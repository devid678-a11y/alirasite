import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import fs from "fs/promises";
import path from "path";
import { ProductCard } from "@/components/ProductCard";
import ProductDetailClient from "../[category]/[id]/ProductDetailClient";
import styles from "./page.module.css";
import { canonicalCatalogSegment, getCanonicalCategoryPath } from "../catalog-utils";
import { getProducts as getCmsProducts, getDocs as getCmsDocs } from "@/app/actions/cms";


function isUsefulImage(image: unknown): boolean {
  return typeof image === "string" && image.length > 0 &&
    image !== "/product_placeholder.svg" && image !== "/product_placeholder.png";
}

function findCategoryImage(catId: string, categories: any[]): string | undefined {
  const categoryById = new Map(categories.map((category: any) => [String(category.id), category]));
  const childrenByParent = new Map<string, any[]>();
  for (const category of categories) {
    if (category.parentId) {
      const parentId = String(category.parentId);
      const children = childrenByParent.get(parentId) || [];
      children.push(category);
      childrenByParent.set(parentId, children);
    }
  }

  const pending = [catId];
  const visited = new Set<string>();
  for (let index = 0; index < pending.length; index += 1) {
    const id = pending[index];
    if (visited.has(id)) continue;
    visited.add(id);

    const category = categoryById.get(id);
    if (isUsefulImage(category?.image)) return category.image;

    for (const child of childrenByParent.get(id) || []) {
      pending.push(String(child.id));
    }
  }

  return undefined;
}

function resolveCategoryImage(catId: string, categories: any[], products: any[]): string {
  const categoryImage = findCategoryImage(catId, categories);
  if (categoryImage) return categoryImage;

  const getDescendantIds = (id: string): string[] => {
    let ids = [id];
    const children = categories.filter((c: any) => c.parentId === id);
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id));
    }
    return ids;
  };

  const descendantIds = new Set(getDescendantIds(catId));
  const productWithImage = products.find((p: any) =>
    descendantIds.has(p.categoryId) &&
    p.image &&
    p.image !== "/product_placeholder.svg" &&
    p.image !== "/product_placeholder.png"
  );

  return productWithImage?.image || "/product_placeholder.svg";
}


