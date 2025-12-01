// src/components/hero/HeroSection.tsx
"use client";

import { translations as heroTranslations } from "@/i18n";

type Lang = "ru" | "bg" | "en" | "ua";

export default function HeroSection({ lang = "ru" }: { lang?: Lang }) {
  return (
    <section
      id="hero"
      className="relative bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-white"
    >
      <div className="container mx-auto px-4 py-14">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          {heroTranslations[lang].title}
        </h1>
        <p className="mt-3 text-center text-white/90">
          {heroTranslations[lang].subtitle}
        </p>

        <div className="mt-8 flex justify-center">
          <a
            href="#booking"
            className="rounded-full bg-white/90 px-6 py-3 text-sky-700 shadow-lg ring-1 ring-white/50 transition hover:bg-white"
          >
            Перейти к покупке билета
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-white/80">{heroTranslations[lang].note}</p>
      </div>
    </section>
  );
}
