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

  const response = await fetch(buildTicketPdfUrl(purchaseId, lang), {
    headers: {
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ticket PDF: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `electronic-ticket-${purchaseId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
