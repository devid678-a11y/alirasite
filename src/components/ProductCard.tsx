import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Clock } from "lucide-react";
import styles from "./ProductCard.module.css";
import categoriesData from "@/data/categories.json";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    wavelengthRange?: string;
    resolution?: string;
    frequencyRange?: string;
    inStock: boolean;
    price: string;
    grsi?: boolean;
    isNew?: boolean;
    category?: string;
    categoryId?: string;
    image?: string;
  };
}

function getProductPath(categoryId: string | undefined, fallbackCategory: string | undefined): string {
  const targetId = categoryId || fallbackCategory;
  if (!targetId) return "uncategorized";
  
  const pathParts: string[] = [];
  let current = (categoriesData as any[]).find((c: any) => c.id === targetId);
  
  while (current) {
    pathParts.unshift(current.id);
    current = (categoriesData as any[]).find((c: any) => c.id === current.parentId);
  }
  
  if (pathParts.length === 0) {
    return targetId;
  }
  return pathParts.join("/");
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const productPath = getProductPath(product.categoryId, product.category);
  const productHref = `/catalog/${productPath}/${product.id}`;
  
  // Only display brand if it exists and is not "unknown"
  const hasValidBrand = Boolean(
    product.brand && 
    product.brand.trim() && 
    product.brand.trim().toLowerCase() !== "unknown"
  );

  return (
    <div className={styles.card}>
      <Link href={productHref} className={styles.imagePlaceholder} aria-label={product.name}>
        <Image 
          src={product.image || "/product_placeholder.svg"} 
          alt={product.name} 
          fill 
          sizes="(max-width: 576px) 100vw, 33vw" 
          style={{ objectFit: 'contain' }} 
          className={styles.productImg} 
        />
      </Link>
      
      {product.isNew && (
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.new}`}>Новинка</span>
        </div>
      )}

      {hasValidBrand && <div className={styles.brand}>{product.brand}</div>}
      
      <h3 className={styles.title}>
        <Link href={productHref} className={styles.titleLink}>
          {product.name}
        </Link>
      </h3>
      
      <div className={styles.specs}>
        {product.wavelengthRange && (
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Диапазон:</span>
            <span className={styles.specValue}>{product.wavelengthRange}</span>
          </div>
        )}
        {product.resolution && (
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Разрешение:</span>
            <span className={styles.specValue}>{product.resolution}</span>
          </div>
        )}
        {product.frequencyRange && (
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Частота:</span>
            <span className={styles.specValue}>{product.frequencyRange}</span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div>
          <div className={styles.price}>{product.price}</div>
          <div className={`${styles.stock} ${product.inStock ? styles.inStock : styles.outOfStock}`}>
            {product.inStock ? (
              <><CheckCircle2 size={14} /> В наличии на складе</>
            ) : (
              <><Clock size={14} /> Под заказ</>
            )}
          </div>
        </div>
        <Link href={productHref} className={styles.moreButton}>
          Подробнее
        </Link>
      </div>
    </div>
  );
};
