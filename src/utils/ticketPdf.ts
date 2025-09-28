import { formatDate } from "./date";

import type { ElectronicTicketData } from "@/types/ticket";

const statusMap: Record<
  ElectronicTicketData["status"],
  "ticketStatusPaid" | "ticketStatusPending" | "ticketStatusCanceled"
> = {
  paid: "ticketStatusPaid",
  pending: "ticketStatusPending",
  canceled: "ticketStatusCanceled",
};

const translitMap: Record<string, string> = {
  А: "A",
  а: "a",
  Б: "B",
  б: "b",
  В: "V",
  в: "v",
  Г: "G",
  г: "g",
  Д: "D",
  д: "d",
  Е: "E",
  е: "e",
  Ё: "Yo",
  ё: "yo",
  Ж: "Zh",
  ж: "zh",
  З: "Z",
  з: "z",
  И: "I",
  и: "i",
  Й: "Y",
  й: "y",
  К: "K",
  к: "k",
  Л: "L",
  л: "l",
  М: "M",
  м: "m",
  Н: "N",
  н: "n",
  О: "O",
  о: "o",
  П: "P",
  п: "p",
  Р: "R",
  р: "r",
  С: "S",
  с: "s",
  Т: "T",
  т: "t",
  У: "U",
  у: "u",
  Ф: "F",
  ф: "f",
  Х: "Kh",
  х: "kh",
  Ц: "Ts",
  ц: "ts",
  Ч: "Ch",
  ч: "ch",
  Ш: "Sh",
  ш: "sh",
  Щ: "Shch",
  щ: "shch",
  Ъ: "A",
  ъ: "a",
  Ы: "Y",
  ы: "y",
  Ь: "",
  ь: "",
  Э: "E",
  э: "e",
  Ю: "Yu",
  ю: "yu",
  Я: "Ya",
  я: "ya",
  Ї: "Yi",
  ї: "yi",
  І: "I",
  і: "i",
  Є: "Ye",
  є: "ye",
  Ґ: "G",
  ґ: "g",
};

const transliterate = (value: string): string =>
  value
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("");

const sanitize = (value: string): string => {
  const ascii = transliterate(value);
  let result = "";
  for (let i = 0; i < ascii.length; i += 1) {
    const code = ascii.charCodeAt(i);
    if (
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 126)
    ) {
      result += ascii[i];
    }
  }
  return result;
};

const escapePdfText = (value: string): string =>
  sanitize(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

type TicketPdfLocale = {
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

const buildPdf = (lines: string[]): string => {
  const contentLines = lines.map((line) => `(${escapePdfText(line)}) Tj`);
  const textStream = [
    "BT",
    "/F1 12 Tf",
    "72 802 Td",
    "14 TL",
    contentLines.join("\nT*\n"),
    "ET",
  ]
    .filter(Boolean)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${textStream.length} >> stream\n${textStream}\nendstream\nendobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  });

  const xrefPosition = pdf.length;
  const totalObjects = objects.length + 1;
  pdf += `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return pdf;
};

export const downloadTicketPdf = (
  ticket: ElectronicTicketData,
  t: TicketPdfLocale
) => {
  const lines: string[] = [];
  const actionLabel =
    ticket.action === "purchase" ? t.ticketActionPurchase : t.ticketActionBook;
  const statusLabel = t[statusMap[ticket.status]];
  lines.push(t.ticketTitle);
  lines.push(`${t.ticketNumber}: ${ticket.purchaseId}`);
  lines.push(`${t.ticketStatus}: ${statusLabel} (${actionLabel})`);
  lines.push(`${t.ticketCreated}: ${formatDate(new Date(ticket.createdAt))}`);
  lines.push(`${t.ticketTotal}: ${ticket.total.toFixed(2)}`);
  lines.push(
    `${t.ticketContacts}: ${ticket.contact.phone}, ${ticket.contact.email}`
  );
  lines.push(
    `${t.ticketOutbound}: ${ticket.outbound.fromName} -> ${ticket.outbound.toName}`
  );
  lines.push(
    `  ${formatDate(ticket.outbound.date)} · ${ticket.outbound.departure_time} - ${ticket.outbound.arrival_time}`
  );
  if (ticket.inbound) {
    lines.push(
      `${t.ticketReturn}: ${ticket.inbound.fromName} -> ${ticket.inbound.toName}`
    );
    lines.push(
      `  ${formatDate(ticket.inbound.date)} · ${ticket.inbound.departure_time} - ${ticket.inbound.arrival_time}`
    );
  }

  lines.push("");
  lines.push(`${t.ticketPassengers}:`);
  ticket.passengers.forEach((passenger, index) => {
    lines.push(`${index + 1}. ${passenger.name}`);
    lines.push(
      `   ${t.ticketPassengerSeat}: ${
        passenger.seatOutbound ?? "-"
      }`
    );
    if (ticket.inbound) {
      lines.push(
        `   ${t.ticketPassengerSeatReturn}: ${
          passenger.seatReturn ?? "-"
        }`
      );
    }
    lines.push(
      `   ${t.ticketPassengerBaggage}: ${
        passenger.extraBaggageOutbound ? t.ticketYes : t.ticketNo
      }`
    );
    if (ticket.inbound) {
      lines.push(
        `   ${t.ticketPassengerBaggageReturn}: ${
          passenger.extraBaggageReturn ? t.ticketYes : t.ticketNo
        }`
      );
    }
    lines.push("");
  });

  const pdf = buildPdf(lines);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ticket-${ticket.purchaseId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
