import { API } from "@/config";

type SupportedLang = "ru" | "bg" | "en" | "ua";

const buildTicketPdfUrl = (purchaseId: number, lang: SupportedLang): string => {
  const url = new URL(`${API}/tickets/${purchaseId}/pdf`);
  url.hostname = "127.0.0.1";
  url.searchParams.set("lang", lang);
  return url.toString();
};

export const downloadTicketPdf = async (
  purchaseId: number,
  lang: SupportedLang
): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const pdfUrl = buildTicketPdfUrl(purchaseId, lang);
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
