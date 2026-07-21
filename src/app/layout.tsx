import "./globals.css";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import Script from "next/script";

import { LanguageProvider } from "@/components/common/LanguageProvider";
import { DEFAULT_LOCALE, HOME_META, OG_IMAGE, SITE_URL, isLocale, toHtmlLang } from "@/lib/seo";

const GA_MEASUREMENT_ID = "G-N3PVQB5J6S";
const GA_DEBUG_MODE = process.env.NODE_ENV !== "production";

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-locale");
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const htmlLang = toHtmlLang(locale);

  return (
    <html lang={htmlLang}>
      <head>
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
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        <LanguageProvider initialLang={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
