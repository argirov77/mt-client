"use client";

import { useLanguage } from "@/components/common/LanguageProvider";
import { getPublicOfferUrl } from "@/utils/publicOffer";

// src/components/SiteFooter.tsx
const translations = {
  ru: {
    nav: "Навигация",
    docs: "Документы",
    offer: "Публичная оферта",
    agreement: "Пользовательское соглашение",
    contacts: "Контакты",
    popular: "Направления",
    routes: "Маршруты",
    about: "О нас",
    schedule: "Расписание",
  },
  bg: {
    nav: "Навигация",
    docs: "Документи",
    offer: "Публична оферта",
    agreement: "Потребителско споразумение",
    contacts: "Контакти",
    popular: "Дестинации",
    routes: "Маршрути",
    about: "За нас",
    schedule: "Разписание",
  },
  en: {
    nav: "Navigation",
    docs: "Documents",
    offer: "Public offer",
    agreement: "User agreement",
    contacts: "Contacts",
    popular: "Destinations",
    routes: "Routes",
    about: "About",
    schedule: "Schedule",
  },
  ua: {
    nav: "Навігація",
    docs: "Документи",
    offer: "Публічна оферта",
    agreement: "Користувацька угода",
    contacts: "Контакти",
    popular: "Напрями",
    routes: "Маршрути",
    about: "Про нас",
    schedule: "Розклад",
  },
};

export default function SiteFooter() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const publicOfferUrl = getPublicOfferUrl(lang);
  return (
    <footer className="bg-slate-900 text-slate-100 py-10">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <span className="font-bold text-lg">Максимов Турс</span>
          <p className="mt-2">© 2005-2025 ООО «Максимов Турс»</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t.nav}</h4>
          <ul>
            <li><a href="#popular" className="hover:underline">{t.popular}</a></li>
            <li><a href="#routes" className="hover:underline">{t.routes}</a></li>
            <li><a href="#about" className="hover:underline">{t.about}</a></li>
            <li><a href="#prices" className="hover:underline">{t.schedule}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t.docs}</h4>
          <ul>
            <li>
              <a
                href={publicOfferUrl}
                className="hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {t.offer}
              </a>
            </li>
            <li><a href="#" className="hover:underline">{t.agreement}</a></li>
            <li><a href="#" className="hover:underline">{t.contacts}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
