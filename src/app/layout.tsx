import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script";

import { LanguageProvider } from "@/components/common/LanguageProvider";
const GA_MEASUREMENT_ID = "G-N3PVQB5J6S";

export const metadata = {
  title: "Максимов Турc",
  description: "Продажа автобусных билетов по Болгарии и Европе",
  icons: {
    icon: "/icons/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://maximovtours.com/#organization",
      name: "Maximov Tours",
      alternateName: "Максимов Турс",
      url: "https://maximovtours.com",
      description:
        "International bus carrier between Ukraine and Bulgaria since 1992. Direct routes Odessa-Varna-Burgas on comfortable buses.",
      foundingDate: "1992",
      email: "avroraiko@gmail.com",
      telephone: ["+380930004636", "+359879554559"],
      sameAs: [
        "https://www.facebook.com/maximovturs/",
        "https://www.instagram.com/maximov_turs/",
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.4",
        reviewCount: "21",
      },
    },
    {
      "@type": "BusTrip",
      provider: { "@id": "https://maximovtours.com/#organization" },
      busName: "Odessa - Varna Direct Bus",
      departureBusStop: {
        "@type": "BusStop",
        name: "Privoz Bus Station, Odessa",
      },
      arrivalBusStop: {
        "@type": "BusStop",
        name: "Central Bus Station, Varna",
      },
      departureTime: "13:40",
      offers: {
        "@type": "Offer",
        price: "2300",
        priceCurrency: "UAH",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How to get from Odessa to Varna?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Maximov Tours operates direct bus service from Odessa to Varna. Departure Monday, Wednesday, Saturday at 13:40 from Privoz station. Journey time approximately 17 hours. Price 2300 UAH.",
          },
        },
        {
          "@type": "Question",
          name: "How long is the bus ride from Odessa to Varna?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Approximately 17 hours including border crossing. The bus departs at 13:40 and arrives next morning around 07:00.",
          },
        },
        {
          "@type": "Question",
          name: "What amenities are on the bus?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All buses have Wi-Fi, power outlets, toilet, comfortable reclining seats, and air conditioning. Buses are Setra, Neoplan, or Mercedes brands.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
