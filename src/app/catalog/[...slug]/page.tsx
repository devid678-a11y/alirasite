import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import fs from "fs/promises";
import path from "path";
import { ProductCard } from "@/components/ProductCard";
import ProductDetailClient from "../[category]/[id]/ProductDetailClient";
import styles from "./page.module.css";


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

async function getCategories() {
  try {
    const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "categories.json"), "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

async function getProducts() {
  try {
    const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "products.json"), "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

async function getDocs() {
  try {
    const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "docs.json"), "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return [];
  }
}

export default async function CatalogSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const lastSlugPart = slug[slug.length - 1];
  
  const categories = await getCategories();
  const products = await getProducts();
  const allDocs = await getDocs();
  
  // 1. Is this a Product Page?
  // We identify a product page if the last slug part matches a product ID
  const product = products.find((p: any) => p.id === lastSlugPart);
  
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
      builtPath += `/${c.id}`;
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
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "RUB",
            "price": product.price && !isNaN(parseFloat(product.price)) ? parseFloat(product.price) : 0,
            "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "ООО «Алира»"
            }
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
  const category = categories.find((c: any) => c.id === lastSlugPart);
  
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
  
  const validCategoryIds = getDescendantIds(category.id);
  const categoryProducts = products.filter((p: any) => validCategoryIds.includes(p.categoryId));

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
          "url": `https://xn--80aapko5acgl.xn--p1ai${builtPath}/${p.id}`,
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

        {subCategories.length > 0 ? (
          <div className={styles.subCatGrid}>
            {subCategories.map((sub: any) => {
              const catImage = resolveCategoryImage(sub.id, categories, products);
              return (
                <Link key={sub.id} href={`${builtPath}/${sub.id}`} className={styles.subCatCard}>
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
