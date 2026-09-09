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
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 p-4 pb-14">
      <section className="mx-auto mt-6 max-w-6xl space-y-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Бронирование билетов</h1>
        <p className="text-slate-600">
          Настоящий пошаговый сценарий поиска, выбора рейсов и оплаты с сохранением всех API и логики.
        </p>
      </section>
      <section className="mt-6">
        <BookingCard />
      </section>
    </main>
  );
}
