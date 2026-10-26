"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Instagram } from "lucide-react";

import { useLanguage } from "@/components/common/LanguageProvider";
import { getPublicOfferUrl } from "@/utils/publicOffer";
import { trackContact } from "@/lib/analytics";
import { OFFICES, OFFICE_ADDRESS, OFFICE_CITY_NAME, formatPhone } from "@/lib/offices";
import { buildPath } from "@/lib/seo";
import { tripShortLabel, tripsData } from "@/lib/tripsData";

// src/components/SiteFooter.tsx

// 2005 — год запуска сайта, константа. Конечный год считается от текущей
// даты, иначе копирайт протухает каждым январём.
// suppressHydrationWarning: страницы статические (revalidate), поэтому в
// новогоднюю ночь год в отданном HTML может отстать от года в браузере.
const COPYRIGHT_YEAR = new Date().getFullYear();

const EMAIL = "Avroraiko@gmail.com";
const INSTAGRAM = "https://www.instagram.com/maximov_turs?igsh=OTR5eGtuOTBoMm5u";

// Направления подвала — те же, что в перелинковке посадочных страниц.
const FOOTER_TRIPS = [
  "odessa-varna",
  "varna-odessa",
  "odessa-burgas",
  "burgas-odessa",
  "odessa-sunny-beach",
  "sunny-beach-odessa",
  "odessa-constanta",
  "constanta-odessa",
  "varna-constanta",
  "constanta-varna",
  "burgas-constanta",
  "constanta-burgas",
];

const translations = {
  ru: {
    offer: "Публичная оферта",
    payments: "Оплата картой",
    contacts: "Контакты",
    instagram: "Instagram",
    tagline: "Автобусы Украина — Румыния — Болгария с 1992 года.",
    passengers: "Пассажирам",
    directions: "Направления",
    buyTicket: "Купить билет",
    route: "Маршрут и остановки",
    prices: "Цены",
    parcels: "Посылки",
  },
  bg: {
    offer: "Публична оферта",
    payments: "Плащане с карта",
    contacts: "Контакти",
    instagram: "Instagram",
    tagline: "Автобуси Украйна — Румъния — България от 1992 г.",
    passengers: "За пътниците",
    directions: "Направления",
    buyTicket: "Купи билет",
    route: "Маршрут и спирки",
    prices: "Цени",
    parcels: "Пратки",
  },
  en: {
    offer: "Public offer",
    payments: "Card payment",
    contacts: "Contacts",
    instagram: "Instagram",
    tagline: "Coaches Ukraine — Romania — Bulgaria since 1992.",
    passengers: "For passengers",
    directions: "Routes",
    buyTicket: "Buy a ticket",
    route: "Route and stops",
    prices: "Prices",
    parcels: "Parcels",
  },
  ua: {
    offer: "Публічна оферта",
    payments: "Оплата карткою",
    contacts: "Контакти",
    instagram: "Instagram",
    tagline: "Автобуси Україна — Румунія — Болгарія з 1992 року.",
    passengers: "Пасажирам",
    directions: "Напрямки",
    buyTicket: "Купити квиток",
    route: "Маршрут і зупинки",
    prices: "Ціни",
    parcels: "Посилки",
  },
};

const MESSENGERS = [
  { key: "viber" as const, href: (digits: string) => `viber://chat?number=%2B${digits}` },
  { key: "telegram" as const, href: (digits: string) => `https://t.me/+${digits}` },
  { key: "whatsapp" as const, href: (digits: string) => `https://wa.me/${digits}` },
];

