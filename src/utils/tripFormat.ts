// Форматирование для пути покупки: даты словами («ср, 28 окт»), цены без «.00»,
// время в пути и день недели прибытия. Свои массивы названий, а не Intl:
// bg-BG в Intl отдаёт «28.10» вместо месяца, а SSR и браузер должны совпадать.

export type TripLang = "ru" | "bg" | "en" | "ua";

const WEEKDAYS: Record<TripLang, string[]> = {
  ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  ua: ["нд", "пн", "вт", "ср", "чт", "пт", "сб"],
  bg: ["нд", "пн", "вт", "ср", "чт", "пт", "сб"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const MONTHS_SHORT: Record<TripLang, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "нояб", "дек"],
  ua: ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"],
  bg: ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const parseIsoDate = (iso: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const weekdayShort = (iso: string, lang: TripLang = "ru"): string => {
  const date = parseIsoDate(iso);
  return date ? WEEKDAYS[lang][date.getUTCDay()] : "";
};

/** «ср, 28 окт» / «Wed, 28 Oct» */
export const formatDayShort = (iso: string, lang: TripLang = "ru"): string => {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return `${WEEKDAYS[lang][date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS_SHORT[lang][date.getUTCMonth()]}`;
};

/** «28 окт» без дня недели */
export const formatDayMonth = (iso: string, lang: TripLang = "ru"): string => {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return `${date.getUTCDate()} ${MONTHS_SHORT[lang][date.getUTCMonth()]}`;
};

/** Цена без «.00»: 2500 → «2500 ₴», 2375.5 → «2375.50 ₴» */
export const formatUah = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${text} ₴`;
};

const toMinutes = (time: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

/** «13:40:00» → «13:40» */
export const shortTime = (time: string): string => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time || "");
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : time;
};

/**
 * Время в пути в минутах и сколько суток добавить к дате прибытия.
 * Бэкенд отдаёт только время, поэтому прибытие раньше отправления
 * считаем следующими сутками (рейсы ночные, короче 24 часов).
 */
export const tripDuration = (
  departureTime: string,
  arrivalTime: string,
): { minutes: number; dayShift: number } | null => {
  const dep = toMinutes(departureTime);
  const arr = toMinutes(arrivalTime);
  if (dep == null || arr == null) return null;
  const dayShift = arr <= dep ? 1 : 0;
  return { minutes: arr + dayShift * 24 * 60 - dep, dayShift };
};

const DURATION_UNITS: Record<TripLang, { h: string; m: string }> = {
  ru: { h: "ч", m: "мин" },
  ua: { h: "год", m: "хв" },
  bg: { h: "ч", m: "мин" },
  en: { h: "h", m: "min" },
};

/** «15 ч 40 мин» */
export const formatDuration = (minutes: number, lang: TripLang = "ru"): string => {
  const units = DURATION_UNITS[lang];
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} ${units.m}`;
  return m ? `${h} ${units.h} ${m} ${units.m}` : `${h} ${units.h}`;
};

export const addDaysIso = (iso: string, days: number): string => {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** День недели прибытия («чт»), если прибытие на следующие сутки. */
export const arrivalWeekday = (
  dateIso: string,
  departureTime: string,
  arrivalTime: string,
  lang: TripLang = "ru",
): string => {
  const duration = tripDuration(departureTime, arrivalTime);
  if (!duration) return "";
  return weekdayShort(addDaysIso(dateIso, duration.dayShift), lang);
};

/** Дни недели рейсов по списку дат: «ср и сб» / «пн, ср и пт» */
export const weekdaysOfDates = (dates: string[], lang: TripLang = "ru"): string => {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const present = new Set(
    dates
      .map((iso) => parseIsoDate(iso)?.getUTCDay())
      .filter((d): d is number => typeof d === "number"),
  );
  const names = order.filter((d) => present.has(d)).map((d) => WEEKDAYS[lang][d]);
  if (names.length <= 1) return names.join("");
  const and = lang === "en" ? "and" : lang === "ua" ? "та" : "и";
  return `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;
};
