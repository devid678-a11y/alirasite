export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { deliverReminders } = await import("./lib/cabinet-push");
  const deliver = () => void deliverReminders().catch(() => console.error("ALIRA push reminder job failed"));
  const timer = setInterval(deliver, 15*60*1000);
  timer.unref();
}
