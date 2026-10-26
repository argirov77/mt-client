import type { Lang } from "@/lib/locale";

type FirstScreenCopy = {
  directSince: string;
  nearestTrips: string;
  seatsFree: (n: number) => string;
  onDays: (days: string) => string;
  fromPrice: (price: string) => string;
  returnDiscount: (route: string, days: string) => string;
  returnDiscountShort: string;
  baggageIncluded: string;
  freeBooking: string;
  chooseTrip: string;
  formTitle: string;
  noTrips: string;
  homeEyebrow: string;
  homeTitle: string;
  popular: string;
  parcels: string;
  inRoute: string;
  popularLabels: Record<string, string>;
};

export const firstScreenTranslations: Record<Lang, FirstScreenCopy> = {
  ru: {
    directSince: "Прямой рейс · с 1992 года",
    nearestTrips: "Ближайшие рейсы",
    seatsFree: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "место" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "места" : "мест"}`,
    onDays: (days) => `по ${days}`,
    fromPrice: (price) => `от ${price}`,
    returnDiscount: (route, days) => `Обратно −10% при покупке туда-обратно · ${route} по ${days}`,
    returnDiscountShort: "Обратно −10% при покупке туда-обратно",
    baggageIncluded: "Чемодан 10–20 кг и ручная кладь в цене",
    freeBooking: "Бесплатная бронь или оплата картой",
    chooseTrip: "Выбрать рейс",
    formTitle: "Купить или забронировать",
    noTrips: "Даты рейсов — в форме ниже",
    homeEyebrow: "С 1992 года · прямые рейсы",
    homeTitle: "Автобусы Украина — Румыния — Болгария",
    popular: "Популярные направления",
    parcels: "Посылки Украина ⇄ Болгария · 1–5 дней · от 15 €",
    inRoute: "в пути",
    popularLabels: { "odessa-varna": "Одесса → Варна", "odessa-sunny-beach": "Одесса → Солнечный берег", "odessa-burgas": "Одесса → Бургас", "varna-odessa": "Варна → Одесса" },
  },
  ua: {
    directSince: "Прямий рейс · з 1992 року",
    nearestTrips: "Найближчі рейси",
    seatsFree: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "місце" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "місця" : "місць"}`,
    onDays: (days) => `по ${days}`,
    fromPrice: (price) => `від ${price}`,
    returnDiscount: (route, days) => `Назад −10% при купівлі туди й назад · ${route} по ${days}`,
    returnDiscountShort: "Назад −10% при купівлі туди й назад",
    baggageIncluded: "Валіза 10–20 кг і ручна поклажа в ціні",
    freeBooking: "Безкоштовне бронювання або оплата карткою",
    chooseTrip: "Обрати рейс",
    formTitle: "Купити або забронювати",
    noTrips: "Дати рейсів — у формі нижче",
    homeEyebrow: "З 1992 року · прямі рейси",
    homeTitle: "Автобуси Україна — Румунія — Болгарія",
    popular: "Популярні напрямки",
    parcels: "Посилки Україна ⇄ Болгарія · 1–5 днів · від 15 €",
    inRoute: "у дорозі",
    popularLabels: { "odessa-varna": "Одеса → Варна", "odessa-sunny-beach": "Одеса → Сонячний берег", "odessa-burgas": "Одеса → Бургас", "varna-odessa": "Варна → Одеса" },
  },
  bg: {
    directSince: "Директен курс · от 1992 г.",
    nearestTrips: "Най-близки курсове",
    seatsFree: (n) => `${n} ${n === 1 ? "място" : "места"}`,
    onDays: (days) => `в ${days}`,
    fromPrice: (price) => `от ${price}`,
    returnDiscount: (route, days) => `Обратно −10% при билет в двете посоки · ${route} в ${days}`,
    returnDiscountShort: "Обратно −10% при билет в двете посоки",
    baggageIncluded: "Куфар 10–20 кг и ръчен багаж са в цената",
    freeBooking: "Безплатна резервация или плащане с карта",
    chooseTrip: "Избери курс",
    formTitle: "Купи или резервирай",
    noTrips: "Датите на курсовете — във формата по-долу",
    homeEyebrow: "От 1992 г. · директни курсове",
    homeTitle: "Автобуси Украйна — Румъния — България",
    popular: "Популярни направления",
    parcels: "Пратки Украйна ⇄ България · 1–5 дни · от 15 €",
    inRoute: "в път",
    popularLabels: { "odessa-varna": "Одеса → Варна", "odessa-sunny-beach": "Одеса → Слънчев бряг", "odessa-burgas": "Одеса → Бургас", "varna-odessa": "Варна → Одеса" },
  },
  en: {
    directSince: "Direct service · since 1992",
    nearestTrips: "Next departures",
    seatsFree: (n) => `${n} ${n === 1 ? "seat" : "seats"}`,
    onDays: (days) => `on ${days}`,
    fromPrice: (price) => `from ${price}`,
    returnDiscount: (route, days) => `Return −10% on a round trip · ${route} on ${days}`,
    returnDiscountShort: "Return −10% on a round trip",
    baggageIncluded: "10–20 kg suitcase and carry-on included",
    freeBooking: "Free reservation or card payment",
    chooseTrip: "Choose a trip",
    formTitle: "Buy or reserve",
    noTrips: "Trip dates are in the form below",
    homeEyebrow: "Since 1992 · direct services",
    homeTitle: "Buses Ukraine — Romania — Bulgaria",
    popular: "Popular routes",
    parcels: "Parcels Ukraine ⇄ Bulgaria · 1–5 days · from €15",
    inRoute: "travel time",
    popularLabels: { "odessa-varna": "Odesa → Varna", "odessa-sunny-beach": "Odesa → Sunny Beach", "odessa-burgas": "Odesa → Burgas", "varna-odessa": "Varna → Odesa" },
  },
};
