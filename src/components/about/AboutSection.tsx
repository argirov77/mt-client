"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  bodyTextClass,
  sectionBgMuted,
  sectionTitleClass,
} from "../common/designGuide";
import { aboutContent, type Lang } from "./content";
import { aboutTranslations } from "@/translations/home";
import { trackContact } from "@/lib/analytics";
import { formatPhone } from "@/lib/offices";

type Props = {
  lang?: Lang;
  id?: string;
  className?: string;
};

type MediaItem = { src: string; alt: string; caption?: string };

/**
 * «О компании» без вкладок: факты, автобусы и офисы подряд, коротко.
 * Тексты, фото, номера и мессенджеры — те же, что были во вкладках.
 */
export default function AboutSection({
  lang = "ru",
  id = "about",
  className = "",
}: Props) {
  const blocks = aboutContent[lang] ?? aboutContent.ru;
  const copy = aboutTranslations[lang] ?? aboutTranslations.ru;
  const [modalItem, setModalItem] = useState<MediaItem | null>(null);

  const aboutBlock = blocks.find((block) => !block.media && !block.offices) ?? blocks[0];
  const fleetBlock = blocks.find((block) => block.media?.length);
  const officesBlock = blocks.find((block) => block.offices?.length);

  const formatPhoneDigits = (phone: string) => phone.replace(/\D/g, "");
  const messengers = (phone: string) => [
    { key: "viber" as const, label: "Viber", href: `viber://chat?number=%2B${formatPhoneDigits(phone)}` },
    { key: "telegram" as const, label: "Telegram", href: `https://t.me/+${formatPhoneDigits(phone)}` },
    { key: "whatsapp" as const, label: "WhatsApp", href: `https://wa.me/${formatPhoneDigits(phone)}` },
  ];
  const trackPhoneClick = (phone: string) => {
    trackContact({ method: "phone", source: "about_section", label: phone });
  };
  const trackMessengerClick = (messenger: "whatsapp" | "viber" | "telegram") => {
    trackContact({ method: messenger, source: "about_section", label: messenger });
  };

  return (
    <section id={id} className={`${sectionBgMuted} py-16 ${className}`}>
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.kicker}</div>
          <h2 className={`${sectionTitleClass} mt-2`}>{copy.title}</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-600 md:text-base">{copy.subtitle}</p>
        </div>

        {/* О компании: факты вместо общих слов */}
        <div className="space-y-4">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {copy.facts.map((fact) => (
              <li key={fact.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <b className="block text-lg text-slate-900 md:text-xl">{fact.value}</b>
                <span className="text-sm text-slate-600">{fact.label}</span>
              </li>
            ))}
          </ul>
          {aboutBlock ? (
            <div className="space-y-2">
              {aboutBlock.text.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`} className={`${bodyTextClass} text-slate-700`}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        {/* Автобусы: фото с подписями */}
        {fleetBlock ? (
          <div className="space-y-3">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{fleetBlock.title}</h3>
            <ul className="grid grid-cols-3 gap-2 sm:gap-3">
              {(fleetBlock.media ?? []).map((item) => (
                <li key={item.src}>
                  <button
                    type="button"
                    className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:shadow-md"
                    onClick={() => setModalItem(item)}
                  >
                    <span className="block aspect-[4/3] bg-slate-100">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={480}
                        height={360}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="block px-2 py-1.5 text-xs font-bold text-slate-800 sm:text-sm">
                      {item.caption ?? item.alt}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-700">{copy.amenities}</p>
          </div>
        ) : null}

        {/* Офисы: фото, адрес, телефон и мессенджеры одной строкой */}
        {officesBlock?.offices ? (
          <div className="space-y-3">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{officesBlock.title}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {officesBlock.offices.map((office) => (
                <div
                  key={office.city}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white sm:flex-row"
                >
                  <div className="relative aspect-[16/9] sm:aspect-auto sm:w-40 sm:shrink-0">
                    <Image src={office.image.src} alt={office.image.alt} fill className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-base text-slate-900">{office.city}</b>
                      <span className="text-sm text-slate-600">· {office.tag}</span>
                    </div>
                    <p className="text-sm text-slate-700">{office.address}</p>
                    {office.phones.map((phone) => (
                      <div key={phone} className="flex flex-wrap items-center gap-2">
                        <a
                          href={`tel:${phone}`}
                          onClick={() => trackPhoneClick(phone)}
                          aria-label={`${copy.call} ${formatPhone(phone)}`}
                          className="min-h-[44px] content-center text-base font-bold text-slate-900 hover:text-[#0a65b0]"
                        >
                          {formatPhone(phone)}
                        </a>
                        <span className="ml-auto flex gap-1.5">
                          {messengers(phone).map((messenger) => (
                            <a
                              key={messenger.key}
                              href={messenger.href}
                              onClick={() => trackMessengerClick(messenger.key)}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${messenger.label} ${formatPhone(phone)}`}
                              title={messenger.label}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition hover:border-slate-400"
                            >
                              <Image src={`/icons/${messenger.key}.png`} alt="" width={18} height={18} />
                            </a>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {modalItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
          onClick={() => setModalItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalItem.caption ?? modalItem.alt}
            className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={modalItem.src}
              alt={modalItem.alt}
              width={1200}
              height={800}
              className="h-[60vh] w-full object-contain"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              <span>{modalItem.caption ?? modalItem.alt}</span>
              <button
                type="button"
                className="min-h-[44px] rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white"
                onClick={() => setModalItem(null)}
              >
                {copy.closeLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