function findCategoryForSlug(slug: string[], categories: any[]): any | undefined {
  const requestedPath = slug.map(canonicalCatalogSegment).join("/");
  return categories.find((item: any) =>
    getCanonicalCategoryPath(String(item.id || ""), categories) === requestedPath
  );
}
async function getCategories() {
  try {
    const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

function cleanMetaText(value: unknown): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenDescription(value: unknown, fallback: string, maxLength = 160): string {
  const text = cleanMetaText(value) || cleanMetaText(fallback);
  if (text.length <= maxLength) return text;

  const excerpt = text.slice(0, maxLength - 1);
  const wordEnd = excerpt.lastIndexOf(" ");
  return (wordEnd > maxLength * 0.55 ? excerpt.slice(0, wordEnd) : excerpt).trim() + "…";
}

function getCategoryDescendantIds(categoryId: string, categories: any[]): Set<string> {
  const result = new Set<string>();
  const pending = [categoryId];

  while (pending.length > 0) {
    const currentId = pending.pop()!;
    if (result.has(currentId)) continue;
    result.add(currentId);

    for (const child of categories) {
      if (String(child.parentId || "") === currentId) {
        pending.push(String(child.id));
      }
    }
  }

  return result;
}

function getCategoryMetaDescription(category: any, categories: any[], products: any[]): string {
  const categoryIds = getCategoryDescendantIds(String(category.id), categories);
  const categoryProducts = products.filter((product: any) => categoryIds.has(String(product.categoryId || "")));
  const count = categoryProducts.length;
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const countLabel = lastTwoDigits >= 11 && lastTwoDigits <= 14
    ? "позиций"
    : lastDigit === 1
      ? "позиция"
      : lastDigit >= 2 && lastDigit <= 4
        ? "позиции"
        : "позиций";

  const examples = categoryProducts
    .slice(0, 2)
    .map((product: any) => cleanMetaText(product.name))
    .filter(Boolean)
    .map((name: string) => shortenDescription(name, "", 34));

  let summary = "";
  if (count > 0) {
    summary = "В каталоге " + count + " " + countLabel;
    if (examples.length > 0) summary += ", например: " + examples.join("; ");
    summary += ".";
  } else {
    const subcategories = categories
      .filter((item: any) => String(item.parentId || "") === String(category.id))
      .slice(0, 2)
      .map((item: any) => cleanMetaText(item.name))
      .filter(Boolean);
    summary = subcategories.length > 0
      ? "В разделе представлены категории: " + subcategories.join("; ") + "."
      : "Уточните, какие модели оборудования доступны в этой категории.";
  }

  return shortenDescription(
    summary + " Уточните наличие и срок поставки; запросите КП.",
    "Подбор оборудования из категории " + cleanMetaText(category.name) + ". Уточните наличие и срок поставки.",
  );
}

function getProductFacts(product: any): string[] {
  const specs = product?.specs;
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];

  const excludedTerms = /цена|стоимост|руб\.?|₽|скидк|дешев|выгодн|наличи|поставк|гарант/i;
  const priority = (label: string): number => {
    if (/диапазон|частот|длин.{0,8}волн/i.test(label)) return 0;
    if (/точност|погреш|разреш|скорост/i.test(label)) return 1;
    if (/динамическ|чувствительн|полос|мощност|канал/i.test(label)) return 2;
    return 3;
  };

  return Object.entries(specs)
    .map(([label, value]) => ({
      label: cleanMetaText(label),
      value: cleanMetaText(value),
    }))
    .filter((item) => item.label && item.value && !excludedTerms.test(item.label + " " + item.value))
    .sort((left, right) => priority(left.label) - priority(right.label))
    .slice(0, 2)
    .map((item) => item.label + ": " + item.value);
}

function getSafeProductExcerpt(product: any): string {
  const excludedTerms = /цен|стоимост|руб\.?|₽|скидк|дешев|выгодн/i;
  const description = cleanMetaText(product?.description);
  const sentences = description.split(/(?<=[.!?])\s+/);
  return sentences.find((sentence) => sentence.length > 24 && !excludedTerms.test(sentence)) || "";
}

function getProductMetaDescription(product: any): string {
  const facts = getProductFacts(product);
  const uniqueDetail = facts.length > 0
    ? facts.join("; ")
    : getSafeProductExcerpt(product) || cleanMetaText(product.name) || "Характеристики прибора";
  const suffix = " Наличие и срок поставки уточните при запросе КП.";
  const detailBudget = 160 - suffix.length - 2;
  const detail = shortenDescription(uniqueDetail, "Характеристики уточняйте по модели.", detailBudget)
    .replace(/[.;,\s]+$/g, "");

  return detail + "." + suffix;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const lastSlugPart = canonicalCatalogSegment(slug[slug.length - 1] || "");
  const [categories] = await Promise.all([getCategories()]);
  const canonical = "/catalog/" + slug.map(canonicalCatalogSegment).join("/");

  const category = findCategoryForSlug(slug, categories);
  if (category) {
    let products: any[] = [];
    try {
      products = (await getCmsProducts()) || [];
    } catch {
      products = [];
    }

    const title = String(category.id) === "lls-opticheskie-analizatory-spektra"
      ? "Купить анализатор спектра — подбор и поставка | АЛИРА"
      : cleanMetaText(category.name) + " — подбор и поставка | АЛИРА";
    const description = getCategoryMetaDescription(category, categories, products);

    return {
      title: { absolute: title },
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical },
      twitter: { title, description },
    };
  }

  const products = await getCmsProducts();
  const product = products.find((item: any) => canonicalCatalogSegment(String(item.id || "")) === lastSlugPart);
  if (product) {
    const productName = cleanMetaText(product.name) || "Средство измерений";
    const title = "Купить " + productName + " | АЛИРА";
    const description = getProductMetaDescription(product);

    return {
      title: { absolute: title },
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical },
      twitter: { title, description },
    };
  }

  return {
    title: "Страница каталога не найдена",
    description: "Каталог измерительного оборудования АЛИРА.",
    robots: { index: false, follow: true },
  };
}

