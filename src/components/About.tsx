// src/components/About.tsx
const translations = {
  ru: {
    about: "О компании",
    txt: "Максимов Турс — перевозки с 2005 года. Собственный автопарк, современный комфорт, поддержка 24/7.",
    contacts: "Контакты и офисы",
    addr: "г. София, бул. Европа, 10",
    tel: "Тел: +359 888 123 456",
    email: "Email: info@maximovtours.bg",
  },
  bg: {
    about: "За компанията",
    txt: "Максимов Турс — превози от 2005 г. Собствен автопарк, модерен комфорт, поддръжка 24/7.",
    contacts: "Контакти и офиси",
    addr: "гр. София, бул. Европа, 10",
    tel: "Тел: +359 888 123 456",
    email: "Email: info@maximovtours.bg",
  },
  en: {
    about: "About the company",
    txt: "Maksimov Tours — passenger transport since 2005. Own fleet, modern comfort, 24/7 support.",
    contacts: "Contacts and offices",
    addr: "Sofia, Europe Blvd, 10",
    tel: "Phone: +359 888 123 456",
    email: "Email: info@maximovtours.bg",
  },
  ua: {
    about: "Про компанію",
    txt: "Максимов Турc — перевезення з 2005 року. Власний автопарк, сучасний комфорт, підтримка 24/7.",
    contacts: "Контакти та офіси",
    addr: "м. Софія, бул. Європа, 10",
    tel: "Тел: +359 888 123 456",
    email: "Email: info@maximovtours.bg",
  },
};

export default function About({ lang = "ru" }: { lang?: "ru" | "bg" | "en" | "ua" }) {
  const t = translations[lang];
  return (
    <section className="bg-white py-14" id="about">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t.about}</h2>
          <p>{t.txt}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">{t.contacts}</h3>
          <p>{t.addr}<br />{t.tel}<br />{t.email}</p>
        </div>
      </div>
    </section>
  );
}
