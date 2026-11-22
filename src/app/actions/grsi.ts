"use server";

import * as cheerio from "cheerio";

export interface GrsiSearchParams {
  q?: string;
  f_name?: string;
  f_gosnum?: string;
  f_vendor?: string;
  f_categ_name?: string;
  f_year_from?: string;
  f_year_to?: string;
  page?: number;
}

export async function searchGrsi(params: GrsiSearchParams) {
  const page = params.page || 1;
  const pageSuffix = page > 1 ? `index_${page}/` : "";
  
  let url = "";
  if (params.q) {
    url = `https://www.pover.ru/spravochnik-sredstv-izmerenij/search/${pageSuffix}?q=${encodeURIComponent(params.q)}`;
  } else {
    const queryParts = [];
    if (params.f_name) queryParts.push(`f_name=${encodeURIComponent(params.f_name)}`);
    if (params.f_gosnum) queryParts.push(`f_gosnum=${encodeURIComponent(params.f_gosnum)}`);
    if (params.f_vendor) queryParts.push(`f_vendor=${encodeURIComponent(params.f_vendor)}`);
    if (params.f_categ_name) queryParts.push(`f_categ_name=${encodeURIComponent(params.f_categ_name)}`);
    
    // Use provided year range or default to last 3 years for "newest" behavior
    queryParts.push(`f_year_from=${params.f_year_from || '1939'}`);
    queryParts.push(`f_year_to=${params.f_year_to || '2026'}`);
    
    url = `https://www.pover.ru/spravochnik-sredstv-izmerenij/${pageSuffix}?${queryParts.join("&")}`;
  }

  console.log("Registry search query URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from registry (status: ${res.status})`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: any[] = [];

    $('.directory-list-item').each((i, el) => {
      const imgWrap = $(el).find('.wrap-image');
      const detailUrl = imgWrap.attr('href') || '';
      
      // Extract slug from detailUrl (e.g. "85208-22-izmeriteli-urovnya-zvuka-megeon-921")
      let slug = "";
      const urlParts = detailUrl.split('/');
      const cleanParts = urlParts.filter(Boolean);
      if (cleanParts.length > 0) {
        slug = cleanParts[cleanParts.length - 1];
      }

      const imgNode = imgWrap.find('img');
      let image = imgNode.attr('data-src') || imgNode.attr('src') || '';
      if (image && !image.startsWith('http')) {
        image = `https://www.pover.ru${image}`;
      }

      const gosnum = $(el).find('.gosnum').text().trim();
      const year = $(el).find('.year').text().trim();
      const title = $(el).find('.title a').text().trim();
      const vendor = $(el).find('.vendor').text().trim();
      const validity = $(el).find('.validity span').text().trim();

      // Official documents linked from list
      const files: any[] = [];
      $(el).find('.file a').each((j, fileEl) => {
        files.push({
          title: $(fileEl).text().trim(),
          url: $(fileEl).attr('href') || ''
        });
      });

      if (title && slug) {
        items.push({
          slug,
          title,
          image: image || '/product_placeholder.svg',
          gosnum,
          year,
          vendor,
          validity,
          files
        });
      }
    });

    // Parse pagination max page
    let totalPages = 1;
    $('.s-docs-nav-list a').each((i, el) => {
      const txt = $(el).text().trim();
      const num = parseInt(txt);
      if (!isNaN(num) && num > totalPages) {
        totalPages = num;
      }
    });

    return {
      success: true,
      items,
      currentPage: page,
      totalPages
    };
  } catch (err: any) {
    console.error("searchGrsi server action error:", err);
    return {
      success: false,
      error: err.message || "Ошибка подключения к справочнику ГРСИ"
    };
  }
}

export async function getGrsiDetail(slug: string) {
  const url = `https://www.pover.ru/spravochnik-sredstv-izmerenij/${slug}/`;
  console.log("Fetching detailed registry info for:", url);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch detail (status: ${res.status})`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Title
    const rawTitle = $('.si-title, h1').text().trim() || slug;
    // Extract registry number from title or metadata
    const title = rawTitle.replace(/,?\s*\d{5}-\d{2}\s*$/, "").trim(); // strip the trailing gosnum
    
    // Parse tables
    const specs: Record<string, string> = {};
    const techSpecs: Record<string, string> = {};
    const packageItems: Record<string, string> = {};
    
    let currentSection = "general";

    $('table tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length === 2) {
        const label = $(tds[0]).text().trim();
        const val = $(tds[1]).text().trim();
        
        if (label && val) {
          if (label === "Наименование характеристики" && val === "Значение") {
            currentSection = "technical";
            return;
          }
          if (label === "Наименование" && val === "Количество") {
            currentSection = "package";
            return;
          }
          
          if (currentSection === "general") {
            specs[label] = val;
          } else if (currentSection === "technical") {
            techSpecs[label] = val;
          } else if (currentSection === "package") {
            packageItems[label] = val;
          }
        }
      }
    });

    // Extract document links
    const docs: any[] = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href.includes('fgis.gost.ru') || href.endsWith('.pdf')) {
        // Dedup and normalize
        if (!docs.some(d => d.url === href)) {
          let docTitle = text;
          if (docTitle === "скачать") {
            // Traverse up to find some label, or fallback
            docTitle = $(el).parent().text().replace("скачать", "").trim() || "Документ";
          }
          docs.push({
            title: docTitle || "Описание типа / Методика",
            url: href
          });
        }
      }
    });

    // Image resolution
    let image = $('.si-img img, .main-image img').attr('src') || '';
    if (!image) {
      $('img').each((i, imgEl) => {
        const src = $(imgEl).attr('src') || '';
        if (src.includes('/normal/') || src.includes('/normal_')) {
          image = src;
        }
      });
    }
    if (image && !image.startsWith('http')) {
      image = `https://www.pover.ru${image}`;
    }

    return {
      success: true,
      title,
      image: image || "/product_placeholder.svg",
      specs,
      techSpecs,
      packageItems,
      docs
    };
  } catch (err: any) {
    console.error("getGrsiDetail server action error:", err);
    return {
      success: false,
      error: err.message || "Ошибка получения детальных характеристик СИ"
    };
  }
}
