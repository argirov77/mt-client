// src/components/hero/HeroSection.tsx
"use client";

import Link from "next/link";
import { translations as heroTranslations } from "@/i18n";
import type { Lang } from "@/components/common/LanguageProvider";

type Props = { lang?: Lang };

export default function HeroSection({ lang = "ru" }: Props) {
  const t = heroTranslations[lang];

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-white"
    >
      <div className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg text-white/90">{t.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#booking"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              {lang === "en" ? "Start booking" : "Начать бронирование"}
            </Link>
            <Link
              href="#routes"
              className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:border-white"
            >
              {t.note}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
