import React from "react";
import brands from "@/data/brands.json";
import styles from "./page.module.css";

export default function BrandsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Бренды и Производители</h1>
        
        <div className={styles.brandsList}>
          {brands.map(brand => (
            <div key={brand.id} className={styles.brandRow}>
              <div className={styles.brandLogo}>{brand.name}</div>
              <div className={styles.brandInfo}>
                <h2>Оборудование {brand.name}</h2>
                <p>{brand.description}</p>
                <p style={{ marginTop: 16, color: "var(--accent)" }}>Официальные поставки. Поверка. Сервисное обслуживание.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
