// src/components/SiteFooter.tsx
const translations = {
  ru: { nav: "Навигация", docs: "Документы", offer: "Публичная оферта", agreement: "Пользовательское соглашение", contacts: "Контакты" },
  bg: { nav: "Навигация", docs: "Документи", offer: "Публична оферта", agreement: "Потребителско споразумение", contacts: "Контакти" },
  en: { nav: "Navigation", docs: "Documents", offer: "Public offer", agreement: "User agreement", contacts: "Contacts" },
  ua: { nav: "Навігація", docs: "Документи", offer: "Публічна оферта", agreement: "Користувацька угода", contacts: "Контакти" },
};

export default function SiteFooter({ lang = "ru" }: { lang?: "ru" | "bg" | "en" | "ua" }) {
  const t = translations[lang];
  return (
    <footer className="bg-primary-dark text-gray-100 py-10">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <span className="font-bold text-lg">Максимов Турс</span>
          <p className="mt-2">© 2005-2025 ООО «Максимов Турс»</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t.nav}</h4>
          <ul>
            <li><a href="#popular" className="hover:underline">{t.nav}</a></li>
            <li><a href="#routes" className="hover:underline">Маршруты</a></li>
            <li><a href="#about" className="hover:underline">О нас</a></li>
            <li><a href="#prices" className="hover:underline">Расписание</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t.docs}</h4>
          <ul>
            <li><a href="#" className="hover:underline">{t.offer}</a></li>
            <li><a href="#" className="hover:underline">{t.agreement}</a></li>
            <li><a href="#" className="hover:underline">{t.contacts}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
