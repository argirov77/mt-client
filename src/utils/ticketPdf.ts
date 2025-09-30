import { API } from "@/config";

type SupportedLang = "ru" | "bg" | "en" | "ua";

const buildTicketPdfUrl = (purchaseId: number, lang: SupportedLang): string => {
  const url = new URL(`${API}/tickets/${purchaseId}/pdf`);
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
  const newTab = window.open(pdfUrl, "_blank", "noopener,noreferrer");

  if (!newTab) {
    throw new Error("Browser blocked the PDF pop-up window");
  }
};
