"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Wrench, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Award, 
  FileText, 
  Upload, 
  Trash2, 
  Cpu, 
  Activity, 
  Zap, 
  Check, 
  AlertCircle,
  HelpCircle,
  Radio,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/Button";
import { saveSubmission, uploadFile, suggestParty } from "@/app/actions/cms";
import styles from "../page.module.css";

export default function RepairClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [defectDescription, setDefectDescription] = useState("");
  const [consent, setConsent] = useState(true);

  // File upload state
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // DaData autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const ignoreFetch = useRef(false);

  useEffect(() => {
    if (!name) {
      setSuggestions([]);
      return;
    }
    const query = name;
    if (query.length < 3 || query.includes("ИНН:") || query.includes("КПП:")) {
      setSuggestions([]);
      return;
    }
    if (ignoreFetch.current) {
      ignoreFetch.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await suggestParty(query);
      setSuggestions(results);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [name]);

  useEffect(() => {
    const handleClickOutside = () => setSuggestions([]);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: any) => {
    ignoreFetch.current = true;
    const formatted = `${suggestion.value} (ИНН: ${suggestion.data.inn}${suggestion.data.kpp ? `, КПП: ${suggestion.data.kpp}` : ""})`;
    setName(formatted);
    setSuggestions([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);
      const res = await uploadFile(data);
      setFileUrl(res.url);
      setFileName(file.name);
      setFileSize(res.size);
    } catch (err) {
      console.error(err);
      setError("Ошибка при загрузке файла. Попробуйте еще раз.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);
      const res = await uploadFile(data);
      setFileUrl(res.url);
      setFileName(file.name);
      setFileSize(res.size);
    } catch (err) {
      console.error(err);
      setError("Ошибка при загрузке файла. Попробуйте еще раз.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFileUrl(null);
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) {
      setError("Пожалуйста, заполните обязательные поля (ФИО/Организация и телефон).");
      return;
    }
    if (!consent) {
      setError("Необходимо согласие на обработку персональных данных.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submission = {
        type: "equipment_repair",
        name,
        phone,
        email,
        deviceModel: deviceModel || "",
        serialNumber: serialNumber || "",
        defectDescription: defectDescription || "",
        attachedFile: fileUrl ? { name: fileName || "File", url: fileUrl, size: fileSize || "" } : null,
        date: new Date().toISOString()
      };

      const res = await saveSubmission(submission);
      if (res && res.success === false) {
        throw new Error(res.error || "Submission failed");
      }

      if (typeof window !== "undefined" && (window as any).ym) {
        (window as any).ym(98916872, "reachGoal", "form_submit");
      }

      setSubmitted(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      console.error("Repair form submit error:", err);
      if (err?.message?.includes("Server Action") || err?.message?.includes("deployment")) {
        window.location.reload();
        return;
      }
      setError("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const brands = [
    "Keysight Technologies (Agilent / HP)",
    "Rohde & Schwarz",
    "Anritsu",
    "Fluke",
    "Tektronix",
    "IFR (Aeroflex / Marconi)",
    "Advantest",
    "Keithley",
    "Yokogawa",
    "Stanford Research Systems",
    "Wiltron",
    "LeCroy (Teledyne)",
    "Chroma",
    "Ophir",
    "Thorlabs"
  ];

  const categories = [
    {
      title: "ВЧ и СВЧ приборы (до 50 ГГц)",
      desc: "Анализаторы спектра, векторные анализаторы цепей (VNA), генераторы сигналов, измерители мощности, синтезаторы частот."
    },
    {
      title: "Осциллографы и логические анализаторы",
      desc: "Цифровые, стробоскопические, широкополосные и аналоговые осциллографы, модули сбора данных, регистраторы."
    },
    {
      title: "Оптическое и ВОЛС оборудование",
      desc: "Оптические рефлектометры (OTDR), оптические спектроанализаторы, тестеры потерь, аттенюаторы и источники излучения."
    },
    {
      title: "Приборы общего назначения и КИПиА",
      desc: "Прецизионные цифровые мультиметры, калибраторы тока и напряжения, мегомметры, частотомеры, лабораторные блоки питания."
    },
    {
      title: "Оборудование радиосвязи и телеком",
      desc: "Радиокоммуникационные тестеры, базовые измерительные станции, антенные тестеры, тестеры протоколов связи."
    },
    {
      title: "Источники питания и электронные нагрузки",
      desc: "Линейные и импульсные прецизионные источники питания, электронные программируемые нагрузки большой мощности."
    }
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Benefits Grid */}
        <div className={styles.benefitsGrid4}>
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px 18px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            <div style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", padding: "12px", borderRadius: "10px" }}>
              <Zap size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>Предварительная диагностика</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Детальная проверка прибора, поиск неисправных компонентов и узлов.
              </p>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px 18px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "12px", borderRadius: "10px" }}>
              <Cpu size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>Компонентный ремонт до 50 ГГц</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Восстановление плат, СВЧ-трактов и микросборок с использованием оригинальной документации.
              </p>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px 18px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", padding: "12px", borderRadius: "10px" }}>
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>Опыт инженеров &gt; 15 лет</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Ведущие специалисты высокой квалификации. Более 2 500+ успешно отремонтированных приборов.
              </p>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px 18px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            <div style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", padding: "12px", borderRadius: "10px" }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>Гарантия + Поверка</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Гарантия от 6 месяцев на работы и детали. Первичная поверка в лаборатории (ФГИС «АРШИН»).
              </p>
            </div>
          </div>
        </div>

        {/* Action Callout Banner */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "16px",
          padding: "36px 40px",
          color: "#ffffff",
          marginBottom: "48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px"
        }}>
          <div style={{ maxWidth: "700px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 10px 0", color: "#ffffff" }}>
              Требуется ремонт или сервисное обслуживание приборов?
            </h2>
            <p style={{ fontSize: "15px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              Привезите прибор на диагностику или отправьте спецификацию с описанием неисправности — подготовим предварительную смету и сроки в течение 1 рабочего дня.
            </p>
          </div>
          <button 
            onClick={scrollToForm}
            style={{
              padding: "14px 28px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
              whiteSpace: "nowrap"
            }}
          >
            Оставить заявку на ремонт
          </button>
        </div>

        {/* Detailed Information Sections */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", marginBottom: "56px" }}>
          
          {/* Section 1: Detailed Overview */}
          <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "16px", padding: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "16px", color: "var(--foreground)" }}>
              Профессиональный подход к ремонту измерительной техники
            </h2>
            <div style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.8" }}>
              <p style={{ marginBottom: "16px" }}>
                <strong>ООО «Алира»</strong> осуществляет квалифицированный ремонт, восстановление и регулярное техническое обслуживание контрольно-измерительных приборов иностранного и отечественного производства, техники радиосвязи и оптоэлектроники.
              </p>
              <p style={{ marginBottom: "16px" }}>
                Мы производим ремонт как на <strong>блочном</strong>, так и на <strong>глубоком компонентном уровне</strong> (замена микросхем, СВЧ-усилителей, аттенюаторов, восстановление печатных плат и источников питания). Это позволяет существенно сократить расходы заказчика по сравнению с полной заменой дорогостоящих узлов.
              </p>
              <p style={{ margin: 0 }}>
                Собственная лабораторная база и специализированный фонд компонентов позволяют оперативно проводить диагностику и настройку прецизионных трактов в диапазоне <strong>до 50 ГГц</strong>. Опыт ключевых инженеров превышает 15 лет работы с приборами ведущих мировых производителей.
              </p>
            </div>
          </div>

          {/* Section 2: Equipment categories */}
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px", color: "var(--foreground)" }}>
              Виды ремонтируемого оборудования
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {categories.map((cat, i) => (
                <div key={i} style={{
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <CheckCircle2 size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>{cat.title}</h3>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Supported Brands */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px", color: "var(--foreground)" }}>
              Специализация по производителям
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Используем оригинальную сервисную документацию, схемы и калибровочные стенды для приборов следующих брендов:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {brands.map((b, i) => (
                <span key={i} style={{
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155"
                }}>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Workflow Steps */}
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px", color: "var(--foreground)" }}>
              Порядок выполнения работ
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {[
                { num: "01", title: "Заявка и доставка", text: "Оформление заявки, доставка оборудования в сервисный центр или выезд инженера." },
                { num: "02", title: "Предварительная диагностика", text: "Детальная проверка прибора, поиск неисправных компонентов и узлов." },
                { num: "03", title: "Смета и согласование", text: "Формирование фиксированной сметы работ, стоимости запчастей и сроков." },
                { num: "04", title: "Ремонт и настройка", text: "Компонентный ремонт, калибровка трактов по заводским спецификациям." },
                { num: "05", title: "Поверка и выдача", text: "Метрологическая поверка (ФГИС «АРШИН») и передача прибора с гарантией от 6 мес." }
              ].map((step, idx) => (
                <div key={idx} style={{
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "20px",
                  position: "relative"
                }}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#2563eb", marginBottom: "8px", opacity: 0.9 }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FORM ANCHOR & FORM CONTAINER */}
        <div ref={formRef} style={{ paddingTop: "20px" }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            {submitted ? (
              <div className={styles.successBanner} style={{ marginTop: 0 }}>
                <div style={{ backgroundColor: "#10b981", color: "#fff", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={36} />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#10b981", margin: 0 }}>
                  Заявка на ремонт успешно принята!
                </h2>
                <p style={{ fontSize: "15px", color: "var(--foreground)", lineHeight: "1.6", maxWidth: "550px", margin: "0 auto" }}>
                  Инженер нашего сервисного центра свяжется с вами по указанным контактам в течение 1 рабочего дня для уточнения деталей и организации диагностики.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setPhone("");
                    setEmail("");
                    setDeviceModel("");
                    setSerialNumber("");
                    setDefectDescription("");
                    setFileUrl(null);
                    setFileName(null);
                  }}
                  style={{ marginTop: "12px" }}
                >
                  Отправить еще одну заявку
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 10px 0", color: "#0f172a" }}>
                  Заявка на диагностику и ремонт
                </h2>
                <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 28px 0" }}>
                  Заполните форму ниже или прикрепите файл спецификации/дефектной ведомости. Поля, отмеченные (*), обязательны.
                </p>

                {error && (
                  <div style={{
                    background: "#fef2f2",
                    border: "1px solid #f87171",
                    color: "#b91c1c",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "14px"
                  }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className={styles.formGrid}>
                  {/* Name / Org */}
                  <div className={styles.formGroup} style={{ position: "relative" }}>
                    <label className={styles.inputLabel}>ФИО / Название организации: <span>*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Иван Иванов / ООО Альфа"
                      className={styles.textInput}
                      required
                      autoComplete="off"
                    />
                    {suggestions.length > 0 && (
                      <div className={styles.suggestionsDropdown} onClick={(e) => e.stopPropagation()}>
                        {suggestions.map((suggestion) => (
                          <div
                            key={suggestion.data.inn + (suggestion.data.kpp || "")}
                            className={styles.suggestionItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSuggestion(suggestion);
                            }}
                          >
                            <div className={styles.suggestionName}>{suggestion.value}</div>
                            <div className={styles.suggestionDetails}>
                              ИНН: {suggestion.data.inn} {suggestion.data.kpp ? `| КПП: ${suggestion.data.kpp}` : ""} | {suggestion.data.address?.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Контактный телефон: <span>*</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                      className={styles.textInput}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Email для связи / КП: <span>*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@example.ru"
                      className={styles.textInput}
                      required
                    />
                  </div>

                  {/* Device Model */}
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Марка и модель прибора:</label>
                    <input
                      type="text"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      placeholder="Например: Keysight N9020A / Fluke 8846A"
                      className={styles.textInput}
                    />
                  </div>

                  {/* Serial Number */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.inputLabel}>Заводской (серийный) номер (если известен):</label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="SN: MY54010293"
                      className={styles.textInput}
                    />
                  </div>

                  {/* Defect description */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.inputLabel}>Описание неисправности или симптомов:</label>
                    <textarea
                      value={defectDescription}
                      onChange={(e) => setDefectDescription(e.target.value)}
                      placeholder="Опишите дефект (не включается, ошибка калибровки, сбой СВЧ тракта, механические повреждения и т.п.)..."
                      className={styles.textArea}
                      rows={3}
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div style={{ marginBottom: "28px" }}>
                  <label className={styles.inputLabel} style={{ marginBottom: "8px", display: "block" }}>
                    Прикрепить файл (дефектная ведомость, фото шильдика/ошибки, список приборов в Excel/PDF):
                  </label>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #94a3b8",
                      borderRadius: "10px",
                      padding: "24px",
                      textAlign: "center",
                      background: isUploading ? "#f8fafc" : "#fafafa",
                      cursor: "pointer",
                      transition: "border-color 0.2s"
                    }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      style={{ display: "none" }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                    />

                    {isUploading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#2563eb" }}>
                        <div className={styles.spinner} />
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>Загрузка файла...</span>
                      </div>
                    ) : fileName ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={22} style={{ color: "#2563eb" }} />
                          <div style={{ textAlign: "left" }}>
                            <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{fileName}</span>
                            {fileSize && <span style={{ fontSize: "12px", color: "#64748b" }}>{fileSize}</span>}
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={removeFile}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600 }}
                        >
                          <Trash2 size={16} /> Удалить
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} style={{ color: "#2563eb", margin: "0 auto 8px auto" }} />
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                          Перетащите файл сюда или <u>нажмите для выбора</u>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Форматы: PDF, Excel, Word, TXT, фото JPG/PNG (до 15 МБ)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consent */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "28px", fontSize: "13px", color: "#64748b" }}>
                  <input
                    type="checkbox"
                    id="repair-consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    style={{ marginTop: "3px" }}
                  />
                  <label htmlFor="repair-consent">
                    Я согласен на <Link href="/agreement" target="_blank" style={{ color: "#2563eb" }}>обработку персональных данных</Link> в соответствии с <Link href="/privacy" target="_blank" style={{ color: "#2563eb" }}>политикой конфиденциальности</Link> <span aria-hidden="true">*</span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || !consent}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    background: isSubmitting || !consent ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: isSubmitting || !consent ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                    transition: "all 0.2s"
                  }}
                >
                  {isSubmitting ? "Отправка заявки..." : "Отправить заявку на ремонт"}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
