"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { 
  ArrowLeft, 
  Download, 
  Wrench, 
  Calendar, 
  ShieldCheck, 
  FileCheck,
  ShoppingBag
} from "lucide-react";
import { useModal } from "@/context/ModalContext";
import styles from "../grsi.module.css";

interface RegistryDetailClientProps {
  data: any;
  slug: string;
}

export default function RegistryDetailClient({ data, slug }: RegistryDetailClientProps) {
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState<"general" | "specs" | "package" | "docs">("general");

  const gosnum = data.specs?.["Номер в госреестре"] || slug.split("-")[0] || "ГРСИ";
  const mpi = data.specs?.["МПИ (интервал между поверками)"] || "1 год";

  const hasTechSpecs = Object.keys(data.techSpecs || {}).length > 0;
  const hasPackage = Object.keys(data.packageItems || {}).length > 0;
  const hasDocs = data.docs && data.docs.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Link */}
        <NextLink href={`/registry?q=${encodeURIComponent(gosnum)}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Назад к поиску реестра
        </NextLink>

        {/* Detail Header */}
        <div className={styles.detailHeaderRow}>
          <div className={styles.detailHeaderInfo}>
            <div className={styles.detailMetaBadges}>
              <span className={styles.gosnumLargeBadge}>ГРСИ № {gosnum}</span>
              {data.specs?.["Год регистрации"] && (
                <span className={styles.yearText} style={{ alignSelf: 'center' }}>Год внесения: {data.specs?.["Год регистрации"]}</span>
              )}
            </div>
            <h1 className={styles.title} style={{ marginTop: 12, marginBottom: 8 }}>{data.title}</h1>
            <div className={styles.cardVendor}>Производитель: {data.specs?.["Изготовитель"] || "Не указан"}</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className={styles.detailGrid}>
          {/* Left Column - Image & Actions */}
          <div className={styles.detailLeftCol}>
            <div className={styles.detailImageWrapper}>
              <img src={data.image} alt={data.title} className={styles.detailImg} />
            </div>

            <div className={styles.detailButtonsCard}>
              <button 
                className={styles.btnPrimaryAction}
                onClick={() => openModal("inquiry", `Поверка прибора: ${data.title} (ГРСИ № ${gosnum})`)}
              >
                <Wrench size={18} />
                Оформить поверку / калибровку
              </button>

              <button 
                className={styles.btnSecondaryAction}
                onClick={() => openModal("kp", `Запрос на подбор/поставку прибора: ${data.title} (ГРСИ № ${gosnum})`)}
              >
                <ShoppingBag size={18} />
                Запросить поставку прибора
              </button>
            </div>
          </div>

          {/* Right Column - Tabs & Specifications */}
          <div className={styles.detailRightCol}>
            <div className={styles.tabsRow}>
              <button 
                className={`${styles.tabBtn} ${activeTab === "general" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("general")}
              >
                Общие сведения
              </button>
              {hasTechSpecs && (
                <button 
                  className={`${styles.tabBtn} ${activeTab === "specs" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("specs")}
                >
                  Характеристики
                </button>
              )}
              {hasPackage && (
                <button 
                  className={`${styles.tabBtn} ${activeTab === "package" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("package")}
                >
                  Комплектация
                </button>
              )}
              {hasDocs && (
                <button 
                  className={`${styles.tabBtn} ${activeTab === "docs" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("docs")}
                >
                  Документы ({data.docs.length})
                </button>
              )}
            </div>

            <div className={styles.tabContent}>
              {/* General Tab */}
              {activeTab === "general" && (
                <table className={styles.detailSpecsTable}>
                  <tbody>
                    {Object.entries(data.specs || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className={styles.detailSpecName}>{k}</td>
                        <td className={styles.detailSpecValue}>{v as string}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className={styles.detailSpecName}>Межповерочный интервал (МПИ)</td>
                      <td className={styles.detailSpecValue} style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        {mpi}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Technical specs Tab */}
              {activeTab === "specs" && hasTechSpecs && (
                <table className={styles.detailSpecsTable}>
                  <tbody>
                    {Object.entries(data.techSpecs || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className={styles.detailSpecName}>{k}</td>
                        <td className={styles.detailSpecValue}>{v as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Package Tab */}
              {activeTab === "package" && hasPackage && (
                <table className={styles.detailSpecsTable}>
                  <tbody>
                    {Object.entries(data.packageItems || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className={styles.detailSpecName}>{k}</td>
                        <td className={styles.detailSpecValue}>{v as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Documents Tab */}
              {activeTab === "docs" && hasDocs && (
                <div className={styles.docsGrid}>
                  {data.docs.map((doc: any, i: number) => (
                    <div key={i} className={styles.docDownloadCard}>
                      <span className={styles.docTitle}>{doc.title}</span>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="nofollow noopener noreferrer"
                        className={styles.btnDownloadLink}
                      >
                        <Download size={14} /> Скачать файл
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
