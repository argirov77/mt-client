import React from "react";
import { Check } from "lucide-react";

import type { ElectronicTicketData, TicketSegment } from "@/types/ticket";
import {
  arrivalWeekday,
  formatDayMonth,
  formatDayShort,
  formatUah,
  shortTime,
  tripDuration,
} from "@/utils/tripFormat";

import type { Dict, Lang } from "./types";

type Props = {
  t: Dict;
  lang: Lang;
  ticket: ElectronicTicketData;
  openReturn: boolean;
  canPay: boolean;
  onPay: () => void;
  onDownload: () => void;
};

/**
 * Экран после «Бронь»: номер заказа, рейсы, места, сумма и как оплатить.
 * Раньше здесь было «Purchase ID: 140. Сумма: 9500.00».
 */
export default function BookedScreen({ t, lang, ticket, openReturn, canPay, onPay, onDownload }: Props) {
  const isBooking = ticket.action === "book";
  const created = ticket.createdAt ? formatDayMonth(ticket.createdAt.slice(0, 10), lang) : "";

  const renderLeg = (title: string, segment: TicketSegment) => {
    const duration = tripDuration(segment.departure_time, segment.arrival_time);
    const arriveDay = duration?.dayShift
      ? arrivalWeekday(segment.date, segment.departure_time, segment.arrival_time, lang)
      : "";
    return (
      <div className="space-y-0.5 py-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[#0a65b0]">
          {title} · {formatDayShort(segment.date, lang)}
        </p>
        <p className="text-sm font-semibold text-slate-900">
          {segment.fromName} {shortTime(segment.departure_time)} → {segment.toName}{" "}
          {shortTime(segment.arrival_time)}
          {arriveDay ? ` ${arriveDay}` : ""}
        </p>
        {segment.seatNumbers.length ? (
          <p className="text-sm text-slate-700">{t.seatsList([...segment.seatNumbers].sort((a, b) => a - b))}</p>
        ) : null}
      </div>
    );
  };

  return (
    <section className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{isBooking ? t.bookedTitle : t.msgRedirect}</h2>
          <p className="text-sm text-slate-600">{t.orderNo(ticket.purchaseId, created)}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
        {ticket.outbound ? renderLeg(t.outboundShort, ticket.outbound) : null}
        {ticket.inbound ? renderLeg(t.inboundShort, ticket.inbound) : null}
        {openReturn && !ticket.inbound ? (
          <p className="py-2 text-sm font-semibold text-slate-900">{t.openReturnLeg}</p>
        ) : null}
        {ticket.passengers.length ? (
          <p className="py-2 text-sm text-slate-700">{ticket.passengers.map((p) => p.name).join(", ")}</p>
        ) : null}
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-slate-900">{t.toPay}</span>
          <b className="text-lg text-slate-900">{formatUah(ticket.total)}</b>
        </div>
        {isBooking ? <p className="text-sm text-slate-700">{t.bookedPayNote}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        {canPay ? (
          <button
            type="button"
            onClick={onPay}
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            {t.payByCard(formatUah(ticket.total))}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDownload}
          className="flex min-h-[48px] items-center justify-center rounded-xl border-[1.5px] border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:border-slate-400"
        >
          {t.downloadPdf}
        </button>
      </div>
    </section>
  );
}
