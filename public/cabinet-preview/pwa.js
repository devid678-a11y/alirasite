let installPrompt;
let getDates;
const controls = document.getElementById("app-controls");
const install = document.getElementById("install-app");
const push = document.getElementById("push-app");
const info = document.getElementById("pwa-info");
const storeKey = "alira-push-token";
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const registration = "serviceWorker" in navigator ?
  navigator.serviceWorker.register("./sw.js", {scope:"./"}).then(()=>navigator.serviceWorker.ready).catch(()=>null) :
  Promise.resolve(null);

function describe(message) { info.textContent=message; }
function refresh() {
  install.hidden = !!standalone();
  push.hidden = !(appleMobile || ("PushManager" in window && "Notification" in window));
  push.textContent = localStorage.getItem(storeKey) ? "Выключить пуши" : "Включить пуши";
  controls.hidden = install.hidden && push.hidden;
}
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  installPrompt=event;
  refresh();
});
window.addEventListener("appinstalled",()=>{ installPrompt=null; install.hidden=true; describe(""); });
install.addEventListener("click",async()=>{
  if(installPrompt){
    const prompt=installPrompt;
    installPrompt=null;
    await prompt.prompt();
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
  if(!response.ok) throw Error("Не удалось связаться с сервером уведомлений.");
}
push.addEventListener("click",async()=>{
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
});
export function setupPwa(readDates) {
  getDates=readDates;
  refresh();
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
