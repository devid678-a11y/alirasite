import React from "react";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import styles from "./page.module.css";
import { getPagesData, getProducts } from "@/app/actions/cms";
import SearchBar from "./SearchBar";
import { ProductCard } from "@/components/ProductCard";

function resolveCategoryImage(catId: string, categories: any[], products: any[]): string {
  const getDescendantIds = (id: string): string[] => {
    let ids = [id];
    const children = categories.filter((c: any) => c.parentId === id);
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id));
    }
    return ids;
  };
  
  const descendantIds = getDescendantIds(catId);
  const productWithImage = products.find((p: any) => 
    descendantIds.includes(p.categoryId) && 
    p.image && 
    p.image !== "/product_placeholder.svg" && 
    p.image !== "/product_placeholder.png"
  );

  if (productWithImage) {
    return productWithImage.image;
  }
  
  const category = categories.find((c: any) => c.id === catId);
  if (category && category.image && category.image !== "/product_placeholder.svg" && category.image !== "/product_placeholder.png") {
    return category.image;
  }
  
  return "/product_placeholder.svg";
}

async function getRootCategories() {
  try {
    const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8");
    const categories = JSON.parse(fileData);
    return categories.filter((c: any) => !c.parentId);
  } catch (e) {
    return [];
  }
}

export const metadata = {
  title: "Метрологическое оборудование. Оснащение лабораторий — ООО «Алира»",
  description: "Метрологическое оборудование и оснащение лабораторий. Поставка измерительных приборов от компании ООО «Алира».",
};

export default async function CatalogIndex({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";

  const pagesData = await getPagesData();
  
  // Read all categories and products to resolve images
  const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8");
  const allCategories = JSON.parse(fileData);
  const productsRes = await getProducts();
  const allProducts = productsRes || [];
  
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
        <h1 className={styles.title}>Метрологическое оборудование. Оснащение лабораторий</h1>
        
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
                <Link key={cat.id} href={`/catalog/${cat.id}`} className={styles.subCatCard}>
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

