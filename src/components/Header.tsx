// src/components/Header.tsx
import { translations } from "@/i18n";

type Lang = "ru" | "bg" | "en" | "ua";
const menu = [
  { href: "#hero",   label: { ru: "Билеты", bg: "Билети", en: "Tickets", ua: "Квитки" }},
  { href: "#popular", label: { ru: "Направления", bg: "Дестинации", en: "Directions", ua: "Напрями" }},
  { href: "#routes",  label: { ru: "Маршруты", bg: "Маршрути", en: "Routes", ua: "Маршрути" }},
  { href: "#about",   label: { ru: "О нас", bg: "За нас", en: "About", ua: "Про нас" }},
  { href: "#prices",  label: { ru: "Расписание", bg: "Разписание", en: "Schedule", ua: "Розклад" }},
  { href: "#contacts", label: { ru: "Контакты", bg: "Контакти", en: "Contacts", ua: "Контакти" }},
];

interface HeaderProps {
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
}

export default function Header({ lang = "ru", onLangChange }: HeaderProps) {
  return (
    <header className="bg-white shadow sticky top-0 z-30">
      <nav className="container mx-auto flex justify-between items-center py-4 px-2">
        {/* Лого */}
        <a href="/" className="font-bold text-primary text-2xl">Максимов Турc</a>
        {/* Меню */}
        <ul className="flex gap-5 items-center">
          {menu.map((item, idx) => (
            <li key={idx}>
              <a href={item.href} className="text-gray-800 hover:text-accent font-medium transition">
                {item.label[lang]}
              </a>
            </li>
          ))}
        </ul>
        {/* Селектор языка */}
        <select
          value={lang}
          onChange={e => onLangChange?.(e.target.value as Lang)}
          className="border border-primary rounded px-2 py-1 ml-4"
        >
          <option value="ru">RU</option>
          <option value="bg">BG</option>
          <option value="en">EN</option>
          <option value="ua">UA</option>
        </select>
      </nav>
    </header>
  );
}
