import React from "react";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import styles from "./page.module.css";
import { getProducts } from "@/app/actions/cms";
import SearchBar from "./SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { canonicalCatalogSegment } from "./catalog-utils";

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

export const metadata = {
  title: { absolute: "Измерительное оборудование — подбор и поставка | АЛИРА" },
  description: "Оптические, радиочастотные и лабораторные приборы. Подберём оборудование по задаче, уточним комплектацию и срок поставки; подготовим КП.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogIndex({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";

  const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8");
  const allCategories = JSON.parse(fileData);
  const allProducts = query.trim() ? (await getProducts()) || [] : [];
  
  const rootCategories = allCategories.filter((c: any) => !c.parentId);

  // Filter products if search query is active
  let searchResults: any[] = [];
  if (query.trim()) {
    const qLower = query.toLowerCase().trim();
    searchResults = allProducts.filter((p: any) => {
      const nameMatch = p.name && p.name.toLowerCase().includes(qLower);
      const brandMatch = p.brand && p.brand.toLowerCase().includes(qLower);
      const descMatch = p.description && p.description.toLowerCase().includes(qLower);
      const modelMatch = p.model && p.model.toLowerCase().includes(qLower);
      const idMatch = p.id && p.id.toLowerCase().includes(qLower);
      
      const specsMatch = p.specs && Object.entries(p.specs).some(([k, v]: any) => 
        k.toLowerCase().includes(qLower) || String(v).toLowerCase().includes(qLower)
      );
      
      return nameMatch || brandMatch || descMatch || modelMatch || idMatch || specsMatch;
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Измерительное оборудование — подбор и поставка</h1>
        <p style={{ maxWidth: 760, margin: "-16px 0 24px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Подберём прибор по техническим требованиям, уточним комплектацию и срок поставки. Отправьте запрос, чтобы получить КП.
        </p>
        
        {/* Search bar component */}
        <SearchBar />
        
        {query.trim() ? (
          <div>
            <h2 className={styles.searchTitle} style={{ fontSize: 20, marginBottom: 24, fontWeight: 600, color: "var(--foreground)" }}>
              Результаты поиска по запросу &ldquo;{query}&rdquo; ({searchResults.length})
            </h2>
            
            {searchResults.length > 0 ? (
              <div className={styles.productsGrid}>
                {searchResults.map((p: any) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <h3>Ничего не найдено</h3>
                <p>Пожалуйста, проверьте правильность написания или попробуйте изменить поисковый запрос.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.subCatGrid}>
            {rootCategories.map((cat: any) => {
              const catImage = resolveCategoryImage(cat.id, allCategories, allProducts);
              return (
                <Link key={cat.id} href={`/catalog/${canonicalCatalogSegment(String(cat.id))}`} className={styles.subCatCard}>
                  <div className={styles.subCatImageWrapper}>
                    <img src={catImage} alt={cat.name} className={styles.subCatImage} />
                  </div>
                  <div className={styles.subCatTitle}>{cat.name}</div>
                </Link>
              );
            })}
          </div>
        )}
        
        {!query.trim() && rootCategories.length === 0 && (
           <p style={{ color: "var(--text-muted)" }}>Загрузка каталога...</p>
        )}
      </div>
    </div>
  );
}

