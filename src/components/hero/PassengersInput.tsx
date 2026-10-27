"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { User, Plus, Minus } from "lucide-react";

type PassengerValue = {
  adults: number;
  discount: number;
};

type Props = {
  value: PassengerValue;                          // {adults, discount}
  onChange: (v: PassengerValue) => void;          // вернём оба значения
  className?: string;                             // контейнер
  pillClass?: string;                             // стиль кнопки-триггера (пилюля)
  minAdults?: number;                             // по умолчанию 0
  maxTotal?: number;                              // по умолчанию 9
  lang?: "ru" | "bg" | "en" | "ua";
};

const L = {
  ru: {
    passengers: "Пассажиры",
    adults: "Взрослый",
    discount: "Льготный",
    tip: "Дети до 17.99, пенсионеры, студенты до 25.99",
    done: "Готово",
    summary: (a: number, d: number) =>
      [a ? `${a} ${plural(a, "взрослый", "взрослых", "взрослых")}` : "", d ? `${d} ${plural(d, "льготный", "льготных", "льготных")}` : ""].filter(Boolean).join(", ") || "0",
  },
  en: {
    passengers: "Passengers",
    adults: "Adult",
    discount: "Discounted",
    tip: "Children up to 17.99, seniors, students up to 25.99",
    done: "Done",
    summary: (a: number, d: number) =>
      [a ? `${a} ${a === 1 ? "adult" : "adults"}` : "", d ? `${d} discounted` : ""].filter(Boolean).join(", ") || "0",
  },
  bg: {
    passengers: "Пътници",
    adults: "Възрастен",
    discount: "С намаление",
    tip: "Деца до 17.99, пенсионери, студенти до 25.99",
    done: "Готово",
    summary: (a: number, d: number) =>
      [a ? `${a} ${a === 1 ? "възрастен" : "възрастни"}` : "", d ? `${d} с намаление` : ""].filter(Boolean).join(", ") || "0",
  },
  ua: {
    passengers: "Пасажири",
    adults: "Дорослий",
    discount: "Пільговий",
    tip: "Діти до 17.99, пенсіонери, студенти до 25.99",
    done: "Готово",
    summary: (a: number, d: number) =>
      [a ? `${a} ${plural(a, "дорослий", "дорослих", "дорослих")}` : "", d ? `${d} ${plural(d, "пільговий", "пільгових", "пільгових")}` : ""].filter(Boolean).join(", ") || "0",
  },
};

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export default function PassengersInput({
  value,
  onChange,
  className = "",
  pillClass = "h-12 px-3 rounded-2xl bg-white/90 hover:bg-white text-[#173452] shadow ring-1 ring-black/5",
  minAdults = 0,
  maxTotal = 9,
  lang = "ru",
}: Props) {
  const t = L[lang];
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<PassengerValue>(value);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popoverLeft, setPopoverLeft] = useState(0);
  const [popoverTop, setPopoverTop] = useState(0);

  // синхронизация внешнего/внутреннего
  useEffect(() => setLocal(value), [value]);

  // закрыть по клику вне и по Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        onChange(local);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        onChange(local);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, local, onChange]);

  useEffect(() => {
    if (!open || !btnRef.current || !popRef.current || !wrapperRef.current) {
      return;
    }

    const updatePosition = () => {
      const buttonRect = btnRef.current?.getBoundingClientRect();
      const popRect = popRef.current?.getBoundingClientRect();
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();

      if (!buttonRect || !popRect || !wrapperRect) return;

      const centeredLeft =
        buttonRect.left -
        wrapperRect.left +
        buttonRect.width / 2 -
        popRect.width / 2;

      const minLeft = 8;
      const maxLeft = Math.max(wrapperRect.width - popRect.width - 8, minLeft);
      const clampedLeft = Math.min(Math.max(centeredLeft, minLeft), maxLeft);

      setPopoverLeft(clampedLeft);
      // открываем вверх: снизу кнопка «Поиск», её поповер закрывать не должен
      setPopoverTop(-popRect.height - 8);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const total = useMemo(
    () => local.adults + local.discount,
    [local.adults, local.discount]
  );

  const canMinusAdult = local.adults > minAdults;
  const canMinusDisc = local.discount > 0;
  const canPlusAdult = total < maxTotal;
  const canPlusDisc = total < maxTotal;

  const change = (deltaA: number, deltaD: number) => {
    setLocal((prev) => {
      const nextA = Math.max(minAdults, prev.adults + deltaA);
      let nextD = Math.max(0, prev.discount + deltaD);
      // контроль общей суммы
      const cappedTotal = Math.min(maxTotal, nextA + nextD);
      nextD = Math.max(0, cappedTotal - nextA);
      return { adults: nextA, discount: nextD };
    });
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Триггер */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${pillClass} inline-flex items-center gap-2`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t.passengers}
      >
        <User className="h-5 w-5 shrink-0 text-[#5c6370]" aria-hidden />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[11px] text-[#5c6370]">{t.passengers}</span>
          <span className="truncate font-semibold text-[#173452]">
            {t.summary(value.adults, value.discount)}
          </span>
        </span>
      </button>

      {/* Поповер */}
      {open && (
        <div
          ref={popRef}
          role="dialog"
          className="absolute z-[60] w-[280px] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 p-3"
          style={{ left: popoverLeft, top: popoverTop }}
        >
          <div className="space-y-3">
            {/* Взрослый */}
            <Row
              label={t.adults}
              value={local.adults}
              onMinus={() => change(-1, 0)}
              onPlus={() => change(+1, 0)}
              disableMinus={!canMinusAdult}
              disablePlus={!canPlusAdult}
            />

            {/* Льготный + подсказка */}
            <Row
              label={
                <span className="flex flex-col leading-tight">
                  {t.discount}
                  <span className="text-xs text-[#5c6370]">{t.tip}</span>
                </span>
              }
              value={local.discount}
              onMinus={() => change(0, -1)}
              onPlus={() => change(0, +1)}
              disableMinus={!canMinusDisc}
              disablePlus={!canPlusDisc}
            />
          </div>

          {/* Итого + Готово */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[#5c6370]">
              {t.passengers}:{" "}
              <b className="text-[#173452] tabular-nums">{total}</b>
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(local);
                setOpen(false);
              }}
              className="h-9 px-4 rounded-xl bg-sky-600 text-white text-sm hover:bg-sky-700 shadow"
            >
              {t.done}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- внутренний ряд со счётчиком --- */
function Row({
  label,
  value,
  onMinus,
  onPlus,
  disableMinus,
  disablePlus,
}: {
  label: React.ReactNode;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  disableMinus?: boolean;
  disablePlus?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-[#173452]">{label}</span>
      <div className="flex items-center gap-2">
        <IconButton
          ariaLabel="minus"
          disabled={!!disableMinus}
          onClick={onMinus}
        >
          <Minus className="h-4 w-4" />
        </IconButton>

        <span className="w-7 text-center tabular-nums text-[#173452]">
          {value}
        </span>

        <IconButton
          ariaLabel="plus"
          disabled={!!disablePlus}
          onClick={onPlus}
        >
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

/* — стильная круглая кнопка +/– */
function IconButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 w-8 grid place-items-center rounded-full border transition
        ${
          disabled
            ? "border-[#e3dfd9] text-white/70 cursor-not-allowed"
            : "border-[#e3dfd9] text-[#173452] hover:bg-[#f6f4f1] active:scale-95"
        }`}
    >
      {children}
    </button>
  );
}
