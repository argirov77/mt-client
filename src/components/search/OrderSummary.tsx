import React from "react";

import type { Dict, Lang, Tour } from "./types";
import { formatDayShort, shortTime } from "@/utils/tripFormat";

type PassengerSummary = {
  name: string;
  seatOutbound: number | null;
  seatReturn: number | null;
  baggageOutbound: boolean;
  baggageReturn: boolean;
};

type OrderSummaryProps = {
  t: Dict;
  lang: Lang;
  fromName: string;
  toName: string;
  outboundTour: Tour | null;
  returnTour: Tour | null;
  returnRequired: boolean;
  openReturn: boolean;
  priceLoading: boolean;
  passengerSummaries: PassengerSummary[];
  adultCount: number;
  childCount: number;
  phone: string;
  email: string;
  totals: {
    overall: number | null;
    baggage: {
      outboundCount: number;
      returnCount: number;
    };
  };
  formatPrice: (value: number) => string;
};

const OrderSummary: React.FC<OrderSummaryProps> = ({
  t,
  lang,
  fromName,
  toName,
  outboundTour,
  returnTour,
  returnRequired,
  openReturn,
  priceLoading,
  passengerSummaries,
  adultCount,
  childCount,
  phone,
  email,
  totals,
  formatPrice,
}) => {
  const baggageLines = [
    totals.baggage.outboundCount > 0
      ? { label: t.baggageSummaryOutbound, count: totals.baggage.outboundCount }
      : null,
    totals.baggage.returnCount > 0
      ? { label: t.baggageSummaryReturn, count: totals.baggage.returnCount }
      : null,
  ].filter(Boolean) as Array<{ label: string; count: number }>;

  const legLine = (tour: Tour | null, from: string, to: string) =>
    tour
      ? `${formatDayShort(tour.date, lang)}, ${shortTime(tour.departure_time)} · ${from} → ${to}`
      : `${t.step1SummaryChoose} · ${from} → ${to}`;

  const row = (label: string, value: React.ReactNode, muted = false) => (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-slate-600">{label}</span>
      <span className={`text-right ${muted ? "text-slate-500" : "font-semibold text-slate-900"}`}>{value}</span>
    </div>
  );

  const showSeats = passengerSummaries.some((p) => p.seatOutbound || p.seatReturn);

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{t.yourTrip}</p>

      <div className="mt-1 divide-y divide-slate-100">
        {row(t.outboundShort, legLine(outboundTour, fromName, toName), !outboundTour)}
        {returnRequired ? row(t.inboundShort, legLine(returnTour, toName, fromName), !returnTour) : null}
        {openReturn ? row(t.inboundShort, `${t.returnModeOpen} · ${toName} → ${fromName}`) : null}
        {row(t.passengersTitle, t.passengersSummary(adultCount, childCount))}

        {passengerSummaries.length ? (
          <ul className="py-1.5 text-sm">
            {passengerSummaries.map((passenger, index) => (
              <li key={`${passenger.name}-${index}`} className="flex items-start justify-between gap-3 py-0.5">
                <span className="min-w-0 truncate text-slate-900">{passenger.name}</span>
                {showSeats ? (
                  <span className="shrink-0 text-slate-600">
                    {[passenger.seatOutbound, passenger.seatReturn].filter(Boolean).join(" / ")}
                    {passenger.baggageOutbound || passenger.baggageReturn ? ` · +${t.ticketPassengerBaggage.toLowerCase()}` : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {phone || email ? row(t.ticketContacts, [phone, email].filter(Boolean).join(" · ")) : null}

        {baggageLines.map((line) => row(line.label, `${line.count} (${t.extraBaggagePrice})`))}

        <div className="flex items-baseline justify-between gap-3 pt-2">
          <span className="text-base font-bold text-slate-900">{t.total}</span>
          <span className="text-lg font-bold text-slate-900">
            {totals.overall != null ? formatPrice(totals.overall) : priceLoading ? t.loading : "—"}
          </span>
        </div>
        {openReturn || (returnRequired && returnTour) ? (
          <p className="border-0 pb-1 text-right text-xs font-semibold text-emerald-700">{t.returnDiscountShort}</p>
        ) : null}
      </div>
    </aside>
  );
};

export type { PassengerSummary };
export default OrderSummary;
