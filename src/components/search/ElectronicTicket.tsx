"use client";

import { useMemo } from "react";

import { formatDate } from "@/utils/date";
import type { ElectronicTicketData } from "@/types/ticket";

type Props = {
  ticket: ElectronicTicketData;
  t: {
    ticketTitle: string;
    ticketNumber: string;
    ticketActionPurchase: string;
    ticketActionBook: string;
    ticketCreated: string;
    ticketStatus: string;
    ticketStatusPaid: string;
    ticketStatusPending: string;
    ticketStatusCanceled: string;
    ticketTotal: string;
    ticketContacts: string;
    ticketPassengers: string;
    ticketPassengerSeat: string;
    ticketPassengerSeatReturn: string;
    ticketPassengerBaggage: string;
    ticketPassengerBaggageReturn: string;
    ticketYes: string;
    ticketNo: string;
    ticketDownload: string;
    ticketOutbound: string;
    ticketReturn: string;
    ticketOpenOnline: string;
  };
  onDownload: () => void;
};

const statusMap: Record<ElectronicTicketData["status"], keyof Props["t"]> = {
  paid: "ticketStatusPaid",
  pending: "ticketStatusPending",
  canceled: "ticketStatusCanceled",
};

const statusStyles: Record<
  ElectronicTicketData["status"],
  { badge: string; dot: string }
> = {
  paid: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-100",
    dot: "bg-emerald-500",
  },
  pending: {
    badge: "bg-amber-50 text-amber-800 border-amber-100",
    dot: "bg-amber-500",
  },
  canceled: {
    badge: "bg-rose-50 text-rose-800 border-rose-100",
    dot: "bg-rose-500",
  },
};

export default function ElectronicTicket({ ticket, t, onDownload }: Props) {
  const formattedCreatedAt = useMemo(
    () => formatDate(new Date(ticket.createdAt)),
    [ticket.createdAt]
  );

  const downloadTicket = () => {
    onDownload();
  };

  const renderSegment = (
    label: string,
    segment: ElectronicTicketData["outbound"]
  ) => {
    if (!segment) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-600">
          <h4 className="font-semibold text-slate-800">{label}</h4>
          <p>Данные о рейсе недоступны</p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            {segment.departure_time} – {segment.arrival_time}
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {segment.fromName} → {segment.toName}
        </p>
        <p className="text-sm text-slate-600">{formatDate(segment.date)}</p>
      </div>
    );
  };

  return (
    <section className="mt-6 rounded-3xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            {t.ticketTitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">#{ticket.ticketNumber}</h3>
            <span
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[ticket.status].badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusStyles[ticket.status].dot}`} aria-hidden />
              {t[statusMap[ticket.status]]}
            </span>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {ticket.action === "purchase" ? t.ticketActionPurchase : t.ticketActionBook}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {t.ticketCreated}: {formattedCreatedAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadTicket}
            className="rounded-full border border-sky-500 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:-translate-y-px hover:bg-sky-500 hover:text-white"
          >
            {t.ticketDownload}
          </button>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {t.ticketTotal}: {ticket.total.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t.ticketStatus}</p>
              <p className="text-base font-semibold text-slate-900">{t[statusMap[ticket.status]]}</p>
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t.ticketTotal}</p>
              <p className="text-base font-semibold text-slate-900">{ticket.total.toFixed(2)}</p>
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t.ticketContacts}</p>
              <p className="text-base font-semibold text-slate-900">
                {ticket.contact.phone}
              </p>
              <p className="text-sm text-slate-600">{ticket.contact.email}</p>
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t.ticketOpenOnline}</p>
              <p className="text-sm text-slate-600">{t.ticketNumber}: {ticket.ticketNumber}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {renderSegment(t.ticketOutbound, ticket.outbound)}
          {renderSegment(t.ticketReturn, ticket.inbound)}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-lg font-semibold text-slate-900">{t.ticketPassengers}</h4>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {ticket.passengers.length}
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {ticket.passengers.map((passenger, index) => (
            <div
              key={`${passenger.name}-${index}`}
              className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <p className="text-base font-semibold text-slate-900">{passenger.name}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <p>
                  <span className="text-slate-500">{t.ticketPassengerSeat}:</span> {passenger.seatOutbound ?? "—"}
                </p>
                {ticket.inbound && (
                  <p>
                    <span className="text-slate-500">{t.ticketPassengerSeatReturn}:</span> {passenger.seatReturn ?? "—"}
                  </p>
                )}
                <p>
                  <span className="text-slate-500">{t.ticketPassengerBaggage}:</span> {passenger.extraBaggageOutbound ? t.ticketYes : t.ticketNo}
                </p>
                {ticket.inbound && (
                  <p>
                    <span className="text-slate-500">{t.ticketPassengerBaggageReturn}:</span> {passenger.extraBaggageReturn ? t.ticketYes : t.ticketNo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

