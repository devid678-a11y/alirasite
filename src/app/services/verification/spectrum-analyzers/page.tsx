import type { Metadata } from "next";
import ServicesClient from "../../ServicesClient";
import ServiceLanding from "../../ServiceLanding";
import { getPagesData, getDocs } from "@/app/actions/cms";

const pageTitle = "Поверка анализаторов спектра | АЛИРА";
const pageDescription = "Поверка анализаторов спектра: уточним возможность работ по модели, согласуем срок и порядок передачи прибора. Отправьте изготовителя, модель и заводской номер.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: "/services/verification/spectrum-analyzers" },
  openGraph: { title: pageTitle, description: pageDescription, url: "/services/verification/spectrum-analyzers" },
  twitter: { title: pageTitle, description: pageDescription },
};

export default async function SpectrumAnalyzersVerificationPage() {
  const pagesData = await getPagesData();
  const servicesData = pagesData.services;
  const allDocs = await getDocs();
  const labDocs = allDocs.filter((doc: any) => doc.category === "lab");

  const pageUrl = "https://xn--80aapko5acgl.xn--p1ai/services/verification/spectrum-analyzers";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://xn--80aapko5acgl.xn--p1ai" },
          { "@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://xn--80aapko5acgl.xn--p1ai/services" },
          { "@type": "ListItem", "position": 3, "name": "Поверка средств измерений", "item": "https://xn--80aapko5acgl.xn--p1ai/services/verification" },
          { "@type": "ListItem", "position": 4, "name": "Поверка анализаторов спектра", "item": pageUrl }
        ]
      },
      {
        "@type": "Service",
        "name": "Поверка анализаторов спектра",
        "serviceType": "Поверка анализаторов спектра",
        "provider": {
          "@type": "Organization",
          "name": "ООО «Алира»",
          "url": "https://xn--80aapko5acgl.xn--p1ai"
        },
        "url": pageUrl,
        "description": pageDescription
      }
    ]
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServiceLanding
        eyebrow="АЛИРА / ПОВЕРКА СРЕДСТВ ИЗМЕРЕНИЙ"
        title="Поверка анализаторов спектра"
        description="Проверим возможность поверки конкретной модели анализатора спектра и заранее согласуем доступный срок. Для начала отправьте изготовителя, модель, заводской номер и желаемую дату."
        primaryActionLabel="Уточнить возможность и срок"
        heroFootnote="Сроки и порядок передачи согласуем до отправки прибора"
        asideTitle="Что прислать для проверки"
        asideDescription="Для предварительной оценки достаточно основных данных прибора. Если чего-то не знаете, пришлите фото шильдика."
        sendItems={[
          "Изготовитель и модель анализатора.",
          "Заводской номер и регистрационный номер типа, если известен.",
          "Фото шильдика или предыдущие документы о поверке — при наличии.",
          "Количество приборов и желаемый срок.",
        ]}
        asideFootnote="По этим данным проверим, можем ли принять прибор на поверку, и согласуем дальнейшие действия."
        asideEmailText="Отправить данные прибора на info@aliracert.ru"
        sectionEyebrow="ПЕРЕД ОБРАЩЕНИЕМ"
        sectionTitle="Сначала проверяем конкретную модель"
        sectionDescription="Возможность и срок поверки зависят от модели, метрологических характеристик и текущей доступности работ. Подтвердим условия до передачи оборудования."
        cards={[
          {
            title: "Идентификация прибора",
            text: "Сверим изготовителя, модель и заводской номер. Если известны регистрационный номер типа и дата предыдущей поверки, приложите их к заявке.",
          },
          {
            title: "Срок и передача",
            text: "Сообщим доступный срок и согласуем порядок передачи прибора. Не отправляйте оборудование, пока не подтвердим возможность и условия работ.",
          },
        ]}
        note="Если поверка конкретной модели не подходит под вашу задачу, обсудим возможную альтернативу — например, калибровку."
        processTitle="Как организуем поверку"
        steps={[
          {
            number: "01",
            title: "Отправьте данные",
            text: "Укажите модель, изготовителя, заводской номер, количество приборов и желаемый срок.",
          },
          {
            number: "02",
            title: "Получите подтверждение",
            text: "Проверим возможность поверки по конкретной модели и сообщим доступный срок.",
          },
          {
            number: "03",
            title: "Согласуйте передачу",
            text: "До отправки оборудования уточним способ передачи и согласуем дальнейшие действия.",
          },
          {
            number: "04",
            title: "Получите результат",
            text: "После выполнения работ сообщим о готовности прибора и передадим оформленные документы. Сведения во ФГИС «АРШИН» оформляются в установленном порядке, если это применимо к прибору.",
          },
        ]}
        ctaEyebrow="ДАННЫЕ ПРИБОРА И СРОК"
        ctaTitle="Проверим поверку по вашей модели"
        ctaDescription="Отправьте изготовителя, модель и заводской номер. Проверим возможность работ и согласуем доступный срок до передачи оборудования."
        ctaActionLabel="Отправить данные прибора"
        relatedHref="/services/verification"
        relatedLabel="Все о поверке средств измерений"
      />
      <ServicesClient servicesData={servicesData} labDocs={labDocs} forceForm="calibration" />
    </div>
  );
}
