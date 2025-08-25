"use client";

import React from "react";

type Props = {
  value: string;
  setValue: (v: string) => void;
  activeDates?: string[];
  disabled?: boolean;
  className?: string;
  label?: string;                 // 🔹 подпись внутри пилюли: "Date" / "Return"
  lang?: "ru" | "bg" | "en" | "ua";
  onOpen?: () => void;            // если календарь внешне открывается
};

export default function DateInput({
  value,
  setValue, // eslint-disable-line @typescript-eslint/no-unused-vars
  activeDates = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  disabled,
  className = "",
  label,
  lang = "ru",
  onOpen,
}: Props) {
  // отображаемое значение (если пусто — покажем "— — —")
  const human =
    value
      ? new Date(value + "T00:00:00Z").toLocaleDateString(
          lang === "en" ? "en-GB" : lang,
          { day: "2-digit", month: "2-digit", year: "numeric" }
        )
      : "— — —";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className={[
        // единая «пилюля»: одинаковая высота/радиус/тени
        "h-14 w-[200px] rounded-2xl bg-white/90 hover:bg-white shadow ring-1 ring-black/5",
        "px-4 text-left",
        "flex items-center",
        className,
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {/* левая иконка календаря */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mr-3 h-5 w-5 text-slate-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      {/* текстовая часть: маленький лейбл + крупное значение в одну колонку */}
      <span className="flex min-w-0 flex-col leading-tight">
        {label && (
          <span className="text-[11px] text-slate-500">{label}</span>
        )}
        <span className="truncate text-slate-800">{human}</span>
      </span>
    </button>
  );
}
