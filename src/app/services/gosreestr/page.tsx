import React from "react";
import ServicesClient from "../ServicesClient";
import ServiceLanding from "../ServiceLanding";
import { getPagesData, getDocs } from "@/app/actions/cms";

export const metadata = {
  title: "Испытания СИ для утверждения типа и внесения в ГРСИ",
  description: "Обсудим испытания средств измерений для утверждения типа. Уточним модификации, исходные документы и состав работ до начала процедуры.",
  alternates: { canonical: "/services/gosreestr" },
};

export default async function GosreestrPage() {
  const pagesData = await getPagesData();
  const servicesData = pagesData.services;
  const allDocs = await getDocs();
  const labDocs = allDocs.filter((d: any) => d.category === "lab");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://xn--80aapko5acgl.xn--p1ai" },
          { "@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://xn--80aapko5acgl.xn--p1ai/services" },
          { "@type": "ListItem", "position": 3, "name": "Испытания СИ в целях утверждения типа (ГРСИ)", "item": "https://xn--80aapko5acgl.xn--p1ai/services/gosreestr" }
        ]
      },
      {
        "@type": "Service",
        "name": "Испытания средств измерений в целях утверждения типа",
        "serviceType": "Испытания СИ для внесения в ГРСИ",
        "provider": {
          "@type": "Organization",
          "name": "ООО «Алира»",
          "url": "https://xn--80aapko5acgl.xn--p1ai"
        },
        "areaServed": "РФ",
        "description": "Организация и сопровождение работ по испытаниям средств измерений для целей утверждения типа; состав работ определяется после первичного разбора прибора и документации."
      }
    ]
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServiceLanding
        eyebrow="АЛИРА / ИСПЫТАНИЯ СИ"
        title="Испытания средств измерений для утверждения типа"
        description="Разберём задачу производителя или заявителя, уточним модификации и имеющиеся документы. До начала согласуем последовательность действий, состав работ и исходные данные."
        primaryActionLabel="Обсудить испытания"
        asideTitle="Для первого разговора не нужен полный пакет документов"
        asideDescription="Начните с основных сведений о средстве измерений. Если чего-то не хватает, подскажем, что уточнить."
        sendItems={[
          "наименование прибора и варианты исполнения",
          "производитель и назначение средства измерений",
          "технические документы и характеристики, если есть",
        ]}
        sectionEyebrow="ПЕРВЫЙ ЭТАП"
        sectionTitle="Сначала — задача и исходные данные"
        sectionDescription="Для оценки процедуры важно понять, что именно планируется утверждать: тип прибора, его модификации, производство и область применения."
        cards={[
          {
            title: "Прибор и модификации",
            text: "Уточняем обозначение типа и исполнения, чтобы определить, какие варианты нужно рассматривать вместе.",
          },
          {
            title: "Документы и характеристики",
            text: "Собираем исходные сведения о производителе, назначении, технических и метрологических характеристиках.",
          },
        ]}
        note="Точный состав и стоимость работ зависят от прибора, числа модификаций и готовности документации. Их согласуем после первичного разбора задачи."
        steps={[
          { number: "01", title: "Вы описываете прибор", text: "Укажите тип, модификации, производителя и цель обращения — можно начать с неполного набора данных." },
          { number: "02", title: "Мы уточняем материалы", text: "Разбираем имеющиеся документы и определяем, каких сведений не хватает для оценки процедуры." },
          { number: "03", title: "Согласуем план работ", text: "Обсуждаем этапы, стоимость и сроки до начала работ по заявке." },
        ]}
        ctaTitle="Не уверены, с чего начать?"
        ctaDescription="Опишите прибор своими словами или позвоните. Специалист подскажет, какие сведения нужны для первого разбора."
        relatedHref="/services/verification"
        relatedLabel="Нужна поверка прибора?"
      />
      <ServicesClient servicesData={servicesData} labDocs={labDocs} requestForm="testing" />
    </div>
  );
}
