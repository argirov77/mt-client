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
  groupFrom: string;
  groupTo: string;
  groupBetween: string;
  returnKicker: string;
  returnTitle: string;
  returnNote: string;
  cta: string;
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
  intro: string;
  daysForward: string;
  daysBackward: string;
  timesNote: string;
  cta: string;
};

type AboutCopy = {
  kicker: string;
  // «{years}» подставляется из yearsOnLine(lang)
  title: string;
  subtitle: string;
  closeLabel: string;
  bullets: string[];
  ctaBuy: string;
  ctaOffices: string;
  facts: { value: string; label: string }[];
  photoAlt: string;
  fleetKicker: string;
  fleetTitle: string;
  fleetDescription: string;
  amenityList: string[];
  amenities: string;
  officesKicker: string;
  officesTitle: string;
  officesDescription: string;
  call: string;
};

type ParcelCopy = {
  kicker: string;
  title: string;
  description: string;
  facts: {
    title: string;
    value: string;
    hint?: string;
  }[];
  steps: string[];
  cta: string;
  note: string;
  fromUa: string;
  fromBg: string;
  officeIn: { odessa: string; varna: string };
  call: string;
};

export const heroTranslations: Record<Lang, HeroCopy> = {
  ru: {
    since: "на линии с 1992 года",
    title: "Украина - Румыния - Болгария",
    route: "Одесса • Болград • Констанца • Варна • Солнечный берег • Бургас",
    primaryCta: "Купить билет",
    secondaryCta: "Отправить посылку",
  },
  bg: {
    since: "на линия от 1992 г.",
    title: "Украйна - Румъния - България",
    route: "Одеса • Болград • Констанца • Варна • Слънчев бряг • Бургас",
    primaryCta: "Купете билет",
    secondaryCta: "Изпратете пратка",
  },
  en: {
    since: "on the line since 1992",
    title: "Ukraine - Romania - Bulgaria",
    route: "Odessa • Bolgrad • Constanța • Varna • Sunny Beach • Burgas",
    primaryCta: "Buy a ticket",
    secondaryCta: "Send a parcel",
  },
  ua: {
    since: "на лінії з 1992 року",
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
    title: "Цены на билеты",
    description: "Стоимость популярных направлений.",
    serviceDescription: "Прямой автобусный рейс",
    meta: ["В гривнах, за одного взрослого", "Могут отличаться по дате", "Все рейсы прямые"],
    loading: "Загрузка…",
    error: "Ошибка загрузки",
    noData: "Данные не найдены",
    currency: "₴",
    groupFrom: "Из Одессы",
    groupTo: "В Одессу",
    groupBetween: "Между городами",
    returnKicker: "Туда-обратно",
    returnTitle: "Обратный билет −10%",
    returnNote: "Скидка на обратный рейс считается автоматически при покупке туда и обратно.",
    cta: "Выбрать даты",
  },
  bg: {
    eyebrow: "Цени",
    title: "Цени на билетите",
    description: "Цени за популярни направления.",
    serviceDescription: "Директен автобусен курс",
    meta: [
      "В гривни, за един възрастен",
      "Може да се променят според датата",
      "Всички курсове са директни",
    ],
    loading: "Зареждане…",
    error: "Грешка при зареждането",
    noData: "Няма данни",
    currency: "₴",
    groupFrom: "От Одеса",
    groupTo: "Към Одеса",
    groupBetween: "Между градовете",
    returnKicker: "Отиване и връщане",
    returnTitle: "Обратен билет −10%",
    returnNote: "Отстъпката за обратния курс се начислява автоматично при покупка отиване и връщане.",
    cta: "Избери дати",
  },
  en: {
    eyebrow: "Prices",
    title: "Ticket prices",
    description: "Popular route pricing.",
    serviceDescription: "Direct coach service",
    meta: ["In UAH, per adult", "May vary by travel date", "All routes are direct"],
    loading: "Loading…",
    error: "Failed to load",
    noData: "No data",
    currency: "₴",
    groupFrom: "From Odesa",
    groupTo: "To Odesa",
    groupBetween: "Between cities",
    returnKicker: "Round trip",
    returnTitle: "Return ticket −10%",
    returnNote: "The return discount is applied automatically when you book both ways.",
    cta: "Choose dates",
  },
  ua: {
    eyebrow: "Ціни",
    title: "Ціни на квитки",
    description: "Вартість популярних напрямків.",
    serviceDescription: "Прямий автобусний рейс",
    meta: ["У гривнях, за одного дорослого", "Можуть відрізнятися за датою", "Усі рейси прямі"],
    loading: "Завантаження…",
    error: "Помилка завантаження",
    noData: "Даних немає",
    currency: "₴",
    groupFrom: "З Одеси",
    groupTo: "До Одеси",
    groupBetween: "Між містами",
    returnKicker: "Туди й назад",
    returnTitle: "Зворотний квиток −10%",
    returnNote: "Знижка на зворотний рейс нараховується автоматично при купівлі туди й назад.",
    cta: "Обрати дати",
  },
};

