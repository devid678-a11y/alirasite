import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import RepairClient from "./RepairClient";

export const metadata: Metadata = {
  title: "Ремонт и сервисное обслуживание измерительного оборудования — ООО «Алира»",
  description: "Профессиональный компонентный и блочный ремонт сложной измерительной техники, ВЧ/СВЧ приборов (до 50 ГГц) и средств связи зарубежного производства. Предварительная диагностика, гарантия от 6 месяцев, первичная поверка (ФГИС «АРШИН»).",
};

export default function RepairPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://xn--80aapko5acgl.xn--p1ai" },
          { "@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://xn--80aapko5acgl.xn--p1ai/services" },
          { "@type": "ListItem", "position": 3, "name": "Ремонт оборудования", "item": "https://xn--80aapko5acgl.xn--p1ai/services/repair" }
        ]
      },
      {
        "@type": "Service",
        "name": "Ремонт и сервисное обслуживание измерительного оборудования",
        "serviceType": "Ремонт измерительной техники и радиооборудования",
        "provider": {
          "@type": "Organization",
          "name": "ООО «Алира»",
          "url": "https://xn--80aapko5acgl.xn--p1ai"
        },
        "areaServed": "Москва и вся Россия",
        "description": "Компонентный и блочный ремонт зарубежных измерительных приборов (Keysight, Rohde&Schwarz, Anritsu, Fluke, Tektronix и др.) в диапазоне до 50 ГГц. Предварительная диагностика, гарантия от 6 месяцев, послеремонтная поверка во ФГИС «АРШИН»."
      }
    ]
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "60px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Главная</Link>
            <span>/</span>
            <Link href="/services" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Услуги</Link>
            <span>/</span>
            <span style={{ color: "var(--foreground)", fontWeight: 500 }}>Ремонт оборудования</span>
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "var(--foreground)", marginBottom: "16px", lineHeight: 1.25 }}>
            Ремонт и сервисное обслуживание измерительного оборудования
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", maxWidth: "860px", lineHeight: "1.6", margin: 0 }}>
            Квалифицированный компонентный и блочный ремонт сложных измерительных приборов, СВЧ-техники до 50 ГГц и оборудования связи ведущих мировых производителей. Предварительная диагностика, гарантия от 6 месяцев и послеремонтная поверка в аккредитованной лаборатории.
          </p>
        </div>
      </div>
      <RepairClient />
    </div>
  );
}
