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
    contacts: "Контакты",
    instagram: "Instagram",
  },
  bg: {
    offer: "Публична оферта",
    payments: "Поддържани методи за плащане",
    contacts: "Контакти",
    instagram: "Instagram",
  },
  en: {
    offer: "Public offer",
    payments: "Supported payment methods",
    contacts: "Contacts",
    instagram: "Instagram",
  },
  ua: {
    offer: "Публічна оферта",
    payments: "Підтримувані способи оплати",
    contacts: "Контакти",
    instagram: "Instagram",
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
    <footer className="bg-slate-900 py-10 text-slate-100">
      <div className="container mx-auto grid gap-8 px-4 text-sm md:grid-cols-3">
        <div>
          <span className="text-lg font-bold">Максимов Турс</span>
          <p className="mt-2 text-slate-300">© 2005-2025 ООО «Максимов Турс»</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">{t.contacts}</h3>
          <ul className="space-y-2 text-slate-300">
            <li>
              <a className="transition hover:text-white hover:underline" href="tel:+380930004636">
                +380930004636
              </a>
            </li>
            <li>
              <a className="transition hover:text-white hover:underline" href="tel:+359894290356">
                +359894290356
              </a>
            </li>
            <li>
              <a className="transition hover:text-white hover:underline" href="mailto:Avroraiko@gmail.com">
                Avroraiko@gmail.com
              </a>
            </li>
            <li>
              <a
                className="transition hover:text-white hover:underline"
                href="https://www.instagram.com/maximov_turs?igsh=OTR5eGtuOTBoMm5u"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.instagram}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">{t.offer}</h3>
          <button
            type="button"
            className="text-left text-slate-300 transition hover:text-white hover:underline"
            onClick={() => setIsOfferOpen(true)}
          >
            {t.offer}
          </button>
        </div>
      </div>

      <div className="container mx-auto mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-700 pt-5 px-4 text-xs text-slate-300">
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
