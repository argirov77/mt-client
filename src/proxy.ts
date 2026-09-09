import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PREFIXED_LOCALES = ["ua", "en", "bg"] as const;
const DEFAULT_LOCALE = "ru";

// Proxy делает ровно одно: подставляет сегмент локали по умолчанию для URL без
// префикса (/odessa-varna → /ru/odessa-varna). Заголовок x-locale больше не
// проставляется: локаль читается из route params в layout/page, а любая
// зависимость рендера от заголовков запроса делает маршрут динамическим и
// снимает его с CDN-кэша.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";

  if ((PREFIXED_LOCALES as readonly string[]).includes(firstSegment)) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname =
    `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}` || `/${DEFAULT_LOCALE}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|api|favicon.ico|robots.txt|sitemap.xml|icons/|images/|.*\\..*).*)",
  ],
};
