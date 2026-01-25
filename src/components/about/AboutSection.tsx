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
  const { kicker, title, subtitle, closeLabel, stats } = aboutTranslations[lang] ?? aboutTranslations.ru;
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

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={`${stat.value}-${index}`}
              className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 text-base font-extrabold text-slate-900">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_0_6px_rgba(251,146,60,0.25)]" />
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
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

              {activeBlock?.offices ? (
                <div className="mt-4 space-y-3">
                  {activeBlock.offices.map((office, index) => (
                    <div
                      key={`${office.city}-${index}`}
                      className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-extrabold text-slate-900">{office.city}</div>
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                          {office.tag}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{office.address}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
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
