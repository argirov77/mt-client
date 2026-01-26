"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/components/common/LanguageProvider";
import { getPublicOfferUrl } from "@/utils/publicOffer";

// src/components/SiteFooter.tsx
const translations = {
  ru: {
    nav: "Навигация",
    docs: "Документы",
    offer: "Публичная оферта",
    agreement: "Пользовательское соглашение",
    contacts: "Контакты",
    popular: "Направления",
    routes: "Маршруты",
    about: "О нас",
    schedule: "Расписание",
  },
  bg: {
    nav: "Навигация",
    docs: "Документи",
    offer: "Публична оферта",
    agreement: "Потребителско споразумение",
    contacts: "Контакти",
    popular: "Дестинации",
    routes: "Маршрути",
    about: "За нас",
    schedule: "Разписание",
  },
  en: {
    nav: "Navigation",
    docs: "Documents",
    offer: "Public offer",
    agreement: "User agreement",
    contacts: "Contacts",
    popular: "Destinations",
    routes: "Routes",
    about: "About",
    schedule: "Schedule",
  },
  ua: {
    nav: "Навігація",
    docs: "Документи",
    offer: "Публічна оферта",
    agreement: "Користувацька угода",
    contacts: "Контакти",
    popular: "Напрями",
    routes: "Маршрути",
    about: "Про нас",
    schedule: "Розклад",
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
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <span className="font-bold text-lg">Максимов Турс</span>
          <p className="mt-2">© 2005-2025 ООО «Максимов Турс»</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t.nav}</h4>
          <ul>
            <li><a href="#popular" className="hover:underline">{t.popular}</a></li>
            <li><a href="#routes" className="hover:underline">{t.routes}</a></li>
            <li><a href="#about" className="hover:underline">{t.about}</a></li>
            <li><a href="#prices" className="hover:underline">{t.schedule}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t.docs}</h4>
          <ul>
            <li>
              <button
                type="button"
                className="hover:underline"
                onClick={() => setIsOfferOpen(true)}
              >
                {t.offer}
              </button>
            </li>
            <li><a href="#" className="hover:underline">{t.agreement}</a></li>
            <li><a href="#" className="hover:underline">{t.contacts}</a></li>
          </ul>
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
