"use client";

import React, { useState } from "react";

// Секции
import HeroSection from "@/components/hero/HeroSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";

// Поисковая выдача + покупка
import SearchResults from "@/components/search/SearchResults";

type Lang = "ru" | "bg" | "en" | "ua";

export default function Page() {
  // фиксируем язык (можно заменить на ваш детектор)
  const [lang] = useState<Lang>("ru");

  // критерии поиска, приходят из HeroSection (SearchForm внутри)
  const [criteria, setCriteria] = useState<{
    from: string;
    to: string;
    date: string; // YYYY-MM-DD
    seatCount: number;
    // returnDate можно добавить позже
  } | null>(null);

  return (
    <main className="min-h-screen">
      {/* HERO + форма поиска */}
      <section id="hero">
        <HeroSection
          lang={lang}
          onSearch={(cr) => {
            setCriteria(cr);
            // скролл к результатам
            setTimeout(() => {
              const el = document.getElementById("results");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
          }}
        />
      </section>

      {/* Результаты поиска и процесс бронирования/покупки */}
      <section id="results" className="mx-auto max-w-6xl w-full px-4 py-10">
        {criteria ? (
          <SearchResults
            lang={lang}
            from={criteria.from}
            to={criteria.to}
            date={criteria.date}
            seatCount={criteria.seatCount}
            // returnDate={criteria.returnDate}
          />
        ) : (
          // лёгкий плейсхолдер до первого поиска
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Выберите направление и дату в форме выше, затем нажмите «Поиск».
          </div>
        )}
      </section>

      {/* Маршруты */}
      <section id="routes" className="bg-white/60">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <Routes />
        </div>
      </section>

      {/* Расписание */}
      <section id="schedule" className="bg-slate-50">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <Schedule />
        </div>
      </section>

      {/* О нас */}
      <section id="about" className="bg-white">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <About />
        </div>
      </section>
    </main>
  );
}
