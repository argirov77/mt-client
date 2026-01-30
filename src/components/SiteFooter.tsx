"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useLanguage } from "@/components/common/LanguageProvider";
import { getPublicOfferUrl } from "@/utils/publicOffer";

// src/components/SiteFooter.tsx
const translations = {
  ru: {
    offer: "Публичная оферта",
    payments: "Поддерживаемые способы оплаты",
  },
  bg: {
    offer: "Публична оферта",
    payments: "Поддържани методи за плащане",
  },
  en: {
    offer: "Public offer",
    payments: "Supported payment methods",
  },
  ua: {
    offer: "Публічна оферта",
    payments: "Підтримувані способи оплати",
  },
};

export default function SiteFooter() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const publicOfferUrl = getPublicOfferUrl(lang);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicOfferEmbedUrl = origin
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        `${origin}${publicOfferUrl}`
      )}`
    : "";

  return (
    <footer className="bg-slate-900 text-slate-100 py-10">
      <div className="container mx-auto flex flex-col gap-6 px-4 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <span className="font-bold text-lg">Максимов Турс</span>
          <p className="mt-2">© 2005-2025 ООО «Максимов Турс»</p>
        </div>
        <button
          type="button"
          className="text-left text-sm font-semibold text-slate-100 hover:underline"
          onClick={() => setIsOfferOpen(true)}
        >
          {t.offer}
        </button>
      </div>
      <div className="container mx-auto mt-6 flex flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-300">
        <span>{t.payments}</span>
        <div className="flex items-center gap-3">
          <Image src="/icons/apple-pay.png" alt="Apple Pay" width={54} height={28} />
          <Image src="/icons/visa.png" alt="Visa" width={50} height={28} />
          <Image src="/icons/mastercard.png" alt="Mastercard" width={50} height={28} />
        </div>
      </div>
      {isOfferOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.offer}
        >
          <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold">{t.offer}</h3>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setIsOfferOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="h-[70vh] bg-slate-50">
              {publicOfferEmbedUrl ? (
                <iframe
                  title={t.offer}
                  src={publicOfferEmbedUrl}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
