import React from "react";
import { getPagesData } from "@/app/actions/cms";

export default async function ContactsPage() {
  const pagesData = await getPagesData();
  const data = pagesData.contacts || {};

  const address = data.address || "123308, г.Москва, ул.Мнёвники, д.3, корпус 1";
  const phone = data.phone || "+7 (495) 229-39-48";
  const email = data.email || "info@aliracert.ru";
  const workHours = data.workHours || "многоканальный, с 9 до 17.30 часов";
  const mapUrl = data.mapUrl || "https://yandex.ru/map-widget/v1/?um=constructor%3A08ecc2bebe63c9d176d5727746227c43039ffcb76879fcc43b6a381f305d515a&amp;source=constructor";

  const phoneHref = phone.replace(/[^+\d]/g, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Контакты — ООО «Алира»",
    "description": "Контактная информация компании ООО «Алира»: адрес, телефоны, электронная почта и интерактивная карта проезда.",
    "mainEntity": {
      "@type": "Organization",
      "name": "ООО «Алира»",
      "telephone": phone,
      "email": email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "ул. Мнёвники, д. 3, корпус 1",
        "addressLocality": "Москва",
        "postalCode": "123308",
        "addressCountry": "RU"
      }
    }
  };

  return (
    <div style={{ padding: "80px 20px", maxWidth: "1200px", margin: "0 auto", minHeight: "60vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "40px", color: "var(--foreground)" }}>Контакты</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "40px" }}>
        <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px", color: "var(--foreground)" }}>Адрес</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-muted)", fontSize: "16px", lineHeight: "1.6" }}>
            <p>{address}</p>
          </div>
        </div>
        
        <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px", color: "var(--foreground)" }}>Телефоны</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-muted)", fontSize: "16px", lineHeight: "1.6" }}>
            <p>
              <a href={`tel:${phoneHref}`} style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: "600" }}>
                {phone}
              </a>
              <br />
              <span style={{ fontSize: "14px" }}>({workHours})</span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "40px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "var(--foreground)" }}>Эл.почта центра</h3>
        <a href={`mailto:${email}`} style={{ color: "var(--accent)", fontSize: "16px", textDecoration: "none", fontWeight: "600" }}>
          {email}
        </a>
      </div>

      <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px", color: "var(--foreground)" }}>Как нас найти</h3>
        <div style={{ borderRadius: "8px", overflow: "hidden", minHeight: "400px" }}>
          <iframe
            src={mapUrl}
            width="100%"
            height="400"
            frameBorder="0"
            style={{ border: "none", display: "block" }}
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