export default async function CatalogSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const lastSlugPart = slug[slug.length - 1];
  
  const categories = await getCategories();
  const categoryCandidate = findCategoryForSlug(slug, categories);
  let products: any[] = [];
  let allDocs: any[] = [];
  let product: any = null;

  if (categoryCandidate) {
    const subCategories = categories.filter((c: any) => c.parentId === categoryCandidate.id);
    const needsProductImages = subCategories.some((category: any) => !findCategoryImage(String(category.id), categories));
    if (subCategories.length === 0 || needsProductImages) {
      products = (await getCmsProducts()) || [];
    }
  } else {
    [products, allDocs] = await Promise.all([getCmsProducts(), getCmsDocs()]);
    product = products.find((p: any) =>
      canonicalCatalogSegment(String(p.id || "")) === canonicalCatalogSegment(lastSlugPart)
    );
  }

  // Product pages need product and document data; category pages avoid loading documents.
  
  if (product) {
    // Render product detail
    const productDocs = allDocs.filter((d: any) => 
      d.productId === product.id || 
      (d.title && product.name && d.title.toLowerCase().includes(product.name.toLowerCase()))
    );

    // Build breadcrumbs for product
    const breadcrumbs = [{ title: "Каталог", href: "/catalog" }];
    let currentCat = categories.find((c: any) => c.id === product.categoryId);
    const catPath = [];
    while (currentCat) {
      catPath.unshift(currentCat);
      currentCat = categories.find((c: any) => c.id === currentCat.parentId);
    }
    
    let builtPath = "/catalog";
    for (const c of catPath) {
      builtPath += `/${canonicalCatalogSegment(String(c.id))}`;
      breadcrumbs.push({ title: c.name, href: builtPath });
    }
    breadcrumbs.push({ title: product.name, href: "#" });

    const productJsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbs.map((crumb, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": crumb.title,
            "item": crumb.href.startsWith("/") ? `https://xn--80aapko5acgl.xn--p1ai${crumb.href}` : "https://xn--80aapko5acgl.xn--p1ai/catalog"
          }))
        },
        {
          "@type": "Product",
          "name": product.name,
          "image": product.image ? `https://xn--80aapko5acgl.xn--p1ai${product.image}` : "https://xn--80aapko5acgl.xn--p1ai/product_placeholder.svg",
          "description": product.description || product.name,
          "brand": {
            "@type": "Brand",
            "name": product.brand || "ООО Алира"
          }
        }
      ]
    };

    return (
      <div className={styles.page}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <div className={styles.container}>
          <nav className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={14} className={styles.crumbIcon} />}
                {i === breadcrumbs.length - 1 ? (
                  <span className={styles.crumbCurrent}>{crumb.title}</span>
                ) : (
                  <Link href={crumb.href} className={styles.crumbLink}>{crumb.title}</Link>
                )}
              </React.Fragment>
            ))}
          </nav>
          <ProductDetailClient product={product} docs={productDocs} category={product.categoryId || "all"} />
        </div>
      </div>
    );
  }

  // 2. Is this a Category Page?
  const category = categoryCandidate;
  
  if (!category) {
    notFound();
  }

  // Find subcategories of this category
  const subCategories = categories.filter((c: any) => c.parentId === category.id);
  
  // Find products that belong to THIS category or its descendants
  const getDescendantIds = (catId: string) => {
    let ids = [catId];
    const children = categories.filter((c: any) => c.parentId === catId);
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id));
    }
    return ids;
  };
  
  const validCategoryIds = new Set(getDescendantIds(category.id));
  const categoryProducts = products.filter((p: any) => validCategoryIds.has(p.categoryId));

  // Build breadcrumbs for category
  const breadcrumbs = [{ title: "Каталог", href: "/catalog" }];
  let currentCat = category;
  const catPath = [];
  while (currentCat) {
    catPath.unshift(currentCat);
    currentCat = categories.find((c: any) => c.id === currentCat.parentId);
  }
  
  let builtPath = "/catalog";
  for (const c of catPath) {
    builtPath += `/${c.id}`;
    breadcrumbs.push({ title: c.name, href: builtPath });
  }

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": crumb.title,
          "item": `https://xn--80aapko5acgl.xn--p1ai${crumb.href}`
        }))
      },
      {
        "@type": "ItemList",
        "name": category.name,
        "itemListElement": categoryProducts.slice(0, 30).map((p: any, idx: number) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `https://xn--80aapko5acgl.xn--p1ai${builtPath}/${canonicalCatalogSegment(String(p.id))}`,
          "name": p.name
        }))
      }
    ]
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <div className={styles.container}>
        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={14} className={styles.crumbIcon} />}
              {i === breadcrumbs.length - 1 ? (
                <span className={styles.crumbCurrent}>{crumb.title}</span>
              ) : (
                <Link href={crumb.href} className={styles.crumbLink}>{crumb.title}</Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        <h1 className={styles.title}>{category.name}</h1>

        {/(анализатор(?:ы)?\s+спектра|спектроанализатор)/i.test(String(category.name || "")) && (
          <p style={{ margin: "-12px 0 24px", color: "var(--text-muted)" }}>
            Нужна поверка такого прибора?{" "}
            <Link className={styles.crumbLink} href="/services/verification/spectrum-analyzers">
              Поверка анализаторов спектра
            </Link>
          </p>
        )}

        {subCategories.length > 0 ? (
          <div className={styles.subCatGrid}>
            {subCategories.map((sub: any) => {
              const catImage = resolveCategoryImage(sub.id, categories, products);
              return (
                <Link key={sub.id} href={`${builtPath}/${canonicalCatalogSegment(String(sub.id))}`} className={styles.subCatCard}>
                  <div className={styles.subCatImageWrapper}>
                    <img src={catImage} alt={sub.name} className={styles.subCatImage} />
                  </div>
                  <div className={styles.subCatTitle}>{sub.name}</div>
                </Link>
              );
            })}
          </div>
        ) : (
          categoryProducts.length > 0 ? (
            <div className={styles.productsSection}>
              <div className={styles.productsGrid}>
                {categoryProducts.map((p: any) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            </div>
          ) : (
             <p className={styles.empty}>В данной категории пока нет товаров.</p>
          )
        )}
      </div>
    </div>
  );
}
