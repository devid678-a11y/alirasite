import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import webPush from "web-push";

const directory = process.env.ALIRA_PUSH_DIR || join(homedir(), ".alira-cabinet-push");
const dayMs = 86400000;
const appUrl = "/cabinet-preview/index.html#schedule";
type Entry = { subscription: webPush.PushSubscription; dates: Record<string, number>; days: number[]; sent?: string; testedAt?: number };

function save(path: string, value: object) {
  writeFileSync(path + ".tmp", JSON.stringify(value), {mode: 0o600});
  renameSync(path + ".tmp", path);
}
export function keys() {
  mkdirSync(directory, {recursive:true,mode:0o700});
  const path = join(directory, "vapid.json");
  if (!existsSync(path)) save(path, webPush.generateVAPIDKeys());
  return JSON.parse(readFileSync(path,"utf8")) as ReturnType<typeof webPush.generateVAPIDKeys>;
}
export function subscriptionPath(token: string) {
  return join(directory, "sub-" + createHash("sha256").update(token).digest("hex") + ".json");
}
export function readEntry(path: string): Entry | undefined {
  return existsSync(path) ? JSON.parse(readFileSync(path,"utf8")) : undefined;
}
export function removeEntry(path: string) {
  if (existsSync(path)) unlinkSync(path);
}
export function updateEntry(path: string, entry: Entry) {
  const previous = readEntry(path);
  save(path, {...entry,sent:previous?.sent,testedAt:previous?.testedAt});
}
type TestInstrument = {name:string;type:string;count:number};

export async function sendTest(path: string, instruments: TestInstrument[] = []) {
  const entry = readEntry(path);
  if (!entry) return 404;
  if (Date.now() - (entry.testedAt ?? 0) < 60000) return 429;
  save(path, {...entry,testedAt:Date.now()});
  const summary = instruments.slice(0,3).map(item =>
    `${item.name} (тип: ${item.type || "не указан"}) — ${item.count} шт.`);
  const body = summary.length
    ? `Тест: ваши приборы поверены: ${summary.join("; ")}.`
    : "Тест: ваши приборы поверены. Добавьте приборы в кабинет, чтобы увидеть их в уведомлении.";
  await send(entry,body.slice(0,500));
  return 204;
}
export function send(entry: Entry, body: string) {
  const {publicKey,privateKey} = keys();
  return webPush.sendNotification(entry.subscription,JSON.stringify({title:"АЛИРА · Поверка",body,url:appUrl}),{
    vapidDetails:{subject:"https://xn--80aapko5acgl.xn--p1ai",publicKey,privateKey},
    TTL:3600,timeout:8000,
  });
}

let running = false;
export async function deliverReminders() {
  if (running) return;
  running = true;
  try {
    keys();
    // Midnight and reminder delivery follow Moscow time.
    const today = new Date(Date.now()+3*3600000).toISOString().slice(0,10);
    const midnight = Date.parse(today);
    for (const name of readdirSync(directory).filter(name=>/^sub-[a-f0-9]{64}\.json$/.test(name))) {
      const path = join(directory,name);
      const entry = readEntry(path);
      if (!entry || entry.sent===today) continue;
      const count = Object.entries(entry.dates).reduce((total,[date,n])=>
        entry.days.includes((Date.parse(date)-midnight)/dayMs) ? total+n : total,0);
      if (!count) continue;
      try {
        await send(entry,`Приборов с приближающейся поверкой или сроком сегодня: ${count}. Сроки — в кабинете.`);
        const latest = readEntry(path);
        if (latest) save(path,{...latest,sent:today});
      } catch (error) {
        const status = (error as {statusCode?:number}).statusCode;
        if (status===404 || status===410) removeEntry(path);
      }
    }
  } finally { running = false; }
}
