// src/components/hero/HeroSection.tsx
'use client';

import { useState } from 'react';
import SearchForm from './SearchForm';
import SearchResults from '@/components/search/SearchResults';

type Lang = 'ru' | 'bg' | 'en' | 'ua';

export default function HeroSection({ lang = 'ru' }: { lang?: Lang }) {
  const [criteria, setCriteria] = useState<null | {
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    seatCount: number;
  }>(null);

  const expanded = !!criteria;

  return (
    <section
      id="hero"
      className="relative bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-white"
    >
      <div className="container mx-auto px-4 py-14">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Поедем с комфортом
        </h1>
        <p className="mt-3 text-center text-white/90">
          Покупка автобусных билетов онлайн — быстро и удобно.
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
              <div className="px-5 pb-5 pt-0">
                <div className="rounded-2xl bg-white/80 p-4 text-slate-900 shadow ring-1 ring-black/5">
                  <SearchResults
                    lang={lang}
                    from={criteria!.from}
                    to={criteria!.to}
                    date={criteria!.date}
                    returnDate={criteria!.returnDate}
                    seatCount={criteria!.seatCount}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

