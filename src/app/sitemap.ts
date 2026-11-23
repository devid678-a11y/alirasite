import { MetadataRoute } from "next";
import { getProducts } from "@/app/actions/cms";
import { canonicalCatalogSegment, getCanonicalCategoryPath } from "./catalog/catalog-utils";
import fs from "fs/promises";
import path from "path";

const getCategoryPath = getCanonicalCategoryPath;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://xn--80aapko5acgl.xn--p1ai"; // алирасерт.рф

  // 1. Static Pages
  const staticRoutes = [
    "",
    "/about",
    "/contacts",
    "/services",
    "/brands",
    "/catalog",
    "/agreement",
    "/privacy",
    "/registry",
    "/services/verification",
    "/services/gosreestr",
    "/services/repair",
    "/request-quote"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Read categories and products from files
  let categories: any[] = [];
  try {
    const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8");
    categories = JSON.parse(fileData);
  } catch (e) {
    console.error("Sitemap category read error:", e);
  }

  // 2. Dynamic Categories
  const categoryRoutes = categories.map((cat: any) => {
    const catPath = getCategoryPath(cat.id, categories);
    return {
      url: `${baseUrl}/catalog/${catPath}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  // 3. Dynamic Products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products.filter((p: any) => p?.id).map((p: any) => {
      const rawCategory = p.categoryId || p.category;
      const targetCategoryId = typeof rawCategory === "string" ? rawCategory : rawCategory?.id || rawCategory?.uid || rawCategory?.documentId;
      const catPath = targetCategoryId ? getCategoryPath(String(targetCategoryId), categories) : "";
      const productPath = [catPath, canonicalCatalogSegment(String(p.id || ""))].filter(Boolean).join("/");
      
      return {
        url: `${baseUrl}/catalog/${productPath}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    });
  } catch (err) {
    console.error("Sitemap product fetch error:", err);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

