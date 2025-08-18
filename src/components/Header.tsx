// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";

type Lang = "ru" | "bg" | "en" | "ua";

const menu = [
  { href: "#hero",    label: { ru: "Билеты",       bg: "Билети",       en: "Tickets",   ua: "Квитки"   } },
  { href: "#popular", label: { ru: "Направления",  bg: "Дестинации",   en: "Directions",ua: "Напрями"  } },
  { href: "#routes",  label: { ru: "Маршруты",     bg: "Маршрути",     en: "Routes",    ua: "Маршрути" } },
  { href: "#about",   label: { ru: "О нас",        bg: "За нас",       en: "About",     ua: "Про нас"  } },
  { href: "#prices",  label: { ru: "Расписание",   bg: "Разписание",   en: "Schedule",  ua: "Розклад"  } },
  { href: "#contacts",label: { ru: "Контакты",     bg: "Контакти",     en: "Contacts",  ua: "Контакти" } },
];

interface HeaderProps {
  /** Начальный язык (если не передать — RU) */
  lang?: Lang;
  /** Опционально: сообщить наружу о смене языка */
  onLangChange?: (lang: Lang) => void;
}

export default function Header({ lang = "ru", onLangChange }: HeaderProps) {
  // локальное состояние чтобы избежать гидрации и не требовать серверный обработчик
  const [current, setCurrent] = useState<Lang>(lang);

  useEffect(() => {
    setCurrent(lang); // если проп поменяли сверху — синхронизируем
  }, [lang]);

  const handleChange = (v: Lang) => {
    setCurrent(v);
    onLangChange?.(v);
  };

  return (
    <header className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-30 border-b border-slate-200">
      <nav className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Лого */}
        <a href="/" className="font-bold text-primary text-lg md:text-2xl tracking-tight">
          Максимов Турc
        </a>

        {/* Меню */}
        <ul className="hidden md:flex gap-6 items-center">
          {menu.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-slate-700 hover:text-primary transition-colors font-medium"
              >
                {item.label[current]}
              </a>
            </li>
          ))}
        </ul>

        {/* Селектор языка */}
        <label className="ml-4 inline-flex items-center gap-2">
          <span className="sr-only">Выбор языка</span>
          <select
            aria-label="Язык"
            value={current}
            onChange={(e) => handleChange(e.target.value as Lang)}
            className="h-9 rounded-md border border-slate-300 bg-white/90 px-2 text-sm text-slate-800
                       hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ru">RU</option>
            <option value="bg">BG</option>
            <option value="en">EN</option>
            <option value="ua">UA</option>
          </select>
        </label>
      </nav>
    </header>
  );
}
