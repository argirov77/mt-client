import { API } from "@/config";

type DownloadTicketPdfParams = {
  ticketId: string | number;
  purchaseId: string | number;
  email: string;
};

const buildTicketPdfUrl = (): string => {
  const url = new URL(`${API}/public/tickets/pdf`);
  url.hostname = "127.0.0.1";
  url.search = "";
  return url.toString();
};

export const downloadTicketPdf = async ({
  ticketId,
  purchaseId,
  email,
}: DownloadTicketPdfParams): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error("Email is required to download the ticket PDF");
  }

  const pdfUrl = buildTicketPdfUrl();
  const response = await fetch(pdfUrl, {
    method: "POST",
    headers: {
      Accept: "application/pdf",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      purchase_id: purchaseId,
      ticket_id: ticketId,
      email: normalizedEmail,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to download the ticket PDF");
  }

  const pdfBlob = await response.blob();
  const objectUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `ticket-${ticketId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
};
