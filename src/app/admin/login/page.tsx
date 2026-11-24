import { loginAdmin } from "@/app/actions/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Вход в заявки | АЛИРА",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error === "config"
    ? "Вход пока не настроен. Добавьте серверные переменные администратора."
    : error === "locked"
      ? "Слишком много попыток входа. Подождите 15 минут."
      : error
        ? "Неверный логин или пароль."
        : "";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f3f7fc", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 420, padding: 32, background: "#fff", border: "1px solid #dbe4ef", borderRadius: 18, boxShadow: "0 18px 50px rgba(25, 55, 90, .09)" }}>
        <div style={{ color: "#1674c8", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>ООО «Алира»</div>
        <h1 style={{ margin: "10px 0 8px", color: "#14253d", fontSize: 28 }}>Заявки с сайта</h1>
        <p style={{ margin: "0 0 24px", color: "#66758a", lineHeight: 1.5 }}>Войдите, чтобы просмотреть обращения.</p>
        <form action={loginAdmin} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, color: "#29384d", fontSize: 14, fontWeight: 600 }}>
            Логин
            <input name="username" autoComplete="username" required style={{ boxSizing: "border-box", width: "100%", padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: 9, fontSize: 16 }} />
          </label>
          <label style={{ display: "grid", gap: 7, color: "#29384d", fontSize: 14, fontWeight: 600 }}>
            Пароль
            <input name="password" type="password" autoComplete="current-password" required style={{ boxSizing: "border-box", width: "100%", padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: 9, fontSize: 16 }} />
          </label>
          {message && <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 14 }}>{message}</p>}
          <button type="submit" style={{ marginTop: 4, padding: "12px 16px", border: 0, borderRadius: 9, background: "#1269b0", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Войти</button>
        </form>
      </section>
    </main>
  );
}
