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
        "Наш автопарк — современные автобусы европейского класса Van Hool, Travego и Neoplan.",
        "В салонах — удобные кресла, увеличенное расстояние между рядами, кондиционер и климат-контроль, розетки и туалеты.",
        "Мы внимательно следим за техническим состоянием и гигиеной: регулярное техобслуживание и тщательная уборка перед каждым рейсом.",
      ],
      bullets: [
        "Комфортные кресла и больше пространства для ног.",
        "Кондиционер, климат-контроль, розетки, туалеты.",
        "Регулярное техобслуживание, контроль качества и чистый салон.",
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
        "Our fleet is made up of modern European-class coaches: Van Hool, Travego, and Neoplan.",
        "On board you'll find comfortable seats, extra legroom, air conditioning and climate control, power outlets, and restrooms.",
        "We closely monitor technical condition and hygiene with regular maintenance and thorough cleaning before every departure.",
      ],
      bullets: [
        "Comfortable seats with extra legroom.",
        "Air conditioning, climate control, power outlets, restrooms.",
        "Regular maintenance, quality checks, and clean interiors.",
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
        "Нашият автопарк е съставен от модерни автобуси от европейски клас: Van Hool, Travego и Neoplan.",
        "В салоните има удобни седалки, повече място за крака, климатик и климат-контрол, контакти и тоалетни.",
        "Следим стриктно техническото състояние и хигиената: редовна поддръжка и щателно почистване преди всеки курс.",
      ],
      bullets: [
        "Удобни седалки и повече място за крака.",
        "Климатик, климат-контрол, контакти, тоалетни.",
        "Редовна поддръжка, контрол на качеството и чист салон.",
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
        "Наш автопарк — сучасні автобуси європейського класу Van Hool, Travego та Neoplan.",
        "У салонах — зручні крісла, більше місця для ніг, кондиціонер і клімат-контроль, розетки та туалети.",
        "Ми ретельно стежимо за технічним станом і гігієною: регулярне техобслуговування та ретельне прибирання перед кожним рейсом.",
      ],
      bullets: [
        "Зручні крісла та більше простору для ніг.",
        "Кондиціонер, клімат-контроль, розетки, туалети.",
        "Регулярне техобслуговування, контроль якості й чистий салон.",
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
