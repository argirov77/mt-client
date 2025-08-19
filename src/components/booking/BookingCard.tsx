"use client";

import React, { useState } from "react";
import SearchForm from "@/components/hero/SearchForm";
import SearchResults from "@/components/search/SearchResults";

type Criteria = {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  seatCount: number;
};

export default function BookingCard() {
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const lang = "ru" as const;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <SearchForm lang={lang} onSearch={(params) => setCriteria(params)} />
      {criteria && (
        <div className="rounded-3xl bg-white/20 backdrop-blur p-5 shadow-lg ring-1 ring-white/30">
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}

