"use client";

import React, { useEffect, useRef, useState } from "react";
import SearchForm from "@/components/hero/SearchForm";
import SearchResults from "@/components/search/SearchResults";
import { useLanguage } from "@/components/common/LanguageProvider";

type Criteria = {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  returnDate?: string;
  seatCount: number;
  discountCount: number;
};

export default function BookingCard() {
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const { lang } = useLanguage();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (criteria && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [criteria]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <SearchForm lang={lang} onSearch={(params) => setCriteria(params)} />
      {criteria && (
        <div
          ref={resultsRef}
          className="rounded-3xl bg-white/20 backdrop-blur p-5 shadow-lg ring-1 ring-white/30"
        >
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}

