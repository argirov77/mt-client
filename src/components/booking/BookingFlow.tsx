"use client";

import { useEffect, useRef, useState } from "react";
import SearchForm from "@/components/hero/SearchForm";
import SearchResults from "@/components/search/SearchResults";
import { useLanguage } from "@/components/common/LanguageProvider";

export type Criteria = {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  returnDate?: string;
  seatCount: number;
  discountCount: number;
};

export default function BookingFlow() {
  const { lang } = useLanguage();
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // после нового поиска скроллим к блоку с результатами, но без резкого скачка
  useEffect(() => {
    if (criteria && resultsRef.current) {
      const elementTop =
        resultsRef.current.getBoundingClientRect().top + window.scrollY;
      const currentTop = window.scrollY;
      const distance = Math.abs(elementTop - currentTop);

      if (distance > 120) {
        window.scrollTo({
          top: Math.max(elementTop - 16, 0),
          behavior: "smooth",
        });
      }
    }
  }, [criteria]);

  return (
    <div className="w-full space-y-6">
      {!criteria && (
        <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white/80 p-5 shadow-lg ring-1 ring-slate-200">
          <SearchForm
            lang={lang}
            embedded
            onSearch={(params) => setCriteria(params)}
          />
        </div>
      )}

      {/* Блок результатов: появляется только после поиска */}
      {criteria && (
        <div
          ref={resultsRef}
          className="mx-auto w-full max-w-5xl rounded-3xl bg-white/90 p-5 shadow-lg ring-1 ring-slate-200"
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="text-sm text-sky-700 underline decoration-sky-300 decoration-2 underline-offset-4 hover:text-sky-900"
              onClick={() => setCriteria(null)}
            >
              {lang === "en" ? "New search" : "Новый поиск"}
            </button>
          </div>
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}
