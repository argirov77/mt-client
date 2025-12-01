import BookingCard from "@/components/booking/BookingCard";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 pb-16">
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 px-4 pb-16 pt-14 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-center">
          <span className="mx-auto rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2rem] text-white/90 ring-1 ring-white/30">
            Живой сценарий бронирования
          </span>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Бронирование билетов с комфортом</h1>
          <p className="text-base text-white/90 sm:text-lg">
            Все реальные шаги — поиск, выбор рейсов, пассажиры, места, допуслуги и оплата — в одной аккуратной ленте без изменения логики.
          </p>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.2),transparent_30%)]" />
      </section>

      <section className="-mt-10 px-4">
        <BookingCard />
      </section>
    </main>
  );
}
