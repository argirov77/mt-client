import type { Lang } from "@/lib/locale";

export type LocaleData = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  heroSubtitle: string;
  leadText: string;
  fullText: string;
};

export type Trip = {
  fromSlug: string;
  toSlug: string;
  reverseKey?: string;
  fromStopId?: number;
  toStopId?: number;
  related?: string[];
  i18n: Record<Lang, LocaleData>;
};

const COMMON = {
  brand: "Максимов Турс",
};

export const tripsData: Record<string, Trip> = {
  "odessa-varna": {
    fromSlug: "odessa",
    toSlug: "varna",
    reverseKey: "varna-odessa",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["odessa-burgas", "odessa-sunny-beach"],
    i18n: {
      ru: {
        slug: "odessa-varna",
        title: "Автобус Одесса → Варна | Расписание и билеты — Максимов Турс",
        description:
          "Прямой автобус Одесса – Варна, ~17 ч в пути, от 2300 грн. Официальный перевозчик, отправление от Привоза. Билеты онлайн, опыт 30+ лет.",
        h1: "Автобус Одесса – Варна: расписание и билеты",
        heroSubtitle: "Прямой рейс Одесса • Болград • Констанца • Варна",
        leadText:
          "Покупайте билет на прямой автобус Одесса – Варна онлайн. Отправление от автостанции «Привоз», прибытие в центр Варны.",
        fullText:
          "Маршрут Одесса – Варна — главное направление Максимов Турс с 1991 года. Автобус отправляется от автостанции «Привоз» в Одессе и следует через Болград и Констанцу к центральной автостанции Варны.\n\nВ дороге примерно 17 часов с учётом пограничного контроля. Рейсы выполняются по фиксированному расписанию несколько раз в неделю — точные даты доступны при выборе направления в форме бронирования.\n\nВ салоне Setra, Neoplan и Mercedes: мягкие кресла с регулируемой спинкой, климат-контроль, Wi-Fi, USB-розетки и санузел. Все рейсы прямые: на пересадки и доплаты времени уходить не будет.\n\nКроме пассажирских перевозок мы доставляем посылки между Украиной и Болгарией в обе стороны — это удобно, если нужно отправить документы или передачу родным.\n\nЦена базового билета — 2300 ₴, скидки доступны для детей и пенсионеров. Бронирование бесплатное, оплата онлайн или при посадке.",
      },
      ua: {
        slug: "odesa-varna",
        title: "Автобус Одеса → Варна | Розклад і квитки — Максимов Турс",
        description:
          "Прямий автобус Одеса – Варна, ~17 год у дорозі, від 2300 грн. Офіційний перевізник, відправлення від Привозу. Квитки онлайн, досвід 30+ років.",
        h1: "Автобус Одеса – Варна: розклад і квитки",
        heroSubtitle: "Прямий рейс Одеса • Болград • Констанца • Варна",
        leadText:
          "Купуйте квиток на прямий автобус Одеса – Варна онлайн. Відправлення з автостанції «Привоз», прибуття в центр Варни.",
        fullText:
          "Маршрут Одеса – Варна — головний напрямок Максимов Турс з 1991 року. Автобус вирушає з автостанції «Привоз» в Одесі та прямує через Болград і Констанцу до центральної автостанції Варни.\n\nУ дорозі приблизно 17 годин з урахуванням прикордонного контролю. Рейси виконуються за фіксованим розкладом кілька разів на тиждень — точні дати доступні під час вибору напрямку у формі бронювання.\n\nУ салоні Setra, Neoplan і Mercedes: м'які крісла з регульованою спинкою, клімат-контроль, Wi-Fi, USB-розетки та туалет. Усі рейси прямі: на пересадки та доплати часу не доведеться витрачати.\n\nКрім пасажирських перевезень, ми доставляємо посилки між Україною та Болгарією в обидва боки — це зручно, якщо потрібно надіслати документи чи передачу рідним.\n\nЦіна базового квитка — 2300 ₴, знижки доступні для дітей і пенсіонерів. Бронювання безкоштовне, оплата онлайн або при посадці.",
      },
      en: {
        slug: "odessa-varna",
        title: "Odessa to Varna Bus | Schedule & Tickets — Maximov Tours",
        description:
          "Direct bus Odessa – Varna, ~17h ride, from €44. Licensed carrier, departure from Privoz. Online tickets, 30+ years of experience.",
        h1: "Odessa to Varna Bus: schedule and tickets",
        heroSubtitle: "Direct service Odessa • Bolgrad • Constanța • Varna",
        leadText:
          "Buy a ticket for the direct Odessa – Varna bus online. Departure from Privoz bus station, arrival in central Varna.",
        fullText:
          "The Odessa – Varna route is Maximov Tours' flagship line, running since 1991. The bus departs from Privoz bus station in Odessa and runs through Bolgrad and Constanța to Varna's central bus station.\n\nThe journey takes about 17 hours including border control. Departures follow a fixed schedule multiple times a week — exact dates are available when you pick the direction in the booking form.\n\nOnboard the Setra, Neoplan, and Mercedes coaches: reclining seats, climate control, Wi-Fi, USB sockets, and a toilet. All trips are direct — no transfers, no extra fees.\n\nIn addition to passenger transport, we deliver parcels between Ukraine and Bulgaria in both directions — handy for documents or care packages.\n\nThe base ticket price is 2300 UAH; discounts are available for children and pensioners. Booking is free, with online payment or pay at boarding.",
      },
      bg: {
        slug: "odesa-varna",
        title: "Автобус Одеса → Варна | Разписание и билети — Максимов Турс",
        description:
          "Директен автобус Одеса – Варна, ~17 ч път, от 44 €. Официален превозвач, тръгване от Привоз. Билети онлайн, опит 30+ години.",
        h1: "Автобус Одеса – Варна: разписание и билети",
        heroSubtitle: "Директен курс Одеса • Болград • Констанца • Варна",
        leadText:
          "Купи билет за директния автобус Одеса – Варна онлайн. Тръгване от автогара Привоз, пристигане в центъра на Варна.",
        fullText:
          "Маршрутът Одеса – Варна е основната линия на Максимов Турс от 1991 г. Автобусът тръгва от автогара „Привоз“ в Одеса и преминава през Болград и Констанца до централната автогара във Варна.\n\nПътуването е около 17 часа с граничен контрол. Курсовете са по фиксирано разписание няколко пъти седмично — конкретните дати се показват при избор на посока във формата за резервация.\n\nВ салоните на Setra, Neoplan и Mercedes: меки седалки с регулируема облегалка, климатик, Wi-Fi, USB и тоалетна. Всички курсове са директни — без прекачвания и допълнителни такси.\n\nОсвен пътници, превозваме и пратки между Украйна и България в двете посоки — удобно за документи или колет до близки.\n\nЦената на стандартния билет е 2300 грн; има отстъпки за деца и пенсионери. Резервацията е безплатна, с плащане онлайн или при качване.",
      },
    },
  },

  "varna-odessa": {
    fromSlug: "varna",
    toSlug: "odessa",
    reverseKey: "odessa-varna",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["burgas-odessa", "sunny-beach-odessa"],
    i18n: {
      ru: {
        slug: "varna-odessa",
        title: "Автобус Варна → Одесса | Расписание и билеты — Максимов Турс",
        description:
          "Прямой автобус Варна – Одесса, ~17 ч, от 2300 грн. Официальный перевозчик, отправление от автостанции Варны. Билеты онлайн, опыт 30+ лет.",
        h1: "Автобус Варна – Одесса: расписание и билеты",
        heroSubtitle: "Прямой рейс Варна • Констанца • Болград • Одесса",
        leadText:
          "Прямой автобус Варна – Одесса: посадка на центральной автостанции Варны, высадка в Одессе у Привоза. Билеты онлайн.",
        fullText:
          "Обратный рейс Варна – Одесса работает по тому же расписанию, что и прямой. Автобус отправляется с центральной автостанции Варны и через Констанцу и Болград возвращается в Одессу.\n\nДорога занимает около 17 часов с учётом пограничных формальностей. Рейсы выполняются по фиксированному расписанию несколько раз в неделю — точные даты доступны в форме поиска.\n\nВ салонах Setra, Neoplan, Mercedes — климат-контроль, Wi-Fi, USB, санузел. Все рейсы прямые, без пересадок.\n\nЕсли вы возвращаетесь домой после отпуска, рейс удобен для багажа: посылки и крупные сумки доставляем без доплат в пределах нормы.\n\nЦена и условия идентичны прямому направлению. Бронируйте онлайн, оплачивайте картой или при посадке.",
      },
      ua: {
        slug: "varna-odesa",
        title: "Автобус Варна → Одеса | Розклад і квитки — Максимов Турс",
        description:
          "Прямий автобус Варна – Одеса, ~17 год, від 2300 грн. Офіційний перевізник, відправлення від автостанції Варни. Квитки онлайн, досвід 30+ років.",
        h1: "Автобус Варна – Одеса: розклад і квитки",
        heroSubtitle: "Прямий рейс Варна • Констанца • Болград • Одеса",
        leadText:
          "Прямий автобус Варна – Одеса: посадка на центральній автостанції Варни, висадка в Одесі біля Привозу. Квитки онлайн.",
        fullText:
          "Зворотний рейс Варна – Одеса працює за тим самим розкладом, що і прямий. Автобус вирушає з центральної автостанції Варни та через Констанцу і Болград повертається до Одеси.\n\nДорога займає близько 17 годин з урахуванням прикордонних формальностей. Рейси виконуються за фіксованим розкладом кілька разів на тиждень — точні дати доступні у формі пошуку.\n\nУ салонах Setra, Neoplan, Mercedes — клімат-контроль, Wi-Fi, USB, туалет. Усі рейси прямі, без пересадок.\n\nЯкщо ви повертаєтеся додому після відпустки, рейс зручний для багажу: посилки й великі сумки доставляємо без доплат у межах норми.\n\nЦіна та умови ідентичні прямому напрямку. Бронюйте онлайн, оплачуйте карткою або при посадці.",
      },
      en: {
        slug: "varna-odessa",
        title: "Varna to Odessa Bus | Schedule & Tickets — Maximov Tours",
        description:
          "Direct bus Varna – Odessa, ~17h, from €44. Licensed carrier, departure from Varna bus station. Online tickets, 30+ years.",
        h1: "Varna to Odessa Bus: schedule and tickets",
        heroSubtitle: "Direct service Varna • Constanța • Bolgrad • Odessa",
        leadText:
          "Direct Varna – Odessa bus: boarding at Varna's central station, drop-off in Odessa at Privoz. Tickets online.",
        fullText:
          "The Varna – Odessa return runs on the same schedule as the outbound route. The bus departs from Varna's central station and returns to Odessa via Constanța and Bolgrad.\n\nThe trip takes about 17 hours including border formalities. Departures are scheduled several times a week — exact dates appear in the search form.\n\nOnboard the Setra, Neoplan, and Mercedes coaches: climate control, Wi-Fi, USB, and a toilet. All trips are direct — no transfers.\n\nIf you're heading home after a holiday, this route is convenient for luggage: parcels and oversized bags travel without surcharges within the standard allowance.\n\nPricing and conditions match the outbound direction. Book online, pay by card or at boarding.",
      },
      bg: {
        slug: "varna-odesa",
        title: "Автобус Варна → Одеса | Разписание и билети — Максимов Турс",
        description:
          "Директен автобус Варна – Одеса, ~17 ч, от 44 €. Официален превозвач, тръгване от автогара Варна. Билети онлайн, опит 30+ години.",
        h1: "Автобус Варна – Одеса: разписание и билети",
        heroSubtitle: "Директен курс Варна • Констанца • Болград • Одеса",
        leadText:
          "Директен автобус Варна – Одеса: качване на централна автогара Варна, слизане в Одеса при Привоз. Билети онлайн.",
        fullText:
          "Обратният курс Варна – Одеса се движи по същото разписание като директния. Автобусът тръгва от централна автогара Варна и през Констанца и Болград се връща в Одеса.\n\nПътуването е около 17 часа с граничните формалности. Курсовете са по фиксирано разписание няколко пъти седмично — точните дати са във формата за търсене.\n\nВ салоните на Setra, Neoplan и Mercedes — климатик, Wi-Fi, USB, тоалетна. Всички курсове са директни, без прекачвания.\n\nАко се прибирате от почивка, маршрутът е удобен за багаж: пратки и големи чанти возим без доплащане в рамките на нормата.\n\nЦената и условията съвпадат с директната посока. Резервирайте онлайн, плащайте с карта или при качване.",
      },
    },
  },

  "odessa-burgas": {
    fromSlug: "odessa",
    toSlug: "burgas",
    reverseKey: "burgas-odessa",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["odessa-varna", "odessa-sunny-beach"],
    i18n: {
      ru: {
        slug: "odessa-burgas",
        title: "Автобус Одесса → Бургас | Расписание, билеты — Максимов Турс",
        description:
          "Прямой автобус Одесса – Бургас через Варну, ~20 ч, от 3200 грн. Официальный перевозчик, билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Одесса – Бургас: расписание и билеты",
        heroSubtitle: "Прямой рейс Одесса • Констанца • Варна • Бургас",
        leadText:
          "Прямой автобус Одесса – Бургас: посадка у Привоза в Одессе, высадка в центре Бургаса. Бронируйте онлайн.",
        fullText:
          "Бургас — крупный порт и популярное направление для отдыха на болгарском побережье. Автобус Максимов Турс едет из Одессы напрямую, проходя через Болград, Констанцу и Варну.\n\nПродолжительность поездки — около 19 часов с учётом границы. Расписание фиксированное; даты подбираются в форме поиска.\n\nКомфорт в дороге: Setra/Neoplan/Mercedes, регулируемые кресла, климат-контроль, Wi-Fi, USB и санузел. Все рейсы прямые.\n\nИз Бургаса удобно продолжить путь к курортам Солнечный берег, Несебр, Святой Влас — все рядом. Узнайте о пересадках и услуге доставки посылок при заказе.\n\nОплата онлайн или при посадке, скидки для детей и пенсионеров.",
      },
      ua: {
        slug: "odesa-burhas",
        title: "Автобус Одеса → Бургас | Розклад і квитки — Максимов Турс",
        description:
          "Прямий автобус Одеса – Бургас через Варну, ~20 год, від 3200 грн. Офіційний перевізник, квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Одеса – Бургас: розклад і квитки",
        heroSubtitle: "Прямий рейс Одеса • Констанца • Варна • Бургас",
        leadText:
          "Прямий автобус Одеса – Бургас: посадка біля Привозу в Одесі, висадка в центрі Бургаса. Бронюйте онлайн.",
        fullText:
          "Бургас — великий порт і популярний напрямок для відпочинку на болгарському узбережжі. Автобус Максимов Турс їде з Одеси напряму, через Болград, Констанцу і Варну.\n\nТривалість поїздки — близько 19 годин з урахуванням кордону. Розклад фіксований; дати обираються у формі пошуку.\n\nКомфорт у дорозі: Setra/Neoplan/Mercedes, регульовані крісла, клімат-контроль, Wi-Fi, USB і туалет. Усі рейси прямі.\n\nЗ Бургаса зручно продовжити шлях до курортів Сонячний берег, Несебр, Святий Влас — усі поруч. Дізнайтеся про пересадки та послугу доставки посилок при замовленні.\n\nОплата онлайн або при посадці, знижки для дітей і пенсіонерів.",
      },
      en: {
        slug: "odessa-burgas",
        title: "Odessa to Burgas Bus | Schedule & Tickets — Maximov Tours",
        description:
          "Direct bus Odessa – Burgas via Varna, ~20h, from €61. Licensed carrier, online tickets. 30+ years of experience.",
        h1: "Odessa to Burgas Bus: schedule and tickets",
        heroSubtitle: "Direct service Odessa • Constanța • Varna • Burgas",
        leadText:
          "Direct Odessa – Burgas bus: boarding at Privoz in Odessa, drop-off in central Burgas. Book online.",
        fullText:
          "Burgas is a major port and a popular Bulgarian Black Sea destination. The Maximov Tours coach runs Odessa to Burgas directly, via Bolgrad, Constanța, and Varna.\n\nThe ride takes about 19 hours including the border. The schedule is fixed; dates are chosen in the search form.\n\nOnboard comfort: Setra/Neoplan/Mercedes coaches, reclining seats, climate control, Wi-Fi, USB, and a toilet. All trips are direct.\n\nFrom Burgas it's easy to continue to Sunny Beach, Nessebar, or Sveti Vlas — all nearby. Ask about onward transfers and parcel delivery when booking.\n\nPay online or at boarding; discounts for children and pensioners.",
      },
      bg: {
        slug: "odesa-burgas",
        title: "Автобус Одеса → Бургас | Разписание и билети — Максимов Турс",
        description:
          "Директен автобус Одеса – Бургас през Варна, ~20 ч, от 61 €. Официален превозвач, билети онлайн. Опит 30+ години.",
        h1: "Автобус Одеса – Бургас: разписание и билети",
        heroSubtitle: "Директен курс Одеса • Констанца • Варна • Бургас",
        leadText:
          "Директен автобус Одеса – Бургас: качване при Привоз в Одеса, слизане в центъра на Бургас. Резервирайте онлайн.",
        fullText:
          "Бургас е голямо пристанище и популярна дестинация на българското крайбрежие. Автобусът на Максимов Турс пътува от Одеса директно през Болград, Констанца и Варна.\n\nПътуването е около 19 часа с граничните формалности. Разписанието е фиксирано; датите се избират във формата за търсене.\n\nКомфорт в салона: Setra/Neoplan/Mercedes, регулируеми седалки, климатик, Wi-Fi, USB и тоалетна. Всички курсове са директни.\n\nОт Бургас лесно се стига до Слънчев бряг, Несебър и Свети Влас — всички наблизо. Питайте за връзки и услугата за пратки при поръчка.\n\nПлащане онлайн или при качване; отстъпки за деца и пенсионери.",
      },
    },
  },

  "burgas-odessa": {
    fromSlug: "burgas",
    toSlug: "odessa",
    reverseKey: "odessa-burgas",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["varna-odessa", "sunny-beach-odessa"],
    i18n: {
      ru: {
        slug: "burgas-odessa",
        title: "Автобус Бургас → Одесса | Расписание, билеты — Максимов Турс",
        description:
          "Прямой автобус Бургас – Одесса через Варну, ~20 ч, от 3200 грн. Официальный перевозчик, билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Бургас – Одесса: расписание и билеты",
        heroSubtitle: "Прямой рейс Бургас • Варна • Констанца • Одесса",
        leadText:
          "Прямой рейс Бургас – Одесса: посадка в центре Бургаса, прибытие в Одессе у Привоза.",
        fullText:
          "Обратный рейс Бургас – Одесса работает синхронно с прямым: автобус выезжает из центра Бургаса, заезжает в Варну и через Констанцу с Болградом возвращается в Одессу.\n\nДорога — около 19 часов с пограничным контролем. Расписание фиксированное несколько раз в неделю.\n\nВ салоне: Wi-Fi, климат-контроль, USB-розетки, санузел. Кресла с регулируемой спинкой — поспать в дороге несложно.\n\nЕсли вы возвращаетесь после отдыха, удобно отправить чемоданы и сувениры с тем же рейсом — посылочная служба работает в обе стороны.\n\nЦена та же, что и в обратную сторону. Бронируйте бесплатно, оплачивайте онлайн или при посадке.",
      },
      ua: {
        slug: "burhas-odesa",
        title: "Автобус Бургас → Одеса | Розклад і квитки — Максимов Турс",
        description:
          "Прямий автобус Бургас – Одеса через Варну, ~20 год, від 3200 грн. Офіційний перевізник, квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Бургас – Одеса: розклад і квитки",
        heroSubtitle: "Прямий рейс Бургас • Варна • Констанца • Одеса",
        leadText:
          "Прямий рейс Бургас – Одеса: посадка в центрі Бургаса, прибуття в Одесі біля Привозу.",
        fullText:
          "Зворотний рейс Бургас – Одеса працює синхронно з прямим: автобус вирушає з центру Бургаса, заїжджає у Варну і через Констанцу з Болградом повертається до Одеси.\n\nДорога — близько 19 годин із прикордонним контролем. Розклад фіксований кілька разів на тиждень.\n\nУ салоні: Wi-Fi, клімат-контроль, USB-розетки, туалет. Крісла з регульованою спинкою — поспати в дорозі нескладно.\n\nЯкщо ви повертаєтеся з відпочинку, зручно відправити валізи й сувеніри тим самим рейсом — посилкова служба працює в обидва боки.\n\nЦіна така ж, як і у зворотний бік. Бронюйте безкоштовно, оплачуйте онлайн або при посадці.",
      },
      en: {
        slug: "burgas-odessa",
        title: "Burgas to Odessa Bus | Schedule & Tickets — Maximov Tours",
        description:
          "Direct bus Burgas – Odessa via Varna, ~20h, from €61. Licensed carrier, online tickets. 30+ years of experience.",
        h1: "Burgas to Odessa Bus: schedule and tickets",
        heroSubtitle: "Direct service Burgas • Varna • Constanța • Odessa",
        leadText:
          "Direct Burgas – Odessa bus: boarding in central Burgas, arrival in Odessa at Privoz.",
        fullText:
          "The Burgas – Odessa return runs in sync with the outbound: the coach leaves central Burgas, stops in Varna, and returns to Odessa via Constanța and Bolgrad.\n\nThe trip is about 19 hours including the border. Departures follow a fixed schedule several times a week.\n\nOnboard: Wi-Fi, climate control, USB sockets, toilet. The reclining seats make sleeping on the way easy.\n\nIf you're coming back from holiday, it's convenient to send suitcases or souvenirs on the same trip — our parcel service runs both ways.\n\nPricing matches the outbound direction. Book for free; pay online or at boarding.",
      },
      bg: {
        slug: "burgas-odesa",
        title: "Автобус Бургас → Одеса | Разписание и билети — Максимов Турс",
        description:
          "Директен автобус Бургас – Одеса през Варна, ~20 ч, от 61 €. Официален превозвач, билети онлайн. Опит 30+ години.",
        h1: "Автобус Бургас – Одеса: разписание и билети",
        heroSubtitle: "Директен курс Бургас • Варна • Констанца • Одеса",
        leadText:
          "Директен курс Бургас – Одеса: качване в центъра на Бургас, пристигане в Одеса при Привоз.",
        fullText:
          "Обратният курс Бургас – Одеса се движи синхронно с директния: автобусът тръгва от центъра на Бургас, минава през Варна и през Констанца и Болград се връща в Одеса.\n\nПътуването е около 19 часа с граничен контрол. Разписанието е фиксирано няколко пъти седмично.\n\nВ салоните: Wi-Fi, климатик, USB, тоалетна. Седалките са с регулируема облегалка — спането по пътя не е проблем.\n\nАко се прибирате от почивка, удобно е да изпратите куфари и сувенири със същия курс — пратките се извършват и в двете посоки.\n\nЦената съвпада с директната посока. Безплатна резервация, плащане онлайн или при качване.",
      },
    },
  },

  "odessa-sunny-beach": {
    fromSlug: "odessa",
    toSlug: "sunny-beach",
    reverseKey: "sunny-beach-odessa",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["odessa-burgas", "odessa-varna"],
    i18n: {
      ru: {
        slug: "odessa-solnechniy-bereg",
        title: "Автобус Одесса → Солнечный берег | Билеты — Максимов Турс",
        description:
          "Прямой автобус Одесса – Солнечный берег через Варну, ~19 ч, от 2800 грн. Официальный перевозчик, билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Одесса – Солнечный берег",
        heroSubtitle: "Прямой рейс Одесса • Констанца • Варна • Солнечный берег",
        leadText:
          "Прямой автобус Одесса – Солнечный берег: посадка у Привоза, высадка прямо на курорте. Идеально для летнего отдыха.",
        fullText:
          "Солнечный берег — крупнейший пляжный курорт Болгарии. Максимов Турс возит туда напрямую из Одессы каждый сезон с 1991 года.\n\nМаршрут проходит через Болград, Констанцу и Варну, время в пути — около 18 часов. Расписание уплотняется летом — даты доступны в форме поиска.\n\nАвтобусы Setra, Neoplan и Mercedes с климат-контролем, Wi-Fi, USB и санузлом. Все рейсы прямые.\n\nПрибытие на Солнечный берег — на главной автостанции курорта; от неё легко добраться до отелей пешком или местным транспортом.\n\nЦена базового билета 2300 ₴, есть детские скидки. Заранее бронируйте на пиковые даты — летом мест мало.",
      },
      ua: {
        slug: "odesa-sonyachniy-bereg",
        title: "Автобус Одеса → Сонячний берег | Квитки — Максимов Турс",
        description:
          "Прямий автобус Одеса – Сонячний берег через Варну, ~19 год, від 2800 грн. Офіційний перевізник, квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Одеса – Сонячний берег",
        heroSubtitle: "Прямий рейс Одеса • Констанца • Варна • Сонячний берег",
        leadText:
          "Прямий автобус Одеса – Сонячний берег: посадка біля Привозу, висадка прямо на курорті. Ідеально для літнього відпочинку.",
        fullText:
          "Сонячний берег — найбільший пляжний курорт Болгарії. Максимов Турс возить туди прямо з Одеси кожен сезон з 1991 року.\n\nМаршрут проходить через Болград, Констанцу і Варну, час у дорозі — близько 18 годин. Розклад ущільнюється влітку — дати доступні у формі пошуку.\n\nАвтобуси Setra, Neoplan і Mercedes з клімат-контролем, Wi-Fi, USB і туалетом. Усі рейси прямі.\n\nПрибуття на Сонячний берег — на головній автостанції курорту; з неї легко дістатися до готелів пішки або місцевим транспортом.\n\nЦіна базового квитка 2300 ₴, є дитячі знижки. Заздалегідь бронюйте на пікові дати — влітку місць мало.",
      },
      en: {
        slug: "odessa-sunny-beach",
        title: "Odessa to Sunny Beach Bus | Tickets — Maximov Tours",
        description:
          "Direct bus Odessa – Sunny Beach via Varna, ~19h, from €54. Licensed carrier, online tickets. 30+ years of experience.",
        h1: "Odessa to Sunny Beach Bus",
        heroSubtitle: "Direct service Odessa • Constanța • Varna • Sunny Beach",
        leadText:
          "Direct Odessa – Sunny Beach bus: boarding at Privoz, drop-off right at the resort. Perfect for the summer holiday.",
        fullText:
          "Sunny Beach is Bulgaria's largest seaside resort. Maximov Tours has been running direct trips there from Odessa every season since 1991.\n\nThe route goes via Bolgrad, Constanța, and Varna, with a travel time of around 18 hours. The summer timetable is denser — exact dates appear in the search form.\n\nSetra, Neoplan, and Mercedes coaches with climate control, Wi-Fi, USB, and a toilet. All trips are direct.\n\nDrop-off in Sunny Beach is at the resort's main bus station; hotels are an easy walk or short local-transport ride away.\n\nBase ticket price 2300 UAH; child discounts available. Book peak summer dates in advance — seats sell out.",
      },
      bg: {
        slug: "odesa-slanchev-bryag",
        title: "Автобус Одеса → Слънчев бряг | Билети — Максимов Турс",
        description:
          "Директен автобус Одеса – Слънчев бряг през Варна, ~19 ч, от 54 €. Официален превозвач, билети онлайн. Опит 30+ години.",
        h1: "Автобус Одеса – Слънчев бряг",
        heroSubtitle: "Директен курс Одеса • Констанца • Варна • Слънчев бряг",
        leadText:
          "Директен автобус Одеса – Слънчев бряг: качване при Привоз, слизане направо на курорта. Идеално за лятна почивка.",
        fullText:
          "Слънчев бряг е най-големият плажен курорт в България. Максимов Турс прави директни курсове до там от Одеса всеки сезон от 1991 г.\n\nМаршрутът минава през Болград, Констанца и Варна; пътуването е около 18 часа. През лятото разписанието е по-плътно — конкретните дати са във формата за търсене.\n\nАвтобуси Setra, Neoplan и Mercedes с климатик, Wi-Fi, USB и тоалетна. Всички курсове са директни.\n\nПристигането в Слънчев бряг е на главната автогара на курорта; от там до хотелите се стига пеша или с местен транспорт.\n\nЦената на стандартния билет е 2300 грн; има детски отстъпки. Резервирайте пиковите летни дати рано — местата свършват.",
      },
    },
  },

  "sunny-beach-odessa": {
    fromSlug: "sunny-beach",
    toSlug: "odessa",
    reverseKey: "odessa-sunny-beach",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["burgas-odessa", "varna-odessa"],
    i18n: {
      ru: {
        slug: "solnechniy-bereg-odessa",
        title: "Автобус Солнечный берег → Одесса | Билеты — Максимов Турс",
        description:
          "Прямой автобус Солнечный берег – Одесса через Варну, ~19 ч, от 2800 грн. Официальный перевозчик, билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Солнечный берег – Одесса",
        heroSubtitle: "Прямой рейс Солнечный берег • Варна • Констанца • Одесса",
        leadText:
          "Возвращайтесь домой удобно: прямой автобус Солнечный берег – Одесса с остановкой в Варне.",
        fullText:
          "Прямой рейс с курорта домой — посадка на главной автостанции Солнечного берега, далее через Варну, Констанцу и Болград в Одессу.\n\nВремя в пути — около 18 часов с пограничным контролем. Расписание фиксированное; летом — несколько рейсов в неделю.\n\nКомфорт прежний: автобусы Setra/Neoplan/Mercedes, Wi-Fi, климат-контроль, USB, санузел.\n\nЕсли купили сувениры или передачу — можно отправить с тем же рейсом. Посылочная служба работает между Болгарией и Украиной с 1991 года.\n\nОплата онлайн или при посадке. Бронируйте обратный билет заранее — обратные рейсы в конце сезона расходятся быстрее.",
      },
      ua: {
        slug: "sonyachniy-bereg-odesa",
        title: "Автобус Сонячний берег → Одеса | Квитки — Максимов Турс",
        description:
          "Прямий автобус Сонячний берег – Одеса через Варну, ~19 год, від 2800 грн. Офіційний перевізник, квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Сонячний берег – Одеса",
        heroSubtitle: "Прямий рейс Сонячний берег • Варна • Констанца • Одеса",
        leadText:
          "Повертайтеся додому зручно: прямий автобус Сонячний берег – Одеса з зупинкою у Варні.",
        fullText:
          "Прямий рейс з курорту додому — посадка на головній автостанції Сонячного берега, далі через Варну, Констанцу і Болград до Одеси.\n\nЧас у дорозі — близько 18 годин з прикордонним контролем. Розклад фіксований; влітку — кілька рейсів на тиждень.\n\nКомфорт колишній: автобуси Setra/Neoplan/Mercedes, Wi-Fi, клімат-контроль, USB, туалет.\n\nЯкщо купили сувеніри чи передачу — можна відправити з тим самим рейсом. Посилкова служба працює між Болгарією та Україною з 1991 року.\n\nОплата онлайн або при посадці. Бронюйте зворотний квиток заздалегідь — зворотні рейси в кінці сезону розходяться швидше.",
      },
      en: {
        slug: "sunny-beach-odessa",
        title: "Sunny Beach to Odessa Bus | Tickets — Maximov Tours",
        description:
          "Direct bus Sunny Beach – Odessa via Varna, ~19h, from €54. Licensed carrier, online tickets. 30+ years of experience.",
        h1: "Sunny Beach to Odessa Bus",
        heroSubtitle: "Direct service Sunny Beach • Varna • Constanța • Odessa",
        leadText:
          "Easy ride home: direct Sunny Beach – Odessa coach with a stop in Varna.",
        fullText:
          "Direct route from the resort to home — boarding at Sunny Beach's main bus station, then through Varna, Constanța, and Bolgrad to Odessa.\n\nThe trip takes around 18 hours including border control. The schedule is fixed; summer runs several departures per week.\n\nSame comfort: Setra/Neoplan/Mercedes coaches, Wi-Fi, climate control, USB, toilet.\n\nIf you've picked up souvenirs or care parcels, they can travel on the same coach. The parcel service between Bulgaria and Ukraine has been running since 1991.\n\nPay online or at boarding. Book the return early — end-of-season return seats sell faster.",
      },
      bg: {
        slug: "slanchev-bryag-odesa",
        title: "Автобус Слънчев бряг → Одеса | Билети — Максимов Турс",
        description:
          "Директен автобус Слънчев бряг – Одеса през Варна, ~19 ч, от 54 €. Официален превозвач, билети онлайн. Опит 30+ години.",
        h1: "Автобус Слънчев бряг – Одеса",
        heroSubtitle: "Директен курс Слънчев бряг • Варна • Констанца • Одеса",
        leadText:
          "Връщайте се удобно: директен автобус Слънчев бряг – Одеса със спирка във Варна.",
        fullText:
          "Директен курс от курорта до вкъщи — качване на главната автогара на Слънчев бряг, после през Варна, Констанца и Болград до Одеса.\n\nПътуването е около 18 часа с граничен контрол. Разписанието е фиксирано; през лятото — няколко курса седмично.\n\nСъщият комфорт: автобуси Setra/Neoplan/Mercedes, Wi-Fi, климатик, USB, тоалетна.\n\nАко сте купили сувенири или пратки — могат да пътуват със същия курс. Услугата за пратки между България и Украйна работи от 1991 г.\n\nПлащане онлайн или при качване. Резервирайте обратния билет рано — местата в края на сезона свършват по-бързо.",
      },
    },
  },

  "odessa-constanta": {
    fromSlug: "odessa",
    toSlug: "constanta",
    reverseKey: "constanta-odessa",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["constanta-varna", "constanta-burgas"],
    i18n: {
      ru: {
        slug: "odessa-constanta",
        title: "Автобус Одесса → Констанца | Расписание — Максимов Турс",
        description:
          "Прямой автобус Одесса – Констанца, ~13 ч, от 2000 грн. Официальный перевозчик, билеты онлайн. Регулярные рейсы, опыт 30+ лет.",
        h1: "Автобус Одесса – Констанца: расписание и билеты",
        heroSubtitle: "Прямой рейс Одесса • Болград • Констанца",
        leadText:
          "Прямой автобус Одесса – Констанца: посадка у Привоза, прибытие в Констанцу. Билеты онлайн.",
        fullText:
          "Констанца — крупнейший черноморский порт Румынии и удобная точка для путешествий по румынскому побережью. Максимов Турс возит туда из Одессы прямыми рейсами.\n\nВремя в пути — около 9 часов, включая прохождение границы. Расписание фиксированное; даты доступны в форме поиска.\n\nВ дороге: автобусы Setra/Neoplan/Mercedes, Wi-Fi, климат-контроль, USB, санузел. Все рейсы прямые, без пересадок.\n\nИз Констанцы можно продолжить путь в Болгарию (Варна, Бургас) нашими рейсами или местным транспортом до Мамайи и других курортов.\n\nЦены умеренные, бронирование бесплатное. Оплата онлайн или при посадке.",
      },
      ua: {
        slug: "odesa-constanta",
        title: "Автобус Одеса → Констанца | Розклад — Максимов Турс",
        description:
          "Прямий автобус Одеса – Констанца, ~13 год, від 2000 грн. Офіційний перевізник, квитки онлайн. Регулярні рейси, досвід 30+ років.",
        h1: "Автобус Одеса – Констанца: розклад і квитки",
        heroSubtitle: "Прямий рейс Одеса • Болград • Констанца",
        leadText:
          "Прямий автобус Одеса – Констанца: посадка біля Привозу, прибуття в Констанцу. Квитки онлайн.",
        fullText:
          "Констанца — найбільший чорноморський порт Румунії та зручна точка для подорожей румунським узбережжям. Максимов Турс возить туди з Одеси прямими рейсами.\n\nЧас у дорозі — близько 9 годин, з урахуванням кордону. Розклад фіксований; дати доступні у формі пошуку.\n\nУ дорозі: автобуси Setra/Neoplan/Mercedes, Wi-Fi, клімат-контроль, USB, туалет. Усі рейси прямі, без пересадок.\n\nЗ Констанци можна продовжити шлях у Болгарію (Варна, Бургас) нашими рейсами або місцевим транспортом до Мамайї та інших курортів.\n\nЦіни помірні, бронювання безкоштовне. Оплата онлайн або при посадці.",
      },
      en: {
        slug: "odessa-constanta",
        title: "Odessa to Constanța Bus | Schedule — Maximov Tours",
        description:
          "Direct bus Odessa – Constanța, ~13h, from €38. Licensed carrier, online tickets. Regular service, 30+ years.",
        h1: "Odessa to Constanța Bus: schedule and tickets",
        heroSubtitle: "Direct service Odessa • Bolgrad • Constanța",
        leadText:
          "Direct Odessa – Constanța bus: boarding at Privoz, arrival in Constanța. Online tickets.",
        fullText:
          "Constanța is Romania's largest Black Sea port and a convenient hub for travel along the Romanian coast. Maximov Tours runs direct buses from Odessa.\n\nThe trip takes around 9 hours, including border control. The schedule is fixed; dates appear in the search form.\n\nOnboard: Setra/Neoplan/Mercedes coaches, Wi-Fi, climate control, USB, toilet. All trips are direct, no transfers.\n\nFrom Constanța you can continue to Bulgaria (Varna, Burgas) on our service or use local transport to Mamaia and nearby resorts.\n\nFares are moderate, booking is free. Pay online or at boarding.",
      },
      bg: {
        slug: "odesa-konstantsa",
        title: "Автобус Одеса → Констанца | Разписание — Максимов Турс",
        description:
          "Директен автобус Одеса – Констанца, ~13 ч, от 38 €. Официален превозвач, билети онлайн. Редовни курсове, опит 30+ години.",
        h1: "Автобус Одеса – Констанца: разписание и билети",
        heroSubtitle: "Директен курс Одеса • Болград • Констанца",
        leadText:
          "Директен автобус Одеса – Констанца: качване при Привоз, пристигане в Констанца. Билети онлайн.",
        fullText:
          "Констанца е най-голямото черноморско пристанище на Румъния и удобен пункт за пътуване по румънското крайбрежие. Максимов Турс прави директни курсове от Одеса.\n\nПътуването е около 9 часа, с граничен контрол. Разписанието е фиксирано; датите са във формата за търсене.\n\nВ салона: автобуси Setra/Neoplan/Mercedes, Wi-Fi, климатик, USB, тоалетна. Всички курсове са директни, без прекачвания.\n\nОт Констанца може да продължите към България (Варна, Бургас) с наши курсове или с местен транспорт до Мамая и близките курорти.\n\nЦените са умерени, резервацията е безплатна. Плащане онлайн или при качване.",
      },
    },
  },

  "constanta-odessa": {
    fromSlug: "constanta",
    toSlug: "odessa",
    reverseKey: "odessa-constanta",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["varna-odessa", "burgas-odessa"],
    i18n: {
      ru: {
        slug: "constanta-odessa",
        title: "Автобус Констанца → Одесса | Расписание — Максимов Турс",
        description:
          "Прямой автобус Констанца – Одесса, ~13 ч, от 2000 грн. Официальный перевозчик, билеты онлайн. Регулярные рейсы, опыт 30+ лет.",
        h1: "Автобус Констанца – Одесса: расписание и билеты",
        heroSubtitle: "Прямой рейс Констанца • Болград • Одесса",
        leadText:
          "Прямой автобус Констанца – Одесса с прибытием в Одессе у Привоза.",
        fullText:
          "Обратный рейс Констанца – Одесса работает в одной паре с прямым. Посадка на автостанции в Констанце, прибытие в Одессе на Привозе.\n\nВремя в пути — около 9 часов с пограничным контролем. Рейсы по фиксированному расписанию несколько раз в неделю.\n\nКомфорт: автобусы Setra/Neoplan/Mercedes, Wi-Fi, климат-контроль, USB-розетки, санузел.\n\nЕсли у вас транзит из других точек Румынии или Болгарии — можно скомбинировать с нашими другими рейсами через Варну или Бургас.\n\nОплата онлайн или при посадке, скидки для детей и пенсионеров.",
      },
      ua: {
        slug: "constanta-odesa",
        title: "Автобус Констанца → Одеса | Розклад — Максимов Турс",
        description:
          "Прямий автобус Констанца – Одеса, ~13 год, від 2000 грн. Офіційний перевізник, квитки онлайн. Регулярні рейси, досвід 30+ років.",
        h1: "Автобус Констанца – Одеса: розклад і квитки",
        heroSubtitle: "Прямий рейс Констанца • Болград • Одеса",
        leadText:
          "Прямий автобус Констанца – Одеса з прибуттям в Одесі біля Привозу.",
        fullText:
          "Зворотний рейс Констанца – Одеса працює в одній парі з прямим. Посадка на автостанції в Констанці, прибуття в Одесі на Привозі.\n\nЧас у дорозі — близько 9 годин з прикордонним контролем. Рейси за фіксованим розкладом кілька разів на тиждень.\n\nКомфорт: автобуси Setra/Neoplan/Mercedes, Wi-Fi, клімат-контроль, USB-розетки, туалет.\n\nЯкщо у вас транзит з інших точок Румунії чи Болгарії — можна скомбінувати з нашими іншими рейсами через Варну або Бургас.\n\nОплата онлайн або при посадці, знижки для дітей і пенсіонерів.",
      },
      en: {
        slug: "constanta-odessa",
        title: "Constanța to Odessa Bus | Schedule — Maximov Tours",
        description:
          "Direct bus Constanța – Odessa, ~13h, from €38. Licensed carrier, online tickets. Regular service, 30+ years.",
        h1: "Constanța to Odessa Bus: schedule and tickets",
        heroSubtitle: "Direct service Constanța • Bolgrad • Odessa",
        leadText:
          "Direct Constanța – Odessa coach, arriving in Odessa at Privoz.",
        fullText:
          "The Constanța – Odessa return travels as a pair with the outbound trip. Boarding at the Constanța bus station, arrival in Odessa at Privoz.\n\nThe journey takes around 9 hours including border checks. Departures follow a fixed schedule several times per week.\n\nComfort: Setra/Neoplan/Mercedes coaches, Wi-Fi, climate control, USB sockets, toilet.\n\nIf you're transiting from elsewhere in Romania or Bulgaria, you can combine this with our other services via Varna or Burgas.\n\nPay online or at boarding; discounts for children and pensioners.",
      },
      bg: {
        slug: "konstantsa-odesa",
        title: "Автобус Констанца → Одеса | Разписание — Максимов Турс",
        description:
          "Директен автобус Констанца – Одеса, ~13 ч, от 38 €. Официален превозвач, билети онлайн. Редовни курсове, опит 30+ години.",
        h1: "Автобус Констанца – Одеса: разписание и билети",
        heroSubtitle: "Директен курс Констанца • Болград • Одеса",
        leadText:
          "Директен автобус Констанца – Одеса с пристигане в Одеса при Привоз.",
        fullText:
          "Обратният курс Констанца – Одеса се движи в двойка с директния. Качване на автогарата в Констанца, пристигане в Одеса при Привоз.\n\nПътуването е около 9 часа с граничен контрол. Курсовете са по фиксирано разписание няколко пъти седмично.\n\nКомфорт: автобуси Setra/Neoplan/Mercedes, Wi-Fi, климатик, USB, тоалетна.\n\nАко имате трансфер от друго място в Румъния или България — може да го комбинирате с нашите курсове през Варна или Бургас.\n\nПлащане онлайн или при качване; отстъпки за деца и пенсионери.",
      },
    },
  },

  "constanta-varna": {
    fromSlug: "constanta",
    toSlug: "varna",
    reverseKey: "varna-constanta",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["constanta-burgas", "odessa-varna"],
    i18n: {
      ru: {
        slug: "constanta-varna",
        title: "Автобус Констанца → Варна | Расписание — Максимов Турс",
        description:
          "Прямой автобус Констанца – Варна. Официальный перевозчик, Wi-Fi, кондиционер, USB. Билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Констанца – Варна",
        heroSubtitle: "Прямой рейс Констанца • Варна",
        leadText:
          "Прямой автобус Констанца – Варна, удобный сегмент международного маршрута Максимов Турс.",
        fullText:
          "Сегмент Констанца – Варна — часть основного маршрута Одесса – Болгария. Автобус заходит в Констанцу и продолжает путь в Варну.\n\nВремя в пути — около 5 часов с учётом пограничных формальностей. Расписание фиксированное; рейсы выполняются по тем же дням, что и основной маршрут.\n\nВ дороге: климат-контроль, Wi-Fi, USB, санузел. Кресла комфортные, поездка лёгкая.\n\nЭто удобный вариант для тех, кто прилетел в Констанцу или путешествует по черноморскому побережью между Румынией и Болгарией.\n\nБронируйте онлайн заранее — на коротких сегментах места ограничены.",
      },
      ua: {
        slug: "constanta-varna",
        title: "Автобус Констанца → Варна | Розклад — Максимов Турс",
        description:
          "Прямий автобус Констанца – Варна. Офіційний перевізник, Wi-Fi, кондиціонер, USB. Квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Констанца – Варна",
        heroSubtitle: "Прямий рейс Констанца • Варна",
        leadText:
          "Прямий автобус Констанца – Варна, зручний сегмент міжнародного маршруту Максимов Турс.",
        fullText:
          "Сегмент Констанца – Варна — частина основного маршруту Одеса – Болгарія. Автобус заходить у Констанцу і продовжує шлях до Варни.\n\nЧас у дорозі — близько 5 годин з прикордонними формальностями. Розклад фіксований; рейси виконуються у ті самі дні, що і основний маршрут.\n\nУ дорозі: клімат-контроль, Wi-Fi, USB, туалет. Крісла комфортні, поїздка легка.\n\nЦе зручний варіант для тих, хто прилетів у Констанцу або подорожує чорноморським узбережжям між Румунією та Болгарією.\n\nБронюйте онлайн заздалегідь — на коротких сегментах місця обмежені.",
      },
      en: {
        slug: "constanta-varna",
        title: "Constanța to Varna Bus | Schedule — Maximov Tours",
        description:
          "Direct bus Constanța – Varna. Licensed carrier, Wi-Fi, AC, USB. Online tickets. 30+ years of experience.",
        h1: "Constanța to Varna Bus",
        heroSubtitle: "Direct service Constanța • Varna",
        leadText:
          "Direct Constanța – Varna coach — a convenient segment of the Maximov Tours international service.",
        fullText:
          "The Constanța – Varna leg is part of the main Odessa – Bulgaria route. The coach calls at Constanța and continues to Varna.\n\nThe ride is around 5 hours including border formalities. The schedule is fixed and matches the days of the main route.\n\nOnboard: climate control, Wi-Fi, USB, toilet. Seats are comfortable, the journey is easy.\n\nA handy option if you flew into Constanța or are travelling the Black Sea coast between Romania and Bulgaria.\n\nBook online in advance — seats on short segments are limited.",
      },
      bg: {
        slug: "konstantsa-varna",
        title: "Автобус Констанца → Варна | Разписание — Максимов Турс",
        description:
          "Директен автобус Констанца – Варна. Официален превозвач, Wi-Fi, климатик, USB. Билети онлайн. Опит 30+ години.",
        h1: "Автобус Констанца – Варна",
        heroSubtitle: "Директен курс Констанца • Варна",
        leadText:
          "Директен автобус Констанца – Варна — удобен сегмент от международния курс на Максимов Турс.",
        fullText:
          "Сегментът Констанца – Варна е част от основния маршрут Одеса – България. Автобусът спира в Констанца и продължава към Варна.\n\nПътуването е около 5 часа с граничните формалности. Разписанието е фиксирано и съвпада с дните на основния курс.\n\nВ салона: климатик, Wi-Fi, USB, тоалетна. Седалките са комфортни, пътуването е леко.\n\nУдобен вариант, ако сте кацнали в Констанца или пътувате по Черноморието между Румъния и България.\n\nРезервирайте онлайн рано — местата по къси сегменти са ограничени.",
      },
    },
  },

  "varna-constanta": {
    fromSlug: "varna",
    toSlug: "constanta",
    reverseKey: "constanta-varna",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["varna-odessa", "burgas-constanta"],
    i18n: {
      ru: {
        slug: "varna-constanta",
        title: "Автобус Варна → Констанца | Расписание — Максимов Турс",
        description:
          "Прямой автобус Варна – Констанца. Официальный перевозчик, Wi-Fi, кондиционер, USB. Билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Варна – Констанца",
        heroSubtitle: "Прямой рейс Варна • Констанца",
        leadText:
          "Прямой автобус Варна – Констанца, удобный сегмент маршрута Болгария – Украина.",
        fullText:
          "Маршрут Варна – Констанца — часть основного направления Болгария – Украина. Автобус выезжает из Варны и через границу следует в Констанцу.\n\nВремя в пути — около 5 часов. Рейсы выполняются по фиксированному расписанию, синхронизированному с основным направлением.\n\nКомфорт в дороге: Wi-Fi, кондиционер, USB, санузел. Автобусы Setra/Neoplan/Mercedes с регулируемыми креслами.\n\nЭтот сегмент популярен у путешественников по черноморскому побережью и у тех, кто транзитом возвращается через Румынию.\n\nОплата онлайн или при посадке, бронирование бесплатное.",
      },
      ua: {
        slug: "varna-constanta",
        title: "Автобус Варна → Констанца | Розклад — Максимов Турс",
        description:
          "Прямий автобус Варна – Констанца. Офіційний перевізник, Wi-Fi, кондиціонер, USB. Квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Варна – Констанца",
        heroSubtitle: "Прямий рейс Варна • Констанца",
        leadText:
          "Прямий автобус Варна – Констанца, зручний сегмент маршруту Болгарія – Україна.",
        fullText:
          "Маршрут Варна – Констанца — частина основного напрямку Болгарія – Україна. Автобус виїжджає з Варни та через кордон прямує в Констанцу.\n\nЧас у дорозі — близько 5 годин. Рейси виконуються за фіксованим розкладом, синхронізованим з основним напрямком.\n\nКомфорт у дорозі: Wi-Fi, кондиціонер, USB, туалет. Автобуси Setra/Neoplan/Mercedes з регульованими кріслами.\n\nЦей сегмент популярний у мандрівників чорноморським узбережжям і у тих, хто транзитом повертається через Румунію.\n\nОплата онлайн або при посадці, бронювання безкоштовне.",
      },
      en: {
        slug: "varna-constanta",
        title: "Varna to Constanța Bus | Schedule — Maximov Tours",
        description:
          "Direct bus Varna – Constanța. Licensed carrier, Wi-Fi, AC, USB. Online tickets. 30+ years of experience.",
        h1: "Varna to Constanța Bus",
        heroSubtitle: "Direct service Varna • Constanța",
        leadText:
          "Direct Varna – Constanța coach, a useful segment of the Bulgaria – Ukraine route.",
        fullText:
          "The Varna – Constanța leg is part of the main Bulgaria – Ukraine direction. The coach leaves Varna and crosses the border into Constanța.\n\nThe ride is around 5 hours. Departures follow a fixed schedule aligned with the main route.\n\nOnboard comfort: Wi-Fi, AC, USB, toilet. Setra/Neoplan/Mercedes coaches with reclining seats.\n\nThis segment is popular among Black Sea coast travellers and those transiting back through Romania.\n\nPay online or at boarding; booking is free.",
      },
      bg: {
        slug: "varna-konstantsa",
        title: "Автобус Варна → Констанца | Разписание — Максимов Турс",
        description:
          "Директен автобус Варна – Констанца. Официален превозвач, Wi-Fi, климатик, USB. Билети онлайн. Опит 30+ години.",
        h1: "Автобус Варна – Констанца",
        heroSubtitle: "Директен курс Варна • Констанца",
        leadText:
          "Директен автобус Варна – Констанца, удобен сегмент по маршрута България – Украйна.",
        fullText:
          "Сегментът Варна – Констанца е част от основната посока България – Украйна. Автобусът тръгва от Варна и през границата стига до Констанца.\n\nПътуването е около 5 часа. Курсовете са по фиксирано разписание, синхронизирано с основния маршрут.\n\nКомфорт: Wi-Fi, климатик, USB, тоалетна. Автобуси Setra/Neoplan/Mercedes с регулируеми седалки.\n\nСегментът е популярен сред пътуващите по Черноморието и при транзит обратно през Румъния.\n\nПлащане онлайн или при качване; резервацията е безплатна.",
      },
    },
  },

  "constanta-burgas": {
    fromSlug: "constanta",
    toSlug: "burgas",
    reverseKey: "burgas-constanta",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["constanta-varna", "odessa-burgas"],
    i18n: {
      ru: {
        slug: "constanta-burgas",
        title: "Автобус Констанца → Бургас | Расписание — Максимов Турс",
        description:
          "Прямой автобус Констанца – Бургас через Варну. Официальный перевозчик, Wi-Fi, кондиционер, USB. Билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Констанца – Бургас",
        heroSubtitle: "Прямой рейс Констанца • Варна • Бургас",
        leadText:
          "Прямой автобус Констанца – Бургас, проходит через Варну. Удобно для путешествий по болгарскому побережью.",
        fullText:
          "Маршрут Констанца – Бургас — часть основного международного рейса Одесса – Бургас. Из Констанцы автобус следует через Варну в Бургас.\n\nВремя в пути — около 7 часов с пограничным контролем. Расписание фиксированное, синхронизировано с главным маршрутом.\n\nКомфорт: автобусы Setra/Neoplan/Mercedes, Wi-Fi, климат-контроль, USB-розетки, санузел.\n\nЭто удобный сегмент для тех, кто прилетел в Констанцу и продолжает путь к курортам Бургаса и Солнечного берега, или возвращается из Бургаса через Румынию.\n\nОплата онлайн или при посадке, скидки для детей и пенсионеров.",
      },
      ua: {
        slug: "constanta-burhas",
        title: "Автобус Констанца → Бургас | Розклад — Максимов Турс",
        description:
          "Прямий автобус Констанца – Бургас через Варну. Офіційний перевізник, Wi-Fi, кондиціонер, USB. Квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Констанца – Бургас",
        heroSubtitle: "Прямий рейс Констанца • Варна • Бургас",
        leadText:
          "Прямий автобус Констанца – Бургас, проходить через Варну. Зручно для подорожей болгарським узбережжям.",
        fullText:
          "Маршрут Констанца – Бургас — частина основного міжнародного рейсу Одеса – Бургас. З Констанци автобус прямує через Варну в Бургас.\n\nЧас у дорозі — близько 7 годин з прикордонним контролем. Розклад фіксований, синхронізований з головним маршрутом.\n\nКомфорт: автобуси Setra/Neoplan/Mercedes, Wi-Fi, клімат-контроль, USB-розетки, туалет.\n\nЦе зручний сегмент для тих, хто прилетів у Констанцу і продовжує шлях до курортів Бургаса та Сонячного берега, або повертається з Бургаса через Румунію.\n\nОплата онлайн або при посадці, знижки для дітей і пенсіонерів.",
      },
      en: {
        slug: "constanta-burgas",
        title: "Constanța to Burgas Bus | Schedule — Maximov Tours",
        description:
          "Direct bus Constanța – Burgas via Varna. Licensed carrier, Wi-Fi, AC, USB. Online tickets. 30+ years of experience.",
        h1: "Constanța to Burgas Bus",
        heroSubtitle: "Direct service Constanța • Varna • Burgas",
        leadText:
          "Direct Constanța – Burgas coach via Varna. Handy for travel along the Bulgarian coast.",
        fullText:
          "The Constanța – Burgas leg is part of the main Odessa – Burgas international service. From Constanța the coach runs via Varna to Burgas.\n\nThe ride is around 7 hours including border control. The schedule is fixed and synced with the main route.\n\nComfort: Setra/Neoplan/Mercedes coaches, Wi-Fi, climate control, USB sockets, toilet.\n\nA convenient segment for travellers landing in Constanța and continuing to Burgas or Sunny Beach, or returning from Burgas via Romania.\n\nPay online or at boarding; discounts for children and pensioners.",
      },
      bg: {
        slug: "konstantsa-burgas",
        title: "Автобус Констанца → Бургас | Разписание — Максимов Турс",
        description:
          "Директен автобус Констанца – Бургас през Варна. Официален превозвач, Wi-Fi, климатик, USB. Билети онлайн. Опит 30+ години.",
        h1: "Автобус Констанца – Бургас",
        heroSubtitle: "Директен курс Констанца • Варна • Бургас",
        leadText:
          "Директен автобус Констанца – Бургас през Варна. Удобно за пътуване по българското крайбрежие.",
        fullText:
          "Маршрутът Констанца – Бургас е част от основния международен курс Одеса – Бургас. От Констанца автобусът минава през Варна до Бургас.\n\nПътуването е около 7 часа с граничен контрол. Разписанието е фиксирано и синхронизирано с основния маршрут.\n\nКомфорт: автобуси Setra/Neoplan/Mercedes, Wi-Fi, климатик, USB, тоалетна.\n\nУдобен сегмент за пътници, кацащи в Констанца и продължаващи към Бургас или Слънчев бряг, или връщащи се от Бургас през Румъния.\n\nПлащане онлайн или при качване; отстъпки за деца и пенсионери.",
      },
    },
  },

  "burgas-constanta": {
    fromSlug: "burgas",
    toSlug: "constanta",
    reverseKey: "constanta-burgas",
    fromStopId: undefined,
    toStopId: undefined,
    related: ["varna-constanta", "burgas-odessa"],
    i18n: {
      ru: {
        slug: "burgas-constanta",
        title: "Автобус Бургас → Констанца | Расписание — Максимов Турс",
        description:
          "Прямой автобус Бургас – Констанца через Варну. Официальный перевозчик, Wi-Fi, кондиционер, USB. Билеты онлайн. Опыт 30+ лет.",
        h1: "Автобус Бургас – Констанца",
        heroSubtitle: "Прямой рейс Бургас • Варна • Констанца",
        leadText:
          "Прямой автобус Бургас – Констанца с заездом в Варну. Часть основного маршрута Болгария – Украина.",
        fullText:
          "Сегмент Бургас – Констанца замыкает поездку с болгарского побережья в Румынию. Автобус едет из Бургаса через Варну в Констанцу.\n\nВремя в пути — около 7 часов. Расписание фиксированное.\n\nВ салоне: Wi-Fi, климат-контроль, USB, санузел. Кресла регулируемые, в дороге удобно отдохнуть.\n\nИз Констанцы можно продолжить путь в Одессу нашим рейсом или вылететь домой международными рейсами.\n\nОплата онлайн или при посадке; есть скидки для детей и пенсионеров.",
      },
      ua: {
        slug: "burhas-constanta",
        title: "Автобус Бургас → Констанца | Розклад — Максимов Турс",
        description:
          "Прямий автобус Бургас – Констанца через Варну. Офіційний перевізник, Wi-Fi, кондиціонер, USB. Квитки онлайн. Досвід 30+ років.",
        h1: "Автобус Бургас – Констанца",
        heroSubtitle: "Прямий рейс Бургас • Варна • Констанца",
        leadText:
          "Прямий автобус Бургас – Констанца із заїздом у Варну. Частина основного маршруту Болгарія – Україна.",
        fullText:
          "Сегмент Бургас – Констанца замикає поїздку з болгарського узбережжя в Румунію. Автобус їде з Бургаса через Варну в Констанцу.\n\nЧас у дорозі — близько 7 годин. Розклад фіксований.\n\nУ салоні: Wi-Fi, клімат-контроль, USB, туалет. Крісла регульовані, у дорозі зручно відпочити.\n\nЗ Констанци можна продовжити шлях до Одеси нашим рейсом або вилетіти додому міжнародними рейсами.\n\nОплата онлайн або при посадці; є знижки для дітей і пенсіонерів.",
      },
      en: {
        slug: "burgas-constanta",
        title: "Burgas to Constanța Bus | Schedule — Maximov Tours",
        description:
          "Direct bus Burgas – Constanța via Varna. Licensed carrier, Wi-Fi, AC, USB. Online tickets. 30+ years of experience.",
        h1: "Burgas to Constanța Bus",
        heroSubtitle: "Direct service Burgas • Varna • Constanța",
        leadText:
          "Direct Burgas – Constanța coach via Varna. Part of the main Bulgaria – Ukraine route.",
        fullText:
          "The Burgas – Constanța leg closes a trip from the Bulgarian coast back into Romania. The coach travels from Burgas via Varna to Constanța.\n\nThe ride is around 7 hours. The schedule is fixed.\n\nOnboard: Wi-Fi, climate control, USB, toilet. Reclining seats let you rest comfortably along the way.\n\nFrom Constanța you can continue to Odessa with our service or fly home on international routes.\n\nPay online or at boarding; discounts for children and pensioners.",
      },
      bg: {
        slug: "burgas-konstantsa",
        title: "Автобус Бургас → Констанца | Разписание — Максимов Турс",
        description:
          "Директен автобус Бургас – Констанца през Варна. Официален превозвач, Wi-Fi, климатик, USB. Билети онлайн. Опит 30+ години.",
        h1: "Автобус Бургас – Констанца",
        heroSubtitle: "Директен курс Бургас • Варна • Констанца",
        leadText:
          "Директен автобус Бургас – Констанца със спирка във Варна. Част от основния маршрут България – Украйна.",
        fullText:
          "Сегментът Бургас – Констанца завършва пътуването от българското крайбрежие обратно в Румъния. Автобусът тръгва от Бургас, минава през Варна и стига до Констанца.\n\nПътуването е около 7 часа. Разписанието е фиксирано.\n\nВ салона: Wi-Fi, климатик, USB, тоалетна. Седалките са с регулируема облегалка — удобни за почивка.\n\nОт Констанца може да продължите към Одеса с наш курс или да отлетите по международни линии.\n\nПлащане онлайн или при качване; отстъпки за деца и пенсионери.",
      },
    },
  },

  route: {
    fromSlug: "",
    toSlug: "",
    fromStopId: undefined,
    toStopId: undefined,
    related: [
      "odessa-varna",
      "odessa-burgas",
      "odessa-sunny-beach",
      "odessa-constanta",
    ],
    i18n: {
      ru: {
        slug: "marshrut",
        title: "Маршрут Одесса – Болгария | Все остановки — Максимов Турс",
        description:
          "Официальный перевозчик Одесса – Болгария. Остановки: Привоз, Болград, Констанца, Варна, Солнечный берег, Бургас. Расписание, билеты онлайн.",
        h1: "Маршрут Одесса – Болгария: остановки и стоянки",
        heroSubtitle: "Одесса • Болград • Констанца • Варна • Солнечный берег • Бургас",
        leadText:
          "Прямой международный рейс Максимов Турс — все ключевые остановки между Одессой и Бургасом на одной странице.",
        fullText:
          "Полный маршрут проходит через шесть основных остановок: Одесса (Привоз), Болград, Констанца, Варна, Солнечный берег и Бургас. Между ключевыми городами рейсы прямые — пересадок нет.\n\nВ дороге автобус делает технические остановки на санитарные перерывы и кофе. Общее время в пути от Одессы до Бургаса — около 19 часов с пограничным контролем.\n\nНа каждом отрезке маршрута можно купить отдельный билет: например, Одесса – Варна, Варна – Бургас, Констанца – Одесса. Цены и расписание для каждого направления — на отдельных страницах ниже.\n\nВ автобусе: Wi-Fi, климат-контроль, USB-розетки, санузел, мягкие кресла Setra/Neoplan/Mercedes. Все рейсы прямые, без пересадок.\n\nКроме пассажиров мы перевозим посылки в обе стороны — это удобно для документов и передач между Украиной и Болгарией. Свяжитесь с нами для расчёта.",
      },
      ua: {
        slug: "marshrut",
        title: "Маршрут Одеса – Болгарія | Усі зупинки — Максимов Турс",
        description:
          "Офіційний перевізник Одеса – Болгарія. Зупинки: Привоз, Болград, Констанца, Варна, Сонячний берег, Бургас. Розклад, квитки онлайн.",
        h1: "Маршрут Одеса – Болгарія: зупинки та стоянки",
        heroSubtitle: "Одеса • Болград • Констанца • Варна • Сонячний берег • Бургас",
        leadText:
          "Прямий міжнародний рейс Максимов Турс — усі ключові зупинки між Одесою та Бургасом на одній сторінці.",
        fullText:
          "Повний маршрут проходить через шість основних зупинок: Одеса (Привоз), Болград, Констанца, Варна, Сонячний берег і Бургас. Між ключовими містами рейси прямі — пересадок немає.\n\nУ дорозі автобус робить технічні зупинки на санітарні перерви та каву. Загальний час у дорозі від Одеси до Бургаса — близько 19 годин з прикордонним контролем.\n\nНа кожному відрізку маршруту можна купити окремий квиток: наприклад, Одеса – Варна, Варна – Бургас, Констанца – Одеса. Ціни та розклад для кожного напрямку — на окремих сторінках нижче.\n\nВ автобусі: Wi-Fi, клімат-контроль, USB-розетки, туалет, м'які крісла Setra/Neoplan/Mercedes. Усі рейси прямі, без пересадок.\n\nКрім пасажирів, ми перевозимо посилки в обидва боки — це зручно для документів і передач між Україною та Болгарією. Зв'яжіться з нами для розрахунку.",
      },
      en: {
        slug: "route",
        title: "Route Odessa – Bulgaria | All Stops — Maximov Tours",
        description:
          "Licensed carrier Odessa – Bulgaria. Stops: Privoz, Bolgrad, Constanța, Varna, Sunny Beach, Burgas. Schedule and online tickets.",
        h1: "Route Odessa – Bulgaria: stops and waypoints",
        heroSubtitle: "Odessa • Bolgrad • Constanța • Varna • Sunny Beach • Burgas",
        leadText:
          "The Maximov Tours international service — every key stop between Odessa and Burgas on one page.",
        fullText:
          "The full route runs through six main stops: Odessa (Privoz), Bolgrad, Constanța, Varna, Sunny Beach, and Burgas. Between key cities the service is direct — no transfers.\n\nThe coach makes technical stops for rest breaks and coffee. Total Odessa-to-Burgas travel time is around 19 hours including border control.\n\nYou can buy a ticket for any segment: Odessa – Varna, Varna – Burgas, Constanța – Odessa, and so on. Prices and schedules for each direction live on dedicated pages below.\n\nOnboard: Wi-Fi, climate control, USB sockets, toilet, reclining seats on Setra/Neoplan/Mercedes coaches. All trips are direct.\n\nWe also carry parcels in both directions — convenient for documents and care packages between Ukraine and Bulgaria. Contact us for a quote.",
      },
      bg: {
        slug: "marshrut",
        title: "Маршрут Одеса – България | Всички спирки — Максимов Турс",
        description:
          "Официален превозвач Одеса – България. Спирки: Привоз, Болград, Констанца, Варна, Слънчев бряг, Бургас. Разписание, билети онлайн.",
        h1: "Маршрут Одеса – България: спирки и стоянки",
        heroSubtitle: "Одеса • Болград • Констанца • Варна • Слънчев бряг • Бургас",
        leadText:
          "Директният международен курс на Максимов Турс — всички ключови спирки между Одеса и Бургас на една страница.",
        fullText:
          "Пълният маршрут минава през шест основни спирки: Одеса (Привоз), Болград, Констанца, Варна, Слънчев бряг и Бургас. Между ключовите градове курсовете са директни — без прекачвания.\n\nПо пътя автобусът прави технически спирки за санитарни паузи и кафе. Общото време Одеса – Бургас е около 19 часа с граничния контрол.\n\nЗа всеки сегмент може да си купите отделен билет: Одеса – Варна, Варна – Бургас, Констанца – Одеса и т.н. Цените и разписанието за всяка посока са на отделни страници по-долу.\n\nВ автобуса: Wi-Fi, климатик, USB, тоалетна, меки седалки Setra/Neoplan/Mercedes. Всички курсове са директни.\n\nПревозваме и пратки в двете посоки — удобно за документи и колети между Украйна и България. Свържете се с нас за оферта.",
      },
    },
  },
};

