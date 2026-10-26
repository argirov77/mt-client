import { Check } from "lucide-react";

export type TripCardProps = {
  heading: string; // «Туда · ср, 28 окт»
  fromStop: string;
  toStop: string;
  departTime: string; // «13:40»
  arriveTime: string; // «05:20»
  arriveDay?: string; // «чт», если прибытие на следующие сутки
  durationText?: string; // «~15 ч 40 мин»
  freeSeatsText?: string; // «Свободно мест: 13»
  priceBreakdown?: string; // «2 × 2500 =»
  priceText: string; // «5000 ₴»
  oldPriceText?: string; // зачёркнутая цена без скидки
  discountBadge?: string; // «−10%»
  onSelect?: () => void;
  selected?: boolean;
  chosenLabel?: string;
  changeLabel?: string;
  onChange?: () => void;
};

export default function TripCard({
  heading,
  fromStop,
  toStop,
  departTime,
  arriveTime,
  arriveDay,
  durationText,
  freeSeatsText,
  priceBreakdown,
  priceText,
  oldPriceText,
  discountBadge,
  onSelect,
  selected = false,
  chosenLabel = "Выбрано",
  changeLabel,
  onChange,
}: TripCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-[#c2410c]">{heading}</span>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {chosenLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="flex flex-col">
          <b className="text-xl font-bold tabular-nums text-[#173452]">{departTime}</b>
          <span className="text-xs text-[#5c6370]">{fromStop}</span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          {durationText ? <span className="text-[11px] text-[#5c6370]">{durationText}</span> : null}
          <span aria-hidden className="w-full border-t-2 border-dotted border-[#a3a7ad]" />
        </span>
        <span className="flex flex-col items-end text-right">
          <b className="text-xl font-bold tabular-nums text-[#173452]">{arriveTime}</b>
          <span className="text-xs text-[#5c6370]">
            {toStop}
            {arriveDay ? `, ${arriveDay}` : ""}
          </span>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        {freeSeatsText ? (
          <span className="font-semibold text-emerald-700">{freeSeatsText}</span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1.5 text-[#173452]">
          {priceBreakdown ? <span className="text-[#5c6370]">{priceBreakdown}</span> : null}
          {oldPriceText ? <s className="text-[#5c6370]">{oldPriceText}</s> : null}
          <b className="text-base">{priceText}</b>
          {discountBadge ? (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
              {discountBadge}
            </span>
          ) : null}
        </span>
      </div>
    </>
  );

  if (selected) {
    return (
      <div className="rounded-2xl border-2 border-emerald-600 bg-white p-3 sm:p-4">
        {body}
        {onChange && changeLabel ? (
          <button
            type="button"
            onClick={onChange}
            className="mt-2 min-h-[44px] text-sm font-semibold text-[#c2410c] underline-offset-2 hover:underline"
          >
            {changeLabel}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-2xl border border-[#e3dfd9] bg-white p-3 text-left transition hover:border-[#fdba74] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:p-4"
    >
      {body}
    </button>
  );
}
