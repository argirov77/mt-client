// src/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage, type Lang } from "@/components/common/LanguageProvider";
import { trackContact } from "@/lib/analytics";
import { buildLocaleAlternates, toHreflang, toHtmlLang } from "@/lib/seo";

type MenuLabel = Record<Lang, string>;

type MenuItem =
  | {
      href: string;
      label: MenuLabel;
      isPrimary?: boolean;
      icon?: "parcel";
      isContact?: false;
    }
  | {
      label: MenuLabel;
      isContact: true;
    };

const menu: MenuItem[] = [
  {
    href: "/#booking",
    label: { ru: "Билет", bg: "Билет", en: "Ticket", ua: "Квиток" },
    isPrimary: true,
  },
  {
    href: "#about",
    label: { ru: "О нас", bg: "За нас", en: "About", ua: "Про нас" },
  },
  {
    href: "#parcel",
    label: { ru: "Посылка", bg: "Пратка", en: "Parcel", ua: "Посилка" },
    icon: "parcel",
  },
  {
    label: { ru: "Контакты", bg: "Контакти", en: "Contacts", ua: "Контакти" },
    isContact: true,
  },
];

type ContactCity = "varna" | "odessa";

type ContactTranslations = Record<
  Lang,
  {
    title: string;
    description: string;
    varna: string;
    odessa: string;
    call: string;
    message: string;
    close: string;
    hint: string;
  }
>;

const contactTranslations: ContactTranslations = {
  ru: {
    title: "Контакты",
    description: "Выберите способ связи, затем выберите номер.",
    varna: "Варна",
    odessa: "Одесса",
    call: "Звонок",
    message: "Сообщение",
    close: "Закрыть",
    hint: "Нажмите на способ связи, затем выберите номер (подписан город).",
  },
  bg: {
    title: "Контакти",
    description: "Изберете начин за връзка, след това изберете номер.",
    varna: "Варна",
    odessa: "Одеса",
    call: "Обаждане",
    message: "Съобщение",
    close: "Затвори",
    hint: "Изберете начин на връзка и номер (с посочен град).",
  },
  en: {
    title: "Contacts",
    description: "Choose a contact method, then pick a number.",
    varna: "Varna",
    odessa: "Odesa",
    call: "Call",
    message: "Message",
    close: "Close",
    hint: "Pick a contact method and then a number (city is shown).",
  },
  ua: {
    title: "Контакти",
    description: "Оберіть спосіб звʼязку, потім номер.",
    varna: "Варна",
    odessa: "Одеса",
    call: "Дзвінок",
    message: "Повідомлення",
    close: "Закрити",
    hint: "Оберіть спосіб звʼязку, потім номер (місто підписане).",
  },
};

const contacts: { city: ContactCity; phone: string }[] = [
  { city: "varna", phone: "+359894290356" },
  { city: "varna", phone: "+359879554559" },
  { city: "odessa", phone: "+380930004636" },
  { city: "odessa", phone: "+380674232247" },
];

const normalizePhoneDigits = (phone: string) => phone.replace(/[^\d]/g, "");

const langLabel: Record<Lang, string> = {
  ru: "RU",
  bg: "BG",
  en: "EN",
  ua: "UA",
};

// Полные названия — для скринридеров: «RU» вслух читается непонятно.
const langName: Record<Lang, string> = {
  ru: "Русский",
  bg: "Български",
  en: "English",
  ua: "Українська",
};

