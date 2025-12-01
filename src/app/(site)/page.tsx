"use client";

import HeroSection from "@/components/hero/HeroSection";
import BookingFlow from "@/components/booking/BookingFlow";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function Page() {
  const { lang } = useLanguage();

  return (
    <main className="min-h-screen">
      <section id="hero">
        <HeroSection lang={lang} />
      </section>

      <section id="booking" className="bg-white">
        <BookingFlow />
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
