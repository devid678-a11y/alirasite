import { checkAuth, logoutAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { loadSubmissions, type Submission } from "./submissions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Заявки | АЛИРА",
  robots: { index: false, follow: false },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function showValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

function submissionFields(submission: Submission) {
  const flat: Record<string, unknown> = { ...submission };
  for (const key of ["contact", "formData"]) {
    Object.assign(flat, asRecord(submission[key]));
  }
  return Object.entries(flat).filter(([key, value]) =>
    !["contact", "formData"].includes(key) && value !== undefined && value !== null && value !== ""
  );
}

const labels: Record<string, string> = {
  id: "ID",
  type: "Тип",
  submittedAt: "Дата",
  createdAt: "Дата",
  name: "Имя",
  orgName: "Организация",
  applicant: "Заявитель",
  phone: "Телефон",
  email: "Email",
  productName: "Прибор",
  deviceModel: "Модель прибора",
  message: "Сообщение",
  comment: "Комментарий",
  serviceName: "Услуга",
};

const typeLabels: Record<string, string> = {
  calibration: "Калибровка",
  verification: "Поверка",
  callback: "Обратный звонок",
  inquiry: "Запрос по прибору",
  kp: "Запрос КП",
  specification_upload: "Загрузка ТЗ",
  equipment_repair: "Ремонт",
  testing: "Испытания",
};

function summaryFor(submission: Submission) {
  const flat = { ...submission, ...asRecord(submission.contact), ...asRecord(submission.formData) };
  return String(flat.name || flat.orgName || flat.applicant || flat.productName || flat.phone || "Новое обращение");
}

function dateFor(submission: Submission) {
  const flat = { ...submission, ...asRecord(submission.contact), ...asRecord(submission.formData) };
  const raw = flat.submittedAt || flat.createdAt || flat.date || flat.timestamp;
  if (!raw) return "Дата не указана";
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return String(raw);
  return date.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
}

export default async function AdminPage() {
  if (!(await checkAuth())) redirect("/admin/login");

  const submissions = await loadSubmissions();
  const newestFirst = [...submissions].reverse();

  return (
    <main style={{ minHeight: "100vh", background: "#f3f7fc", padding: "28px 18px 56px", fontFamily: "Arial, sans-serif", color: "#18283d" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <div style={{ color: "#1674c8", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ООО «Алира»</div>
            <h1 style={{ margin: "8px 0 4px", fontSize: 30 }}>Заявки с сайта</h1>
            <p style={{ margin: 0, color: "#66758a" }}>Всего: {submissions.length}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <a href="/admin/export" style={{ display: "inline-block", padding: "10px 13px", border: "1px solid #bfd2e6", borderRadius: 9, background: "#fff", color: "#145e9b", textDecoration: "none", fontWeight: 700 }}>Скачать JSON</a>
            <form action={logoutAdmin}>
              <button type="submit" style={{ padding: "10px 13px", border: "1px solid #bfd2e6", borderRadius: 9, background: "#fff", color: "#334155", fontWeight: 700, cursor: "pointer" }}>Выйти</button>
            </form>
          </div>
        </header>

        {newestFirst.length === 0 ? (
          <section style={{ padding: 24, border: "1px solid #dbe4ef", borderRadius: 14, background: "#fff", color: "#66758a" }}>
            Файл заявок пока пуст или недоступен.
          </section>
        ) : (
          <section style={{ display: "grid", gap: 12 }}>
            {newestFirst.map((submission, index) => {
              const type = String(submission.type || "inquiry");
              const title = typeLabels[type] || type;
              return (
                <details key={String(submission.id || index)} style={{ padding: "0 18px", border: "1px solid #dbe4ef", borderRadius: 13, background: "#fff", boxShadow: "0 3px 12px rgba(25, 55, 90, .035)" }}>
                  <summary style={{ cursor: "pointer", padding: "17px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", fontWeight: 700 }}>
                    <span>{title} — {summaryFor(submission)}</span>
                    <span style={{ color: "#66758a", fontSize: 13, fontWeight: 400 }}>{dateFor(submission)}</span>
                  </summary>
                  <div style={{ borderTop: "1px solid #edf1f6", padding: "8px 0 14px" }}>
                    {submissionFields(submission).map(([key, value]) => (
                      <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 190px) 1fr", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f4f8", overflowWrap: "anywhere" }}>
                        <strong style={{ color: "#526176", fontSize: 13 }}>{labels[key] || key}</strong>
                        <span style={{ whiteSpace: "pre-wrap" }}>{showValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
