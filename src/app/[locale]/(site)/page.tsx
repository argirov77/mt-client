import { Suspense } from "react";
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
import { buildOrganizationLD } from "@/lib/jsonld";
import type { Lang } from "@/lib/locale";
import { fetchSelectedPricelist, fetchSelectedRoute } from "@/lib/serverData";

type Params = { locale: string };

// Ревалидация задана на уровне страницы, а не на fetch: /selected_route и
// /selected_pricelist — POST-запросы, а Data Cache в Next кэширует только GET,
// и опция next.revalidate на самом фетче была бы молча проигнорирована.
export const revalidate = 600;

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
  const organizationLd = buildOrganizationLD(lang);

  const [routesData, prices] = await Promise.all([
    fetchSelectedRoute(lang),
    fetchSelectedPricelist(lang),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      {/* Оверлей возврата с оплаты читает query-параметры на клиенте
          (useSearchParams). Suspense здесь нужен именно для CSR-bailout:
          без него prerender падает, с ним страница остаётся статической,
          а в SSR-разметку не попадает ничего пользовательского. */}
      <Suspense fallback={null}>
        <PurchaseReturnView />
      </Suspense>
      <main className="min-h-screen">
        <HeroSection lang={lang} />
        <BookingSection lang={lang} />
        <About />
        <ParcelSection />
        <Routes lang={lang} initialData={routesData} />
        <Schedule lang={lang} initialPrices={prices} />
      </main>
    </>
  );
}
