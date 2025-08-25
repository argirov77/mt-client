import { Clock, ChevronRight, Users } from "lucide-react";

export type PriceRow = {
  label: string; // "Взрослых" / "Льготных"
  count: number; // 1
  price: number; // 45
  discount?: number; // 5 (percent)
};

export type TripCardProps = {
  directionLabel?: string; // "Туда" | "Обратно"
  dateText: string; // "Чт, 28 авг 2025"
  fromStop: string; // "Stop1"
  toStop: string; // "Stop4"
  departTime: string; // "10:10"
  arriveTime: string; // "13:45"
  duration: string; // "3 ч 35 мин"
  freeSeats: number; // 8
  rows: PriceRow[]; // [{label:'Взрослых',count:1,price:45}]
  total: number; // 45
  onSelect?: () => void;
};

export default function TripCard({
  directionLabel = "Туда",
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
}: TripCardProps) {
  return (
    <article
      className="rounded-2xl bg-white shadow ring-1 ring-black/5 p-4 md:p-5 hover:shadow-md transition"
      role="button"
      onClick={onSelect}
    >
      {/* header */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-slate-900 font-medium">{dateText}</span>
        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 px-2.5 py-0.5 text-xs">
          {directionLabel}
        </span>
      </div>

      {/* timeline */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1">
          {/* from */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-600 ring-4 ring-sky-100" />
            <div className="min-w-0">
              <div className="text-slate-900 font-medium truncate">{fromStop}</div>
              <div className="text-xs text-slate-500">
                <Clock className="inline mr-1 h-3 w-3" />
                {departTime}
              </div>
            </div>
          </div>

          {/* line */}
          <div className="mx-2 h-px bg-slate-200 md:w-64" />

          {/* to */}
          <div className="flex items-center gap-2 justify-end min-w-0">
            <div className="text-right min-w-0">
              <div className="text-slate-900 font-medium truncate">{toStop}</div>
              <div className="text-xs text-slate-500">
                <Clock className="inline mr-1 h-3 w-3" />
                {arriveTime}
              </div>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
          </div>
        </div>

        {/* duration */}
        <div className="md:ml-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </span>
        </div>
      </div>

      {/* meta row */}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <Users className="h-3.5 w-3.5" />
        Свободных мест: <span className="font-medium text-slate-700">{freeSeats}</span>
      </div>

      <hr className="my-4 border-slate-100" />

      {/* pricing + CTA */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        {/* breakdown */}
        <div className="space-y-1">
          {rows.map((r, i) => (
            <div key={i} className="text-sm text-slate-700">
              {r.count} {r.label} × {r.price.toFixed(2)}
              {r.discount ? (
                <span className="ml-1 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 ring-1 ring-emerald-100">
                  -{r.discount}%
                </span>
              ) : null}{" = "}
              <span className="font-medium">
                {(r.count * r.price * (1 - (r.discount ?? 0) / 100)).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="text-sm text-slate-500">
            Итого: <span className="font-semibold text-slate-900">{total.toFixed(2)}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">К оплате</div>
            <div className="text-2xl font-semibold text-slate-900">{total.toFixed(2)}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff6a00] px-4 py-2 text-white shadow hover:bg-[#ff7a1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6a00]"
          >
            Выбрать <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

