import type { Metadata } from "next";

import BookingCard from "@/components/booking/BookingCard";

// Приватный маршрут: рендерим на каждый запрос и не отдаём в CDN-кэш.
// Публичные страницы кэшируются (revalidate), эта ветка — нет.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-14">
      <section className="mx-auto mt-6 max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Бронирование билетов</h1>
      </section>
      <section className="mt-6">
        <BookingCard />
      </section>
    </main>
  );
}
