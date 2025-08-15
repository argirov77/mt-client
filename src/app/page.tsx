'use client';

import React, { useState } from 'react';
import HeroSection from '@/components/hero/HeroSection';
import SearchResults from '@/components/search/SearchResults';

type Lang = 'ru' | 'bg' | 'en' | 'ua';

export default function Page() {
  // Фиксируем язык, чтобы не ловить гидрацию (можно заменить на свой детектор)
  const [lang] = useState<Lang>('ru');

  // Критерии поиска, которые прилетают из HeroSection
  const [criteria, setCriteria] = useState<{
    from: string;
    to: string;
    date: string;        // YYYY-MM-DD
    seatCount: number;
  } | null>(null);

  return (
    <main className="min-h-screen bg-slate-50">
      <HeroSection
        lang={lang}
        onSearch={(cr) => {
          // сюда приходит { from, to, date, seatCount } из формы
          setCriteria(cr);
          // можно проскроллить к результатам:
          setTimeout(() => {
            const el = document.getElementById('results');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 0);
        }}
      />

      {/* Результаты поиска и процесс бронирования/покупки */}
      <div id="results">
        {criteria && (
          <SearchResults
            lang={lang}
            from={criteria.from}
            to={criteria.to}
            date={criteria.date}
            seatCount={criteria.seatCount}
            // returnDate можно добавить позже, когда будет второй датапикер
          />
        )}
      </div>
    </main>
  );
}
