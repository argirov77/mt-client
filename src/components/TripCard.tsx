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
  return (
    <div
      className={`rounded-2xl bg-white shadow ring-1 ring-black/5 p-5 flex flex-col gap-4 hover:shadow-md transition ${
        selected ? "ring-sky-300" : ""
      }`}
      role="button"
      onClick={onSelect}
    >
      {/* date */}
      <div className="text-lg font-bold text-slate-900">{dateText}</div>
      {/* top row: departure/arrival */}
      <div className="flex justify-between items-start">
        {/* departure */}
        <div>
          <div className="text-xs text-slate-500">{departureLabel}</div>
          <div className="text-lg font-bold text-slate-900">{departTime}</div>
          <div className="text-sm text-slate-500">{fromStop}</div>
        </div>
        {/* arrival */}
        <div className="text-right">
          <div className="text-xs text-slate-500">{arrivalLabel}</div>
          <div className="text-lg font-bold text-slate-900">{arriveTime}</div>
          <div className="text-sm text-slate-500">{toStop}</div>
        </div>
      </div>

      {/* duration */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock className="h-4 w-4" />
        {inRouteLabel}: {duration}
      </div>

      {/* route line */}
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{fromStop}</span>
        <div className="flex-1 mx-2 h-0.5 bg-slate-300"></div>
        <span>{toStop}</span>
      </div>

      {/* passengers */}
      <div className="text-sm text-slate-600 space-y-1">
        {rows.map((r, i) => (
          <div key={i}>
            {r.count} {r.label} × {r.price.toFixed(2)} ₴
            {r.discount ? (
              <span className="ml-1 text-emerald-600">(-{r.discount}%)</span>
            ) : null}
            {" = "}
            <span className="font-medium">
              {(r.count * r.price * (1 - (r.discount ?? 0) / 100)).toFixed(2)} ₴
            </span>
          </div>
        ))}
      </div>

      {/* bottom: free seats and select */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">
          <Users className="h-3.5 w-3.5" />
          {freeSeatsText ? freeSeatsText(freeSeats) : `Свободно мест: ${freeSeats}`}
        </span>
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-slate-900">
            {total.toFixed(2)} ₴
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow text-white ${
              selected
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#ff6a00] hover:bg-[#ff7a1c]"
            }`}
          >
            {selected ? chosenLabel : pickLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

