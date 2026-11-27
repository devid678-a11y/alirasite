const base = "https://fgis.gost.ru/fundmetrology";

function date(value: unknown) {
  if (typeof value !== "string") return "";
  const parts = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

type Record = {
  mi_number: string;
  mit_number: string;
  verification_date: string;
  valid_date?: string;
  vri_id: string;
  applicability?: boolean | string;
  org_title?: string;
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const serial = params.get("serial")?.trim();
  const registry = params.get("registry")?.trim();
  if (!serial || serial.length > 100 || !registry || !/^\d{1,10}-\d{2,4}$/.test(registry)) {
    return Response.json({ status: "invalid" }, { status: 400 });
  }
  const query = new URLSearchParams({ mi_number: serial, mit_number: registry, rows: "100", sort: "verification_date desc" });
  try {
    const response = await fetch(`${base}/eapi/vri?${query}`, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new Error("Arshin unavailable");
    const data = await response.json();
    const items: Record[] = data.result?.items;
    if (!Array.isArray(items)) throw new Error("Unexpected Arshin response");
    const matches = items.filter(item =>
      String(item.mi_number).trim() === serial && String(item.mit_number).trim() === registry &&
      date(item.verification_date) && /^[\w.-]+$/.test(item.vri_id ?? ""),
    ).sort((a,b) => date(b.verification_date).localeCompare(date(a.verification_date)));
    const item = matches[0];
    if (!item) return Response.json({ status: "missing" });
    if (matches.some(other => other.vri_id !== item.vri_id && date(other.verification_date) === date(item.verification_date))) {
      return Response.json({ status: "ambiguous" });
    }
    const unsuitable = item.applicability === false || item.applicability === "false";
    return Response.json({
      status: "found", due: unsuitable ? "" : date(item.valid_date),
      date: date(item.verification_date), provider: item.org_title ?? "",
      unsuitable, url: `${base}/cm/results/${encodeURIComponent(item.vri_id)}`,
    });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 502 });
  }
}
