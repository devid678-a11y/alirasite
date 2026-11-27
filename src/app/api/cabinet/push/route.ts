import { keys, removeEntry, sendTest, subscriptionPath, updateEntry } from "@/lib/cabinet-push";

export const runtime = "nodejs";

function pushKey(value: unknown, length: number) {
  if (typeof value !== "string" || value.length>100 || !/^[A-Za-z0-9_+/-]+={0,2}$/.test(value)) return "";
  const bytes = Buffer.from(value, "base64url");
  return bytes.length===length ? bytes.toString("base64url") : "";
}

export async function GET() {
  return Response.json({publicKey:keys().publicKey},{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return new Response(null,{status:401});
  const path = subscriptionPath(token);
  try {
    const raw = await request.text();
    if (raw.length>100000) return new Response(null,{status:413});
    const data = JSON.parse(raw);
    if (data.action==="disable") {
      removeEntry(path);
      return new Response(null,{status:204});
    }
    if (data.action==="test") {
      try {
        return new Response(null,{status:await sendTest(path)});
      } catch (error) {
        const {statusCode,code} = error as {statusCode?:number;code?:string};
        if (statusCode===404 || statusCode===410) {
          removeEntry(path);
          return new Response(null,{status:410});
        }
        console.warn("ALIRA test push delivery failed",{statusCode,code});
        return Response.json({code:statusCode?"provider_rejected":"provider_unavailable",status:statusCode},{status:502});
      }
    }
    if (data.action!=="sync") return new Response(null,{status:400});
    const subscription = data.subscription;
    let endpoint: URL;
    try { endpoint = new URL(subscription?.endpoint); }
    catch { return Response.json({code:"invalid_endpoint"},{status:400}); }
    const host = endpoint.hostname;
    const allowed = [
      "fcm.googleapis.com", "android.googleapis.com", "updates.push.services.mozilla.com",
      "push.services.mozilla.com", "web.push.apple.com", "notify.windows.com",
    ].includes(host) || host.endsWith(".push.apple.com") || host.endsWith(".notify.windows.com");
    if (endpoint.protocol!=="https:" || endpoint.port || endpoint.username || endpoint.password) {
      return Response.json({code:"invalid_endpoint"},{status:400});
    }
    if (!allowed) return Response.json({code:"unsupported_provider",host},{status:400});
    const p256dh = pushKey(subscription?.keys?.p256dh,65);
    const auth = pushKey(subscription?.keys?.auth,16);
    if (!p256dh || !auth || Buffer.from(p256dh,"base64url")[0]!==4) {
      return Response.json({code:"invalid_keys"},{status:400});
    }
    const selectedDays = Array.isArray(data.days) ? data.days : [30,14,7];
    const days = [0,1,3,7,14,30,60].filter(day=>selectedDays.includes(day));
    if (!data.dates || typeof data.dates!=="object" || Array.isArray(data.dates)) {
      return Response.json({code:"invalid_dates"},{status:400});
    }
    const dates = Object.fromEntries(Object.entries(data.dates).filter(([date,count])=>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isInteger(count) && Number(count)>0 && Number(count)<=10000));
    if (Object.keys(dates).length>3700) return new Response(null,{status:413});
    keys();
    updateEntry(path,{subscription:{endpoint:endpoint.href,keys:{p256dh,auth}},days,dates:dates as Record<string,number>});
    return new Response(null,{status:204});
  } catch {
    return new Response(null,{status:502});
  }
}
