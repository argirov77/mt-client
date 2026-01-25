import type { Lang } from "@/components/common/LanguageProvider";

type HeroCopy = {
  title: string;
  subtitle: string;
  note: string;
  startBooking: string;
};

type BookingCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

type ScheduleCopy = {
  eyebrow: string;
  title: string;
  description: string;
  serviceDescription: string;
  meta: string[];
  loading: string;
  error: string;
  noData: string;
  currency: string;
};

type RoutesCopy = {
  eyebrow: string;
  title: string;
  forward: string;
  backward: string;
  noData: string;
  arrival: string;
  departure: string;
  map: string;
  stopsCount: (n: number) => string;
  duration: string;
  showAll: string;
  showLess: string;
};

type AboutCopy = {
  heading: string;
  tagline: string;
};

export const heroTranslations: Record<Lang, HeroCopy> = {
  ru: {
    title: "Покупка билета онлайн",
    subtitle:
      "Быстро. Удобно. Без очередей. Максимов Турc — ваш надёжный перевозчик.",
    note: "100% возврат до отправления",
    startBooking: "Начать бронирование",
  },
  bg: {
    title: "Купете билет онлайн",
    subtitle:
      "Бързо. Удобно. Без опашки. Максимов Турс — вашият надежден превозвач.",
    note: "100% връщане до заминаването",
    startBooking: "Започнете резервация",
  },
  en: {
    title: "Buy your ticket online",
    subtitle:
      "Fast. Easy. No queues. Maksimov Tours — your reliable carrier.",
    note: "100% refund before departure",
    startBooking: "Start booking",
  },
  ua: {
    title: "Купуйте квиток онлайн",
    subtitle:
      "Швидко. Зручно. Без черг. Максимов Турc — ваш надійний перевізник.",
    note: "100% повернення до відправлення",
    startBooking: "Почати бронювання",
  },
};

export const bookingTranslations: Record<Lang, BookingCopy> = {
  ru: {
    eyebrow: "Покупка билета",
    title: "Пошаговый процесс бронирования",
    description:
      "Проходите шаги последовательно: поиск, выбор рейсов, места, пассажиры и оплата без смены логики.",
  },
  en: {
    eyebrow: "Ticket purchase",
    title: "Step-by-step booking flow",
    description:
      "Follow the steps to search, select seats, add extras and pay without leaving the flow.",
  },
  bg: {
    eyebrow: "Покупка на билет",
    title: "Стъпков процес на резервация",
    description:
      "Минавайте през стъпките подред: търсене, избор на курсове, места, пътници и плащане без да сменяте логиката.",
  },
  ua: {
    eyebrow: "Придбання квитка",
    title: "Покроковий процес бронювання",
    description:
      "Проходьте кроки послідовно: пошук, вибір рейсів, місця, пасажири та оплата без зміни логіки.",
  },
};

export const scheduleTranslations: Record<Lang, ScheduleCopy> = {
  ru: {
    eyebrow: "Цены",
    title: "Актуальные тарифы",
    description: "Стоимость популярных направлений.",
    serviceDescription: "Прямой автобусный рейс",
    meta: ["Цены в гривнах (UAH)", "Могут отличаться по дате", "Все рейсы прямые"],
    loading: "Загрузка…",
    error: "Ошибка загрузки",
    noData: "Данные не найдены",
    currency: "₴",
  },
  bg: {
    eyebrow: "Цени",
    title: "Актуални тарифи",
    description: "Цени за популярни направления.",
    serviceDescription: "Директен автобусен курс",
    meta: [
      "Цените са в гривни (UAH)",
      "Може да се променят според датата",
      "Всички курсове са директни",
    ],
    loading: "Зареждане…",
    error: "Грешка при зареждането",
    noData: "Няма данни",
    currency: "₴",
  },
  en: {
    eyebrow: "Prices",
    title: "Current fares",
    description: "Popular route pricing.",
    serviceDescription: "Direct coach service",
    meta: ["Prices in UAH", "May vary by travel date", "All routes are direct"],
    loading: "Loading…",
    error: "Failed to load",
    noData: "No data",
    currency: "₴",
  },
  ua: {
    eyebrow: "Ціни",
    title: "Актуальні тарифи",
    description: "Вартість популярних напрямків.",
    serviceDescription: "Прямий автобусний рейс",
    meta: ["Ціни в гривнях (UAH)", "Можуть відрізнятися за датою", "Усі рейси прямі"],
    loading: "Завантаження…",
    error: "Помилка завантаження",
    noData: "Даних немає",
    currency: "₴",
  },
};

export const routesTranslations: Record<Lang, RoutesCopy> = {
  ru: {
    eyebrow: "Маршруты автобусов",
    title: "Наши маршруты",
    forward: "Направление 1",
    backward: "Направление 2",
    noData: "Маршруты не найдены",
    arrival: "Прибытие",
    departure: "Отправление",
    map: "Открыть на карте",
    stopsCount: (n: number) =>
      `${n} остановк${n % 10 === 1 && n % 100 !== 11
        ? "а"
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
          ? "и"
          : ""}`,
    duration: "В пути",
    showAll: "Показать все",
    showLess: "Свернуть",
  },
  en: {
    eyebrow: "Bus routes",
    title: "Our routes",
    forward: "Direction 1",
    backward: "Direction 2",
    noData: "No routes found",
    arrival: "Arrival",
    departure: "Departure",
    map: "Open in map",
    stopsCount: (n: number) => `${n} stops`,
    duration: "Duration",
    showAll: "Show all",
    showLess: "Show less",
  },
  bg: {
    eyebrow: "Автобусни маршрути",
    title: "Нашите маршрути",
    forward: "Посока 1",
    backward: "Посока 2",
    noData: "Няма намерени маршрути",
    arrival: "Пристига",
    departure: "Заминава",
    map: "Отвори на картата",
    stopsCount: (n: number) => `${n} спирк${n === 1 ? "а" : "и"}`,
    duration: "Пътуване",
    showAll: "Покажи всички",
    showLess: "Скрий",
  },
  ua: {
    eyebrow: "Автобусні маршрути",
    title: "Наші маршрути",
    forward: "Напрям 1",
    backward: "Напрям 2",
    noData: "Маршрути не знайдено",
    arrival: "Прибуття",
    departure: "Відправлення",
    map: "Відкрити на мапі",
    stopsCount: (n: number) =>
      `${n} зупин${n === 1 ? "ка" : n >= 2 && n <= 4 ? "ки" : "ок"}`,
    duration: "У дорозі",
    showAll: "Показати всі",
    showLess: "Згорнути",
  },
};

export const aboutTranslations: Record<Lang, AboutCopy> = {
  ru: {
    heading: "О компании",
    tagline:
      "Премиальный сервис, современный автопарк и офисы в ключевых транспортных узлах для удобства пассажиров.",
  },
  en: {
    heading: "About company",
    tagline:
      "Premium service, a modern fleet, and offices in key transport hubs for passenger convenience.",
  },
  bg: {
    heading: "За компанията",
    tagline:
      "Премиум обслужване, модерен автопарк и офиси в ключови транспортни центрове за удобство на пътниците.",
  },
  ua: {
    heading: "Про компанію",
    tagline:
      "Преміальний сервіс, сучасний автопарк і офіси в ключових транспортних вузлах для зручності пасажирів.",
  },
};
