"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Paperclip } from "lucide-react";
import { saveSubmission, uploadFile } from "@/app/actions/cms";
import s from "@/app/home.module.css";

const acceptedExtensions = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv"]);
const maxFileSize = 10 * 1024 * 1024;

export default function HomeInstrumentListForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setError("");
    if (!nextFile) {
      setFile(null);
      return;
    }

    const extension = nextFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!acceptedExtensions.has(extension)) {
      setFile(null);
      event.target.value = "";
      setError("Загрузите перечень в формате Excel, Word, PDF или CSV.");
      return;
    }
    if (nextFile.size > maxFileSize) {
      setFile(null);
      event.target.value = "";
      setError("Размер файла должен быть не больше 10 МБ.");
      return;
    }
    setFile(nextFile);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!file) {
      setError("Прикрепите перечень приборов.");
      return;
    }
    const trimmedContact = contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact);
    const phoneDigits = trimmedContact.replace(/\D/g, "");
    const isPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
    if (!isEmail && !isPhone) {
      setError("Укажите корректный телефон или адрес электронной почты.");
      return;
    }
    if (!consent) {
      setError("Для отправки заявки нужно согласие на обработку персональных данных.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadedFile = await uploadFile(uploadData);
      const result = await saveSubmission({
        type: "specification_upload",
        serviceType: "Расчёт поверки или калибровки по перечню",
        phone: isPhone ? trimmedContact : "",
        email: isEmail ? trimmedContact : "",
        message: "Просьба рассчитать стоимость и сроки поверки или калибровки по перечню приборов.",
        attachedFile: { name: file.name, url: uploadedFile.url, size: uploadedFile.size },
        consent: true,
        date: new Date().toISOString(),
      });
      if (result?.success === false) throw new Error(result.error || "Не удалось отправить заявку.");
      if (typeof window !== "undefined") {
        const ymWindow = window as unknown as { ym?: (...args: unknown[]) => void };
        ymWindow.ym?.(98916872, "reachGoal", "form_submit");
      }
      setSubmitted(true);
    } catch {
      setError("Не получилось отправить файл. Попробуйте ещё раз или позвоните нам.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={s.listSuccess} role="status">
        <CheckCircle2 size={25} aria-hidden="true" />
        <div><strong>Перечень отправлен</strong><span>Свяжемся с вами по указанному контакту.</span></div>
      </div>
    );
  }

  return (
    <form className={s.listForm} onSubmit={handleSubmit}>
      <div className={s.listControls}>
        <label className={s.filePicker}>
          <Paperclip size={18} aria-hidden="true" />
          <span>{file ? file.name : "Прикрепить перечень"}</span>
          <input
            ref={fileInputRef}
            className={s.fileInput}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
            onChange={handleFileChange}
            aria-label="Выберите перечень приборов"
            required
          />
        </label>
        <input
          className={s.contactInput}
          type="text"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="Телефон или email"
          aria-label="Телефон или email для ответа"
          autoComplete="email tel"
          required
        />
        <button className={s.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить перечень"}
          {!isSubmitting && <ArrowRight size={17} aria-hidden="true" />}
        </button>
      </div>
      <div className={s.listFormFoot}>
        <label className={s.consentRow}>
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>Согласен на <Link href="/agreement" target="_blank">обработку персональных данных</Link> и принимаю <Link href="/privacy" target="_blank">политику конфиденциальности</Link>.</span>
        </label>
        <span className={s.fileHint}>Excel, Word, PDF или CSV · до 10 МБ</span>
      </div>
      {error && <p className={s.formError} role="alert">{error}</p>}
    </form>
  );
}
