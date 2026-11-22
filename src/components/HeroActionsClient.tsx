"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, Upload, CheckCircle2, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { uploadFile, saveSubmission } from "@/app/actions/cms";
import styles from "@/app/page.module.css";

export const HeroActionsClient: React.FC = () => {
  const { openModal } = useModal();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const fileRes = await uploadFile(formData);
      await saveSubmission({
        type: "specification_upload",
        phone: phone,
        attachedFile: { name: file.name, url: fileRes.url, size: fileRes.size },
        date: new Date().toISOString()
      });
      if (typeof window !== "undefined" && (window as any).ym) {
        (window as any).ym(98916872, 'reachGoal', 'form_submit');
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      openModal("kp", "Загрузка спецификации");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%", marginTop: "24px" }}>
      <div className={styles.heroActions}>
        <Link href="/catalog" className={styles.btnLargePrimary} style={{ textDecoration: 'none' }}>
          <Package size={24} />
          <div className={styles.btnText}>
            <span className={styles.btnTitle}>Перейти в Каталог оборудования</span>
          </div>
        </Link>
        <Link href="/request-quote" className={styles.btnLargeSecondary} style={{ textDecoration: 'none' }}>
          <FileText size={24} />
          <div className={styles.btnText}>
            <span className={styles.btnTitle}>Запросить КП и смету</span>
          </div>
        </Link>
      </div>

      {/* Instant Specification Upload Box (CRO/Lead-Capture) */}
      <div style={{
        marginTop: "24px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "20px 24px",
        border: "1px solid rgba(37, 99, 235, 0.2)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)"
      }}>
        {submitted ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#065f46" }}>
            <CheckCircle2 size={28} style={{ color: "#10b981" }} />
            <div>
              <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>Спецификация успешно загружена!</strong>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Метрологи лаборатории обработают файл и свяжутся с вами с готовым расчетом в течение 1 рабочего дня.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFileSubmit} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px", color: "#0f172a", marginBottom: "4px" }}>
                <Upload size={18} style={{ color: "#2563eb" }} />
                Есть готовый список приборов или спецификация?
              </div>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Загрузите файл (Excel / PDF / Word) — пришлем расчет цен и сроков поверки/поставки.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flex: "1 1 320px", alignItems: "center" }}>
              <label style={{
                cursor: "pointer",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <Upload size={14} />
                {file ? file.name.substring(0, 18) + "..." : "Прикрепить файл..."}
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.doc,.docx,.pdf,.png,.jpg,.jpeg" 
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} 
                  style={{ display: "none" }} 
                />
              </label>

              <input 
                type="tel"
                placeholder="+7 (999) 000-00-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={!!file}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  flex: 1,
                  minWidth: "140px"
                }}
              />

              <button 
                type="submit" 
                disabled={isSubmitting || !file}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: file ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#94a3b8",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "13px",
                  border: "none",
                  cursor: file ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {isSubmitting ? "Отправка..." : <>Рассчитать <ArrowRight size={14} /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
