'use client';

import React, { useState } from 'react';
import SearchForm from './SearchForm';

type Lang = 'ru' | 'bg' | 'en' | 'ua';

type Props = {
  lang?: Lang;
  className?: string;
  onSearch: (criteria: { from: string; to: string; date: string; seatCount: number }) => void;
};

const TXT = {
  ru: {
    title: 'Поедем с комфортом',
    subtitle: 'Покупка автобусных билетов онлайн — быстро и удобно.',
  },
  bg: {
    title: 'Пътувайте комфортно',
    subtitle: 'Купете автобусни билети онлайн — бързо и удобно.',
  },
  en: {
    title: 'Travel in comfort',
    subtitle: 'Buy bus tickets online — fast and easy.',
  },
  ua: {
    title: 'Подорожуйте з комфортом',
    subtitle: 'Купуйте автобусні квитки онлайн — швидко та зручно.',
  },
};

export default function HeroSection({ lang = 'ru', className = '', onSearch }: Props) {
  const t = TXT[lang] ?? TXT.ru;

  // локально управляемые поля формы
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');           // YYYY-MM-DD
  const [seatCount, setSeatCount] = useState(1);

  return (
    <section
      className={`relative min-h-[420px] flex flex-col items-center justify-center
      bg-gradient-to-r from-blue-700 to-sky-400 text-white ${className}`}
    >
      {/* Декорный фон */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.15),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,.15),transparent_40%)]" />

      <div className="z-10 flex flex-col items-center w-full px-4">
        <h1 className="text-4xl md:text-5xl font-bold mt-10 mb-4 text-center drop-shadow">
          {t.title}
        </h1>
        <p className="text-xl mb-6 text-center drop-shadow">
          {t.subtitle}
        </p>

        {/* Форма поиска */}
        <div className="w-full max-w-5xl">
          <SearchForm
            from={from}
            to={to}
            date={date}
            seatCount={seatCount}
            setFrom={setFrom}
            setTo={setTo}
            setDate={setDate}
            setSeatCount={setSeatCount}
            lang={lang}
            onSearch={(criteria) => {
              // отдаём наружу чистые данные
              onSearch(criteria);
            }}
          />
        </div>
      </div>

      {/* Небольшая подложка под формой для читабельности */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-900/30 to-transparent pointer-events-none" />
    </section>
  );
}
