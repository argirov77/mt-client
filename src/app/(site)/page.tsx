import type { Metadata } from "next";

import PurchaseClient from "@/components/purchase/PurchaseClient";
import MarketingHome from "@/components/home/MarketingHome";
import PaymentBanner from "@/components/home/PaymentBanner";

export const metadata: Metadata = {
  title: "Максимов Турс — автобусные билеты по Болгарии и Европе",
  description:
    "Прямые автобусные рейсы между Украиной и Болгарией с 1992 года. Билеты онлайн на маршруты Одесса — Варна — Бургас, удобные автобусы Setra, Neoplan, Mercedes.",
  alternates: {
    canonical: "https://maximovtours.com/",
    languages: {
      ru: "https://maximovtours.com/ru/",
      en: "https://maximovtours.com/en/",
      uk: "https://maximovtours.com/uk/",
      bg: "https://maximovtours.com/bg/",
      "x-default": "https://maximovtours.com/",
    },
  },
  openGraph: {
    title: "Максимов Турс — автобусные билеты по Болгарии и Европе",
    description:
      "Прямые автобусные рейсы Одесса — Варна — Бургас. Онлайн-бронирование, оплата картой, электронные билеты.",
    url: "https://maximovtours.com/",
    siteName: "Maximov Tours",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Максимов Турс — автобусные билеты по Болгарии и Европе",
    description:
      "Прямые автобусные рейсы Одесса — Варна — Бургас. Онлайн-бронирование, оплата картой, электронные билеты.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type RawParam = string | string[] | undefined;

const firstString = (value: RawParam): string => {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
};

type SearchParams = Promise<Record<string, RawParam>>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const purchaseId =
    firstString(params.purchase_id) || firstString(params.purchaseId);
  const paymentStatus = firstString(params.payment).toLowerCase();

  if (purchaseId) {
    return (
      <main className="min-h-screen bg-slate-50 py-6">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4">
          <PaymentBanner
            initialStatus={paymentStatus}
            shouldCleanUrl={Boolean(paymentStatus || purchaseId)}
          />
          <PurchaseClient purchaseId={purchaseId} />
        </div>
      </main>
    );
  }

  return <MarketingHome />;
}
