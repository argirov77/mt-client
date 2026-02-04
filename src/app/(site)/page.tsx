"use client";

import HeroSection from "@/components/hero/HeroSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";
import BookingCard from "@/components/booking/BookingCard";
import ParcelSection from "@/components/ParcelSection";
import { useLanguage } from "@/components/common/LanguageProvider";
import {
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionTitleClass,
} from "@/components/common/designGuide";
import { bookingTranslations } from "@/translations/home";

export default function Page() {
  const { lang } = useLanguage();
  const bookingCopy = bookingTranslations[lang];

  return (
    <main className="min-h-screen">
      <section id="hero">
        <HeroSection lang={lang} />
      </section>

      <section id="booking" className="-mt-12 bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p className={sectionEyebrowClass}>{bookingCopy.eyebrow}</p>
            <div className="mx-auto w-full max-w-3xl rounded-md bg-rose-300/80 px-4 py-3 shadow-sm">
              <h2 className={sectionTitleClass}>{bookingCopy.title}</h2>
              <p className="text-base text-slate-800">{bookingCopy.description}</p>
            </div>
          </div>
          <BookingCard />
        </div>
      </section>

      <About />
      <ParcelSection />
      <Routes />
      <Schedule lang={lang} />
    </main>
  );
}
