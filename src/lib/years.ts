import type { Lang } from "@/lib/locale";

// Год начала работы — константа компании, а не дата запуска сайта.
export const FIRST_YEAR = 1992;

const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
};

/**
 * «34 года», «34 роки», «34 години», «34 years» — число считается от текущей
 * даты, чтобы текст не протухал каждым январём.
 */
export const yearsOnLine = (lang: Lang, now: Date = new Date()): string => {
  const n = now.getFullYear() - FIRST_YEAR;
  switch (lang) {
    case "ua":
      return `${n} ${plural(n, ["рік", "роки", "років"])}`;
    case "bg":
      return `${n} ${n === 1 ? "година" : "години"}`;
    case "en":
      return `${n} ${n === 1 ? "year" : "years"}`;
    default:
      return `${n} ${plural(n, ["год", "года", "лет"])}`;
  }
};
