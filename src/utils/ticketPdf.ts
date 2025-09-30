import { API } from "@/config";

const buildTicketPdfUrl = (ticketNumber: string | number): string => {
  const url = new URL(`${API}/tickets/${ticketNumber}/pdf`);
  url.hostname = "127.0.0.1";
  url.search = "";
  return url.toString();
};

export const downloadTicketPdf = async (
  ticketNumber: string | number
): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const pdfUrl = buildTicketPdfUrl(ticketNumber);
  const response = await fetch(pdfUrl, {
    method: "GET",
    headers: { Accept: "application/pdf" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to download the ticket PDF");
  }

  const pdfBlob = await response.blob();
  const objectUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `ticket-${ticketNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
};
