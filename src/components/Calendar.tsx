"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Lang = "ru" | "bg" | "en" | "ua";

type Props = {
  activeDates?: string[];      // ISO: yyyy-mm-dd
  selectedDate?: string;       // ISO
  minDate?: string;            // ISO
  onSelect?: (iso: string) => void;
  lang?: Lang;
  className?: string;
  accentHex?: string;          // кастомный цвет (по умолчанию фирменный синий)
  allowAllFutureDates?: boolean; // разрешить выбор любых дат от minDate (или от сегодня)
};

const MONTHS: Record<Lang, string[]> = {
  ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  bg: ["Януари","Февруари","Март","Април","Май","Юни","Юли","Август","Септември","Октомври","Ноември","Декември"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  ua: ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"],
};
const WEEKDAYS: Record<Lang, string[]> = {
  ru: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
  bg: ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"],
  en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  ua: ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"],
};

const LEGEND: Record<Lang, { trip: string; selected: string }> = {
  ru: { trip: "есть рейс", selected: "выбрано" },
  bg: { trip: "има курс", selected: "избрано" },
  en: { trip: "trip available", selected: "selected" },
  ua: { trip: "є рейс", selected: "обрано" },
};

const toISO = (y:number,m:number,d:number)=> new Date(Date.UTC(y,m,d)).toISOString().slice(0,10);
const todayISO = () => {
  const n = new Date();
  return toISO(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
};

export default function Calendar({
  activeDates = [],
  selectedDate,
  minDate,
  onSelect,
  lang = "ru",
  className = "",
  accentHex = "#0E63F4", // синий
  allowAllFutureDates = false,
}: Props) {
  // Открываем месяц выбранной даты, иначе — первого доступного дня не раньше minDate
  // (календарь «Обратно» сразу на месяце отправления, а не на текущем).
  const anchorISO =
    selectedDate || activeDates.find((iso) => !minDate || iso >= minDate) || minDate;
  const initialISO = anchorISO || todayISO();
  const init = new Date(initialISO + "T00:00:00Z");
  const [year,setYear]   = useState(init.getUTCFullYear());
  const [month,setMonth] = useState(init.getUTCMonth());

  useEffect(()=> {
    const src = anchorISO;
    if (!src) return;
    const d = new Date(src + "T00:00:00Z");
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  },[anchorISO]);

  const minISO = minDate || todayISO();
  const today  = todayISO();
  const activeSet = useMemo(()=> new Set(activeDates), [activeDates]);

  const first = new Date(Date.UTC(year,month,1));
  const shift = (first.getUTCDay()+6)%7;
  const daysInThis = new Date(Date.UTC(year,month+1,0)).getUTCDate();

  const prevY = month===0 ? year-1 : year;
  const prevM = month===0 ? 11 : month-1;
  const daysPrev = new Date(Date.UTC(prevY,prevM+1,0)).getUTCDate();

  type Cell = {
    iso: string;
    day: number;
    inMonth: boolean;
    selectable: boolean;
    selected: boolean;
    isToday: boolean;
    isActive: boolean;
  };
  const cells: Cell[] = [];

  for (let i=shift-1;i>=0;i--){
    const d = daysPrev - i;
    const iso = toISO(prevY,prevM,d);
    cells.push({ iso, day:d, inMonth:false, selectable:false, selected:selectedDate===iso, isToday:iso===today, isActive:false });
  }
  for (let d=1; d<=daysInThis; d++){
    const iso = toISO(year,month,d);
    const isActive = activeSet.has(iso);
    const selectable = (allowAllFutureDates ? iso>=minISO : isActive && iso>=minISO);
    cells.push({ iso, day:d, inMonth:true, selectable, selected:selectedDate===iso, isToday:iso===today, isActive });
  }
  const nextCount = 42 - cells.length;
  const nextY = month===11 ? year+1 : year;
  const nextM = month===11 ? 0 : month+1;
  for (let d=1; d<=nextCount; d++){
    const iso = toISO(nextY,nextM,d);
    cells.push({ iso, day:d, inMonth:false, selectable:false, selected:selectedDate===iso, isToday:iso===today, isActive:false });
  }

  return (
    <div className={`w-full max-w-[360px] rounded-2xl bg-white ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" aria-label="‹" onClick={()=>{ setMonth(m=> m===0?11:m-1); if(month===0) setYear(y=>y-1); }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e3dfd9] hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-700"/>
        </button>
        <div className="text-sm font-semibold text-gray-800">{MONTHS[lang][month]} {year}</div>
        <button type="button" aria-label="›" onClick={()=>{ setMonth(m=> m===11?0:m+1); if(month===11) setYear(y=>y+1); }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e3dfd9] hover:bg-gray-100">
          <ChevronRight className="h-5 w-5 text-gray-700"/>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-1 text-center text-[11px] font-medium text-gray-500">
        {WEEKDAYS[lang].map(w=> <div key={w} className="py-1">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {cells.map(c=>{
          const base = "relative h-10 rounded-xl flex items-center justify-center text-sm";
          const ringToday = c.isToday && !c.selected ? " underline decoration-2 underline-offset-4" : "";
          let cls: string;
          if (c.selected) cls = "font-bold text-white shadow-md";
          else if (c.selectable && c.isActive) cls = "border border-[#fdba74] bg-[#fdf0e7] font-bold text-[#173452] hover:bg-[#fbe2d3] cursor-pointer";
          else if (c.selectable) cls = "bg-white text-[#173452] hover:bg-[#fdf0e7] cursor-pointer";
          else cls = c.inMonth ? "text-[#8c929c] cursor-not-allowed" : "text-white/70 cursor-not-allowed";
          return (
            <button
              key={c.iso}
              type="button"
              disabled={!c.selectable}
              onClick={()=> c.selectable && onSelect?.(c.iso)}
              className={`${base}${ringToday} ${cls}`}
              style={c.selected ? { backgroundColor: accentHex } : undefined}
              aria-label={c.iso}
              aria-pressed={c.selected}
            >
              {c.day}
            </button>
          );
        })}
      </div>

      {!allowAllFutureDates && (
        <div className="flex gap-4 px-4 pb-3 text-xs text-[#5c6370]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-3 rounded border border-[#fdba74] bg-[#fdf0e7]" />
            {LEGEND[lang].trip}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-3 rounded" style={{ backgroundColor: accentHex }} />
            {LEGEND[lang].selected}
          </span>
        </div>
      )}
    </div>
  );
}
