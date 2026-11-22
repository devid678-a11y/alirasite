"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, FileText, Download, Eye } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import styles from "./page.module.css";

export default function ProductDetailClient({ 
  product, 
  docs, 
  category 
}: { 
  product: any; 
  docs: any[]; 
  category: string;
}) {
  const [activeTab, setActiveTab] = useState("desc");
  const { openModal } = useModal();
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // State for active SKU variant if product has variants
  const [activeVariant, setActiveVariant] = useState<any>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  // Resolve fields dynamically depending on active variant selection
  const displayName = activeVariant ? product.name : product.name;
  const displayImage = (activeVariant && activeVariant.image) || product.image;
  const displayPrice = (activeVariant && activeVariant.price) || product.price;
  const displaySpecs = activeVariant && activeVariant.specs ? { ...product.specs, ...activeVariant.specs } : product.specs;

  // Extract all unique selected spec keys for selectors
  const variantKeys: string[] = [];
  if (product.variants) {
    product.variants.forEach((v: any) => {
      Object.keys(v.specs).forEach((k: string) => {
        if (!variantKeys.includes(k)) variantKeys.push(k);
      });
    });
  }

  // Active specs selected
  const [selectedSpecs, setSelectedSpecs] = useState<any>(() => {
    if (activeVariant) return activeVariant.specs;
    return {};
  });

  const handleSelectValue = (key: string, val: string) => {
    const nextSpecs = { ...selectedSpecs, [key]: val };
    setSelectedSpecs(nextSpecs);

    // Find if there is a variant matching the selection
    if (product.variants) {
      const match = product.variants.find((v: any) => {
        return Object.entries(nextSpecs).every(([k, val]) => v.specs[k] === val);
      });
      if (match) setActiveVariant(match);
    }
  };

  const hasValidBrand = Boolean(
    product.brand && 
    product.brand.trim() && 
    product.brand.trim().toLowerCase() !== "unknown"
  );

  return (
    <div className={styles.productDetail}>
      <div className={styles.topSection}>
        <div className={styles.imageArea}>
          <img 
            src={displayImage || "/product_placeholder.svg"} 
            alt={product.name} 
            className={styles.productImg}
          />
        </div>

        <div className={styles.infoArea}>
          {hasValidBrand && <div className={styles.brand}>{product.brand}</div>}
          <h1 className={styles.title}>{displayName}</h1>
          
          <div className={styles.metaRow}>
            <div className={`${styles.stock} ${product.inStock ? styles.inStock : styles.outOfStock}`}>
              {product.inStock ? (
                <><CheckCircle2 size={16} /> В наличии</>
              ) : (
                <><Clock size={16} /> Под заказ</>
              )}
            </div>
          </div>

          {/* SKU Selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className={styles.selectorsSection}>
              {variantKeys.map((key) => {
                const uniqueValues = Array.from(
                  new Set(product.variants.map((v: any) => v.specs[key]))
                ) as string[];

                return (
                  <div key={key} className={styles.selectorGroup}>
                    <span className={styles.selectorLabel}>{key}:</span>
                    <div className={styles.selectorOptions}>
                      {uniqueValues.map((val) => {
                        const isActive = selectedSpecs[key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`${styles.skuValueItem} ${isActive ? styles.skuValueItemActive : ""}`}
                            onClick={() => handleSelectValue(key, val)}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.price}>{displayPrice}</div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={() => openModal("inquiry", activeVariant ? `${product.name} (${activeVariant.name})` : product.name)}
            >
              Отправить заявку
            </button>
            <button
              type="button"
              className={styles.secondaryActionBtn}
              onClick={() => openModal("kp", activeVariant ? `${product.name} (${activeVariant.name})` : product.name)}
            >
              Запросить КП
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button className={`${styles.tabBtn} ${activeTab === "desc" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("desc")}>Описание</button>
          <button className={`${styles.tabBtn} ${activeTab === "specs" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("specs")}>Характеристики</button>
          <button className={`${styles.tabBtn} ${activeTab === "grsi" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("grsi")}>Поверка</button>
          <button className={`${styles.tabBtn} ${activeTab === "docs" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("docs")}>Документация</button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "desc" && (
            <div>
              <h3>Общее описание</h3>
              <p style={{ marginTop: 16 }}>{product.description}</p>
              {product.applications && product.applications.length > 0 && (
                <>
                  <h3 style={{ marginTop: 32, marginBottom: 16 }}>Применение</h3>
                  <ul>
                    {product.applications.map((app: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: 8 }}>{app}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {activeTab === "specs" && (
            <div>
              <h3>Технические характеристики</h3>
              {displaySpecs && Object.keys(displaySpecs).length > 0 ? (
                <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
                  <tbody>
                    {Object.entries(displaySpecs).map(([k, v]: [string, any], idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 0 ? "rgba(0,0,0,0.01)" : "transparent" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 500, width: "40%", color: "#202b38" }}>{k}</td>
                        <td style={{ padding: "12px 16px", color: "#596779" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: 16 }}>Характеристики уточняются при запросе спецификации.</p>
              )}
            </div>
          )}

          {activeTab === "grsi" && (
            <div>
              <h3>Метрологическое обеспечение и поверка</h3>
              <p style={{ marginTop: 16 }}>
                ООО «Алира» организует первичную и периодическую поверку данного типа оборудования в аккредитованной лаборатории с официальным внесением сведений во ФГИС «АРШИН».
              </p>
              <div style={{ marginTop: 24, padding: "20px 24px", background: "#f7f9fc", borderRadius: "14px", border: "1px solid #d9e3ef" }}>
                <h4 style={{ margin: 0, marginBottom: 8, color: "#173b69" }}>Нужна поверка или калибровка?</h4>
                <p style={{ margin: 0, marginBottom: 16, fontSize: "14px", color: "#596779" }}>
                  Оставьте заявку — рассчитаем стоимость поверки прибора и согласуем сроки доставки в лабораторию.
                </p>
                <button
                  type="button"
                  className={styles.primaryActionBtn}
                  style={{ width: "auto", minHeight: "42px", padding: "0 22px", display: "inline-flex" }}
                  onClick={() => openModal("inquiry", `Поверка: ${product.name}`)}
                >
                  Рассчитать поверку прибора
                </button>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div>
              <h3>Документация и сертификаты</h3>
              {docs && docs.length > 0 ? (
                <div style={{ marginTop: 20 }}>
                  {docs.map((doc: any, idx: number) => (
                    <div key={idx} className={styles.documentItemRow}>
                      <div className={styles.documentItem}>
                        <FileText size={20} color="#2c66b0" />
                        <div>
                          <div style={{ fontWeight: 600, color: "#202b38" }}>{doc.name}</div>
                          <div style={{ fontSize: "12px", color: "#596779" }}>{doc.category || "Документ"} · {doc.size || "PDF"}</div>
                        </div>
                      </div>
                      <div className={styles.docActions}>
                        {doc.url && (
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download
                            className={styles.docActionLink}
                            title="Скачать документ"
                          >
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: 16 }}>Официальное описание типа и руководство по эксплуатации предоставляются по запросу.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
