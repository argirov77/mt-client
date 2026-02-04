import type { Lang } from "@/components/common/LanguageProvider";

type HeroCopy = {
  since: string;
  title: string;
  route: string;
  primaryCta: string;
  secondaryCta: string;
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
  kicker: string;
  title: string;
  subtitle: string;
  closeLabel: string;
};

type ParcelCopy = {
  kicker: string;
  title: string;
  description: {
    start: string;
    from: string;
    middle: string;
    to: string;
    end: string;
    carrierPrefix: string;
    carrierBg: string;
    carrierMiddle: string;
    carrierUa: string;
  };
  facts: {
    title: string;
    value: string;
    hint?: string;
  }[];
  cta: string;
  note: string;
};

export const heroTranslations: Record<Lang, HeroCopy> = {
  ru: {
    since: "на линии с 1991 года",
    title: "Украина - Румыния - Болгария",
    route: "Одесса • Болград • Констанца • Варна • Солнечный берег • Бургас",
    primaryCta: "Купить билет",
    secondaryCta: "Отправить посылку",
  },
  bg: {
    since: "на линия от 1991 г.",
    title: "Украйна - Румъния - България",
    route: "Одеса • Болград • Констанца • Варна • Слънчев бряг • Бургас",
    primaryCta: "Купете билет",
    secondaryCta: "Изпратете пратка",
  },
  en: {
    since: "on the line since 1991",
    title: "Ukraine - Romania - Bulgaria",
    route: "Odessa • Bolgrad • Constanța • Varna • Sunny Beach • Burgas",
    primaryCta: "Buy a ticket",
    secondaryCta: "Send a parcel",
  },
  ua: {
    since: "на лінії з 1991 року",
    title: "Україна - Румунія - Болгарія",
    route: "Одеса • Болград • Констанца • Варна • Сонячний берег • Бургас",
    primaryCta: "Купити квиток",
    secondaryCta: "Відправити посилку",
  },
};

export const bookingTranslations: Record<Lang, BookingCopy> = {
  ru: {
    eyebrow: "Покупка билета",
    title: "Забронировать / Купить билет",
    description:
      "Обеспечь себя местом: бесплатно забронируй или купи билет в несколько кликов!",
  },
  en: {
    eyebrow: "Ticket purchase",
    title: "Reserve / Buy a ticket",
    description:
      "Secure your seat: reserve for free or buy a ticket in just a few clicks!",
  },
  bg: {
    eyebrow: "Покупка на билет",
    title: "Резервирай / Купи билет",
    description:
      "Осигури си място: резервирай безплатно или купи билет само с няколко клика!",
  },
  ua: {
    eyebrow: "Придбання квитка",
    title: "Забронювати / Купити квиток",
    description:
      "Забезпеч себе місцем: безкоштовно забронюй або купи квиток у кілька кліків!",
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

export const parcelTranslations: Record<Lang, ParcelCopy> = {
  ru: {
    kicker: "Посылки",
    title: "Отправка посылок Болгария ↔ Украина",
    description: {
      start: "Мы доставляем посылки ",
      from: "из любой точки Болгарии",
      middle: " в ",
      to: "любую точку Украины",
      end: " и наоборот.",
      carrierPrefix: " В Болгарии работаем через ",
      carrierBg: "Econt",
      carrierMiddle: ", в Украине — через ",
      carrierUa: "Новую Почту",
    },
    facts: [
      { title: "Срок доставки", value: "от 2 до 7 дней" },
      { title: "Стоимость", value: "от 20 €", hint: "индивидуально" },
      { title: "Тип отправлений", value: "личные посылки и небольшие грузы" },
    ],
    cta: "Рассчитать стоимость",
    note: "Просто напишите направление, города, вес и габариты — ответим с точной ценой.",
  },
  bg: {
    kicker: "Пратки",
    title: "Изпращане на пратки България ↔ Украйна",
    description: {
      start: "Доставяме пратки ",
      from: "от всяка точка на България",
      middle: " до ",
      to: "всяка точка на Украйна",
      end: " и обратно.",
      carrierPrefix: " В България работим чрез ",
      carrierBg: "Econt",
      carrierMiddle: ", в Украйна — чрез ",
      carrierUa: "Nova Poshta",
    },
    facts: [
      { title: "Срок на доставка", value: "от 2 до 7 дни" },
      { title: "Цена", value: "от 20 €", hint: "индивидуално" },
      { title: "Вид пратки", value: "лични пратки и малки товари" },
    ],
    cta: "Изчисли цена",
    note: "Напишете посока, градове, тегло и размери — ще върнем точна цена.",
  },
  en: {
    kicker: "Parcels",
    title: "Parcel delivery Bulgaria ↔ Ukraine",
    description: {
      start: "We deliver parcels ",
      from: "from any point in Bulgaria",
      middle: " to ",
      to: "any point in Ukraine",
      end: " and back.",
      carrierPrefix: " In Bulgaria we work with ",
      carrierBg: "Econt",
      carrierMiddle: ", in Ukraine — with ",
      carrierUa: "Nova Poshta",
    },
    facts: [
      { title: "Delivery time", value: "2 to 7 days" },
      { title: "Price", value: "from 20 €", hint: "individual" },
      { title: "Shipment type", value: "personal parcels and small cargo" },
    ],
    cta: "Calculate price",
    note: "Send the route, cities, weight and dimensions — we will reply with an exact quote.",
  },
  ua: {
    kicker: "Посилки",
    title: "Відправка посилок Болгарія ↔ Україна",
    description: {
      start: "Ми доставляємо посилки ",
      from: "з будь-якої точки Болгарії",
      middle: " до ",
      to: "будь-якої точки України",
      end: " і навпаки.",
      carrierPrefix: " У Болгарії працюємо через ",
      carrierBg: "Econt",
      carrierMiddle: ", в Україні — через ",
      carrierUa: "Нову Пошту",
    },
    facts: [
      { title: "Термін доставки", value: "від 2 до 7 днів" },
      { title: "Вартість", value: "від 20 €", hint: "індивідуально" },
      { title: "Тип відправлень", value: "особисті посилки та невеликі вантажі" },
    ],
    cta: "Розрахувати вартість",
    note: "Просто напишіть напрямок, міста, вагу та габарити — відповімо з точною ціною.",
  },
};

export const aboutTranslations: Record<Lang, AboutCopy> = {
  ru: {
    kicker: "О компании",
    title: "Быстрый сервис и живая поддержка",
    subtitle:
      "Максимов Турс занимается пассажирскими перевозками с 1992 года! Доверие, ответственность, безопасность — наши главные принципы!",
    closeLabel: "Закрыть",
  },
  en: {
    kicker: "About company",
    title: "Fast service with real support",
    subtitle:
      "Maksimov Tours has provided passenger transport since 1992. Trust, responsibility, and safety are our core principles.",
    closeLabel: "Close",
  },
  bg: {
    kicker: "За компанията",
    title: "Бързо обслужване и жива подкрепа",
    subtitle:
      "„Максимов Турс“ извършва пътнически превози от 1992 г. Доверие, отговорност и безопасност са нашите основни принципи.",
    closeLabel: "Затвори",
  },
  ua: {
    kicker: "Про компанію",
    title: "Швидкий сервіс і жива підтримка",
    subtitle:
      "«Максимов Турс» займається пасажирськими перевезеннями з 1992 року. Довіра, відповідальність і безпека — наші головні принципи.",
    closeLabel: "Закрити",
  },
};
