import { checkAuth } from "@/app/actions/auth";
import { loadSubmissions } from "../submissions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const submissions = await loadSubmissions();
  return new NextResponse(JSON.stringify(submissions, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"alira-submissions.json\"",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