export const routesTranslations: Record<Lang, RoutesCopy> = {
  ru: {
    eyebrow: "Маршрут",
    title: "Остановки и время",
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
    intro: "Прямой рейс через Румынию. Из Одессы — по средам и субботам, обратно — по понедельникам и пятницам.",
    daysForward: "ср, сб",
    daysBackward: "пн, пт",
    timesNote: "Время местное, у остановки — прибытие и отправление.",
    cta: "Выбрать рейс",
  },
  en: {
    eyebrow: "Route",
    title: "Stops and times",
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
    intro: "A direct trip through Romania. From Odesa on Wednesdays and Saturdays, back on Mondays and Fridays.",
    daysForward: "Wed, Sat",
    daysBackward: "Mon, Fri",
    timesNote: "Local time; for each stop — arrival and departure.",
    cta: "Choose a trip",
  },
  bg: {
    eyebrow: "Маршрут",
    title: "Спирки и часове",
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
    intro: "Директен курс през Румъния. От Одеса — в сряда и събота, обратно — в понеделник и петък.",
    daysForward: "ср, сб",
    daysBackward: "пн, пт",
    timesNote: "Местно време, при спирката — пристигане и заминаване.",
    cta: "Избери курс",
  },
  ua: {
    eyebrow: "Маршрут",
    title: "Зупинки та час",
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
    intro: "Прямий рейс через Румунію. З Одеси — по середах і суботах, назад — по понеділках і пʼятницях.",
    daysForward: "ср, сб",
    daysBackward: "пн, пт",
    timesNote: "Час місцевий, біля зупинки — прибуття та відправлення.",
    cta: "Обрати рейс",
  },
};

export const parcelTranslations: Record<Lang, ParcelCopy> = {
  ru: {
    kicker: "Посылки",
    title: "Посылки Украина ⇄ Болгария",
    description:
      "Доставляем в обе стороны — документы, передачи родным и не только. Подберём тариф и подскажем по упаковке.",
    facts: [
      { title: "Срок доставки", value: "1–5 дней" },
      { title: "Стоимость", value: "от 15 €", hint: "зависит от веса и размеров" },
    ],
    steps: [
      "Напишите или позвоните в офис",
      "Укажите направление, города, вес и размеры",
      "Получите точную цену и срок",
    ],
    cta: "Связаться и получить расчёт",
    fromUa: "Из Украины",
    fromBg: "Из Болгарии",
    officeIn: { odessa: "Офис в Одессе", varna: "Офис в Варне" },
    call: "Звонок",
    note: "Свяжитесь с нами, укажите направление, города, вес и размеры — мы вернёмся с точной ценой и сроками.",
  },
  bg: {
    kicker: "Пратки",
    title: "Пратки Украйна ⇄ България",
    description:
      "Доставяме в двете посоки — документи, пратки за близки и не само. Ще изберем тарифа и ще помогнем с опаковката.",
    facts: [
      { title: "Срок на доставка", value: "1–5 дни" },
      { title: "Цена", value: "от 15 €", hint: "според тегло и размери" },
    ],
    steps: [
      "Пишете или се обадете в офиса",
      "Посочете посока, градове, тегло и размери",
      "Получавате точна цена и срок",
    ],
    cta: "Свържи се и получи оферта",
    fromUa: "От Украйна",
    fromBg: "От България",
    officeIn: { odessa: "Офис в Одеса", varna: "Офис във Варна" },
    call: "Обаждане",
    note: "Свържи се с нас и посочи посока, градове, тегло и размери — ще върнем точна цена и срок.",
  },
  en: {
    kicker: "Parcels",
    title: "Parcels Ukraine ⇄ Bulgaria",
    description:
      "We deliver both ways — documents, packages for family and more. We'll pick the rate and advise on packing.",
    facts: [
      { title: "Delivery time", value: "1–5 days" },
      { title: "Price", value: "from €15", hint: "based on weight and dimensions" },
    ],
    steps: [
      "Write or call the office",
      "Tell us the direction, cities, weight and dimensions",
      "Get the exact price and timing",
    ],
    cta: "Contact us for a quote",
    fromUa: "From Ukraine",
    fromBg: "From Bulgaria",
    officeIn: { odessa: "Odesa office", varna: "Varna office" },
    call: "Call",
    note: "Contact us and share the route, cities, weight, and dimensions — we’ll reply with an exact quote and timing.",
  },
  ua: {
    kicker: "Посилки",
    title: "Посилки Україна ⇄ Болгарія",
    description:
      "Доставляємо в обидва боки — документи, передачі рідним і не тільки. Підберемо тариф і підкажемо щодо пакування.",
    facts: [
      { title: "Термін доставки", value: "1–5 днів" },
      { title: "Вартість", value: "від 15 €", hint: "залежить від ваги та розмірів" },
    ],
    steps: [
      "Напишіть або зателефонуйте в офіс",
      "Вкажіть напрямок, міста, вагу та розміри",
      "Отримайте точну ціну та строк",
    ],
    cta: "Звʼязатися для розрахунку",
    fromUa: "З України",
    fromBg: "З Болгарії",
    officeIn: { odessa: "Офіс в Одесі", varna: "Офіс у Варні" },
    call: "Дзвінок",
    note: "Звʼяжіться з нами, вкажіть напрямок, міста, вагу та розміри — відповімо з точною ціною і строками.",
  },
};

