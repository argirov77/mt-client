// src/components/ParcelSection.tsx
"use client";

import { useLanguage } from "@/components/common/LanguageProvider";
import { parcelTranslations } from "@/translations/home";
import {
  sectionBgMuted,
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionTitleClass,
} from "@/components/common/designGuide";

export default function ParcelSection() {
  const { lang } = useLanguage();
  const t = parcelTranslations[lang];

  const handleClick = () => {
    window.dispatchEvent(new Event("open-contact-modal"));
  };

  return (
    <section id="parcel" className={`${sectionBgMuted} py-16`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="text-center">
          <p className={sectionEyebrowClass}>{t.kicker}</p>
          <h2 className={`${sectionTitleClass} mt-2`}>{t.title}</h2>
          <p className={`mx-auto mt-3 max-w-3xl ${sectionDescriptionClass}`}>{t.description}</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 px-5 py-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid gap-3 md:grid-cols-3">
            {t.facts.map((fact, index) => (
              <div
                key={fact.title}
                className="flex gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4"
              >
                <div
                  className={
                    index === 1
                      ? "flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600"
                      : index === 2
                        ? "flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600"
                  }
                  aria-hidden="true"
                >
                  {index === 0 ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v5l3 2" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  ) : null}
                  {index === 1 ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 7.5c-1-1.5-2.7-2.5-4.7-2.5-3 0-5.4 2.2-5.4 5s2.4 5 5.4 5c2 0 3.7-1 4.7-2.5" />
                      <path d="M6.5 10H13" />
                      <path d="M6.5 14H13" />
                    </svg>
                  ) : null}
                  {index === 2 ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
                      <path d="M3 8v8l9 5 9-5V8" />
                      <path d="M12 13v8" />
                    </svg>
                  ) : null}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {fact.title}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {fact.value}
                    {fact.hint ? (
                      <span className="ml-2 text-xs font-semibold text-slate-600">{fact.hint}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-orange-700 shadow-[0_12px_24px_rgba(251,146,60,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(251,146,60,0.2)]"
          >
            {t.cta}
          </button>
          <p className={`max-w-xl text-sm text-slate-600 sm:text-base`}>{t.note}</p>
        </div>
      </div>
    </section>
  );
}
