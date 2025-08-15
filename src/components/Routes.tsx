// src/components/Routes.tsx
const translations = {
  ru: { routes: "Наши маршруты", buy: "Купить билет" },
  bg: { routes: "Нашите маршрути", buy: "Купете билет" },
  en: { routes: "Our routes", buy: "Buy ticket" },
  ua: { routes: "Наші маршрути", buy: "Купити квиток" },
};

export default function Routes({ lang = "ru" }: { lang?: "ru" | "bg" | "en" | "ua" }) {
  const t = translations[lang];
  return (
    <section className="bg-gray-50 py-14" id="routes">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-8">{t.routes}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-primary font-semibold text-lg mb-2">София — Варна</span>
            <button className="bg-accent text-white px-6 py-2 rounded-lg font-semibold">{t.buy}</button>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-primary font-semibold text-lg mb-2">Пловдив — Бургас</span>
            <button className="bg-accent text-white px-6 py-2 rounded-lg font-semibold">{t.buy}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
