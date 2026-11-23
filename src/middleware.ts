import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const segments = url.pathname.split("/");
  const canonicalSegments = segments.map((segment) => segment.replace(/^lls-/i, ""));

  if (segments.some((segment, index) => segment !== canonicalSegments[index])) {
    url.pathname = canonicalSegments.join("/");
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/catalog/:path*"],
};