type TripPageCopy = {
  reverseLabel: string;
  hubLabel: string;
  relatedLabel: string;
  blockTitle: string;
};

export const tripPageTranslations: Record<Lang, TripPageCopy> = {
  ru: {
    reverseLabel: "Обратный рейс",
    hubLabel: "Полный маршрут",
    relatedLabel: "Похожие направления",
    blockTitle: "Связанные направления",
  },
  ua: {
    reverseLabel: "Зворотний рейс",
    hubLabel: "Повний маршрут",
    relatedLabel: "Схожі напрямки",
    blockTitle: "Пов'язані напрямки",
  },
  en: {
    reverseLabel: "Return trip",
    hubLabel: "Full route",
    relatedLabel: "Related directions",
    blockTitle: "Related directions",
  },
  bg: {
    reverseLabel: "Обратен курс",
    hubLabel: "Пълен маршрут",
    relatedLabel: "Подобни посоки",
    blockTitle: "Свързани посоки",
  },
};

// {years} подставляется из yearsOnLine(): «34 года» и дальше само.
export const aboutTranslations: Record<Lang, AboutCopy> = {
  ru: {
    kicker: "О компании",
    title: "{years} на линии Украина — Болгария",
    subtitle:
      "Максимов Турс возит пассажиров с 1992 года. Прямые рейсы круглый год, офисы на автовокзалах Одессы и Варны и живая поддержка по телефону и в мессенджерах.",
    closeLabel: "Закрыть",
    bullets: [
      "Регулярные рейсы круглый год, без пересадок",
      "Водители со стажем от 10 лет",
      "Консультации в офисах Одессы и Варны",
      "Поддержка по телефону и в мессенджерах",
    ],
    ctaBuy: "Купить билет",
    ctaOffices: "Офисы и телефоны",
    facts: [
      { value: "{years}", label: "на линии с 1992 года" },
      { value: "Круглый год", label: "регулярные рейсы" },
      { value: "10+ лет", label: "стаж водителей" },
      { value: "2 офиса", label: "в Одессе и Варне" },
    ],
    photoAlt: "Одесса и Варна",
    fleetKicker: "Автопарк",
    fleetTitle: "Автобусы европейского класса",
    fleetDescription:
      "Mercedes Travego, Neoplan и Van Hool. Удобные сиденья, достаточно места между рядами, регулярное техобслуживание и чистый салон.",
    amenityList: [
      "Климат-контроль",
      "Wi-Fi",
      "USB-розетки",
      "Туалет в салоне",
      "Откидные сиденья",
    ],
    amenities: "Климат-контроль, Wi-Fi, USB-розетки, туалет, откидные сиденья",
    officesKicker: "Офисы и контакты",
    officesTitle: "Поможем на месте и по телефону",
    officesDescription:
      "Офисы на автовокзалах Одессы и Варны: расписание, покупка, обмен и возврат билетов. Звоните или пишите в Viber, Telegram и WhatsApp.",
    call: "Позвонить",
  },
  en: {
    kicker: "About company",
    title: "{years} on the Ukraine — Bulgaria line",
    subtitle:
      "Maksimov Tours has carried passengers since 1992. Direct trips all year round, offices at the Odesa and Varna bus stations, and real support by phone and messenger.",
    closeLabel: "Close",
    bullets: [
      "Regular year-round trips, no transfers",
      "Drivers with 10+ years of experience",
      "In-person help at the Odesa and Varna offices",
      "Support by phone and messenger",
    ],
    ctaBuy: "Buy a ticket",
    ctaOffices: "Offices and phones",
    facts: [
      { value: "{years}", label: "on the line since 1992" },
      { value: "All year", label: "regular trips" },
      { value: "10+ years", label: "driver experience" },
      { value: "2 offices", label: "in Odesa and Varna" },
    ],
    photoAlt: "Odesa and Varna",
    fleetKicker: "Fleet",
    fleetTitle: "European-class coaches",
    fleetDescription:
      "Mercedes Travego, Neoplan and Van Hool. Comfortable seats, ample space between rows, regular maintenance and a clean interior.",
    amenityList: [
      "Climate control",
      "Wi-Fi",
      "USB sockets",
      "Onboard toilet",
      "Reclining seats",
    ],
    amenities: "Air conditioning, Wi-Fi, USB sockets, toilet, reclining seats",
    officesKicker: "Offices and contacts",
    officesTitle: "Help in person and by phone",
    officesDescription:
      "Offices at the Odesa and Varna bus stations: schedules, purchase, exchange and refunds. Call us or write on Viber, Telegram and WhatsApp.",
    call: "Call",
  },
  bg: {
    kicker: "За компанията",
    title: "{years} на линията Украйна — България",
    subtitle:
      "„Максимов Турс“ превозва пътници от 1992 г. Директни курсове целогодишно, офиси на автогарите в Одеса и Варна и жива подкрепа по телефон и месинджъри.",
    closeLabel: "Затвори",
    bullets: [
      "Редовни курсове целогодишно, без прекачване",
      "Шофьори с над 10 години стаж",
      "Консултации в офисите в Одеса и Варна",
      "Подкрепа по телефон и месинджъри",
    ],
    ctaBuy: "Купи билет",
    ctaOffices: "Офиси и телефони",
    facts: [
      { value: "{years}", label: "на линията от 1992 г." },
      { value: "Целогодишно", label: "редовни курсове" },
      { value: "10+ години", label: "стаж на шофьорите" },
      { value: "2 офиса", label: "в Одеса и Варна" },
    ],
    photoAlt: "Одеса и Варна",
    fleetKicker: "Автопарк",
    fleetTitle: "Автобуси от европейски клас",
    fleetDescription:
      "Mercedes Travego, Neoplan и Van Hool. Удобни седалки, достатъчно място между редовете, редовна поддръжка и чист салон.",
    amenityList: [
      "Климатик",
      "Wi-Fi",
      "USB контакти",
      "Тоалетна в салона",
      "Накланящи се седалки",
    ],
    amenities: "Климатик, Wi-Fi, USB контакти, тоалетна, накланящи се седалки",
    officesKicker: "Офиси и контакти",
    officesTitle: "Помагаме на място и по телефона",
    officesDescription:
      "Офиси на автогарите в Одеса и Варна: разписание, покупка, замяна и връщане на билети. Обадете се или пишете във Viber, Telegram и WhatsApp.",
    call: "Обади се",
  },
  ua: {
    kicker: "Про компанію",
    title: "{years} на лінії Україна — Болгарія",
    subtitle:
      "«Максимов Турс» возить пасажирів з 1992 року. Прямі рейси цілий рік, офіси на автовокзалах Одеси та Варни і жива підтримка телефоном і в месенджерах.",
    closeLabel: "Закрити",
    bullets: [
      "Регулярні рейси цілий рік, без пересадок",
      "Водії зі стажем від 10 років",
      "Консультації в офісах Одеси та Варни",
      "Підтримка телефоном і в месенджерах",
    ],
    ctaBuy: "Купити квиток",
    ctaOffices: "Офіси та телефони",
    facts: [
      { value: "{years}", label: "на лінії з 1992 року" },
      { value: "Цілий рік", label: "регулярні рейси" },
      { value: "10+ років", label: "стаж водіїв" },
      { value: "2 офіси", label: "в Одесі та Варні" },
    ],
    photoAlt: "Одеса і Варна",
    fleetKicker: "Автопарк",
    fleetTitle: "Автобуси європейського класу",
    fleetDescription:
      "Mercedes Travego, Neoplan і Van Hool. Зручні сидіння, достатньо місця між рядами, регулярне техобслуговування та чистий салон.",
    amenityList: [
      "Клімат-контроль",
      "Wi-Fi",
      "USB-розетки",
      "Туалет у салоні",
      "Відкидні сидіння",
    ],
    amenities: "Клімат-контроль, Wi-Fi, USB-розетки, туалет, відкидні сидіння",
    officesKicker: "Офіси та контакти",
    officesTitle: "Допоможемо на місці й телефоном",
    officesDescription:
      "Офіси на автовокзалах Одеси та Варни: розклад, купівля, обмін і повернення квитків. Телефонуйте або пишіть у Viber, Telegram і WhatsApp.",
    call: "Зателефонувати",
  },
};