void COMMON;

export const TRIP_KEYS = Object.keys(tripsData);

export function getAllStaticParams(): Array<{ locale: Lang; trip: string }> {
  const params: Array<{ locale: Lang; trip: string }> = [];
  for (const trip of Object.values(tripsData)) {
    for (const locale of Object.keys(trip.i18n) as Lang[]) {
      const data = trip.i18n[locale];
      if (!data) continue;
      params.push({ locale, trip: data.slug });
    }
  }
  return params;
}

export function findTripByLocaleSlug(
  locale: Lang,
  slug: string
): { key: string; trip: Trip } | null {
  for (const [key, trip] of Object.entries(tripsData)) {
    const data = trip.i18n[locale];
    if (data?.slug === slug) {
      return { key, trip };
    }
  }
  return null;
}

export function findTripKeyForStopPair(
  fromId: number | undefined,
  toId: number | undefined
): string | null {
  if (!fromId || !toId) return null;
  for (const [key, trip] of Object.entries(tripsData)) {
    if (trip.fromStopId === fromId && trip.toStopId === toId) return key;
  }
  return null;
}

export function buildHubStopLinks(locale: Lang): Record<string, string> {
  const sourceTrips = ["odessa-varna", "odessa-burgas", "odessa-sunny-beach", "odessa-constanta"];
  const links: Record<string, string> = {};
  for (const key of sourceTrips) {
    const trip = tripsData[key];
    if (!trip) continue;
    const target = trip.i18n[locale];
    if (!target) continue;
    const hrefBase = locale === "ru" ? "" : `/${locale}`;
    const href = `${hrefBase}/${target.slug}`;
    const ru = tripsData[key].i18n.ru;
    const labels = [
      target.h1,
      ru.h1,
      trip.toSlug,
    ];
    const cityNames = cityNamesFromTrip(key, locale);
    for (const name of [...cityNames, ...labels]) {
      if (name) links[name] = href;
    }
  }
  return links;
}

function cityNamesFromTrip(key: string, locale: Lang): string[] {
  const cities: Record<string, Record<Lang, string[]>> = {
    "odessa-varna": {
      ru: ["Варна"],
      ua: ["Варна"],
      en: ["Varna"],
      bg: ["Варна"],
    },
    "odessa-burgas": {
      ru: ["Бургас"],
      ua: ["Бургас"],
      en: ["Burgas"],
      bg: ["Бургас"],
    },
    "odessa-sunny-beach": {
      ru: ["Солнечный берег", "Солнечный Берег"],
      ua: ["Сонячний берег", "Сонячний Берег"],
      en: ["Sunny Beach"],
      bg: ["Слънчев бряг", "Слънчев Бряг"],
    },
    "odessa-constanta": {
      ru: ["Констанца", "Konstanca"],
      ua: ["Констанца"],
      en: ["Constanța", "Constanta"],
      bg: ["Констанца"],
    },
  };
  return cities[key]?.[locale] ?? [];
}