export default function Header() {
  const { lang: current } = useLanguage();
  const pathname = usePathname();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDetailsElement>(null);
  const langSummaryRef = useRef<HTMLElement>(null);
  const [method, setMethod] = useState<"telegram" | "viber" | "whatsapp" | "call">("telegram");
  // Один и тот же модал контактов открывается из топбара и из секции «Посылка»
  // (событие open-contact-modal). source определяем по точке открытия.
  const [contactSource, setContactSource] = useState<"topbar" | "parcel_section">("topbar");
  const t = contactTranslations[current];

  // Ссылки строятся из того же маппинга слагов, что и hreflang в <head>,
  // и попадают в серверную разметку: краулер видит настоящие <a href>,
  // а не <option value>, по которым он не переходит.
  const localeLinks = useMemo(() => buildLocaleAlternates(pathname || "/"), [pathname]);

  // Нативный <details> не закрывается ни по клику снаружи, ни по Escape.
  useEffect(() => {
    if (!isLangOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!langRef.current?.contains(event.target as Node)) setIsLangOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsLangOpen(false);
      langSummaryRef.current?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLangOpen]);

  useEffect(() => {
    const handler = () => {
      setContactSource("parcel_section");
      setIsContactOpen(true);
    };
    window.addEventListener("open-contact-modal", handler);

    return () => window.removeEventListener("open-contact-modal", handler);
  }, []);

  const actionLabel = {
    telegram: "Telegram",
    viber: "Viber",
    whatsapp: "WhatsApp",
    call: t.call,
  } as const;

  const linkFor = (phone: string) => {
    const digits = normalizePhoneDigits(phone);

    if (method === "call") return `tel:${phone}`;
    if (method === "viber") return `viber://chat?number=${encodeURIComponent(phone)}`;
    if (method === "whatsapp") return `https://wa.me/${digits}`;

    return `tg://resolve?phone=${digits}`;
  };

  const trackContactClick = (phone: string) => {
    trackContact({
      method: method === "call" ? "phone" : method,
      source: contactSource,
      label: method === "call" ? phone : method,
    });
  };

  return (
    <header className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-30 border-b border-slate-200">
      <nav className="container mx-auto flex max-w-6xl flex-nowrap items-center gap-2 px-4 py-2 md:h-14 md:gap-3">
        {/* Лого */}
        <Link
          href="/"
          className="order-1 flex items-center gap-2 text-lg font-bold tracking-tight text-primary md:order-none md:text-2xl"
        >
          <Image
            src="/icons/speling.svg"
            alt="Запись"
            width={150}
            height={38}
            className="hidden md:inline"
            priority
          />
          <Image
            src="/icons/logo.svg"
            alt="Максимов Турс"
            width={34}
            height={34}
            className="inline md:hidden"
            priority
          />
        </Link>

        {/* Меню */}
        <ul className="order-2 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 md:order-none md:overflow-visible md:pb-0">
          {menu.map((item) => {
            if (item.isContact) {
              return (
                <li key="contacts">
                  <button
                    type="button"
                    onClick={() => {
                      setContactSource("topbar");
                      setIsContactOpen(true);
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:shadow-lg"
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
              <li key={item.href} className={item.href === "#about" ? "hidden md:block" : undefined}>
                <Link
                  href={item.href}
                  className={
                    item.isPrimary
                      ? "flex items-center gap-2 whitespace-nowrap rounded-[14px] border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-orange-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:text-xs"
                      : "flex items-center gap-2 whitespace-nowrap rounded-[14px] border border-transparent px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 sm:text-xs"
                  }
                >
                  {item.icon === "parcel" ? (
                    <span className="sr-only">UA BG</span>
                  ) : null}
                  {item.label[current]}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Переключатель языка: выпадающий список из настоящих ссылок */}
        <div
          role="group"
          aria-label="Выбор языка"
          className="order-3 ml-auto inline-flex items-center md:order-none md:ml-4"
        >
          <details
            ref={langRef}
            open={isLangOpen}
            onToggle={(event) => setIsLangOpen(event.currentTarget.open)}
            className="relative"
          >
            <summary
              ref={langSummaryRef}
              aria-label="Язык"
              title={langName[current]}
              className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-md border border-slate-300
                         bg-white/90 px-2 text-sm text-slate-800 select-none
                         hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-primary/30 [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden="true">{langLabel[current]}</span>
              <span className="sr-only">{langName[current]}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </summary>

            <ul className="absolute right-0 z-40 mt-1 min-w-[7rem] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              {localeLinks.map(({ locale, href }) => (
                <li key={locale}>
                  <Link
                    href={href}
                    hrefLang={toHreflang(locale)}
                    lang={toHtmlLang(locale)}
                    aria-current={locale === current ? "true" : undefined}
                    onClick={() => setIsLangOpen(false)}
                    className={
                      locale === current
                        ? "flex items-center gap-2 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900"
                        : "flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                    }
                  >
                    <span aria-hidden="true" className="w-6 shrink-0 font-black tracking-wide">
                      {langLabel[locale]}
                    </span>
                    <span className="whitespace-nowrap">{langName[locale]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </nav>
      {isContactOpen ? (
        <div
          className="fixed inset-x-0 top-14 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[calc(100vh-7.5rem)] w-full max-w-xl overflow-y-auto rounded-[18px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-4 py-3">
              <div>
                <h2 className="text-base font-black text-slate-900">{t.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:shadow-md"
                aria-label={t.close}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="grid gap-3 p-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.message}>
                {(
                  [
                    { key: "telegram", label: "Telegram" },
                    { key: "viber", label: "Viber" },
                    { key: "whatsapp", label: "WhatsApp" },
                    { key: "call", label: t.call },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMethod(item.key)}
                    aria-pressed={method === item.key}
                    aria-label={item.label}
                    title={item.label}
                    className={
                      method === item.key
                        ? "flex h-11 w-11 items-center justify-center rounded-[16px] border border-orange-200 bg-orange-50 text-orange-700 shadow-md transition hover:-translate-y-0.5"
                        : "flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md"
                    }
                  >
                    {item.key === "telegram" ? (
                      <img src="/icons/telegram.png" alt="Telegram" width={18} height={18} />
                    ) : null}
                    {item.key === "viber" ? (
                      <img src="/icons/viber.png" alt="Viber" width={18} height={18} />
                    ) : null}
                    {item.key === "whatsapp" ? (
                      <img src="/icons/whatsapp.png" alt="WhatsApp" width={18} height={18} />
                    ) : null}
                    {item.key === "call" ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.25 1.64.45 2.5.57A2 2 0 0 1 22 16.9z"
                        />
                      </svg>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="grid gap-2">
                {contacts.map((entry) => (
                  <div
                    key={`${entry.city}-${entry.phone}`}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                        {t[entry.city as keyof typeof t]}
                      </p>
                      <p className="text-xs text-slate-500">{entry.phone}</p>
                    </div>
                    <a
                      href={linkFor(entry.phone)}
                      onClick={() => trackContactClick(entry.phone)}
                      aria-label={`${actionLabel[method]} ${entry.phone}`}
                      title={actionLabel[method]}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {method === "telegram" ? (
                        <img src="/icons/telegram.png" alt="Telegram" width={18} height={18} />
                      ) : null}
                      {method === "viber" ? (
                        <img src="/icons/viber.png" alt="Viber" width={18} height={18} />
                      ) : null}
                      {method === "whatsapp" ? (
                        <img src="/icons/whatsapp.png" alt="WhatsApp" width={18} height={18} />
                      ) : null}
                      {method === "call" ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.25 1.64.45 2.5.57A2 2 0 0 1 22 16.9z"
                          />
                        </svg>
                      ) : null}
                    </a>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500">{t.hint}</p>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
