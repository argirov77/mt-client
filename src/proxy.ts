import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PREFIXED_LOCALES = ["ua", "en", "bg"] as const;
const DEFAULT_LOCALE = "ru";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";

  if ((PREFIXED_LOCALES as readonly string[]).includes(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", firstSegment);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname =
    `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}` || `/${DEFAULT_LOCALE}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", DEFAULT_LOCALE);
  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|api|favicon.ico|robots.txt|sitemap.xml|icons/|images/|.*\\..*).*)",
  ],
};
