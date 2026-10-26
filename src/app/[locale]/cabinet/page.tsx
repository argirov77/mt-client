"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import Link from "next/link";

import Header from "@/components/Header";
import Loader from "@/components/common/Loader";
import OfficePhones from "@/components/common/OfficePhones";
import { useLanguage } from "@/components/common/LanguageProvider";
import { buildPath } from "@/lib/seo";
import type { Lang } from "@/lib/locale";
import PurchaseClient from "@/components/purchase/PurchaseClient";

const PURCHASE_PARAM_KEYS = [
  "purchaseId",
  "purchase_id",
  "purchase",
  "id",
  "ticketId",
  "ticket_id",
  "ticket",
];

const NO_LINK_COPY: Record<Lang, { title: string; text: string; noEmail: string; spam: string; home: string }> = {
  ru: {
    title: "Кабинет заказа",
    text: "Откройте ссылку из письма с билетами или отсканируйте QR-код в билете — кабинет откроется сам.",
    noEmail: "Письма нет?",
    spam: "Проверьте папку «Спам». Или позвоните в офис:",
    home: "На главную",
  },
  ua: {
    title: "Кабінет замовлення",
    text: "Відкрийте посилання з листа з квитками або відскануйте QR-код у квитку — кабінет відкриється сам.",
    noEmail: "Листа немає?",
    spam: "Перевірте папку «Спам». Або зателефонуйте в офіс:",
    home: "На головну",
  },
  bg: {
    title: "Страница на поръчката",
    text: "Отворете линка от имейла с билетите или сканирайте QR кода в билета — страницата ще се отвори сама.",
    noEmail: "Няма писмо?",
    spam: "Проверете папка „Спам“. Или се обадете в офиса:",
    home: "Към началото",
  },
  en: {
    title: "Order page",
    text: "Open the link from the email with your tickets or scan the QR code on the ticket — the page opens by itself.",
    noEmail: "No email?",
    spam: "Check your Spam folder. Or call the office:",
    home: "Home",
  },
};

// Без ссылки — страница с шапкой, где взять ссылку, и телефонами офисов
// (раньше — красная строка без шапки и выхода).
function CabinetNoLink() {
  const { lang } = useLanguage();
  const t = NO_LINK_COPY[lang];
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#f6f4f1] px-4 py-10">
        <div className="mx-auto max-w-xl space-y-5 rounded-2xl border border-[#e3dfd9] bg-white p-5 sm:p-6">
          <h1 className="text-2xl font-bold text-[#173452]">{t.title}</h1>
          <p className="text-[#173452]">{t.text}</p>
          <div className="space-y-2">
            <p className="font-semibold text-[#173452]">{t.noEmail}</p>
            <p className="text-sm text-[#173452]">{t.spam}</p>
            <OfficePhones lang={lang} source="cabinet" />
          </div>
          <Link
            href={buildPath(lang, "/")}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[#e3dfd9] px-4 text-sm font-semibold text-[#173452] hover:bg-[#f6f4f1]"
          >
            {t.home}
          </Link>
        </div>
      </main>
    </>
  );
}

const COOKIE_PATTERN = /(?:^|;\s*)minicab_purchase_(\w+)=/i;

function CabinetPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let resolved: string | null = null;

    if (searchParams) {
      for (const key of PURCHASE_PARAM_KEYS) {
        const value = searchParams.get(key);
        if (value) {
          const trimmed = value.trim();
          if (trimmed) {
            resolved = trimmed;
            break;
          }
        }
      }
    }

    if (!resolved && pathname) {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 1) {
        const candidate = segments[segments.length - 1];
        if (candidate && candidate.toLowerCase() !== "cabinet") {
          resolved = candidate;
        }
      }
    }

    if (!resolved && typeof document !== "undefined") {
      const match = document.cookie.match(COOKIE_PATTERN);
      if (match && match[1]) {
        const fromCookie = match[1].trim();
        if (fromCookie) {
          resolved = fromCookie;
        }
      }
    }

    setPurchaseId((prev) => (prev === resolved ? prev : resolved));
    setInitialized(true);
  }, [pathname, searchParams]);

  if (!initialized) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Loader />
      </div>
    );
  }

  if (!purchaseId) {
    return <CabinetNoLink />;
  }
  return <PurchaseClient purchaseId={purchaseId} />;
}

export default function CabinetPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Loader />
        </div>
      }
    >
      <CabinetPageContent />
    </Suspense>
  );
}
