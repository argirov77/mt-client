// src/components/ParcelSection.tsx
"use client";

import { useLanguage } from "@/components/common/LanguageProvider";
import { parcelTranslations } from "@/translations/home";

export default function ParcelSection() {
  const { lang } = useLanguage();
  const t = parcelTranslations[lang];

  const handleClick = () => {
    window.dispatchEvent(new Event("open-contact-modal"));
  };

  return (
    <section
      id="parcel"
      className="bg-slate-50 px-4 py-16 [background:radial-gradient(900px_420px_at_15%_10%,rgba(11,108,255,.1),transparent_60%),radial-gradient(760px_380px_at_85%_80%,rgba(255,122,0,.1),transparent_55%),#f6f8fb]"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[26px] border border-slate-200/60 bg-white/90 p-7 shadow-[0_28px_90px_rgba(15,23,42,.12)]">
          <div className="pointer-events-none absolute inset-[-1px] rounded-[26px] opacity-20 [background:linear-gradient(135deg,rgba(11,108,255,.18),rgba(255,122,0,.16))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [padding:1px]" />

          <div className="relative z-10 mx-auto mb-6 max-w-3xl text-center">
            <span className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
              {t.kicker}
            </span>
            <h2 className="mb-2 text-balance text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
              {t.title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {t.description.start}
              <strong className="font-semibold text-slate-900">{t.description.from}</strong>
              {t.description.middle}
              <strong className="font-semibold text-slate-900">{t.description.to}</strong>
              {t.description.end}
              {t.description.carrierPrefix}
              <strong className="font-semibold text-slate-900">{t.description.carrierBg}</strong>
              {t.description.carrierMiddle}
              <strong className="font-semibold text-slate-900">{t.description.carrierUa}</strong>.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 md:grid-cols-3">
            {t.facts.map((fact, index) => (
              <div
                key={fact.title}
                className="flex gap-3 rounded-[20px] border border-slate-200/60 bg-slate-900/[0.02] p-4 transition hover:-translate-y-0.5 hover:bg-slate-900/[0.03] hover:shadow-[0_18px_50px_rgba(15,23,42,.1)]"
              >
                <div
                  className={
                    index === 1
                      ? "flex h-11 w-11 flex-none items-center justify-center rounded-[16px] border border-orange-200/80 bg-orange-100/60 text-orange-500"
                      : index === 2
                        ? "flex h-11 w-11 flex-none items-center justify-center rounded-[16px] border border-emerald-200/80 bg-emerald-100/60 text-emerald-600"
                        : "flex h-11 w-11 flex-none items-center justify-center rounded-[16px] border border-blue-200/80 bg-blue-100/60 text-blue-500"
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
                  <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                    {fact.title}
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {fact.value}
                    {fact.hint ? (
                      <span className="ml-2 text-xs font-semibold text-slate-600">{fact.hint}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleClick}
              className="inline-flex items-center justify-center rounded-[16px] border border-blue-500/30 bg-blue-500 px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(11,108,255,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(11,108,255,.26)]"
            >
              {t.cta}
            </button>
            <p className="max-w-xl text-sm text-slate-600 sm:text-base">{t.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
