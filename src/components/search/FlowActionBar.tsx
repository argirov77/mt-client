import React from "react";

type Action = {
  label: string;
  onClick: () => void;
  // «Не готово»: кнопка серая, но нажимается — показывает, чего не хватает
  muted?: boolean;
  tone?: "primary" | "pay" | "secondary";
  disabled?: boolean;
};

type Props = {
  hint?: string | null;
  totalLabel?: string;
  totalText?: string;
  primary?: Action;
  secondary?: Action;
  notes?: React.ReactNode;
};

const toneClass = (action: Action) => {
  if (action.muted) return "bg-[#d7d2cb] text-[#173452] hover:bg-[#d7d2cb]";
  if (action.tone === "pay") return "bg-emerald-700 text-white hover:bg-emerald-800";
  if (action.tone === "secondary")
    return "border-[1.5px] border-[#e3dfd9] bg-white text-[#173452] hover:border-[#173452]";
  return "bg-[#c2410c] text-white hover:bg-[#a8380b]";
};

/**
 * Итог и главная кнопка шага. На телефоне закреплены внизу экрана,
 * на компьютере стоят в правой колонке под «Вашей поездкой» (итог — в ней).
 */
export default function FlowActionBar({ hint, totalLabel, totalText, primary, secondary, notes }: Props) {
  const stacked = Boolean(secondary);

  const renderButton = (action: Action, extra = "") => (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      aria-disabled={action.muted || undefined}
      className={`flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${toneClass(action)} ${extra}`}
    >
      {action.label}
    </button>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3dfd9] bg-white px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_14px_rgba(15,23,42,0.07)] lg:static lg:z-auto lg:rounded-2xl lg:border lg:px-4 lg:pb-4 lg:pt-3 lg:shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-1.5">
        {hint ? (
          <p role="status" className="text-center text-xs font-semibold text-amber-800 lg:text-left">
            {hint}
          </p>
        ) : null}
        {stacked ? (
          <>
            {primary ? renderButton(primary, "w-full") : null}
            {secondary ? renderButton(secondary, "w-full") : null}
          </>
        ) : (
          <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
            {totalText ? (
              // на компьютере итог уже стоит в «Вашей поездке» над кнопкой
              <span className="flex flex-col leading-tight lg:hidden">
                <span className="text-[11px] text-[#5c6370]">{totalLabel}</span>
                <b className="text-base text-[#173452]">{totalText}</b>
              </span>
            ) : null}
            {primary ? renderButton(primary, "flex-1") : null}
          </div>
        )}
        {notes ? <div className="text-center text-[11px] text-[#5c6370] lg:text-left">{notes}</div> : null}
      </div>
    </div>
  );
}
