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

  // после нового поиска скроллим к блоку с результатами
  useEffect(() => {
    if (criteria && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [criteria]);

  return (
    <div className="w-full space-y-6">
      {/* Блок поиска — просто красивая карточка с формой */}
      <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white/80 p-5 shadow-lg ring-1 ring-slate-200">
        <SearchForm
          lang={lang}
          embedded
          onSearch={(params) => setCriteria(params)}
        />
      </div>

      {/* Блок результатов: появляется только после поиска */}
      {criteria && (
        <div
          ref={resultsRef}
          className="mx-auto w-full max-w-5xl rounded-3xl bg-white/90 p-5 shadow-lg ring-1 ring-slate-200"
        >
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}
