// src/components/Schedule.tsx
const translations = {
  ru: { schedule: "Цены и расписание", route: "Маршрут", time: "Время", price: "Цена" },
  bg: { schedule: "Цени и разписание", route: "Маршрут", time: "Час", price: "Цена" },
  en: { schedule: "Prices and schedule", route: "Route", time: "Time", price: "Price" },
  ua: { schedule: "Ціни та розклад", route: "Маршрут", time: "Час", price: "Ціна" },
};

export default function Schedule({ lang = "ru" }: { lang?: "ru" | "bg" | "en" | "ua" }) {
  const t = translations[lang];
  return (
    <section className="bg-gray-50 py-14" id="prices">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-8">{t.schedule}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl text-left">
            <thead>
              <tr>
                <th className="px-6 py-4">{t.route}</th>
                <th className="px-6 py-4">{t.time}</th>
                <th className="px-6 py-4">{t.price}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4">София — Варна</td>
                <td className="px-6 py-4">08:00, 15:30</td>
                <td className="px-6 py-4">50 лв</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
