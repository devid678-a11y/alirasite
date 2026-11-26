"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Activity, Check, X, Wrench } from "lucide-react";
import { Button } from "@/components/Button";
import styles from "./page.module.css";
import { saveSubmission, suggestParty } from "@/app/actions/cms";

export default function ServicesClient({
  servicesData,
  labDocs,
  forceForm = null,
  requestForm = null,
  fixedServiceSubtype = null,
  requestLabel = ""
}: {
  servicesData: any;
  labDocs: any[];
  forceForm?: "calibration" | "testing" | null;
  requestForm?: "calibration" | "testing" | null;
  fixedServiceSubtype?: "verification" | "calibration" | null;
  requestLabel?: string;
}) {
  const [activeForm, setActiveForm] = useState<"calibration" | "testing" | null>(forceForm);
  const [serviceSubtype, setServiceSubtype] = useState<"verification" | "calibration">(fixedServiceSubtype || "verification");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // --- Calibration Form State ---
  const [calibContact, setCalibContact] = useState({
    orgName: "",
    email: "",
    phone: "",
    comment: "",
    consent: false
  });

  // --- Testing Form State ---
  const [testingForm, setTestingForm] = useState({
    siName: "",
    email: "",
    phone: "",
    modifications: "",
    applicant: "",
    credentials: "",
    manufacturer: "",
    purpose: "",
    scope: "",
    prodType: "серийное",
    serialNumbers: "",
    software: "",
    characteristics: "",
    documents: "",
    protocols: "нет",
    startActivity: "",
    minpromtorg: "",
    paymentDetails: "",
    consent: false
  });

  // --- LocalStorage persistence (Drafts) & Accidental Close Protection ---
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedCalibContact = localStorage.getItem("calibContact");
    const savedTestingForm = localStorage.getItem("testingForm");
    const savedActiveForm = localStorage.getItem("activeForm");

    if (savedCalibContact) {
      try { setCalibContact(prev => ({ ...prev, ...JSON.parse(savedCalibContact) })); } catch (e) {}
    }
    if (savedTestingForm) {
      try {
        const savedTestingValues = JSON.parse(savedTestingForm);
        setTestingForm(prev => ({
          ...prev,
          ...savedTestingValues,
          email: savedTestingValues.email || "",
          phone: savedTestingValues.phone || "",
        }));
      } catch (e) {}
    }

    if (forceForm) {
      setActiveForm(forceForm);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const formParam = urlParams.get("form");
      if (requestForm) {
        if (formParam === requestForm) {
          setActiveForm(requestForm);
          const url = new URL(window.location.href);
          url.searchParams.delete("form");
          window.history.replaceState(window.history.state, "", url.toString());
        }
      } else if (formParam === "calibration" || formParam === "testing") {
        setActiveForm(formParam as any);
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      } else if (savedActiveForm) {
        try { setActiveForm(JSON.parse(savedActiveForm) as any); } catch (e) {}
      }
    }
  }, [forceForm, requestForm]);

  useEffect(() => {
    if (!mounted) return;
    if (forceForm) {
      setActiveForm(forceForm);
    }
  }, [forceForm, mounted]);

  useEffect(() => {
    if (!requestForm || forceForm) return;
    const openRequestForm = () => {
      setSubmitted(false);
      setActiveForm(requestForm);
    };
    window.addEventListener("alira:open-service-request", openRequestForm);
    return () => window.removeEventListener("alira:open-service-request", openRequestForm);
  }, [requestForm, forceForm]);

  useEffect(() => {
    if (fixedServiceSubtype) setServiceSubtype(fixedServiceSubtype);
  }, [fixedServiceSubtype]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("calibContact", JSON.stringify(calibContact));
  }, [calibContact, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("testingForm", JSON.stringify(testingForm));
  }, [testingForm, mounted]);

  useEffect(() => {
    if (!mounted || forceForm || requestForm) return;
    if (activeForm) {
      localStorage.setItem("activeForm", JSON.stringify(activeForm));
    } else {
      localStorage.removeItem("activeForm");
    }
  }, [activeForm, mounted, forceForm, requestForm]);

  const clearDraft = (type: "calibration" | "testing") => {
    if (type === "calibration") {
      localStorage.removeItem("calibContact");
      setCalibContact({
        orgName: "",
        email: "",
        phone: "",
        comment: "",
        consent: false
      });
    } else {
      localStorage.removeItem("testingForm");
      setTestingForm({
        siName: "",
        email: "",
        phone: "",
        modifications: "",
        applicant: "",
        credentials: "",
        manufacturer: "",
        purpose: "",
        scope: "",
        prodType: "серийное",
        serialNumbers: "",
        software: "",
        characteristics: "",
        documents: "",
        protocols: "нет",
        startActivity: "",
        minpromtorg: "",
        paymentDetails: "",
        consent: false
      });
    }
  };

  const checkHasChanges = (type: "calibration" | "testing"): boolean => {
    if (type === "calibration") {
      const hasContactData = calibContact.orgName || calibContact.email || calibContact.phone || calibContact.comment || calibContact.consent;
      return !!hasContactData;
    } else {
      const hasTestingData = Object.entries(testingForm).some(([key, val]) => {
        if (key === "prodType" && val === "серийное") return false;
        if (key === "protocols" && val === "нет") return false;
        if (key === "consent" && val === false) return false;
        return !!val;
      });
      return hasTestingData;
    }
  };

  const handleCloseForm = () => {
    if (activeForm) {
      if (checkHasChanges(activeForm)) {
        if (!window.confirm("Вы уверены, что хотите закрыть форму? Внесенные данные будут сохранены в черновик.")) {
          return;
        }
      }
      setActiveForm(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseForm();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeForm && !forceForm) {
        handleCloseForm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeForm, calibContact, testingForm, forceForm]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeForm && !forceForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeForm, forceForm]);

  // --- DaData Suggestions (Smart Search) ---
  const [calibSuggestions, setCalibSuggestions] = useState<any[]>([]);
  const [testingSuggestions, setTestingSuggestions] = useState<any[]>([]);
  
  const ignoreCalibFetch = useRef(false);
  const ignoreTestingFetch = useRef(false);

  useEffect(() => {
    if (!mounted || !activeForm || activeForm !== "calibration") return;
    const query = calibContact.orgName;
    if (query.length < 3 || query.includes("ИНН:") || query.includes("КПП:")) {
      setCalibSuggestions([]);
      return;
    }
    if (ignoreCalibFetch.current) {
      ignoreCalibFetch.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const suggestions = await suggestParty(query);
      setCalibSuggestions(suggestions);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [calibContact.orgName, activeForm, mounted]);

  useEffect(() => {
    if (!mounted || !activeForm || activeForm !== "testing") return;
    const query = testingForm.applicant;
    // Suggest only for short/single line text
    if (query.length < 3 || query.includes("\n") || query.includes("ИНН:")) {
      setTestingSuggestions([]);
      return;
    }
    if (ignoreTestingFetch.current) {
      ignoreTestingFetch.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const suggestions = await suggestParty(query);
      setTestingSuggestions(suggestions);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [testingForm.applicant, activeForm, mounted]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = () => {
      setCalibSuggestions([]);
      setTestingSuggestions([]);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectCalibSuggestion = (suggestion: any) => {
    ignoreCalibFetch.current = true;
    const formatted = `${suggestion.value} (ИНН: ${suggestion.data.inn}${suggestion.data.kpp ? `, КПП: ${suggestion.data.kpp}` : ""})`;
    setCalibContact(prev => ({
      ...prev,
      orgName: formatted
    }));
    setCalibSuggestions([]);
  };

  const handleSelectTestingSuggestion = (suggestion: any) => {
    ignoreTestingFetch.current = true;
    const formatted = `Наименование: ${suggestion.value}
Адрес: ${suggestion.data.address?.unrestricted_value || suggestion.data.address?.value || ""}
ИНН: ${suggestion.data.inn}${suggestion.data.kpp ? ` / КПП: ${suggestion.data.kpp}` : ""}
ОГРН: ${suggestion.data.ogrn || ""}`;
    
    setTestingForm(prev => ({
      ...prev,
      applicant: formatted
    }));
    setTestingSuggestions([]);
  };

  // Scroll to form smoothly
  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleOpenForm = (type: "calibration" | "testing") => {
    setActiveForm(type);
    setSubmitted(false);
    scrollToForm();
  };

  // --- Calibration Handlers ---
  const handleCalibContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCalibContact(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Testing Handlers ---
  const handleTestingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTestingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestingCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestingForm(prev => ({
      ...prev,
      consent: e.target.checked
    }));
  };

  // --- Form Submissions ---
  const handleCalibSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    if (!calibContact.email.trim() && !calibContact.phone.trim()) {
      alert("Укажите телефон или адрес электронной почты — как вам удобнее.");
      return;
    }
    if (!calibContact.consent) {
      alert("Необходимо дать согласие на обработку персональных данных.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isVerification = serviceSubtype === "verification";
      const submissionData = {
        type: serviceSubtype,
        serviceSubtype: serviceSubtype,
        serviceName: isVerification ? "Поверка средств измерений" : "Калибровка средств измерений",
        ...(requestLabel ? { productName: requestLabel } : {}),
        contact: {
          orgName: calibContact.orgName || "",
          email: calibContact.email || "",
          phone: calibContact.phone || "",
          message: calibContact.comment || ""
        },
        submittedAt: new Date().toISOString()
      };

      const res = await saveSubmission(submissionData);
      if (res && res.success === false) {
        throw new Error(res.error || "Submission failed");
      }
      if (typeof window !== "undefined") {
        const ymWindow = window as unknown as { ym?: (...args: unknown[]) => void };
        ymWindow.ym?.(98916872, "reachGoal", isVerification ? "verification_form_submit" : "calibration_form_submit");
        ymWindow.ym?.(98916872, "reachGoal", "form_submit");
      }
      clearDraft("calibration");
      setSubmitted(true);
    } catch (err: any) {
      console.error("Calibration form submit error:", err);
      if (err?.message?.includes("Server Action") || err?.message?.includes("deployment")) {
        window.location.reload();
        return;
      }
      alert("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    const requiredFields = ["siName"];
    for (const field of requiredFields) {
      if (!String(testingForm[field as keyof typeof testingForm] || "").trim()) {
        alert("Укажите наименование или модель средства измерений.");
        return;
      }
    }
    if (!testingForm.email.trim() && !testingForm.phone.trim()) {
      alert("Укажите телефон или адрес электронной почты — как вам удобнее.");
      return;
    }
    if (!testingForm.consent) {
      alert("Необходимо дать согласие на обработку персональных данных.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        type: "testing",
        contact: {
          orgName: testingForm.applicant || "",
          email: testingForm.email || "",
          phone: testingForm.phone || ""
        },
        formData: {
          siName: testingForm.siName || "",
          modifications: testingForm.modifications || "",
          applicant: testingForm.applicant || "",
          credentials: testingForm.credentials || "",
          manufacturer: testingForm.manufacturer || "",
          purpose: testingForm.purpose || "",
          scope: testingForm.scope || "",
          prodType: testingForm.prodType || "серийное",
          serialNumbers: testingForm.serialNumbers || "",
          software: testingForm.software || "",
          characteristics: testingForm.characteristics || "",
          documents: testingForm.documents || "",
          protocols: testingForm.protocols || "нет",
          startActivity: testingForm.startActivity || "",
          minpromtorg: testingForm.minpromtorg || "",
          paymentDetails: testingForm.paymentDetails || ""
        },
        submittedAt: new Date().toISOString()
      };

      const res = await saveSubmission(submissionData);
      if (res && res.success === false) {
        throw new Error(res.error || "Submission failed");
      }
      clearDraft("testing");
      setSubmitted(true);
    } catch (err: any) {
      console.error("Testing form submit error:", err);
      if (err?.message?.includes("Server Action") || err?.message?.includes("deployment")) {
        window.location.reload();
        return;
      }
      alert("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={forceForm ? styles.verificationPage : requestForm ? undefined : styles.page}>
      <div className={forceForm ? styles.verificationContainer : requestForm ? undefined : styles.container}>

        {/* Services interactive selectors grid */}
        {!forceForm && !requestForm && (
          <div className={styles.cardsGrid}>
            <div className={`${styles.serviceCard} ${activeForm === "calibration" ? styles.serviceCardActive : ""}`}>
              <div className={styles.cardIcon}>
                <Activity size={28} />
              </div>
              <h2 className={styles.cardTitle}>Поверка средств измерений</h2>
              <p className={styles.cardDesc}>
                Первичная и периодическая поверка. Поможем определить, что нужно подготовить для расчёта.
              </p>
              <Button variant="primary" style={{ marginTop: "auto" }} onClick={() => handleOpenForm("calibration")}>
                Оформить заявку
              </Button>
            </div>

            <div className={`${styles.serviceCard} ${activeForm === "testing" ? styles.serviceCardActive : ""}`}>
              <div className={styles.cardIcon}>
                <FileText size={28} />
              </div>
              <h2 className={styles.cardTitle}>Испытания СИ в целях утверждения типа</h2>
              <p className={styles.cardDesc}>
                Комплексные испытания средств измерений для последующего внесения в Государственный 
                реестр средств измерений РФ (ГРСИ) и получения свидетельства об утверждении типа.
              </p>
              <Button variant="primary" style={{ marginTop: "auto" }} onClick={() => handleOpenForm("testing")}>
                Оформить заявку
              </Button>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.cardIcon}>
                <Wrench size={28} />
              </div>
              <h2 className={styles.cardTitle}>Ремонт и сервисное обслуживание СИ</h2>
              <p className={styles.cardDesc}>
                Квалифицированный компонентный и блочный ремонт сложных измерительных приборов, ВЧ/СВЧ техники до 50 ГГц (Keysight, R&S, Anritsu, Fluke). Предварительная диагностика, гарантия от 6 месяцев и послеремонтная поверка.
              </p>
              <Link href="/services/repair" style={{ textDecoration: 'none', marginTop: 'auto' }}>
                <Button variant="primary" style={{ width: '100%' }}>
                  Перейти к услуге
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Form Anchor */}
        {!requestForm && <div id="service-request" ref={formRef} tabIndex={-1} className={styles.formAnchor} />}

        {/* Forms Render Area in Modal Pop-up or Inline */}
        {activeForm && (
          <div 
            className={forceForm ? "" : styles.modalOverlay} 
            onClick={forceForm ? undefined : handleOverlayClick}
          >
            <div 
              className={forceForm ? styles.inlineForm : styles.modalContainer}
              role={forceForm ? undefined : "dialog"}
              aria-modal={forceForm ? undefined : true}
            >
              {!forceForm && (
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={handleCloseForm}
                  title="Закрыть (Esc)"
                >
                  <X size={22} />
                </button>
              )}

              {submitted ? (
                <div className={styles.successBanner} style={{ marginTop: 0 }}>
                  <div style={{ backgroundColor: "#10b981", color: "#fff", width: 54, height: 54, borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                    <Check size={32} />
                  </div>
                  <h2 className={styles.successTitle}>Заявка успешно отправлена!</h2>
                  <p className={styles.successText}>
                    Благодарим Вас за обращение. Метрологи нашей лаборатории примут заявку в обработку и свяжутся с Вами по указанным контактам в течение 1 рабочего дня.
                  </p>
                  {!forceForm && (
                    <Button variant="outline" onClick={() => { setSubmitted(false); setActiveForm(null); }} style={{ marginTop: 8 }}>
                      Закрыть окно
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Form 1: Verification & Calibration */}
                  {activeForm === "calibration" && (
                    <form onSubmit={handleCalibSubmit} style={{ border: "none", padding: 0 }}>
                      {!fixedServiceSubtype && (
                      <div className={styles.serviceTabs} role="tablist" aria-label="Выберите тип услуги">
                        <button
                          type="button"
                          role="tab"
                          id="tab-verification"
                          aria-selected={serviceSubtype === "verification"}
                          className={`${styles.serviceTab} ${serviceSubtype === "verification" ? styles.serviceTabActive : ""}`}
                          onClick={() => setServiceSubtype("verification")}
                        >
                          <CheckCircle2 size={17} className={styles.tabIcon} aria-hidden="true" />
                          <span>Нужна поверка</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          id="tab-calibration"
                          aria-selected={serviceSubtype === "calibration"}
                          className={`${styles.serviceTab} ${serviceSubtype === "calibration" ? styles.serviceTabActive : ""}`}
                          onClick={() => setServiceSubtype("calibration")}
                        >
                          <Activity size={17} className={styles.tabIcon} aria-hidden="true" />
                          <span>Нужна калибровка</span>
                        </button>
                      </div>

                      )}

                      <h2 className={styles.formTitle}>Оставьте контакты — мы свяжемся</h2>
                      <p className={styles.formSubtitle}>
                        {serviceSubtype === "verification"
                          ? "Оставьте телефон или email. Прибор и характеристики можно указать в комментарии по желанию — мы свяжемся и уточним детали."
                          : "Оставьте телефон или email. Если хотите, напишите в комментарии, что нужно откалибровать. Мы свяжемся и уточним детали."}
                      </p>

                      <div className={styles.formGridContacts}>
                        <div className={styles.formGroup} style={{ position: "relative" }}>
                          <label className={styles.inputLabel} htmlFor="calibration-org-name">Компания (необязательно):</label>
                          <input
                            type="text"
                            id="calibration-org-name"
                            name="orgName"
                            value={calibContact.orgName}
                            onChange={handleCalibContactChange}
                            className={styles.textInput}
                            placeholder="Название компании или ИНН"
                            autoComplete="off"
                          />
                          {calibSuggestions.length > 0 && (
                            <div className={styles.suggestionsDropdown} onClick={(e) => e.stopPropagation()}>
                              {calibSuggestions.map((suggestion) => (
                                <div
                                  key={suggestion.data.inn + (suggestion.data.kpp || "")}
                                  className={styles.suggestionItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectCalibSuggestion(suggestion);
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

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel} htmlFor="calibration-phone">Телефон для связи:</label>
                          <input
                            type="tel"
                            id="calibration-phone"
                            name="phone"
                            value={calibContact.phone}
                            onChange={handleCalibContactChange}
                            className={styles.textInput}
                            placeholder="+7 (___) ___-__-__"
                            autoComplete="tel"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel} htmlFor="calibration-email">Электронная почта:</label>
                          <input
                            type="email"
                            id="calibration-email"
                            name="email"
                            value={calibContact.email}
                            onChange={handleCalibContactChange}
                            className={styles.textInput}
                            placeholder="example@mail.ru"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <p className={styles.contactHint}>Достаточно указать телефон или email — можно оставить только один контакт.</p>
                      <div className={styles.formGroupFull}>
                        <label className={styles.inputLabel} htmlFor="calibration-comment">
                          Комментарий <span style={{ color: "#7b8999", fontWeight: 400 }}>(необязательно)</span>
                        </label>
                        <textarea
                          id="calibration-comment"
                          name="comment"
                          value={calibContact.comment}
                          onChange={handleCalibContactChange}
                          className={styles.textArea}
                          rows={4}
                          placeholder="Например, какие приборы нужно поверить. Марку, модель и характеристики можно указать по желанию."
                        />
                        <p className={styles.contactHint} style={{ margin: "2px 0 10px" }}>
                          Можно оставить поле пустым — мы уточним детали при общении.
                        </p>
                      </div>

                      <label className={styles.consentRow}>
                        <input
                          type="checkbox"
                          checked={calibContact.consent}
                          onChange={(e) => setCalibContact(prev => ({ ...prev, consent: e.target.checked }))}
                          required
                        />
                        <span>
                          Я согласен на <Link href="/agreement" target="_blank">обработку персональных данных</Link> в соответствии с <Link href="/privacy" target="_blank">политикой конфиденциальности</Link>.
                        </span>
                      </label>

                      <Button variant="primary" type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                        {isSubmitting
                          ? "Отправка заявки..."
                          : (serviceSubtype === "verification" ? "Отправить заявку на поверку" : "Отправить заявку на калибровку")}
                      </Button>
                    </form>
                  )}

                  {/* Form 2: Testing / Approval */}
                  {activeForm === "testing" && (
                    <form onSubmit={handleTestingSubmit} style={{ border: "none", padding: 0 }}>
                      <h2 className={styles.formTitle}>Обсудить испытания средства измерений</h2>
                      <p className={styles.formSubtitle}>
                        Для первого разговора укажите прибор и телефон или почту. Технические детали можно заполнить ниже, если они уже есть.
                      </p>

                      <div className={styles.formGrid}>
                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel} htmlFor="testing-si-name">Модель или наименование прибора: <span>*</span></label>
                          <input
                            type="text"
                            id="testing-si-name"
                            name="siName"
                            value={testingForm.siName}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Например, оптический рефлектометр AQ7280"
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel} htmlFor="testing-email">Электронная почта:</label>
                          <input
                            type="email"
                            id="testing-email"
                            name="email"
                            value={testingForm.email || ""}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="example@mail.ru"
                            autoComplete="email"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel} htmlFor="testing-phone">Телефон для связи:</label>
                          <input
                            type="tel"
                            id="testing-phone"
                            name="phone"
                            value={testingForm.phone || ""}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="+7 (999) 123-45-67"
                            autoComplete="tel"
                          />
                        </div>
                        <p className={styles.contactHint}>Укажите телефон или электронную почту — достаточно одного варианта.</p>
                      </div>

                      <details className={styles.optionalFields}>
                        <summary>Добавить сведения о модификациях, документах и характеристиках</summary>
                        <div className={styles.formGrid}>
                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Модификации или варианты исполнения:</label>
                          <textarea
                            name="modifications"
                            value={testingForm.modifications}
                            onChange={handleTestingChange}
                            className={styles.textArea}
                            placeholder="Укажите модификации (например: AQ7282A, AQ7283F и т.д.)"
                          />
                        </div>

                        <div className={styles.formGroupFull} style={{ position: "relative" }}>
                          <label className={styles.inputLabel}>
                            Компания-заявитель (если известна):
                          </label>
                          <textarea
                            name="applicant"
                            value={testingForm.applicant}
                            onChange={handleTestingChange}
                            className={styles.textArea}
                            placeholder="Введите ИНН или название компании для умного поиска..."
                          />
                          {testingSuggestions.length > 0 && (
                            <div className={styles.suggestionsDropdown} onClick={(e) => e.stopPropagation()}>
                              {testingSuggestions.map((suggestion) => (
                                <div
                                  key={suggestion.data.inn + (suggestion.data.kpp || "")}
                                  className={styles.suggestionItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectTestingSuggestion(suggestion);
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

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Документ о полномочиях заявителя:</label>
                          <input
                            type="text"
                            name="credentials"
                            value={testingForm.credentials}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Доверенность №... от ... / Устав"
                          />
                        </div>

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>
                            Изготовитель и страна производства:
                          </label>
                          <textarea
                            name="manufacturer"
                            value={testingForm.manufacturer}
                            onChange={handleTestingChange}
                            className={styles.textArea}
                            placeholder="Полное наименование компании-производителя и её филиалов"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel}>Назначение прибора:</label>
                          <input
                            type="text"
                            name="purpose"
                            value={testingForm.purpose}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Например, Измерение затухания и длины волокна"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel}>Область применения:</label>
                          <input
                            type="text"
                            name="scope"
                            value={testingForm.scope}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Сфера государственного регулирования (связь, оборона, геодезия)"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel}>Характер производства:</label>
                          <select
                            name="prodType"
                            value={testingForm.prodType}
                            onChange={handleTestingChange}
                            className={styles.selectInput}
                          >
                            <option value="серийное">Серийное</option>
                            <option value="единичное">Единичное</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel}>Заводские номера:</label>
                          <input
                            type="text"
                            name="serialNumbers"
                            value={testingForm.serialNumbers}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Номера приборов, представляемых на испытания"
                          />
                        </div>

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Сведения о наличии программного продукта:</label>
                          <input
                            type="text"
                            name="software"
                            value={testingForm.software}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Версия встроенного и внешнего ПО, наименование"
                          />
                        </div>

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Технические и метрологические характеристики:</label>
                          <textarea
                            name="characteristics"
                            value={testingForm.characteristics}
                            onChange={handleTestingChange}
                            className={styles.textArea}
                            placeholder="Основные параметры СИ, диапазон измерений, погрешность"
                          />
                        </div>

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Сведения о документах, по которым осуществляется изготовление СИ (для серийного производства):</label>
                          <input
                            type="text"
                            name="documents"
                            value={testingForm.documents}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="ТУ, ГОСТ, стандарты изготовителя"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel}>Сведения о наличии протоколов предварительных испытаний:</label>
                          <select
                            name="protocols"
                            value={testingForm.protocols}
                            onChange={handleTestingChange}
                            className={styles.selectInput}
                          >
                            <option value="нет">Нет</option>
                            <option value="есть">Есть</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.inputLabel}>Сведения о начале осуществления деятельности по производству СИ:</label>
                          <input
                            type="text"
                            name="startActivity"
                            value={testingForm.startActivity}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Дата начала производства прибора"
                          />
                        </div>

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Сведения о наличии заключения Минпромторга России о подтверждении производства:</label>
                          <input
                            type="text"
                            name="minpromtorg"
                            value={testingForm.minpromtorg}
                            onChange={handleTestingChange}
                            className={styles.textInput}
                            placeholder="Реквизиты заключения Минпромторга при наличии"
                          />
                        </div>

                        <div className={styles.formGroupFull}>
                          <label className={styles.inputLabel}>Платежные реквизиты:</label>
                          <textarea
                            name="paymentDetails"
                            value={testingForm.paymentDetails}
                            onChange={handleTestingChange}
                            className={styles.textArea}
                            placeholder="ИНН, КПП, расчетный счет, наименование банка для выставления счета"
                          />
                        </div>
                      </div>
                      </details>

                      <label className={styles.consentRow}>
                        <input
                          type="checkbox"
                          checked={testingForm.consent}
                          onChange={handleTestingCheckboxChange}
                          required
                        />
                        <span>
                          Я согласен на <Link href="/agreement" target="_blank">обработку персональных данных</Link> в соответствии с <Link href="/privacy" target="_blank">политикой конфиденциальности</Link>.
                        </span>
                      </label>

                      <Button variant="primary" type="submit" style={{ width: "100%", padding: "14px" }} disabled={isSubmitting}>
                        {isSubmitting ? "Отправка..." : "Отправить запрос специалисту"}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
