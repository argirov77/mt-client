// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage, type Lang } from "@/components/common/LanguageProvider";

const menu = [
  {
    href: "/booking",
    label: { ru: "Купить билет", bg: "Купи билет", en: "Buy ticket", ua: "Купити квиток" },
    isPrimary: true,
  },
  {
    href: "#about",
    label: { ru: "О нас", bg: "За нас", en: "About", ua: "Про нас" },
  },
  {
    label: { ru: "Контакты", bg: "Контакти", en: "Contacts", ua: "Контакти" },
    isContact: true,
  },
];

const contactTranslations = {
  ru: {
    title: "Связаться с нами",
    cityLabel: "Город",
    varna: "Варна",
    odessa: "Одесса",
    call: "Звонок",
    message: "Сообщение",
    close: "Закрыть",
  },
  bg: {
    title: "Свържете се с нас",
    cityLabel: "Град",
    varna: "Варна",
    odessa: "Одеса",
    call: "Обаждане",
    message: "Съобщение",
    close: "Затвори",
  },
  en: {
    title: "Contact us",
    cityLabel: "City",
    varna: "Varna",
    odessa: "Odesa",
    call: "Call",
    message: "Message",
    close: "Close",
  },
  ua: {
    title: "Звʼязатися з нами",
    cityLabel: "Місто",
    varna: "Варна",
    odessa: "Одеса",
    call: "Дзвінок",
    message: "Повідомлення",
    close: "Закрити",
  },
};

const contacts = {
  varna: ["+359894290356", "+359879554559"],
  odessa: ["+380930004636", "+380674232247"],
};

const normalizePhoneDigits = (phone: string) => phone.replace(/[^\d]/g, "");

export default function Header() {
  const { lang: current, setLang } = useLanguage();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [city, setCity] = useState<"varna" | "odessa">("varna");
  const t = contactTranslations[current];

  const handleChange = (v: Lang) => {
    setLang(v);
  };

  return (
    <header className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-30 border-b border-slate-200">
      <nav className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Лого */}
        <Link href="/" className="font-bold text-primary text-lg md:text-2xl tracking-tight">
          Максимов Турc
        </Link>

        {/* Меню */}
        <ul className="hidden md:flex gap-4 items-center">
          {menu.map((item) => {
            if (item.isContact) {
              return (
                <li key="contacts">
                  <button
                    type="button"
                    onClick={() => setIsContactOpen(true)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-primary/50 hover:text-primary"
                    aria-label={item.label[current]}
                    title={item.label[current]}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 4.5a2.25 2.25 0 012.25-2.25h2.1c.98 0 1.84.64 2.12 1.58l.76 2.44a2.25 2.25 0 01-.54 2.24l-1.24 1.24a14.99 14.99 0 006.2 6.2l1.24-1.24a2.25 2.25 0 012.24-.54l2.44.76a2.25 2.25 0 011.58 2.12v2.1A2.25 2.25 0 0119.5 21.75h-.75C9.6 21.75 2.25 14.4 2.25 5.25V4.5z"
                      />
                    </svg>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    item.isPrimary
                      ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                      : "text-slate-700 hover:text-primary transition-colors font-medium"
                  }
                >
                  {item.label[current]}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Селектор языка */}
        <label className="ml-4 inline-flex items-center gap-2">
          <span className="sr-only">Выбор языка</span>
          <select
            aria-label="Язык"
            value={current}
            onChange={(e) => handleChange(e.target.value as Lang)}
            className="h-9 rounded-md border border-slate-300 bg-white/90 px-2 text-sm text-slate-800
                       hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ru">RU</option>
            <option value="bg">BG</option>
            <option value="en">EN</option>
            <option value="ua">UA</option>
          </select>
        </label>
      </nav>
      {isContactOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">{t.cityLabel}</p>
                <h2 className="text-xl font-semibold text-slate-900">{t.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                {t.close}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["varna", "odessa"] as const).map((cityKey) => (
                <button
                  key={cityKey}
                  type="button"
                  onClick={() => setCity(cityKey)}
                  className={
                    city === cityKey
                      ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      : "rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-primary/40 hover:text-primary"
                  }
                >
                  {t[cityKey]}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {contacts[city].map((phone) => {
                const digits = normalizePhoneDigits(phone);
                const viberLink = `viber://chat?number=%2B${digits}`;
                const whatsappLink = `https://wa.me/${digits}`;
                const telegramLink = `tg://resolve?phone=${digits}`;

                return (
                  <div
                    key={phone}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{phone}</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${phone}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-primary/40 hover:text-primary"
                          aria-label={`${t.call} ${phone}`}
                          title={t.call}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 4.5a2.25 2.25 0 012.25-2.25h2.1c.98 0 1.84.64 2.12 1.58l.76 2.44a2.25 2.25 0 01-.54 2.24l-1.24 1.24a14.99 14.99 0 006.2 6.2l1.24-1.24a2.25 2.25 0 012.24-.54l2.44.76a2.25 2.25 0 011.58 2.12v2.1A2.25 2.25 0 0119.5 21.75h-.75C9.6 21.75 2.25 14.4 2.25 5.25V4.5z"
                            />
                          </svg>
                        </a>
                        <span className="text-[10px] font-semibold uppercase text-slate-500">
                          {t.message}
                        </span>
                        <a
                          href={viberLink}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-700 transition hover:border-purple-400"
                          aria-label={`Viber ${phone}`}
                          title="Viber"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 18.75c4.5 1.5 9-1.5 9.75-6 .75-4.5-2.25-8.25-6.75-9C6 3 2.25 6 1.5 10.5a8.1 8.1 0 001.5 6.3l-.75 3.45 3.6-1.2 1.65-.3z"
                            />
                          </svg>
                        </a>
                        <a
                          href={whatsappLink}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:border-emerald-400"
                          aria-label={`WhatsApp ${phone}`}
                          title="WhatsApp"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 19.5l1.08-3.24a6.75 6.75 0 118.16 0l-3.24 1.08-2.25-.75-1.5 1.5-1.25 1.41z"
                            />
                          </svg>
                        </a>
                        <a
                          href={telegramLink}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition hover:border-sky-400"
                          aria-label={`Telegram ${phone}`}
                          title="Telegram"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M20.25 4.5l-16.5 7.5 5.7 1.8 2.55 6.2 1.35-4.05 4.2 3.15 2.7-14.6z"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
