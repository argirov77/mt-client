export type PublicOfferLang = "ru" | "bg" | "en" | "ua";

const PUBLIC_OFFER_LINKS: Record<PublicOfferLang, string> = {
  ru: "/t&c/Russian.docx",
  en: "/t&c/English.docx",
  bg: "/t&c/Bulgarian.docx",
  ua: "/t&c/Ukrainian.docx",
};

export const getPublicOfferUrl = (lang: PublicOfferLang) =>
  PUBLIC_OFFER_LINKS[lang] ?? PUBLIC_OFFER_LINKS.ru;
