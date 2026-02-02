import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

type DownloadTicketPdfParams = {
  ticketId: string | number;
  purchaseId: string | number;
  email: string;
};

const buildTicketPdfUrl = ({
  ticketId,
  purchaseId,
  email,
}: DownloadTicketPdfParams): string => {
  const encodedTicketId = encodeURIComponent(String(ticketId));
  const url = new URL(`${API}/public/tickets/${encodedTicketId}/pdf`);
  if (LOCAL_HOSTNAMES.has(url.hostname)) {
    url.hostname = "127.0.0.1";
  }
  url.searchParams.set("purchase_id", String(purchaseId));
  url.searchParams.set("email", email);
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

  const pdfUrl = buildTicketPdfUrl({ ticketId, purchaseId, email: normalizedEmail });
  const response = await fetchWithInclude(pdfUrl, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
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
