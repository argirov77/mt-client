"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "../Calendar"; // ваш компонент

type Props = {
  value: string;
  setValue: (v: string) => void;
  activeDates?: string[];
  minDate?: string;
  disabled?: boolean;
  className?: string; // «пилюля» по умолчанию
  lang?: "ru" | "bg" | "en" | "ua";
};

function toHuman(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

export default function DateInput({
  value,
  setValue,
  activeDates = [],
  minDate,
  disabled,
  className = "h-12 px-4 rounded-2xl bg-white/90 hover:bg-white text-slate-800 shadow ring-1 ring-black/5 flex items-center gap-2",
  lang = "ru",
}: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 6,
      left: r.left + window.scrollX,
      width: r.width,
    });
  }, [open]);

  // пересчитать при скролле/resize
  useEffect(() => {
    if (!open) return;
    const on = () => {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 6,
        left: r.left + window.scrollX,
        width: r.width,
      });
    };
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
  }, [open]);

  // закрытие по Esc/клику вне
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!popRef.current || !anchorRef.current) return;
      if (
        !popRef.current.contains(e.target as Node) &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const hasDate = Boolean(value);

  return (
    <div ref={anchorRef} className="relative">
      {/* Пилюля (без плейсхолдера) */}
      <button
        type="button"
        aria-label="Выбрать дату"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        className={className}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon className="h-5 w-5 opacity-80" />
        <span className={hasDate ? "text-slate-900" : "text-transparent select-none"}>
          {hasDate ? toHuman(value) : ".... .... ...."}
        </span>
      </button>

      {/* Popover */}
      {open && !disabled &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[9999] shadow-xl rounded-2xl bg-white ring-1 ring-black/10"
            style={{ top: pos.top, left: pos.left, minWidth: Math.max(320, pos.width) }}
          >
            <div className="px-3 pt-2 pb-1 text-xs text-slate-500">
              Доступные даты отмечены точкой
            </div>
            <Calendar
              activeDates={activeDates}
              selectedDate={value}
              minDate={minDate}
              onSelect={(iso) => {
                setValue(iso);
                setOpen(false);
              }}
              lang={lang}
              className="border-0 shadow-none"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
