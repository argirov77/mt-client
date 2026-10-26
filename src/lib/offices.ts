import type { Lang } from "@/lib/locale";

// Офисы и телефоны — одним списком для шапки, окна «Контакты», кабинета
// и экранов после оплаты. Номера те же, что в content.ts и подвале.

export type OfficeCity = "odessa" | "varna";

export type Office = {
  city: OfficeCity;
  phones: string[];
};

export const OFFICES: Office[] = [
  { city: "odessa", phones: ["+380930004636", "+380674232247"] },
  { city: "varna", phones: ["+359894290356", "+359879554559"] },
];

export const OFFICE_CITY_NAME: Record<Lang, Record<OfficeCity, string>> = {
  ru: { odessa: "Одесса", varna: "Варна" },
  ua: { odessa: "Одеса", varna: "Варна" },
  bg: { odessa: "Одеса", varna: "Варна" },
  en: { odessa: "Odesa", varna: "Varna" },
};

export const OFFICE_ADDRESS: Record<Lang, Record<OfficeCity, string>> = {
  ru: {
    odessa: "Автовокзал «Привоз», офис № 5",
    varna: "Автовокзал Варна, офис № 1",
  },
  ua: {
    odessa: "Автовокзал «Привоз», офіс № 5",
    varna: "Автовокзал Варна, офіс № 1",
  },
  bg: {
    odessa: "Автогара „Привоз“, офис № 5",
    varna: "Автогара Варна, офис № 1",
  },
  en: {
    odessa: "Privoz bus station, office No. 5",
    varna: "Varna bus station, office No. 1",
  },
};

/** «+380930004636» → «+380 93 000 46 36», «+359894290356» → «+359 89 429 0356» */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("380") && digits.length === 12) {
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  if (digits.startsWith("359") && digits.length === 12) {
    return `+359 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
};
