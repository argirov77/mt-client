"use client";

import { useMemo } from "react";

import { formatDate } from "@/utils/date";

import type { ElectronicTicketData } from "./SearchResults";

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
  };
};

const statusMap: Record<ElectronicTicketData["status"], keyof Props["t"]> = {
  paid: "ticketStatusPaid",
  pending: "ticketStatusPending",
  canceled: "ticketStatusCanceled",
};

export default function ElectronicTicket({ ticket, t }: Props) {
  const formattedCreatedAt = useMemo(
    () => formatDate(new Date(ticket.createdAt)),
    [ticket.createdAt]
  );

  const downloadTicket = () => {
    const lines: string[] = [];
    lines.push(`${t.ticketTitle}`);
    lines.push(`${t.ticketNumber}: ${ticket.purchaseId}`);
    lines.push(
      `${t.ticketStatus}: ${t[statusMap[ticket.status]]} (${ticket.action === "purchase" ? t.ticketActionPurchase : t.ticketActionBook})`
    );
    lines.push(`${t.ticketCreated}: ${formattedCreatedAt}`);
    lines.push(`${t.ticketTotal}: ${ticket.total.toFixed(2)}`);
    lines.push(`${t.ticketContacts}: ${ticket.contact.phone}, ${ticket.contact.email}`);
    lines.push(`${t.ticketOutbound}: ${ticket.outbound.fromName} → ${ticket.outbound.toName}`);
    if (ticket.inbound) {
      lines.push(`${t.ticketReturn}: ${ticket.inbound.fromName} → ${ticket.inbound.toName}`);
    }
    lines.push(`${t.ticketPassengers}:`);
    ticket.passengers.forEach((passenger, idx) => {
      lines.push(
        `  ${idx + 1}. ${passenger.name} | ${t.ticketPassengerSeat}: ${passenger.seatOutbound ?? "-"} | ${t.ticketPassengerSeatReturn}: ${passenger.seatReturn ?? "-"}`
      );
      lines.push(
        `     ${t.ticketPassengerBaggage}: ${passenger.extraBaggageOutbound ? t.ticketYes : t.ticketNo}` +
          (ticket.inbound
            ? ` | ${t.ticketPassengerBaggageReturn}: ${passenger.extraBaggageReturn ? t.ticketYes : t.ticketNo}`
            : "")
      );
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.purchaseId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <div key={`${passenger.name}-${index}`} className="rounded-lg border bg-white p-4">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

