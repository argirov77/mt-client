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

export default function ElectronicTicket({ ticket, t, onDownload }: Props) {
  const formattedCreatedAt = useMemo(
    () => formatDate(new Date(ticket.createdAt)),
    [ticket.createdAt]
  );

  const downloadTicket = () => {
    onDownload();
  };

  const renderSegment = (label: string, segment: ElectronicTicketData["outbound"]) => (
    <div className="rounded-lg border bg-white/60 p-4">
      <h4 className="font-semibold">{label}</h4>
      <p>
        {segment.fromName} → {segment.toName}
      </p>
      <p>
        {formatDate(segment.date)} · {segment.departure_time} – {segment.arrival_time}
      </p>
    </div>
  );

  return (
    <section className="mt-6 rounded-3xl bg-sky-50/80 p-6 shadow-inner">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-sky-900">{t.ticketTitle}</h3>
          <p className="text-sm text-slate-600">
            {t.ticketNumber}: {ticket.purchaseId}
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTicket}
          className="self-start rounded-full border border-sky-500 px-4 py-2 text-sky-700 transition hover:bg-sky-500 hover:text-white"
        >
          {t.ticketDownload}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white/80 p-4">
          <p>
            <span className="font-semibold">{t.ticketStatus}:</span> {t[statusMap[ticket.status]]} · {" "}
            {ticket.action === "purchase" ? t.ticketActionPurchase : t.ticketActionBook}
          </p>
          <p>
            <span className="font-semibold">{t.ticketCreated}:</span> {formattedCreatedAt}
          </p>
          <p>
            <span className="font-semibold">{t.ticketTotal}:</span> {ticket.total.toFixed(2)}
          </p>
          <p>
            <span className="font-semibold">{t.ticketContacts}:</span> {ticket.contact.phone}, {ticket.contact.email}
          </p>
        </div>

        <div className="space-y-3">
          {renderSegment(t.ticketOutbound, ticket.outbound)}
          {ticket.inbound && renderSegment(t.ticketReturn, ticket.inbound)}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-sky-800">{t.ticketPassengers}</h4>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {ticket.passengers.map((passenger, index) => (
            <div key={`${passenger.name}-${index}`} className="flex flex-col gap-2 rounded-lg border bg-white p-4">
              <p className="font-semibold text-slate-800">{passenger.name}</p>
              <p className="text-sm text-slate-600">
                {t.ticketPassengerSeat}: {passenger.seatOutbound ?? "—"}
              </p>
              {ticket.inbound && (
                <p className="text-sm text-slate-600">
                  {t.ticketPassengerSeatReturn}: {passenger.seatReturn ?? "—"}
                </p>
              )}
              <p className="text-sm text-slate-600">
                {t.ticketPassengerBaggage}: {passenger.extraBaggageOutbound ? t.ticketYes : t.ticketNo}
              </p>
              {ticket.inbound && (
                <p className="text-sm text-slate-600">
                  {t.ticketPassengerBaggageReturn}: {passenger.extraBaggageReturn ? t.ticketYes : t.ticketNo}
                </p>
              )}
              <button
                type="button"
                onClick={downloadTicket}
                className="self-start rounded border border-sky-500 px-3 py-1 text-sm text-sky-700 transition hover:bg-sky-500 hover:text-white"
              >
                {t.ticketDownload}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

