"use client";

import React, { useState } from "react";

import HeroSection from "@/components/hero/HeroSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";

type Lang = "ru" | "bg" | "en" | "ua";

export default function Page() {
  const [lang] = useState<Lang>("ru");

  return (
    <main className="min-h-screen">
      <section id="hero">
        <HeroSection lang={lang} />
      </section>

      <section id="routes" className="bg-white/60">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <Routes />
        </div>
      </section>

      <section id="schedule" className="bg-slate-50">
        <div className="mx-auto max-w-6xl w-full px-4 py-14">
          <Schedule />
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
