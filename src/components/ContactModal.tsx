"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { uploadFile, saveSubmission, suggestParty } from "@/app/actions/cms";
import styles from "./ContactModal.module.css";

export const ContactModal: React.FC = () => {
  const { isOpen, modalType, productName, closeModal } = useModal();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [consent, setConsent] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DaData Suggestions (Smart Search) ---
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const ignoreFetch = useRef(false);

  useEffect(() => {
    if (!isOpen || !name) {
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
  }, [name, isOpen]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = () => {
      setSuggestions([]);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: any) => {
    ignoreFetch.current = true;
    const formattedName = `${suggestion.value} (ИНН: ${suggestion.data.inn}${suggestion.data.kpp ? `, КПП: ${suggestion.data.kpp}` : ""})`;
    setName(formattedName);
    setSuggestions([]);
    
    // Auto-append details to comment field if available
    const suffix = `\n\nРеквизиты организации:\nАдрес: ${suggestion.data.address?.unrestricted_value || suggestion.data.address?.value || ""}\nИНН: ${suggestion.data.inn}${suggestion.data.kpp ? ` / КПП: ${suggestion.data.kpp}` : ""}\nОГРН: ${suggestion.data.ogrn || ""}`;
    setMessage(prev => prev ? `${prev}${suffix}` : suffix.trim());
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (modalType) {
      case "callback":
        return "Заказать обратный звонок";
      case "inquiry":
        return productName ? `Заявка на ${productName}` : "Отправить заявку";
      case "kp":
        return productName ? `Запрос КП на ${productName}` : "Запрос коммерческого предложения";
      default:
        return "Связаться с нами";
    }
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    setIsSubmitting(true);
    setError(null);

    try {
      const submission = {
        type: modalType || "inquiry",
        productName: productName || null,
        name: name || "",
        phone: phone || "",
        email: email || "",
        message: message || "",
        attachedFile: fileUrl ? { name: fileName || "File", url: fileUrl, size: fileSize || "" } : null,
        date: new Date().toISOString()
      };

      const res = await saveSubmission(submission);
      if (res && res.success === false) {
        throw new Error(res.error || "Submission failed");
      }
      
      // Yandex.Metrika goal for form submission
      if (typeof window !== "undefined" && (window as any).ym) {
        (window as any).ym(98916872, 'reachGoal', 'form_submit');
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error("ContactModal error:", err);
      if (err?.message?.includes("Server Action") || err?.message?.includes("deployment")) {
        window.location.reload();
        return;
      }
      setError("Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeModal();
    // Reset state after transition
    setTimeout(() => {
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setFileUrl(null);
      setFileName(null);
      setFileSize(null);
      setIsSuccess(false);
      setError(null);
    }, 200);
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose}>
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className={styles.successState}>
            <CheckCircle2 size={64} className={styles.successIcon} />
            <h2>Заявка успешно отправлена!</h2>
            <p>Наши специалисты свяжутся с вами в ближайшее время для уточнения деталей.</p>
            <button className={styles.successCloseBtn} onClick={handleClose}>
              Отлично
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>{getTitle()}</h2>
            <p className={styles.subtitleText}>
              Заполните форму ниже, и мы подготовим для вас предложение.
            </p>

            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label>ФИО / Название компании *</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Иван Иванов / ООО Альфа"
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

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Телефон *</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+7 (999) 123-45-67"
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Email *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="info@example.com"
                  required 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Комментарий к заявке</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Укажите ваши пожелания, количество приборов или требования к конфигурации..."
                rows={3}
              />
            </div>

            <div className={styles.fileSection}>
              <label>Список приборов или техническое задание (ТЗ)</label>
              <div 
                className={`${styles.dropZone} ${isUploading ? styles.uploading : ""}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                
                {isUploading ? (
                  <div className={styles.uploadState}>
                    <div className={styles.spinner}></div>
                    <span>Загрузка файла...</span>
                  </div>
                ) : fileName ? (
                  <div className={styles.fileInfo} onClick={(e) => e.stopPropagation()}>
                    <FileText size={24} className={styles.fileIcon} />
                    <div className={styles.fileMeta}>
                      <span className={styles.fileName}>{fileName}</span>
                      <span className={styles.fileSize}>{fileSize}</span>
                    </div>
                    <button type="button" className={styles.removeFileBtn} onClick={removeFile}>
                      Удалить
                    </button>
                  </div>
                ) : (
                  <div className={styles.promptState}>
                    <Upload size={24} className={styles.uploadIcon} />
                    <span>Перетащите файл сюда или <strong>нажмите для выбора</strong></span>
                    <span className={styles.fileTypes}>Допустимые форматы: PDF, Word, Excel, TXT (до 10 МБ)</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.consentGroup}>
              <input 
                type="checkbox" 
                id="modal-consent"
                checked={consent} 
                onChange={(e) => setConsent(e.target.checked)} 
                required 
              />
              <label htmlFor="modal-consent" className={styles.consentLabel}>
                Я согласен на <Link href="/agreement" target="_blank" onClick={(e) => e.stopPropagation()}>обработку персональных данных</Link> в соответствии с <Link href="/privacy" target="_blank" onClick={(e) => e.stopPropagation()}>политикой конфиденциальности</Link>
              </label>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={isSubmitting || isUploading || !consent}
            >
              {isSubmitting ? "Отправка..." : "Отправить заявку"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
