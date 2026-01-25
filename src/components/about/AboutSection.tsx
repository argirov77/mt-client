"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  bodyTextClass,
  sectionBgMuted,
  sectionTitleClass,
} from "../common/designGuide";
import { aboutContent, type Lang } from "./content";
import { aboutTranslations } from "@/translations/home";

type Props = {
  lang?: Lang;
  id?: string;
  className?: string;
};

export default function AboutSection({
  lang = "ru",
  id = "about",
  className = "",
}: Props) {
  const blocks = aboutContent[lang] ?? aboutContent.ru;
  const { kicker, title, subtitle, closeLabel } = aboutTranslations[lang] ?? aboutTranslations.ru;
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [modalItem, setModalItem] = useState<null | {
    src: string;
    alt: string;
    caption?: string;
  }>(null);

  const activeBlock = blocks[activeIndex] ?? blocks[0];
  const media = activeBlock?.media ?? [];
  const heroMedia = media[activeMediaIndex] ?? media[0];

  const formatPhoneDigits = (phone: string) => phone.replace(/\D/g, "");
  const buildWhatsAppLink = (phone: string) => `https://wa.me/${formatPhoneDigits(phone)}`;
  const buildViberLink = (phone: string) =>
    `viber://chat?number=%2B${formatPhoneDigits(phone)}`;
  const buildTelegramLink = (phone: string) => `https://t.me/+${formatPhoneDigits(phone)}`;

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [activeIndex]);

  const bulletItems = useMemo(() => activeBlock?.bullets ?? [], [activeBlock]);

  return (
    <section id={id} className={`${sectionBgMuted} py-16 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {kicker}
          </div>
          <h2 className={`${sectionTitleClass} mt-2`}>
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            {subtitle}
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200/70 bg-gradient-to-b from-white/95 to-white/80 px-4 py-3">
            <div
              className="flex flex-nowrap gap-2 overflow-auto md:flex-wrap"
              role="tablist"
              aria-label="Разделы"
            >
              {blocks.map((block, idx) => (
                <button
                  key={`${block.title}-${idx}`}
                  type="button"
                  role="tab"
                  className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                    idx === activeIndex
                      ? "border-orange-200/80 bg-orange-100/70 text-orange-700 shadow-[0_12px_24px_rgba(251,146,60,0.18)]"
                      : "border-slate-200/70 bg-white text-slate-600 hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                  aria-selected={idx === activeIndex}
                  onClick={() => setActiveIndex(idx)}
                >
                  {block.title}
                </button>
              ))}
            </div>
          </div>

          {activeBlock?.offices ? (
            <div className="px-5 py-6">
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                {activeBlock?.title}
              </h3>
              <div className="mt-3 space-y-3">
                {activeBlock?.text.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`} className={`${bodyTextClass} text-slate-600`}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <ul className="mt-5 grid gap-3 md:grid-cols-3">
                {bulletItems.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {activeBlock.offices.map((office, index) => (
                  <div
                    key={`${office.city}-${index}`}
                    className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                  >
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-50 to-orange-50">
                      <Image
                        src={office.image.src}
                        alt={office.image.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-base font-extrabold text-slate-900">{office.city}</div>
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                          {office.tag}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">{office.address}</div>
                      {office.image.caption ? (
                        <div className="text-xs font-semibold text-slate-500">
                          {office.image.caption}
                        </div>
                      ) : null}
                      <div className="mt-2 space-y-2">
                        {office.phones.map((phone) => (
                          <div
                            key={phone}
                            className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <a
                                href={`tel:${phone}`}
                                className="text-sm font-semibold text-slate-800 hover:text-orange-600"
                              >
                                {phone}
                              </a>
                              <a
                                href={`tel:${phone}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700"
                              >
                                Позвонить
                              </a>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Мессенджеры
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={buildViberLink(phone)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-700 transition hover:border-purple-400"
                                  target="_blank"
                                  rel="noreferrer"
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
                                  href={buildWhatsAppLink(phone)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:border-emerald-400"
                                  target="_blank"
                                  rel="noreferrer"
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
                                  href={buildTelegramLink(phone)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition hover:border-sky-400"
                                  target="_blank"
                                  rel="noreferrer"
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
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b border-slate-200/70 px-5 py-6 lg:border-b-0 lg:border-r">
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {activeBlock?.title}
                </h3>
                <div className="mt-3 space-y-3">
                  {activeBlock?.text.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`} className={`${bodyTextClass} text-slate-600`}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                <ul className="mt-5 grid gap-3">
                  {bulletItems.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-5 py-6">
                {media.length > 0 ? (
                  <>
                    <div className="hidden gap-3 sm:grid sm:grid-cols-2">
                      {media.map((item, index) => (
                        <button
                          key={`${item.src}-${index}`}
                          type="button"
                          className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                          onClick={() => setModalItem(item)}
                        >
                          <div className="aspect-[16/10] bg-gradient-to-br from-slate-50 to-orange-50">
                            <Image
                              src={item.src}
                              alt={item.alt}
                              width={640}
                              height={420}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-slate-700">
                            <span>{item.caption ?? ""}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="block sm:hidden">
                      <button
                        type="button"
                        className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-md"
                        onClick={() => heroMedia && setModalItem(heroMedia)}
                      >
                        <div className="aspect-[16/10] bg-gradient-to-br from-slate-50 to-orange-50">
                          {heroMedia ? (
                            <Image
                              src={heroMedia.src}
                              alt={heroMedia.alt}
                              width={640}
                              height={420}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 px-3 py-2 text-xs font-bold text-slate-700">
                          <span>{heroMedia?.caption ?? ""}</span>
                        </div>
                      </button>

                      <div className="mt-3 flex gap-3 overflow-auto pb-2">
                        {media.map((item, index) => (
                          <button
                            key={`${item.src}-${index}`}
                            type="button"
                            className={`flex w-28 flex-shrink-0 flex-col overflow-hidden rounded-2xl border text-left shadow-sm ${
                              index === activeMediaIndex
                                ? "border-orange-200 bg-orange-50/60"
                                : "border-slate-200/70 bg-white"
                            }`}
                            onClick={() => setActiveMediaIndex(index)}
                          >
                            <div className="aspect-[16/10] bg-gradient-to-br from-slate-50 to-orange-50">
                              <Image
                                src={item.src}
                                alt={item.alt}
                                width={240}
                                height={160}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="px-2 py-2 text-[11px] font-bold text-slate-700">
                              {item.caption ?? ""}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>

      {modalItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
          onClick={() => setModalItem(null)}
        >
          <div
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
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white"
                onClick={() => setModalItem(null)}
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
