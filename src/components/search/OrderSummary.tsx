import React from "react";

import type { Dict, Tour } from "./types";

type PassengerSummary = {
  name: string;
  seatOutbound: number | null;
  seatReturn: number | null;
  baggageOutbound: boolean;
  baggageReturn: boolean;
};

type OrderSummaryProps = {
  t: Dict;
  fromName: string;
  toName: string;
  outboundTour: Tour;
  returnTour: Tour | null;
  returnRequired: boolean;
  passengerSummaries: PassengerSummary[];
  seatCount: number;
  phone: string;
  email: string;
  totals: {
    outbound: number;
    return: number;
    overall: number;
    baggage: {
      outboundCount: number;
      outboundPrice: number;
      returnCount: number;
      returnPrice: number;
      total: number;
    };
  };
  formatDateLabel: (value: string) => string;
  formatPrice: (value: number) => string;
};

const OrderSummary: React.FC<OrderSummaryProps> = ({
  t,
  fromName,
  toName,
  outboundTour,
  returnTour,
  returnRequired,
  passengerSummaries,
  seatCount,
  phone,
  email,
  totals,
  formatDateLabel,
  formatPrice,
}) => {
  const contactsProvided = Boolean(phone || email);
  const baggageLines = [
    totals.baggage.outboundCount > 0
      ? {
          label: t.baggageSummaryOutbound,
          count: totals.baggage.outboundCount,
          price: totals.baggage.outboundPrice,
          total: totals.baggage.outboundCount * totals.baggage.outboundPrice,
        }
      : null,
    totals.baggage.returnCount > 0
      ? {
          label: t.baggageSummaryReturn,
          count: totals.baggage.returnCount,
          price: totals.baggage.returnPrice,
          total: totals.baggage.returnCount * totals.baggage.returnPrice,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    count: number;
    price: number;
    total: number;
  }>;

  const renderRouteBlock = (
    title: string,
    subtitle: string,
    date: string,
    departure: string,
    arrival: string,
    accent: string,
  ) => {
    return (
      <div className="rounded-none border-0 bg-slate-50/70 px-3 py-3 shadow-none sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:px-4 sm:py-3 sm:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <p className="text-base font-semibold text-slate-900">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 ring-1 ${accent}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                {formatDateLabel(date)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                {departure} → {arrival}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="overflow-hidden rounded-none border-0 bg-transparent shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:shadow-xl">
      <div className="border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.orderSummaryTitle}</p>
      </div>

      <div className="space-y-4 px-3 py-3 sm:px-5 sm:py-4">
        {renderRouteBlock(
          t.outboundShort,
          `${fromName} → ${toName}`,
          outboundTour.date,
          outboundTour.departure_time,
          outboundTour.arrival_time,
          "bg-sky-50 text-sky-700 ring-sky-100",
        )}

        {returnRequired && returnTour
          ? renderRouteBlock(
              t.inboundShort,
              `${toName} → ${fromName}`,
              returnTour.date,
              returnTour.departure_time,
              returnTour.arrival_time,
              "bg-indigo-50 text-indigo-700 ring-indigo-100",
            )
          : null}

        <div className="rounded-none border-0 bg-slate-50/70 px-3 py-3 shadow-none sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:px-4 sm:py-3 sm:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.passengersTitle}</p>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
              {seatCount} {t.seatsLabel}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {passengerSummaries.length ? (
              <ul className="space-y-2">
                {passengerSummaries.map((passenger, index) => (
                  <li key={`${passenger.name}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-slate-900">{passenger.name}</span>
                      <span className="text-xs font-medium text-slate-600">{t.passengerLabel(index + 1)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      {passenger.seatOutbound ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                          <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                          {t.ticketPassengerSeat}: {passenger.seatOutbound}
                        </span>
                      ) : null}
                      {passenger.seatReturn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                          <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
                          {t.ticketPassengerSeatReturn}: {passenger.seatReturn}
                        </span>
                      ) : null}
                      {passenger.baggageOutbound ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-800 ring-1 ring-amber-100">
                          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                          {t.ticketPassengerBaggage}
                        </span>
                      ) : null}
                      {passenger.baggageReturn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-800 ring-1 ring-amber-100">
                          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                          {t.ticketPassengerBaggageReturn}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500" aria-hidden>
                &nbsp;
              </p>
            )}
          </div>
        </div>

        <div className="rounded-none border-0 bg-slate-50/70 px-3 py-3 shadow-none sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:px-4 sm:py-3 sm:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.ticketContacts}</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {contactsProvided ? (
              <>
                {phone ? <div className="font-semibold text-slate-900">{phone}</div> : null}
                {email ? <div className="text-slate-600">{email}</div> : null}
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  {t.step3SummaryPending}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {baggageLines.length ? (
          <div className="rounded-none border-0 bg-slate-50/70 px-3 py-3 shadow-none sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:px-4 sm:py-3 sm:shadow-sm">
            <div className="space-y-1 text-sm text-slate-700">
              {baggageLines.map((line) => (
                <div key={line.label} className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">
                    {line.label}: {line.count} × {formatPrice(line.price)} = {formatPrice(line.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-none border-0 bg-slate-50/70 px-3 py-3 shadow-none sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:px-4 sm:py-4 sm:shadow-sm">
          <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
            <span>{t.total}</span>
            <span className="text-emerald-600">{formatPrice(totals.overall)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export type { PassengerSummary };
export default OrderSummary;
