import { ChevronRight } from "lucide-react";

export type TripCardProps = {
  dateText: string; // "28.08.2025"
  fromStop: string; // "Stop1"
  toStop: string; // "Stop3"
  departTime: string; // "10:10"
  arriveTime: string; // "13:10"
  total: number; // 85.80
  onSelect?: () => void;
  selected?: boolean;
  pickLabel?: string;
  chosenLabel?: string;
  priceLabel?: string;
};

export default function TripCard({
  dateText,
  fromStop,
  toStop,
  departTime,
  arriveTime,
  total,
  onSelect,
  selected = false,
  pickLabel = "Выбрать",
  chosenLabel = "Выбрано",
  priceLabel = "Цена",
}: TripCardProps) {
  return (
    <div
      className={`group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-orange-100 hover:shadow-md md:flex-row md:items-center md:justify-between md:p-5 ${
        selected ? "border-orange-200 ring-2 ring-orange-200" : ""
      }`}
      role="button"
      onClick={onSelect}
    >
      <div className="flex flex-col gap-4 md:gap-3">
        <div className="text-sm font-medium text-slate-700">
          <span className="text-slate-500">Дата:</span> {dateText}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-slate-900">{fromStop}</span>
            <span className="text-base font-medium text-slate-700">{departTime}</span>
          </div>

          <div className="flex flex-col gap-1 sm:items-end sm:text-right">
            <span className="text-xl font-semibold text-slate-900">{toStop}</span>
            <span className="text-base font-medium text-slate-700">{arriveTime}</span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 md:w-auto md:flex-col md:items-end md:justify-center">
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {priceLabel}
          </div>
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
