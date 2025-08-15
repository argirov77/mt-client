// src/components/Popular.tsx
const translations = {
  ru: {
    popular: "Популярные направления",
    sale: "Скидки и акции",
    sofVar: "София — Варна",
    ploBur: "Пловдив — Бургас",
    sale1: "-20% на София — Варна до 1 сентября!",
  },
  bg: {
    popular: "Популярни дестинации",
    sale: "Отстъпки и промоции",
    sofVar: "София — Варна",
    ploBur: "Пловдив — Бургас",
    sale1: "-20% за София — Варна до 1 септември!",
  },
  en: {
    popular: "Popular destinations",
    sale: "Discounts and offers",
    sofVar: "Sofia — Varna",
    ploBur: "Plovdiv — Burgas",
    sale1: "-20% for Sofia — Varna until Sept 1st!",
  },
  ua: {
    popular: "Популярні напрямки",
    sale: "Знижки та акції",
    sofVar: "Софія — Варна",
    ploBur: "Пловдив — Бургас",
    sale1: "-20% на Софія — Варна до 1 вересня!",
  },
};

export default function Popular({ lang = "ru" }: { lang?: "ru" | "bg" | "en" | "ua" }) {
  const t = translations[lang];
  return (
    <section className="bg-white py-14" id="popular">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-6">{t.popular}</h2>
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <button className="bg-primary text-white px-6 py-3 rounded-lg">{t.sofVar}</button>
          <button className="bg-primary text-white px-6 py-3 rounded-lg">{t.ploBur}</button>
        </div>
        <h3 className="text-xl font-semibold text-center mb-4">{t.sale}</h3>
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="bg-accent text-white px-6 py-4 rounded-xl font-semibold">
            {t.sale1}
          </div>
        </div>
      </div>
    </section>
  );
}
