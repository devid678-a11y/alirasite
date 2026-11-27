import { keys, removeEntry, sendTest, subscriptionPath, updateEntry } from "@/lib/cabinet-push";

export const runtime = "nodejs";

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
    const endpoint = new URL(subscription.endpoint);
    const host = endpoint.hostname;
    const allowed = host==="fcm.googleapis.com" || host==="updates.push.services.mozilla.com" ||
      host==="web.push.apple.com" || host.endsWith(".push.apple.com") || host.endsWith(".notify.windows.com");
    if (!allowed || endpoint.protocol!=="https:" || endpoint.port || endpoint.username || endpoint.password ||
        !/^[\w-]{87}=?$/.test(subscription.keys?.p256dh || "") || !/^[\w-]{22}(?:==)?$/.test(subscription.keys?.auth || "") ||
        !Array.isArray(data.days) || !data.dates || typeof data.dates!=="object") {
      return new Response(null,{status:400});
    }
    const days = [0,1,3,7,14,30,60].filter(day=>data.days.includes(day));
    const dates = Object.fromEntries(Object.entries(data.dates).filter(([date,count])=>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isInteger(count) && Number(count)>0 && Number(count)<=10000));
    if (Object.keys(dates).length>3700) return new Response(null,{status:413});
    keys();
    updateEntry(path,{subscription:{endpoint:endpoint.href,keys:{p256dh:subscription.keys.p256dh.replace(/=+$/,""),auth:subscription.keys.auth.replace(/=+$/,"")}},days,dates:dates as Record<string,number>});
    return new Response(null,{status:204});
  } catch {
    return new Response(null,{status:502});
  }
}
