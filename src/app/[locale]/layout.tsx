import "../globals.css";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Script from "next/script";

import { LanguageProvider } from "@/components/common/LanguageProvider";
import {
  DEFAULT_LOCALE,
  HOME_META,
  LOCALES,
  OG_IMAGE,
  SITE_URL,
  isLocale,
  toHtmlLang,
} from "@/lib/seo";

const GA_MEASUREMENT_ID = "G-N3PVQB5J6S";
const GA_DEBUG_MODE = process.env.NODE_ENV !== "production";

// Это корневой layout приложения: единственный сегмент верхнего уровня — [locale],
// поэтому html/body живут здесь. Локаль берётся из route params, а не из
// заголовка x-locale: любой динамический API (headers(), cookies()) в корневом
// layout переводит всё дерево маршрутов в динамический рендер, из-за чего
// ответы уходят с Cache-Control: no-store и CDN их не кэширует.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_META[DEFAULT_LOCALE].title,
  description: HOME_META[DEFAULT_LOCALE].description,
  icons: {
    icon: "/icons/favicon.ico",
  },
  openGraph: {
    siteName: "Maximov Tours",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const htmlLang = toHtmlLang(locale);

  return (
    <html lang={htmlLang}>
      <head>
        {/* Шрифты редизайна: Golos Text — текст, Unbounded — заголовки.
            Подключены ссылкой, а не next/font: сборка на Netlify не должна
            зависеть от доступности fonts.googleapis.com. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- правило про pages/_document, в app-роутере ссылка в <head> корневого layout применяется ко всем страницам */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&family=Unbounded:wght@600;700&display=swap"
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            (function () {
              var DEBUG_KEY = 'ga4_debug_mode';
              var debugMode = ${GA_DEBUG_MODE ? "true" : "false"};
              try {
                var value = new URLSearchParams(window.location.search).get('debug_mode');
                if (value === '1') sessionStorage.setItem(DEBUG_KEY, '1');
                else if (value === '0') sessionStorage.removeItem(DEBUG_KEY);
                if (sessionStorage.getItem(DEBUG_KEY) === '1') debugMode = true;
              } catch (e) {}
              // debug_mode передаём только когда режим включён; false не шлём.
              var config = debugMode ? { debug_mode: true } : {};
              gtag('config', '${GA_MEASUREMENT_ID}', config);
            })();
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-white text-[#173452] antialiased">
        <LanguageProvider initialLang={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
