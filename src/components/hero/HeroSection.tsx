// src/components/hero/HeroSection.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import SearchForm from "./SearchForm";
import SearchResults from "@/components/search/SearchResults";
import { translations as heroTranslations } from "@/i18n";

type Lang = "ru" | "bg" | "en" | "ua";

export default function HeroSection({ lang = "ru" }: { lang?: Lang }) {
  const [criteria, setCriteria] = useState<null | {
    from: string;
    to: string;
    fromName: string;
    toName: string;
    date: string;
    returnDate?: string;
    seatCount: number;
    discountCount: number;
  }>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const expanded = !!criteria;

  useEffect(() => {
    if (criteria && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [criteria]);

  return (
    <section
      id="hero"
      className="relative bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-white"
    >
      <div className="container mx-auto px-4 py-14">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          {heroTranslations[lang].title}
        </h1>
        <p className="mt-3 text-center text-white/90">
          {heroTranslations[lang].subtitle}
        </p>

        {/* ЕДИНАЯ КАПСУЛА: форма + (скрываемый) блок результатов */}
        <div className="mx-auto mt-8 max-w-5xl rounded-3xl bg-white/20 backdrop-blur shadow-lg ring-1 ring-white/30 overflow-visible relative z-30">

          {/* ВСТАВЛЯЕМ ФОРМУ БЕЗ ЕЕ СОБСТВЕННОГО ВНЕШНЕГО КОНТЕЙНЕРА  */}
          <div className="p-5">
            <SearchForm
              lang={lang}
              embedded
              onSearch={(cr) => setCriteria(cr)}
            />
          </div>

          {/* Плавно раскрываемый блок с результатами ПОИСКА */}
          <div
            className={[
              'grid transition-all duration-300 ease-in-out',
              expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
            ].join(' ')}
          >
            {expanded && (
              <div ref={resultsRef} className="px-5 pb-5 pt-0">
                <div className="rounded-2xl bg-white/80 p-4 text-slate-900 shadow ring-1 ring-black/5">
                  <SearchResults
                    lang={lang}
                    from={criteria!.from}
                    to={criteria!.to}
                    fromName={criteria!.fromName}
                    toName={criteria!.toName}
                    date={criteria!.date}
                    returnDate={criteria!.returnDate}
                    seatCount={criteria!.seatCount}
                    discountCount={criteria!.discountCount}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/80">
          {heroTranslations[lang].note}
        </p>
      </div>
    </section>
  );
}

