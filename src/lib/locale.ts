export type Lang = "ru" | "bg" | "en" | "ua";

export const LOCALES = ["ru", "ua", "en", "bg"] as const;
export const DEFAULT_LOCALE: Lang = "ru";
export const PREFIXED_LOCALES: ReadonlyArray<Lang> = ["ua", "en", "bg"];

export function isLocale(value: unknown): value is Lang {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeToPathPrefix(locale: Lang): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

const HREFLANG_MAP: Record<Lang, string> = {
  ru: "ru",
  ua: "uk",
  en: "en",
  bg: "bg",
};

export function toHreflang(locale: Lang): string {
  return HREFLANG_MAP[locale];
}

export function toHtmlLang(locale: Lang): string {
  return HREFLANG_MAP[locale];
}
