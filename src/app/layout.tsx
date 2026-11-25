import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xn--80aapko5acgl.xn--p1ai"),
  title: {
    default: "АЛИРА — Поверка средств измерений и испытания",
    template: "%s | ООО «Алира»"
  },
  description: "Поверка средств измерений, испытания СИ и метрологическое сопровождение предприятий. Уточните порядок работ и согласуйте сроки по вашему перечню оборудования.",
  keywords: ["поверка средств измерений", "испытания средств измерений", "утверждение типа СИ", "Госреестр СИ", "ФГИС Аршин", "метрологическое сопровождение"],
  openGraph: {
    title: "АЛИРА — Поверка средств измерений и испытания",
    description: "Поверка средств измерений, испытания для утверждения типа СИ и метрологическое сопровождение предприятий.",
    url: "https://xn--80aapko5acgl.xn--p1ai",
    siteName: "ООО «Алира»",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "https://xn--80aapko5acgl.xn--p1ai/hero_banner.png",
        width: 1200,
        height: 630,
        alt: "ООО Алира"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "АЛИРА — Поверка средств измерений и испытания",
    description: "Поверка средств измерений, испытания для утверждения типа СИ и метрологическое сопровождение предприятий.",
    images: ["https://xn--80aapko5acgl.xn--p1ai/hero_banner.png"]
  },
  robots: {
    index: true,
    follow: true
  }
};

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ModalProvider } from "@/context/ModalContext";
import { ContactModal } from "@/components/ContactModal";
import { getPagesData } from "@/app/actions/cms";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pagesData = await getPagesData();
  const headerData = pagesData.header || {};

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ООО «Алира»",
    "legalName": "Общество с ограниченной ответственностью «Алира»",
    "url": "https://xn--80aapko5acgl.xn--p1ai",
    "logo": "https://xn--80aapko5acgl.xn--p1ai/logo-new.png",
    "email": "i@dbatischev.ru",
    "telephone": "+7 (495) 229-39-48",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ул. Мнёвники, д. 3, корпус 1",
      "addressLocality": "Москва",
      "postalCode": "123308",
      "addressCountry": "RU"
    }
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ООО «Алира»",
    "url": "https://xn--80aapko5acgl.xn--p1ai",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://xn--80aapko5acgl.xn--p1ai/catalog?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="ru" className={roboto.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Script id="yandex-metrika" strategy="beforeInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=114625715', 'ym');

            ym(114625715, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
      </head>
      <body style={{ fontFamily: "var(--font-roboto), sans-serif" }}>
        <noscript><div><img src="https://mc.yandex.ru/watch/114625715" style={{ position: "absolute", left: "-9999px" }} alt="" /></div></noscript>
        <ModalProvider>
          <Header data={headerData} />
          <main style={{ flexGrow: 1 }}>{children}</main>
          <Footer />
          <ContactModal />
        </ModalProvider>
        <Script src="//code.jivo.ru/widget/DeHx9ZcLLI" strategy="afterInteractive" />
        
      </body>
    </html>
  );
}
