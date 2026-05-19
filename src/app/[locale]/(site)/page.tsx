import type { Metadata } from "next";
import { notFound } from "next/navigation";

import About from "@/components/About";
import HeroSection from "@/components/hero/HeroSection";
import BookingSection from "@/components/home/BookingSection";
import PurchaseReturnView from "@/components/home/PurchaseReturnView";
import ParcelSection from "@/components/ParcelSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import { buildHomeMetadata, isLocale } from "@/lib/seo";
import type { Lang } from "@/lib/locale";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildHomeMetadata(locale);
}

export default async function HomePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Lang;

  return (
    <>
      <PurchaseReturnView />
      <main className="min-h-screen">
        <HeroSection lang={lang} />
        <BookingSection lang={lang} />
        <About />
        <ParcelSection />
        <Routes lang={lang} />
        <Schedule lang={lang} />
      </main>
    </>
  );
}
