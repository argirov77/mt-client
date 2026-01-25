// src/components/about/content.ts

export type Lang = "ru" | "bg" | "en" | "ua";

type Section = {
  title: string;
  text: string[];
  media?: {
    src: string;
    alt: string;
    caption?: string;
  }[];
};

export const aboutContent: Record<Lang, Section[]> = {
  ru: [
    {
      title: "О нас",
      text: [
        "Компания «Максимов Турс» работает с 1991 года. Мы являемся лицензированным регулярным перевозчиком, что гарантирует соблюдение строгих стандартов безопасности и качества.",
        "Наш приоритет — надежность рейсов, комфорт и уверенность каждого пассажира.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Наш автопарк состоит из современных автобусов европейского класса.",
        "Выполняем рейсы на автобусах Van Hool, Travego и Neoplan, чтобы обеспечить комфорт и надежность поездок.",
        "Мы уделяем особое внимание техническому обслуживанию и гигиене: салоны проходят регулярную глубокую очистку, что обеспечивает чистоту и комфорт во время поездки.",
      ],
      media: [
        {
          src: "/images/vanhool.webp",
          alt: "Автобус Van Hool",
          caption: "Van Hool",
        },
        {
          src: "/images/travel.webp",
          alt: "Автобус Travego",
          caption: "Travego",
        },
        {
          src: "/images/neoplan.webp",
          alt: "Автобус Neoplan",
          caption: "Neoplan",
        },
      ],
    },
    {
      title: "Офисы и контакты",
      text: [
        "«Максимов Турс» — это не только онлайн-сервис, но и сеть реальных офисов, где пассажиры могут получить консультацию и поддержку.",
        "Прямое общение с клиентами помогает нам поддерживать высокий уровень сервиса.",
        "Варна, Болгария — Автовокзал Варна, внутри здания, офис № 1 (бул. Владислав Варненчик, 158Б).",
        "Одесса, Украина — Автовокзал Привоз, 2 этаж, офис № 5 (ул. Новощепной ряд, 5).",
      ],
      media: [
        {
          src: "/images/varna.webp",
          alt: "Офис в Варне",
          caption: "Варна — Автовокзал Варна, офис № 1",
        },
        {
          src: "/images/privoz.webp",
          alt: "Офис в Одессе",
          caption: "Одесса — Автовокзал Привоз, офис № 5",
        },
      ],
    },
  ],

  en: [
    {
      title: "About Us",
      text: [
        "Maksimov Tours has been operating since 1991 as a licensed regular bus carrier, ensuring strict compliance with safety and quality standards.",
        "Our commitment is reliability, passenger comfort, and trust in every trip.",
      ],
    },
    {
      title: "Fleet",
      text: [
        "Our fleet features modern European-class buses.",
        "We operate Van Hool, Travego, and Neoplan coaches to ensure comfort and reliability on every trip.",
        "We place strong emphasis on both technical maintenance and interior hygiene: vehicles undergo regular deep cleaning to guarantee cleanliness and comfort throughout the journey.",
      ],
      media: [
        {
          src: "/images/vanhool.webp",
          alt: "Van Hool coach",
          caption: "Van Hool",
        },
        {
          src: "/images/travel.webp",
          alt: "Travego coach",
          caption: "Travego",
        },
        {
          src: "/images/neoplan.webp",
          alt: "Neoplan coach",
          caption: "Neoplan",
        },
      ],
    },
    {
      title: "Offices & Contacts",
      text: [
        "Beyond our online service, Maksimov Tours maintains physical offices where passengers can receive consultation and support.",
        "Personal interaction with clients allows us to provide a consistently high standard of service.",
        "Varna, Bulgaria — Varna Bus Station, inside the building, Office № 1 (158B Vladislav Varnenchik Blvd.).",
        "Odesa, Ukraine — Pryvoz Bus Station, 2nd floor, Office № 5 (5 Novoshchepnyi Ryad St.).",
      ],
      media: [
        {
          src: "/images/varna.webp",
          alt: "Varna office",
          caption: "Varna — Varna Bus Station, Office № 1",
        },
        {
          src: "/images/privoz.webp",
          alt: "Odesa office",
          caption: "Odesa — Pryvoz Bus Station, Office № 5",
        },
      ],
    },
  ],

  bg: [
    {
      title: "За нас",
      text: [
        "„Максимов Турс“ работи от 1991 г. като лицензиран редовен превозвач, спазвайки стриктни стандарти за безопасност и качество.",
        "Наш приоритет е надеждността на курсовете, комфортът и доверието на всеки пътник.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Нашият автопарк включва модерни автобуси от европейски клас.",
        "Обслужваме курсове с автобуси Van Hool, Travego и Neoplan, за да гарантираме комфорт и надеждност.",
        "Обръщаме специално внимание на техническата поддръжка и чистотата: салоните се подлагат на редовна дълбока хигиенизация, което осигурява приятно пътуване.",
      ],
      media: [
        {
          src: "/images/vanhool.webp",
          alt: "Автобус Van Hool",
          caption: "Van Hool",
        },
        {
          src: "/images/travel.webp",
          alt: "Автобус Travego",
          caption: "Travego",
        },
        {
          src: "/images/neoplan.webp",
          alt: "Автобус Neoplan",
          caption: "Neoplan",
        },
      ],
    },
    {
      title: "Офиси и контакти",
      text: [
        "„Максимов Турс“ не е само онлайн услуга, а и мрежа от реални офиси, където пътниците могат да получат консултация и съдействие.",
        "Прякото обслужване гарантира високо качество на услугата.",
        "Варна, България — Автогара Варна, вътре в сградата, офис № 1 (бул. Владислав Варненчик, 158Б).",
        "Одеса, Украйна — Автогара Привоз, 2 етаж, офис № 5 (ул. Новощепной ряд, 5).",
      ],
      media: [
        {
          src: "/images/varna.webp",
          alt: "Офис във Варна",
          caption: "Варна — Автогара Варна, офис № 1",
        },
        {
          src: "/images/privoz.webp",
          alt: "Офис в Одеса",
          caption: "Одеса — Автогара Привоз, офис № 5",
        },
      ],
    },
  ],

  ua: [
    {
      title: "Про нас",
      text: [
        "«Максимов Турс» працює з 1991 року як ліцензований регулярний перевізник, дотримуючись високих стандартів безпеки та якості.",
        "Наш пріоритет — надійність рейсів, комфорт та довіра кожного пасажира.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Наш автопарк складається з сучасних автобусів європейського класу.",
        "Ми виконуємо рейси автобусами Van Hool, Travego та Neoplan, забезпечуючи комфорт і надійність.",
        "Ми приділяємо особливу увагу технічному стану та чистоті салонів: регулярна глибока очистка забезпечує комфорт під час поїздки.",
      ],
      media: [
        {
          src: "/images/vanhool.webp",
          alt: "Автобус Van Hool",
          caption: "Van Hool",
        },
        {
          src: "/images/travel.webp",
          alt: "Автобус Travego",
          caption: "Travego",
        },
        {
          src: "/images/neoplan.webp",
          alt: "Автобус Neoplan",
          caption: "Neoplan",
        },
      ],
    },
    {
      title: "Офіси та контакти",
      text: [
        "«Максимов Турс» — це не лише онлайн-сервіс, а й мережа реальних офісів, де пасажири можуть отримати консультацію та допомогу.",
        "Особисте спілкування з клієнтами гарантує високий рівень обслуговування.",
        "Варна, Болгарія — Автовокзал Варна, всередині будівлі, офіс № 1 (бул. Владислав Варненчик, 158Б).",
        "Одеса, Україна — Автовокзал Привоз, 2 поверх, офіс № 5 (вул. Новощепний ряд, 5).",
      ],
      media: [
        {
          src: "/images/varna.webp",
          alt: "Офіс у Варні",
          caption: "Варна — Автовокзал Варна, офіс № 1",
        },
        {
          src: "/images/privoz.webp",
          alt: "Офіс в Одесі",
          caption: "Одеса — Автовокзал Привоз, офіс № 5",
        },
      ],
    },
  ],
};
