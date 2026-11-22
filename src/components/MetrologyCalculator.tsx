"use client";

import React, { useState } from "react";
import { Calculator, CheckCircle2, ShieldCheck, ArrowRight, RotateCcw } from "lucide-react";
import { saveSubmission } from "@/app/actions/cms";

export const MetrologyCalculator: React.FC = () => {
  const [serviceType, setServiceType] = useState("calibration");
  const [category, setCategory] = useState("optical");
  const [quantity, setQuantity] = useState("1-5");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setIsSubmitting(true);
    try {
      await saveSubmission({
        type: "quiz_calculator",
        serviceType,
        category,
        quantity,
        phone: contact,
        date: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={{ padding: "80px 20px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 12px 0", color: "#ffffff" }}>
            Рассчитайте стоимость поверки или оснащения лаборатории
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "700px", margin: "0 auto" }}>
            Выберите параметры вашего заказа за 30 секунд и получите смету с гарантией внесения сведений во ФГИС «АРШИН»
          </p>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "36px", backdropFilter: "blur(10px)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 12px 0" }}>Расчет принят в работу!</h3>
              <p style={{ color: "#94a3b8", fontSize: "15px", maxWidth: "550px", margin: "0 auto 24px auto" }}>
                Метрологи нашей аккредитованной лаборатории сформируют смету с учетом действующих скидок и свяжутся с вами в течение 1 рабочего дня.
              </p>
              <button 
                onClick={() => setSubmitted(false)} 
                style={{ background: "transparent", border: "1px solid #475569", color: "#cbd5e1", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <RotateCcw size={16} /> Рассчитать еще раз
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", marginBottom: "32px" }}>
                {/* Step 1 */}
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#38bdf8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    1. Услуга или оборудование
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { id: "calibration", label: "Поверка / Калибровка СИ" },
                      { id: "testing", label: "Испытания для ГРСИ (Утверждение типа)" },
                      { id: "supply", label: "Поставка оборудования и оснащение" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setServiceType(opt.id)}
                        style={{
                          textAlign: "left",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: serviceType === opt.id ? "2px solid #2563eb" : "1px solid #334155",
                          background: serviceType === opt.id ? "rgba(37, 99, 235, 0.2)" : "rgba(15, 23, 42, 0.6)",
                          color: serviceType === opt.id ? "#ffffff" : "#cbd5e1",
                          fontWeight: serviceType === opt.id ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#38bdf8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    2. Категория оборудования
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { id: "optical", label: "Оптические СИ (Рефлектометры, ВОЛС)" },
                      { id: "rf", label: "ВЧ / СВЧ измерители и Анализаторы" },
                      { id: "general", label: "Общепромышленные приборы КИПиА" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCategory(opt.id)}
                        style={{
                          textAlign: "left",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: category === opt.id ? "2px solid #2563eb" : "1px solid #334155",
                          background: category === opt.id ? "rgba(37, 99, 235, 0.2)" : "rgba(15, 23, 42, 0.6)",
                          color: category === opt.id ? "#ffffff" : "#cbd5e1",
                          fontWeight: category === opt.id ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3 */}
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#38bdf8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    3. Количество приборов
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { id: "1-5", label: "1 — 5 приборов (Разовый заказ)" },
                      { id: "5-20", label: "5 — 20 приборов (Партия)" },
                      { id: "20+", label: "Свыше 20 приборов (Комплекс)" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setQuantity(opt.id)}
                        style={{
                          textAlign: "left",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: quantity === opt.id ? "2px solid #2563eb" : "1px solid #334155",
                          background: quantity === opt.id ? "rgba(37, 99, 235, 0.2)" : "rgba(15, 23, 42, 0.6)",
                          color: quantity === opt.id ? "#ffffff" : "#cbd5e1",
                          fontWeight: quantity === opt.id ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "14px", fontWeight: 600 }}>
                  <ShieldCheck size={18} /> Сведения передаются во ФГИС «АРШИН» по 102-ФЗ
                </div>

                <div style={{ display: "flex", gap: "12px", flex: "1 1 340px", justifyContent: "flex-end" }}>
                  <input
                    type="tel"
                    placeholder="Ваш телефон для получения расчета..."
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid #475569",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: "14px",
                      flex: 1,
                      maxWidth: "280px"
                    }}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: "14px 28px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)"
                    }}
                  >
                    {isSubmitting ? "Расчет..." : <>Получить смету <ArrowRight size={16} /></>}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
