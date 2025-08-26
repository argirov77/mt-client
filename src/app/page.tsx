"use client";

import React, { useEffect, useState } from "react";

import HeroSection from "@/components/hero/HeroSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";

type Lang = "ru" | "bg" | "en" | "ua";

export default function Page() {
  const [lang, setLang] = useState<Lang>("ru");

  useEffect(() => {
    const nav = navigator.language.slice(0, 2) as Lang;
    if (["ru", "bg", "en", "ua"].includes(nav)) {
      setLang(nav);
    }
  }, []);

  return (
    <main className="min-h-screen">
      <section id="hero">
        <HeroSection lang={lang} />
      </section>

      <section id="routes" className="relative z-10 bg-white/60">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <Routes />
        </div>
      </section>

      <section id="schedule" className="bg-slate-50">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <Schedule lang={lang} />
        </div>
      </section>

      <section id="about" className="bg-white">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <About />
        </div>
      </section>
    </main>
  );
}
