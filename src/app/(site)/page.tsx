"use client";

import HeroSection from "@/components/hero/HeroSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";
import BookingCard from "@/components/booking/BookingCard";
import { useLanguage } from "@/components/common/LanguageProvider";
import { bookingTranslations } from "@/translations/home";

export default function Page() {
  const { lang } = useLanguage();
  const bookingCopy = bookingTranslations[lang];

  return (
    <main className="min-h-screen">
      <section id="hero">
        <HeroSection lang={lang} />
      </section>

      <section id="booking" className="-mt-12 bg-slate-50 pb-14 pt-16">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">{bookingCopy.eyebrow}</p>
            <h2 className="text-3xl font-bold text-slate-900">{bookingCopy.title}</h2>
            <p className="text-slate-600">{bookingCopy.description}</p>
          </div>
          <BookingCard />
        </div>
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
