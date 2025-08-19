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
    <div className="mx-auto w-full max-w-5xl rounded-2xl border bg-white p-4 shadow">
      <SearchForm lang={lang} onSearch={(params) => setCriteria(params)} />
      {criteria && (
        <div className="mt-6">
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}

