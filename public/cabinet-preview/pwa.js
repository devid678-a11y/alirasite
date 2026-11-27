let installPrompt;
let getDates;
const controls = document.getElementById("app-controls");
const install = document.getElementById("install-app");
const push = document.getElementById("push-app");
const test = document.getElementById("push-test");
const info = document.getElementById("pwa-info");
const storeKey = "alira-push-token";
const dismissedKey = "alira-app-offer-dismissed";
const later = document.getElementById("pwa-later");
const title = document.getElementById("pwa-title");
const intro = document.getElementById("pwa-intro");
const content = document.getElementById("content");
let offerReady = false;
let installed = false;
let dismissed = localStorage.getItem(dismissedKey) === "1";
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const registration = "serviceWorker" in navigator ?
  navigator.serviceWorker.register("./sw.js", {scope:"./"}).then(()=>navigator.serviceWorker.ready).catch(()=>null) :
  Promise.resolve(null);

function describe(message) { info.textContent=message; }
function refresh() {
  const settings = location.hash === "#settings";
  const subscribed = !!localStorage.getItem(storeKey);
  const isInstalled = installed || standalone();
  const canPush = "PushManager" in window && "Notification" in window;
  const canOfferPush = canPush && !subscribed && Notification.permission !== "denied" &&
    (!appleMobile || isInstalled);
  const canOfferInstall = !isInstalled && (appleMobile || !!installPrompt);
  install.hidden = settings ? !!isInstalled : !canOfferInstall;
  push.hidden = settings ? !(canPush || appleMobile) : !canOfferPush;
  push.textContent = subscribed ? "Выключить пуши" : "Включить пуши";
  test.hidden = !settings;
  later.hidden = settings;
  intro.hidden = settings;
  title.textContent = settings ? "Приложение и уведомления" : "Кабинет АЛИРЫ на вашем устройстве";
  intro.textContent = canOfferInstall && canOfferPush ? "Добавьте кабинет на главный экран и включите напоминания о поверке." :
    canOfferInstall ? "Добавьте кабинет на главный экран. Он будет открываться с иконки АЛИРЫ." :
    "Включите уведомления, чтобы получать напоминания о поверке.";
  controls.hidden = settings ? false : !offerReady || dismissed || (install.hidden && push.hidden);
  if (settings && controls.previousElementSibling !== content) content.after(controls);
  if (!settings && controls.nextElementSibling !== content) content.before(controls);
}
later.addEventListener("click", () => {
  dismissed = true;
  localStorage.setItem(dismissedKey, "1");
  describe("");
  refresh();
});
window.addEventListener("hashchange", refresh);
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  installPrompt=event;
  refresh();
});
window.addEventListener("appinstalled",()=>{ installPrompt=null; installed=true; describe(""); refresh(); });
install.addEventListener("click",async()=>{
  if(installPrompt){
    const prompt=installPrompt;
    installPrompt=null;
    try {
      const choice = await prompt.prompt();
      if (choice?.outcome === "accepted") installed = true;
    } catch {
      describe("Установить кабинет можно через меню браузера.");
    }
    refresh();
    return;
  }
  describe(appleMobile ? "Откройте кабинет в Safari. Нажмите «Поделиться» → «На экран Домой», затем откройте АЛИРУ с главного экрана." :
    "В меню браузера выберите «Установить приложение» или «Добавить на главный экран».");
});
async function send(action, token, subscription) {
  const response = await fetch("/api/cabinet/push",{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({action,...(subscription ? {...getDates(),subscription:subscription.toJSON()} : {})}),
  });
  if(response.status===429) throw Error("Повторить тест можно через минуту.");
  if (action==="test" && (response.status===404 || response.status===410)) {
    const error = Error("Подписка устарела.");
    error.expired = true;
    throw error;
  }
  if (action==="test" && response.status===502) {
    const details = await response.json().catch(()=>null);
    if (details?.code==="provider_rejected") throw Error("Служба доставки отклонила пуш (код "+details.status+").");
    throw Error("Сервер АЛИРЫ не получил ответ от службы доставки пушей.");
  }
  if (action==="sync" && response.status===400) {
    const details=await response.json().catch(()=>null);
    if(details?.code==="unsupported_provider") throw Error("Служба пушей этого браузера не поддерживается ("+details.host+"). Попробуйте обычный Chrome, Edge, Firefox или Safari на iPhone.");
    if(details?.code==="invalid_endpoint") throw Error("Браузер вернул некорректный адрес подписки.");
    if(details?.code==="invalid_keys") throw Error("Браузер вернул некорректные ключи подписки.");
    if(details?.code==="invalid_dates") throw Error("Сервер не принял даты напоминаний.");
  }
  if (!response.ok) throw Error(action==="sync" ?
    "Не удалось сохранить подписку (код "+response.status+")." :
    "Сервер уведомлений ответил с ошибкой (код "+response.status+").");
}
async function togglePush() {
  push.disabled=true;
  try {
    const token=localStorage.getItem(storeKey);
    if(appleMobile&&!standalone()){ install.click();return; }
    if(!("Notification" in window)) throw Error("Браузер не поддерживает пуши для этого приложения.");
    if(!token && await Notification.requestPermission()!=="granted") throw Error("Разрешите уведомления в настройках браузера.");
    const worker=await registration;
    if(!worker) throw Error("Не удалось запустить приложение. Обновите страницу.");
    let subscription=await worker.pushManager.getSubscription();
    if(token) {
      if(subscription) await subscription.unsubscribe();
      await send("disable", token);
      localStorage.removeItem(storeKey);
      describe("Пуши выключены на этом устройстве.");
      return;
    }
    const response=await fetch("/api/cabinet/push");
    if(!response.ok) throw Error("Сервер уведомлений недоступен.");
    const {publicKey}=await response.json();
    subscription ??= await worker.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:publicKey});
    const newToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,"0")).join("");
    await send("sync", newToken, subscription);
    localStorage.setItem(storeKey,newToken);
    describe("Пуши включены. Сроки напоминаний можно выбрать в настройках.");
  } catch(error) { describe(error.message); }
  finally { refresh();push.disabled=false; }
}
push.addEventListener("click", () => void togglePush());
test.addEventListener("click", async () => {
  if (test.disabled || push.disabled) return;
  test.disabled = true;
  try {
    if (!localStorage.getItem(storeKey)) await togglePush();
    const token = localStorage.getItem(storeKey);
    if (!token) return;
    const worker = await registration;
    const subscription = await worker?.pushManager.getSubscription();
    if (!subscription) throw Error("Включите пуши заново на этом устройстве.");
    await send("sync", token, subscription);
    await send("test", token);
    describe("Тест отправлен. Проверьте уведомления на этом устройстве.");
  } catch (error) {
    if (error.expired) {
      const worker = await registration;
      const subscription = await worker?.pushManager.getSubscription();
      await subscription?.unsubscribe().catch(()=>{});
      localStorage.removeItem(storeKey);
      describe("Подписка устарела. Нажмите «Включить пуши», затем повторите тест.");
      refresh();
    } else describe(error.message);
  } finally { test.disabled = false; }
});
export function setupPwa(readDates) {
  getDates=readDates;
  refresh();
  window.setTimeout(() => { offerReady = true; refresh(); }, 1200);
  void syncPush();
}
let queued = Promise.resolve();
export function syncPush() {
  queued = queued.then(async()=>{
    const token=localStorage.getItem(storeKey);
    if(!token || !getDates) return;
    const worker=await registration;
    const subscription=await worker?.pushManager.getSubscription();
    if(subscription) await send("sync",token,subscription);
  }).catch(()=>describe("Сроки пушей не обновились. Откройте кабинет позже, чтобы повторить синхронизацию."));
  return queued;
}
