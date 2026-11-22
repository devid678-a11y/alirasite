import React from "react";
import { getPagesData } from "@/app/actions/cms";
import { AboutGallery } from "@/components/AboutGallery";
import styles from "./about.module.css";

export const metadata = {
  title: "О компании | ООО «Алира»",
  description: "Независимая экспертная организация «Алира». Комплексное метрологическое обеспечение предприятий, поставка, поверка и утверждение типа средств измерений.",
};

export default async function AboutPage() {
  const pagesData = await getPagesData();
  const homeData = pagesData.home || {};
  const about = pagesData.about || homeData.aboutSection || {
    title: "О компании",
    text: "ООО «Алира» – ваш надежный партнер в области измерительного оборудования."
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerCard}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Алира · метрологические услуги для предприятий
          </div>
          <h1 className={styles.title}>{about.title}</h1>
          <p className={styles.lead}>{about.text}</p>
        </div>

        <section className={styles.gallerySection}>
          <div className={styles.galleryHeader}>
            <h2 className={styles.galleryTitle}>Лаборатория и измерительная база</h2>
            <p className={styles.gallerySubtitle}>
              Собственные испытательные комплексы, поверочные стенды и высокоточные эталоны
            </p>
          </div>
          <AboutGallery gridCols={4} />
        </section>
      </div>
    </main>
  );
}
