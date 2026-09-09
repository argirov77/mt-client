import type { Lang } from "@/lib/locale";

/**
 * Дни отправления для посадочных страниц.
 *
 * Источник дней — хардкод (решение владельца): из данных остановок
 * (/selected_route) дни недели не выводятся, там только времена прибытия и
 * отправления внутри одного рейса.
 *
 * Направление определяется ключом маршрута из tripsData, а не локалью и не
 * порядком слов в локальном слаге: слаги переведены (odessa-solnechniy-bereg →
 * odesa-sonyachniy-bereg → odessa-sunny-beach), ключ — один на все локали.
 */
type DepartureGroup = "A" | "B";

// A — от Одессы по корридору, B — в сторону Одессы.
const TRIP_GROUP: Record<string, DepartureGroup> = {
  "odessa-varna": "A",
  "odessa-burgas": "A",
  "odessa-sunny-beach": "A",
  "odessa-constanta": "A",
  "constanta-varna": "A",
  "constanta-burgas": "A",
  "varna-odessa": "B",
  "burgas-odessa": "B",
  "sunny-beach-odessa": "B",
  "constanta-odessa": "B",
  "varna-constanta": "B",
  "burgas-constanta": "B",
};

const GROUP_TEXT: Record<DepartureGroup, Record<Lang, string>> = {
  A: {
    ru: "Регулярные рейсы — по средам и субботам. В высокий сезон добавляются дополнительные рейсы: актуальные даты видны при выборе направления в форме бронирования.",
    ua: "Регулярні рейси — по середах і суботах. У високий сезон додаються додаткові рейси: актуальні дати видно при виборі напрямку у формі бронювання.",
    en: "Regular departures run on Wednesdays and Saturdays. Extra departures are added in high season — current dates appear when you select the route in the booking form.",
    bg: "Редовните курсове са в сряда и събота. През активния сезон се добавят допълнителни курсове: актуалните дати се виждат при избор на направление във формата за резервация.",
  },
  B: {
    ru: "Регулярные рейсы — по понедельникам и пятницам. В высокий сезон добавляются дополнительные рейсы: актуальные даты видны при выборе направления в форме бронирования.",
    ua: "Регулярні рейси — по понеділках і п’ятницях. У високий сезон додаються додаткові рейси: актуальні дати видно при виборі напрямку у формі бронювання.",
    en: "Regular departures run on Mondays and Fridays. Extra departures are added in high season — current dates appear when you select the route in the booking form.",
    bg: "Редовните курсове са в понеделник и петък. През активния сезон се добавят допълнителни курсове: актуалните дати се виждат при избор на направление във формата за резервация.",
  },
};

// Хаб /marshrut описывает корридор целиком, поэтому называет обе группы.
const HUB_TEXT: Record<Lang, string> = {
  ru: "Рейсы в сторону Болгарии — по средам и субботам, в сторону Одессы — по понедельникам и пятницам. В высокий сезон добавляются дополнительные рейсы.",
  ua: "Рейси у бік Болгарії — по середах і суботах, у бік Одеси — по понеділках і п’ятницях. У високий сезон додаються додаткові рейси.",
  en: "Departures towards Bulgaria run on Wednesdays and Saturdays, towards Odessa on Mondays and Fridays. Extra departures are added in high season.",
  bg: "Курсовете към България са в сряда и събота, към Одеса — в понеделник и петък. През активния сезон се добавят допълнителни курсове.",
};

export const HUB_TRIP_KEY = "route";

/** Текст с днями отправления для страницы маршрута или хаба. */
export function departureDaysText(tripKey: string, locale: Lang): string | null {
  if (tripKey === HUB_TRIP_KEY) return HUB_TEXT[locale] ?? null;
  const group = TRIP_GROUP[tripKey];
  if (!group) return null;
  return GROUP_TEXT[group][locale] ?? null;
}
