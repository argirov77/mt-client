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
  chosenLabel?: string;
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
  chosenLabel = "Выбрано",
}: TripCardProps) {
  return (
    <div
      className={`group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-orange-100 hover:shadow-md md:flex-row md:items-center md:justify-between md:gap-6 md:p-5 ${
        selected ? "border-orange-200 ring-2 ring-orange-200" : ""
      }`}
      role="button"
      onClick={onSelect}
    >
      <div className="flex flex-1 flex-col gap-3 md:gap-2">
        <div className="flex justify-start text-sm font-semibold text-slate-900 md:text-base">
          <span className="shrink-0 text-sm font-semibold text-slate-700 md:text-base">{dateText}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fromStop}</span>
            <span className="text-xl font-bold text-slate-900">{departTime}</span>
          </div>

          <div className="flex flex-col gap-0.5 items-end text-right">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{toStop}</span>
            <span className="text-xl font-bold text-slate-900">{arriveTime}</span>
          </div>
        </div>
      </div>

      <div className="mt-1 flex w-full items-center justify-end gap-3 md:mt-0 md:ml-6 md:w-auto md:flex-col md:items-end md:justify-center">
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
          {selected ? chosenLabel : `${total.toFixed(2)} ₴`}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
