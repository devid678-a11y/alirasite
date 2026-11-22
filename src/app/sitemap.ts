import { MetadataRoute } from "next";
import { getProducts } from "@/app/actions/cms";
import fs from "fs/promises";
import path from "path";

function getCategoryPath(catId: string, categories: any[]): string {
  const pathParts: string[] = [];
  let current = categories.find((c: any) => c.id === catId);
  
  while (current) {
    pathParts.unshift(current.id);
    current = categories.find((c: any) => c.id === current.parentId);
  }
  
  return pathParts.join("/");
}

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
    productRoutes = products.map((p: any) => {
      const targetCategoryId = p.categoryId || p.category;
      const catPath = targetCategoryId ? getCategoryPath(targetCategoryId, categories) : "uncategorized";
      
      return {
        url: `${baseUrl}/catalog/${catPath}/${p.id}`,
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

