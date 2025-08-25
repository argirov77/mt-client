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
}: TripCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white shadow ring-1 ring-black/5 p-5 flex flex-col gap-4 hover:shadow-md transition ${selected ? "ring-sky-300" : ""}`}
      role="button"
      onClick={onSelect}
    >
      {/* top row */}
      <div className="flex items-center justify-between">
        <div className="text-slate-600 text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {dateText} • {departTime} → {arriveTime} ({duration})
          </span>
        </div>
        <span className="text-xl font-semibold text-slate-900">
          {total.toFixed(2)} ₴
        </span>
      </div>

      {/* route */}
      <div className="text-lg font-medium text-slate-900">
        {fromStop} → {toStop}
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

      {/* bottom */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">
          <Users className="h-3.5 w-3.5" />
          {freeSeatsText ? freeSeatsText(freeSeats) : `Свободно мест: ${freeSeats}`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow text-white ${selected ? "bg-green-600 hover:bg-green-700" : "bg-[#ff6a00] hover:bg-[#ff7a1c]"}`}
        >
          {selected ? chosenLabel : pickLabel} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

