import React from "react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Запрос коммерческого предложения",
  description: "Запросить коммерческое предложение на измерительное оборудование и услуги поверки.",
};

export default function RequestQuotePage() {
  return (
    <div style={{ padding: "60px 20px", minHeight: "80vh", background: "#f8fafc" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
          Оформление заявки
        </h1>
        <p style={{ fontSize: 16, color: "#64748b" }}>
          Заполните форму ниже, чтобы получить индивидуальный расчет стоимости оборудования или услуг.
        </p>
      </div>
      
      <ContactForm formType="kp" />
    </div>
  );
}
