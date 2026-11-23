import fs from "fs/promises";
import path from "path";
import { getProducts } from "@/app/actions/cms";
import { canonicalCatalogSegment, getCanonicalCategoryPath } from "@/app/catalog/catalog-utils";

export const dynamic = "force-dynamic";

const SITE_URL = "https://xn--80aapko5acgl.xn--p1ai";
const PLACEHOLDER_IMAGES = new Set(["/product_placeholder.svg", "/product_placeholder.png"]);

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }

  const source = String(value ?? "").replace(/\u00a0/g, " ").trim();
  const match = source.match(/^(\d[\d\s]*(?:[,.]\d{1,2})?)\s*(?:₽|руб(?:\.|ля|лей)?|RUB|RUR)?$/i);
  if (!match) return null;

  const amount = Number(match[1].replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function absoluteImageUrl(value: unknown): string | null {
  const image = String(value ?? "").trim();
  if (!image || PLACEHOLDER_IMAGES.has(image)) return null;

  try {
    const url = new URL(image, SITE_URL);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function productUrl(product: any, categories: any[]): string | null {
  const categoryPath = getCanonicalCategoryPath(String(product.categoryId || ""), categories);
  const productId = canonicalCatalogSegment(String(product.id || "").trim());
  if (!categoryPath || !productId) return null;
  return `${SITE_URL}/catalog/${categoryPath}/${productId}`;
}

function buildCategoryXml(categories: any[]): { xml: string; categoryIdByProductCategory: Map<string, number> } {
  const sorted = [...categories].sort((a, b) => String(a.id).localeCompare(String(b.id), "ru"));
  const idBySourceId = new Map(sorted.map((category, index) => [String(category.id), index + 1]));
  const xml = sorted.map((category) => {
    const id = idBySourceId.get(String(category.id));
    if (!id) return "";
    const parentId = category.parentId ? idBySourceId.get(String(category.parentId)) : undefined;
    const parentAttribute = parentId ? ` parentId="${parentId}"` : "";
    return `      <category id="${id}"${parentAttribute}>${escapeXml(category.name)}</category>`;
  }).filter(Boolean).join("\n");
  return { xml, categoryIdByProductCategory: idBySourceId };
}

export async function GET() {
  const [products, categoriesText] = await Promise.all([
    getProducts(),
    fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8"),
  ]);
  const categories = JSON.parse(categoriesText);
  const { xml: categoriesXml, categoryIdByProductCategory } = buildCategoryXml(categories);
  const seenIds = new Set<string>();

  const offersXml = products.map((product: any) => {
    const id = String(product.id ?? "").trim();
    const normalizedId = id.replace(/[^a-zA-Z0-9а-яА-Я0-9.,\/\\()\[\]\-=_]/g, "-").slice(0, 80);
    const price = parsePrice(product.price);
    const name = cleanText(product.name, 150);
    const categoryId = categoryIdByProductCategory.get(String(product.categoryId || ""));
    const url = productUrl(product, categories);
    const picture = absoluteImageUrl(product.image);

    if (!normalizedId || seenIds.has(normalizedId) || !price || !name || !categoryId || !url || !picture) {
      return "";
    }
    seenIds.add(normalizedId);

    const brand = cleanText(product.brand, 100);
    const vendor = brand && brand.toLowerCase() !== "unknown" ? `        <vendor>${escapeXml(brand)}</vendor>\n` : "";
    const vendorCodeValue = cleanText(product.model || product.sku || "", 100);
    const vendorCode = vendorCodeValue ? `        <vendorCode>${escapeXml(vendorCodeValue)}</vendorCode>\n` : "";
    const description = cleanText(product.description || product.name, 3000);
    const specs = product.specs && typeof product.specs === "object"
      ? Object.entries(product.specs).filter(([, value]) => value != null && String(value).trim()).map(([key, value]) =>
          `        <param name="${escapeXml(cleanText(key, 100))}">${escapeXml(cleanText(value, 500))}</param>`
        ).join("\n")
      : "";

    return [
      `      <offer id="${escapeXml(normalizedId)}" available="true">`,
      `        <name>${escapeXml(name)}</name>`,
      vendor.trimEnd(),
      vendorCode.trimEnd(),
      `        <url>${escapeXml(url)}</url>`,
      `        <price>${price}</price>`,
      "        <currencyId>RUR</currencyId>",
      `        <categoryId>${categoryId}</categoryId>`,
      `        <picture>${escapeXml(picture)}</picture>`,
      `        <description>${escapeXml(description)}</description>`,
      specs,
      "      </offer>",
    ].filter(Boolean).join("\n");
  }).filter(Boolean).join("\n");

  const generatedAt = new Date().toISOString();
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${generatedAt}">
  <shop>
    <name>АЛИРА</name>
    <company>ООО «Алира»</company>
    <url>${SITE_URL}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>
`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
