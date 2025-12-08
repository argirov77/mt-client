import { Clock, Users, ChevronRight } from "lucide-react";

export type PriceRow = {
  label: string; // "Взрослых" / "Льготных"
  count: number; // 1
  price: number; // 45
  discount?: number; // 5 (percent)
};

export type TripCardProps = {
  dateText: string; // "28.08.2025"
  fromStop: string; // "Stop1"
  toStop: string; // "Stop3"
  departTime: string; // "10:10"
  arriveTime: string; // "13:10"
  duration: string; // "3ч 0м"
  freeSeats: number; // 8
  rows: PriceRow[]; // [{label:'Взрослых',count:1,price:45}]
  total: number; // 85.80
  onSelect?: () => void;
  selected?: boolean;
  pickLabel?: string;
  chosenLabel?: string;
  freeSeatsText?: (n: number) => string;
  departureLabel?: string;
  arrivalLabel?: string;
  inRouteLabel?: string;
};

export default function TripCard({
  dateText,
  fromStop,
  toStop,
  departTime,
  arriveTime,
  duration,
  freeSeats,
  rows,
  total,
  onSelect,
  selected = false,
  pickLabel = "Выбрать",
  chosenLabel = "Выбрано",
  freeSeatsText,
  departureLabel = "Отправление",
  arrivalLabel = "Прибытие",
  inRouteLabel = "В пути",
}: TripCardProps) {
  const freeSeatsLabel = freeSeatsText
    ? freeSeatsText(freeSeats)
    : `Свободно мест: ${freeSeats}`;

  return (
    <div
      className={`group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md md:flex-row md:items-center md:justify-between md:p-5 ${
        selected ? "border-orange-200 ring-2 ring-orange-200" : ""
      }`}
      role="button"
      onClick={onSelect}
    >
      <div className="flex flex-col gap-3 md:gap-2">
        <div className="text-sm text-slate-500">Дата: {dateText}</div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {departureLabel}
            </span>
            <span className="text-lg font-semibold text-slate-900">{departTime}</span>
            <span className="text-sm font-medium text-slate-900">{fromStop}</span>
          </div>

          <div className="h-px w-full max-w-[80px] bg-slate-200 sm:h-10 sm:w-px sm:bg-gradient-to-b sm:from-slate-100 sm:via-slate-300 sm:to-slate-100" />

          <div className="flex flex-col gap-1 sm:items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {arrivalLabel}
            </span>
            <span className="text-lg font-semibold text-slate-900">{arriveTime}</span>
            <span className="text-sm font-medium text-slate-900">{toStop}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            <Clock className="h-3.5 w-3.5" />
            {inRouteLabel}: {duration}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 ring-1 ring-sky-200">
            <Users className="h-3.5 w-3.5" />
            {freeSeatsLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          {rows.map((r, i) => {
            const rowTotal = r.count * r.price * (1 - (r.discount ?? 0) / 100);
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1"
              >
                <span className="font-medium text-slate-800">{r.count}</span>
                <span>{r.label}</span>
                <span className="text-slate-500">× {r.price.toFixed(2)} ₴</span>
                {r.discount ? (
                  <span className="text-emerald-600">- {r.discount}%</span>
                ) : null}
                <span className="font-medium text-slate-900">= {rowTotal.toFixed(2)} ₴</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
        <div className="text-right">
          <div className="text-sm text-slate-500">Итого</div>
          <div className="text-2xl font-bold text-slate-900">{total.toFixed(2)} ₴</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
            selected
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {selected ? chosenLabel : pickLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

