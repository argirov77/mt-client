/**
 * Дизайн-токены редизайна (макеты «Разделы сайта»).
 *
 * Тёмно-синий #173452 — текст, тёмные блоки и подвал; оранжевый #c2410c —
 * кнопки и акценты; #f6f4f1 — тёплый фон секций; серый #5c6370 — только
 * второстепенные подписи. Заголовки — Unbounded, текст — Golos Text.
 */
export const designGuide = {
  typography: {
    fontFamily: "'Golos Text', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
    displayFamily: "'Unbounded', 'Golos Text', system-ui, sans-serif",
    baseSize: "16px",
    headingWeight: 700,
    subheadingWeight: 600,
    bodyWeight: 400,
  },
  colors: {
    navy: "#173452",
    accent: "#c2410c",
    accentSoft: "#fdf0e7",
    sand: "#fdba74",
    section: "#f6f4f1",
    textPrimary: "#173452",
    textSecondary: "#5c6370",
    cardBorder: "#e3dfd9",
  },
  surfaces: {
    cardRadius: "24px",
    cardShadow: "0 1px 2px rgba(23,52,82,0.06), 0 8px 24px rgba(23,52,82,0.06)",
  },
};

/** Светлый тёплый фон секции. */
export const sectionBgMuted = "bg-[#f6f4f1]";
/** Белый фон секции — чередуется с тёплым. */
export const sectionBgPlain = "bg-white";
/** Тёмно-синий блок (посылки, подвал, полосы-акценты). */
export const sectionBgDark = "bg-[#173452] text-white";

/** Вертикальные отступы секции — одни на весь сайт. */
export const sectionPadClass = "py-12 sm:py-16 lg:py-20";
/** Контейнер секции. */
export const sectionInnerClass = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** Надпись над заголовком: оранжевая, капсом, с разрядкой. */
export const sectionEyebrowClass =
  "text-[13px] font-bold uppercase tracking-[0.14em] text-[#c2410c]";
/** Та же надпись на тёмном фоне. */
export const sectionEyebrowOnDarkClass =
  "text-[13px] font-bold uppercase tracking-[0.14em] text-[#fdba74]";
/** H2 секции. */
export const sectionTitleClass =
  "font-display text-[28px] font-bold leading-[1.15] tracking-tight text-[#173452] sm:text-[36px] lg:text-[44px]";
/** H2 на тёмном фоне. */
export const sectionTitleOnDarkClass =
  "font-display text-[28px] font-bold leading-[1.15] tracking-tight text-white sm:text-[36px] lg:text-[44px]";
/** H3 карточки. */
export const cardTitleClass = "font-display text-[20px] font-bold text-[#173452]";
/** Описание под заголовком. */
export const sectionDescriptionClass = "text-base leading-relaxed text-[#5c6370] sm:text-[18px]";

/** Белая карточка на тёплом фоне. */
export const cardBaseClass = "rounded-3xl border border-[#e3dfd9] bg-white";
/** Тёплая карточка на белом фоне. */
export const cardMutedClass = "rounded-3xl bg-[#f6f4f1]";
/** Кружок под иконку или цифру шага. */
export const iconCircleClass =
  "grid h-11 w-11 place-items-center rounded-full bg-[#fdf0e7] text-[#c2410c]";
/** Бейдж-пилюля с акцентом (дни рейсов, номер офиса). */
export const accentPillClass =
  "inline-flex items-center rounded-full bg-[#fdf0e7] px-3 py-1 text-sm font-bold text-[#c2410c]";
/** Нейтральная пилюля-примечание. */
export const notePillClass =
  "inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-sm text-[#5c6370]";

/** Оранжевая кнопка — главное действие. */
export const buttonPrimaryClass =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#c2410c] px-6 text-base font-bold text-white transition hover:bg-[#a8380b]";
/** Кнопка-контур — второстепенное действие. */
export const buttonSecondaryClass =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#e3dfd9] bg-white px-6 text-base font-bold text-[#173452] transition hover:border-[#173452]";
