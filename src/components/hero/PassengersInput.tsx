"use client";

import React from "react";
import { Minus, Plus, User2 } from "lucide-react";

type Props = {
  value: number;
  setValue: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;      // оболочка (флекс)
  pillClass?: string;      // «пилюля» с иконкой и числом
  btnClass?: string;       // кнопки +/-
};

export default function PassengersInput({
  value,
  setValue,
  min = 1,
  max = 8,
  className = "flex items-center gap-2",
  pillClass = "h-12 px-3 rounded-2xl bg-white/90 hover:bg-white text-slate-800 shadow ring-1 ring-black/5 flex items-center gap-2",
  btnClass = "h-12 w-10 grid place-items-center rounded-xl bg-white/90 hover:bg-white text-sky-700 shadow ring-1 ring-black/5",
}: Props) {

  const dec = () => setValue(Math.max(min, value - 1));
  const inc = () => setValue(Math.min(max, value + 1));

  return (
    <div className={className} aria-label="Количество пассажиров">
      <button
        type="button"
        aria-label="Меньше пассажиров"
        className={btnClass}
        onClick={dec}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>

      <div
        className={pillClass}
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") dec();
          if (e.key === "ArrowUp") inc();
          if (e.key === "Home") setValue(min);
          if (e.key === "End") setValue(max);
        }}
      >
        <User2 className="h-5 w-5 opacity-80" />
        <span className="tabular-nums">{value}</span>
      </div>

      <button
        type="button"
        aria-label="Больше пассажиров"
        className={btnClass}
        onClick={inc}
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
