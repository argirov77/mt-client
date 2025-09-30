import { API } from "@/config";

const buildTicketPdfUrl = (purchaseId: number): string => {
  const url = new URL(`${API}/tickets/${purchaseId}/pdf`);
  url.hostname = "127.0.0.1";
  url.search = "";
  return url.toString();
};

export const downloadTicketPdf = async (purchaseId: number): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const pdfUrl = buildTicketPdfUrl(purchaseId);
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
  link.download = `ticket-${purchaseId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
};