export default function SiteFooter() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const publicOfferUrl = getPublicOfferUrl(lang);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  // Первый номер Одессы — он же в кнопках мессенджеров подвала.
  const mainPhone = OFFICES[0].phones[0];
  const mainDigits = mainPhone.replace(/\D/g, "");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicOfferEmbedUrl = origin
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        `${origin}${publicOfferUrl}`
      )}`
    : "";

  const trackPhoneClick = (phone: string) => {
    trackContact({ method: "phone", source: "footer", label: phone });
  };

  const trackEmailClick = (email: string) => {
    trackContact({ method: "email", source: "footer", label: email });
  };

  const linkClass = "text-base text-white/85 transition hover:text-[#fdba74]";
  const columnTitleClass =
    "text-[13px] font-bold uppercase tracking-[0.12em] text-[#fdba74]";

  const directions = FOOTER_TRIPS.flatMap((key) => {
    const slug = tripsData[key]?.i18n[lang]?.slug;
    const label = tripShortLabel(key, lang);
    if (!slug || !label) return [];
    return [{ key, href: buildPath(lang, `/${slug}`), label }];
  });

  return (
    <footer className="bg-[#173452] px-4 pb-7 pt-10 text-white/85 sm:px-6 sm:pt-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-9">
        <div className="flex flex-wrap gap-9 gap-x-10">
          <div className="flex flex-1 basis-[220px] flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white">
                <Image src="/icons/logo.svg" alt="" width={42} height={42} />
              </span>
              <span className="font-display text-[18px] font-bold text-white">Максимов Турс</span>
            </div>
            <p className="text-[15px] leading-relaxed">{t.tagline}</p>
            <div className="flex gap-2">
              {MESSENGERS.map((messenger) => (
                <a
                  key={messenger.key}
                  href={messenger.href(mainDigits)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={messenger.key}
                  onClick={() =>
                    trackContact({ method: messenger.key, source: "footer", label: messenger.key })
                  }
                  className="grid h-11 w-11 place-items-center rounded-xl bg-white"
                >
                  <Image src={`/icons/${messenger.key}.png`} alt="" width={24} height={24} />
                </a>
              ))}
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.instagram}
                className="grid h-11 w-11 place-items-center rounded-xl bg-white"
              >
                <Instagram className="h-[22px] w-[22px] text-[#173452]" strokeWidth={2} aria-hidden />
              </a>
            </div>
          </div>

          <nav className="flex flex-1 basis-[170px] flex-col gap-3">
            <span className={columnTitleClass}>{t.passengers}</span>
            <Link href="#booking" className={linkClass}>
              {t.buyTicket}
            </Link>
            <Link href="#routes" className={linkClass}>
              {t.route}
            </Link>
            <Link href="#prices" className={linkClass}>
              {t.prices}
            </Link>
            <Link href="#parcel" className={linkClass}>
              {t.parcels}
            </Link>
            <button type="button" className={`text-left ${linkClass}`} onClick={() => setIsOfferOpen(true)}>
              {t.offer}
            </button>
          </nav>

          <nav className="flex flex-[2] basis-[420px] flex-col gap-3">
            <span className={columnTitleClass}>{t.directions}</span>
            <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {directions.map((direction) => (
                <Link key={direction.key} href={direction.href} className={linkClass}>
                  {direction.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex flex-1 basis-[200px] flex-col gap-2.5">
            <span className={columnTitleClass}>{t.contacts}</span>
            {OFFICES.map((office) => (
              <div key={office.city} className="flex flex-col gap-1.5 pt-1.5 first:pt-0">
                <span className="text-[13px] text-white/70">
                  {OFFICE_CITY_NAME[lang][office.city]}, {OFFICE_ADDRESS[lang][office.city]}
                </span>
                {office.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    onClick={() => trackPhoneClick(phone)}
                    className="text-base font-semibold text-white transition hover:text-[#fdba74]"
                  >
                    {formatPhone(phone)}
                  </a>
                ))}
              </div>
            ))}
            <a
              href={`mailto:${EMAIL}`}
              onClick={() => trackEmailClick(EMAIL)}
              className={`pt-1.5 text-[15px] ${linkClass}`}
            >
              {EMAIL}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5">
          <span className="text-sm text-white/70" suppressHydrationWarning>
            © 2005–{COPYRIGHT_YEAR} ООО «Максимов Турс»
          </span>
          <div className="flex items-center gap-2">
            <span className="pr-1 text-[13px] text-white/70">{t.payments}</span>
            <span className="flex h-8 items-center rounded-lg bg-white px-2">
              <Image src="/icons/visa.png" alt="Visa" width={96} height={96} className="h-6 w-auto" />
            </span>
            <span className="flex h-8 items-center rounded-lg bg-white px-2">
              <Image
                src="/icons/mastercard.png"
                alt="Mastercard"
                width={107}
                height={76}
                className="h-5 w-auto"
              />
            </span>
            <span className="flex h-8 items-center rounded-lg bg-white px-2">
              <Image
                src="/icons/apple-pay.png"
                alt="Apple Pay"
                width={100}
                height={100}
                className="h-6 w-auto"
              />
            </span>
          </div>
        </div>
      </div>

      {isOfferOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#173452]/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.offer}
        >
          <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white text-[#173452] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3dfd9] px-6 py-4">
              <h3 className="font-display text-lg font-bold">{t.offer}</h3>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-semibold text-[#5c6370] hover:bg-[#f6f4f1]"
                onClick={() => setIsOfferOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="h-[70vh] bg-[#f6f4f1]">
              {publicOfferEmbedUrl ? (
                <iframe title={t.offer} src={publicOfferEmbedUrl} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#5c6370]">
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
