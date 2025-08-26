// src/components/about/types.ts
export type Lang = "ru" | "bg" | "en" | "ua";

export type AboutBlock = {
  title: string;
  text: string[];
  // можно прикреплять изображения/медиа к блоку (необязательно)
  media?: {
    src: string;
    alt?: string;
    kind?: "image" | "bus" | "office";
  }[];
  id?: string; // Больше НЕ обязательный — чтобы совпадало с content.ts
};
