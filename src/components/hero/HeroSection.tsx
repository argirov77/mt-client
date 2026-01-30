// src/components/hero/HeroSection.tsx
"use client";

import Link from "next/link";
import { heroTranslations } from "@/translations/home";
import type { Lang } from "@/components/common/LanguageProvider";

type Props = { lang?: Lang };

export default function HeroSection({ lang = "ru" }: Props) {
  const t = heroTranslations[lang];

  return (
    <section id="hero" className="bg-slate-50 px-3 py-3 sm:px-4">
      <div className="relative">
        <div
          aria-hidden="true"
          className="h-[82vh] min-h-[620px] overflow-hidden rounded-2xl border border-slate-200/70 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:h-[80vh] sm:min-h-[560px]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(3,10,20,0.28) 0%, rgba(3,10,20,0.58) 55%, rgba(3,10,20,0.88) 100%), url('/images/hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto flex h-full w-full max-w-[1180px] items-end justify-center px-3 pb-6 sm:px-4 lg:justify-start lg:px-6">
            <div className="w-full max-w-[720px] text-center text-white lg:max-w-[560px] lg:text-left">
              <span className="inline-block text-xs font-extrabold uppercase tracking-[0.12em] text-white/80">
                {t.since}
              </span>
              <h1 className="mt-3 text-[clamp(34px,5vw,56px)] font-black leading-[1.05] tracking-[-0.03em]">
                {t.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-white/90">
                {t.route}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Link
                  href="#booking"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_40px_rgba(11,108,255,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(0,0,0,0.25)] sm:w-auto"
                >
                  {t.primaryCta}
                </Link>
                <Link
                  href="#parcel"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(0,0,0,0.25)] sm:w-auto"
                >
                  {t.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
