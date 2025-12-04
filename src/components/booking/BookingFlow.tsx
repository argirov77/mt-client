"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
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

  // после нового поиска скроллим к заголовку результатов с небольшим отступом
  useEffect(() => {
    if (criteria && resultsRef.current) {
      const rect = resultsRef.current.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const currentTop = window.scrollY;
      const distance = Math.abs(elementTop - currentTop);
      const alreadyVisible = rect.top >= 0 && rect.top < window.innerHeight;

      if (!alreadyVisible && distance > 40) {
        window.scrollTo({
          top: Math.max(elementTop - 80, 0),
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
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-50 hover:text-sky-900"
              onClick={() => setCriteria(null)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <Search className="h-4 w-4" aria-hidden />
              {lang === "en" ? "Back to search" : "Назад к поиску"}
            </button>
          </div>
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}
