// src/components/about/content.ts

export type Lang = "ru" | "bg" | "en" | "ua";

type Section = {
  title: string;
  text: string[];
  bullets: string[];
  media?: {
    src: string;
    alt: string;
    caption?: string;
  }[];
  offices?: {
    city: string;
    tag: string;
    address: string;
    image: {
      src: string;
      alt: string;
      caption?: string;
    };
    phones: string[];
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
      bullets: [
        "Работаем с 1991 года и соблюдаем международные стандарты перевозок.",
        "Фокус на безопасности, пунктуальности и комфорте пассажиров.",
        "Понятный сервис: онлайн-бронирование и поддержка в офисах.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Наш автопарк состоит из современных автобусов европейского класса.",
        "Выполняем рейсы на автобусах Van Hool, Travego и Neoplan, чтобы обеспечить комфорт и надежность поездок.",
        "Мы уделяем особое внимание техническому обслуживанию и гигиене: салоны проходят регулярную глубокую очистку, что обеспечивает чистоту и комфорт во время поездки.",
      ],
      bullets: [
        "Модели: Van Hool, Travego, Neoplan.",
        "Регулярное техобслуживание и контроль качества.",
        "Чистота салона перед каждым рейсом.",
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
      ],
      bullets: [
        "Консультации и помощь в офисах на маршруте.",
        "Покупка билетов и поддержка пассажиров на месте.",
        "Офисы расположены в ключевых транспортных узлах.",
      ],
      offices: [
        {
          city: "Варна",
          tag: "Офис № 1",
          address: "Автовокзал Варна, внутри здания, бул. Владислав Варненчик, 158Б",
          image: {
            src: "/images/varna.webp",
            alt: "Офис в Варне",
            caption: "Варна — Автовокзал Варна, офис № 1",
          },
          phones: ["+359894290356", "+359879554559"],
        },
        {
          city: "Одесса",
          tag: "Офис № 5",
          address: "Автовокзал Привоз, 2 этаж, ул. Новощепной ряд, 5",
          image: {
            src: "/images/privoz.webp",
            alt: "Офис в Одессе",
            caption: "Одесса — Автовокзал Привоз, офис № 5",
          },
          phones: ["+380930004636", "+380674232247"],
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
      bullets: [
        "Operating since 1991 with licensed international routes.",
        "Focus on safety, punctuality, and passenger comfort.",
        "Clear service: online booking plus office support.",
      ],
    },
    {
      title: "Fleet",
      text: [
        "Our fleet features modern European-class buses.",
        "We operate Van Hool, Travego, and Neoplan coaches to ensure comfort and reliability on every trip.",
        "We place strong emphasis on both technical maintenance and interior hygiene: vehicles undergo regular deep cleaning to guarantee cleanliness and comfort throughout the journey.",
      ],
      bullets: [
        "Models: Van Hool, Travego, Neoplan.",
        "Regular maintenance and quality control.",
        "Clean interiors before every departure.",
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
      ],
      bullets: [
        "In-person consultations at key route hubs.",
        "Ticket purchase and passenger support on site.",
        "Offices located at major bus stations.",
      ],
      offices: [
        {
          city: "Varna",
          tag: "Office № 1",
          address: "Varna Bus Station, inside the building, 158B Vladislav Varnenchik Blvd.",
          image: {
            src: "/images/varna.webp",
            alt: "Varna office",
            caption: "Varna — Varna Bus Station, Office № 1",
          },
          phones: ["+359894290356", "+359879554559"],
        },
        {
          city: "Odesa",
          tag: "Office № 5",
          address: "Pryvoz Bus Station, 2nd floor, 5 Novoshchepnyi Ryad St.",
          image: {
            src: "/images/privoz.webp",
            alt: "Odesa office",
            caption: "Odesa — Pryvoz Bus Station, Office № 5",
          },
          phones: ["+380930004636", "+380674232247"],
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
      bullets: [
        "Работим от 1991 г. с лицензирани международни линии.",
        "Фокус върху безопасност, точност и комфорт.",
        "Ясна услуга: онлайн резервации и офис подкрепа.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Нашият автопарк включва модерни автобуси от европейски клас.",
        "Обслужваме курсове с автобуси Van Hool, Travego и Neoplan, за да гарантираме комфорт и надеждност.",
        "Обръщаме специално внимание на техническата поддръжка и чистотата: салоните се подлагат на редовна дълбока хигиенизация, което осигурява приятно пътуване.",
      ],
      bullets: [
        "Модели: Van Hool, Travego, Neoplan.",
        "Редовна техническа поддръжка и контрол на качеството.",
        "Чистота на салона преди всеки курс.",
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
      ],
      bullets: [
        "Консултации на място в ключови точки по маршрута.",
        "Подкрепа при покупка на билети и обслужване.",
        "Офиси на главните автогари.",
      ],
      offices: [
        {
          city: "Варна",
          tag: "Офис № 1",
          address: "Автогара Варна, вътре в сградата, бул. Владислав Варненчик, 158Б",
          image: {
            src: "/images/varna.webp",
            alt: "Офис във Варна",
            caption: "Варна — Автогара Варна, офис № 1",
          },
          phones: ["+359894290356", "+359879554559"],
        },
        {
          city: "Одеса",
          tag: "Офис № 5",
          address: "Автогара Привоз, 2 етаж, ул. Новощепной ряд, 5",
          image: {
            src: "/images/privoz.webp",
            alt: "Офис в Одеса",
            caption: "Одеса — Автогара Привоз, офис № 5",
          },
          phones: ["+380930004636", "+380674232247"],
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
      bullets: [
        "Працюємо з 1991 року з ліцензованими міжнародними рейсами.",
        "Фокус на безпеці, пунктуальності та комфорті.",
        "Зрозумілий сервіс: онлайн-бронювання та підтримка в офісах.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Наш автопарк складається з сучасних автобусів європейського класу.",
        "Ми виконуємо рейси автобусами Van Hool, Travego та Neoplan, забезпечуючи комфорт і надійність.",
        "Ми приділяємо особливу увагу технічному стану та чистоті салонів: регулярна глибока очистка забезпечує комфорт під час поїздки.",
      ],
      bullets: [
        "Моделі: Van Hool, Travego, Neoplan.",
        "Регулярне техобслуговування та контроль якості.",
        "Чистота салону перед кожним рейсом.",
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
      ],
      bullets: [
        "Консультації на місці в ключових точках маршруту.",
        "Допомога з квитками та підтримка пасажирів.",
        "Офіси на головних автовокзалах.",
      ],
      offices: [
        {
          city: "Варна",
          tag: "Офіс № 1",
          address: "Автовокзал Варна, всередині будівлі, бул. Владислав Варненчик, 158Б",
          image: {
            src: "/images/varna.webp",
            alt: "Офіс у Варні",
            caption: "Варна — Автовокзал Варна, офіс № 1",
          },
          phones: ["+359894290356", "+359879554559"],
        },
        {
          city: "Одеса",
          tag: "Офіс № 5",
          address: "Автовокзал Привоз, 2 поверх, вул. Новощепний ряд, 5",
          image: {
            src: "/images/privoz.webp",
            alt: "Офіс в Одесі",
            caption: "Одеса — Автовокзал Привоз, офіс № 5",
          },
          phones: ["+380930004636", "+380674232247"],
        },
      ],
    },
  ],
};
