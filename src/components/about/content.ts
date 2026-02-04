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
        "Мы занимаемся пассажирскими автобусными перевозками с 1992 года.",
        "За это время мы заслужили доверие тысяч пассажиров и сформировали репутацию компании, на которую можно положиться.",
        "Мы относимся к каждому клиенту с вниманием и уважением.",
        "Безопасность, надежность, ответственность и профессионализм — принципы, на которых строится наша работа уже более 30 лет!",
      ],
      bullets: [
        "Регулярные кругогодичные рейсы.",
        "Безопасность и комфорт пассажиров.",
        "Онлайн-поддержка.",
        "Офлайн консультации в офисах.",
        "Водители с 10+ стажем вождения.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Наш автопарк — это современные автобусы европейского класса Mercedes, Neoplan, Van Hool.",
        "Мы уделяем особое внимание техническому обслуживанию и гигиене, что обеспечивает высокий уровень комфорта, надежности и чистоты.",
        "Наши автобусы имеют комфортные сидения и достаточное расстояние между рядами, а также оснащены кондиционером и системой климат-контроля, зарядками и туалетами.",
      ],
      bullets: [
        "современные автобусы",
        "удобные сидения",
        "регулярное техобслуживание и контроль качества",
        "чистота в салоне",
        "безопасность и надежность",
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
        "We have provided passenger coach services since 1992.",
        "Over the years, we have earned the trust of thousands of passengers and built a reputation you can rely on.",
        "We treat every customer with care and respect.",
        "Safety, reliability, responsibility, and professionalism have guided our work for more than 30 years.",
      ],
      bullets: [
        "Regular year-round services.",
        "Passenger safety and comfort.",
        "Online support.",
        "In-office consultations.",
        "Drivers with 10+ years of experience.",
      ],
    },
    {
      title: "Fleet",
      text: [
        "Our fleet features modern European-class coaches: Mercedes, Neoplan, Van Hool.",
        "We pay special attention to maintenance and hygiene, ensuring a high level of comfort, reliability, and cleanliness.",
        "Our coaches have comfortable seats with ample spacing between rows and are equipped with air conditioning, climate control, charging points, and restrooms.",
      ],
      bullets: [
        "modern coaches",
        "comfortable seats",
        "regular maintenance and quality control",
        "clean interiors",
        "safety and reliability",
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
        "Извършваме пътнически автобусни превози от 1992 г.",
        "През това време спечелихме доверието на хиляди пътници и изградихме репутация, на която можете да разчитате.",
        "Отнасяме се към всеки клиент с внимание и уважение.",
        "Безопасността, надеждността, отговорността и професионализмът са принципите, които ни водят повече от 30 години.",
      ],
      bullets: [
        "Редовни целогодишни курсове.",
        "Безопасност и комфорт на пътниците.",
        "Онлайн поддръжка.",
        "Консултации на място в офисите.",
        "Шофьори с над 10 години опит.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Нашият автопарк включва модерни автобуси от европейски клас Mercedes, Neoplan, Van Hool.",
        "Обръщаме специално внимание на техническата поддръжка и хигиената, което осигурява висок комфорт, надеждност и чистота.",
        "Автобусите разполагат с удобни седалки и достатъчно пространство между редовете, както и климатик, климат-контрол, зарядни и тоалетни.",
      ],
      bullets: [
        "модерни автобуси",
        "удобни седалки",
        "редовна поддръжка и контрол на качеството",
        "чистота в салона",
        "безопасност и надеждност",
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
        "Ми здійснюємо пасажирські автобусні перевезення з 1992 року.",
        "За цей час ми здобули довіру тисяч пасажирів і сформували репутацію компанії, на яку можна покластися.",
        "Ми ставимося до кожного клієнта з увагою та повагою.",
        "Безпека, надійність, відповідальність і професіоналізм — принципи, на яких будується наша робота вже понад 30 років!",
      ],
      bullets: [
        "Регулярні цілорічні рейси.",
        "Безпека та комфорт пасажирів.",
        "Онлайн-підтримка.",
        "Офлайн консультації в офісах.",
        "Водії зі стажем 10+ років.",
      ],
    },
    {
      title: "Автопарк",
      text: [
        "Наш автопарк — це сучасні автобуси європейського класу Mercedes, Neoplan, Van Hool.",
        "Ми приділяємо особливу увагу технічному обслуговуванню та гігієні, що забезпечує високий рівень комфорту, надійності й чистоти.",
        "Автобуси мають зручні сидіння та достатню відстань між рядами, а також оснащені кондиціонером і системою клімат-контролю, зарядками та туалетами.",
      ],
      bullets: [
        "сучасні автобуси",
        "зручні сидіння",
        "регулярне техобслуговування та контроль якості",
        "чистота в салоні",
        "безпека та надійність",
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
