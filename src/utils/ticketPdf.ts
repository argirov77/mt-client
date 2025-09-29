import { formatDate } from "./date";

import type { ElectronicTicketData } from "@/types/ticket";
import { createElectronicTicketPdf } from "@/pdf/createElectronicTicketPdf";

export type TicketPdfLocale = {
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

const statusMap: Record<
  ElectronicTicketData["status"],
  "ticketStatusPaid" | "ticketStatusPending" | "ticketStatusCanceled"
> = {
  paid: "ticketStatusPaid",
  pending: "ticketStatusPending",
  canceled: "ticketStatusCanceled",
};

const statusPalette: Record<
  ElectronicTicketData["status"],
  { background: string; text: string }
> = {
  paid: { background: "#16a34a", text: "#ffffff" },
  pending: { background: "#f97316", text: "#ffffff" },
  canceled: { background: "#ef4444", text: "#ffffff" },
};

const getOnlineUrl = (purchaseId: number): string => {
  if (typeof window === "undefined") {
    return `/ticket/${purchaseId}`;
  }
  const { origin } = window.location;
  return `${origin}/ticket/${purchaseId}`;
};

export const downloadTicketPdf = async (
  ticket: ElectronicTicketData,
  t: TicketPdfLocale
): Promise<void> => {
  const actionLabel =
    ticket.action === "purchase" ? t.ticketActionPurchase : t.ticketActionBook;
  const statusLabel = t[statusMap[ticket.status]];
  const createdAt = formatDate(new Date(ticket.createdAt));
  const onlineUrl = getOnlineUrl(ticket.purchaseId);

  const pdfBlob = await createElectronicTicketPdf({
    ticket,
    t,
    statusLabel,
    actionLabel,
    createdAt,
    onlineUrl,
    statusStyle: statusPalette[ticket.status],
  });

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `electronic-ticket-${ticket.purchaseId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
