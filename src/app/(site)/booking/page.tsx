import BookingCard from "@/components/booking/BookingCard";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 pb-14">
      <section className="mx-auto mt-6 max-w-6xl space-y-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Бронирование билетов</h1>
        <p className="text-base text-slate-700">
          Настоящий пошаговый сценарий поиска, выбора рейсов и оплаты с сохранением всех API и логики.
        </p>
      </section>
      <section className="mt-6">
        <BookingCard />
      </section>
    </main>
  );
}
