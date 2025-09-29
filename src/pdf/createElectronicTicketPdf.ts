import { drawElectronicTicketTemplate } from "./electronicTicketTemplate";

import type { ElectronicTicketData } from "@/types/ticket";
import type { TicketPdfLocale } from "@/utils/ticketPdf";

type CreateTicketPdfOptions = {
  ticket: ElectronicTicketData;
  t: TicketPdfLocale;
  statusLabel: string;
  actionLabel: string;
  createdAt: string;
  onlineUrl: string;
  statusStyle: { background: string; text: string };
};

const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754;
const DEFAULT_DPI = 96;
const POINTS_PER_INCH = 72;

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const buildPdfFromJpeg = (
  imageBytes: Uint8Array,
  pixelWidth: number,
  pixelHeight: number
): Uint8Array => {
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points

  const widthInPoints = (pixelWidth / DEFAULT_DPI) * POINTS_PER_INCH;
  const heightInPoints = (pixelHeight / DEFAULT_DPI) * POINTS_PER_INCH;

  const scale = Math.min(pageWidth / widthInPoints, pageHeight / heightInPoints);
  const drawWidth = widthInPoints * scale;
  const drawHeight = heightInPoints * scale;
  const offsetX = (pageWidth - drawWidth) / 2;
  const offsetY = (pageHeight - drawHeight) / 2;

  const textEncoder = new TextEncoder();

  const header = textEncoder.encode("%PDF-1.4\n");
  const binaryHeader = new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]);

  const chunks: Uint8Array[] = [header, binaryHeader];
  const offsets: number[] = [0];
  let position = header.length + binaryHeader.length;

  const push = (chunk: Uint8Array) => {
    chunks.push(chunk);
    position += chunk.length;
  };

  const beginObject = () => {
    offsets.push(position);
  };

  const object1 = textEncoder.encode(
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
  );
  beginObject();
  push(object1);

  const object2 = textEncoder.encode(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
  );
  beginObject();
  push(object2);

  const object3 = textEncoder.encode(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(
      2
    )} ${pageHeight.toFixed(
      2
    )}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );
  beginObject();
  push(object3);

  const imageHeader = textEncoder.encode(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`
  );
  const imageFooter = textEncoder.encode("\nendstream\nendobj\n");
  beginObject();
  push(imageHeader);
  push(imageBytes);
  push(imageFooter);

  const contentStream = `q\n${drawWidth
    .toFixed(2)
    .replace(/\.00$/, "")} 0 0 ${drawHeight
    .toFixed(2)
    .replace(/\.00$/, "")} ${offsetX
    .toFixed(2)
    .replace(/\.00$/, "")} ${offsetY
    .toFixed(2)
    .replace(/\.00$/, "")} cm\n/Im0 Do\nQ`;
  const contentStreamBytes = textEncoder.encode(contentStream);
  const object5Header = textEncoder.encode(
    `5 0 obj\n<< /Length ${contentStreamBytes.length} >>\nstream\n`
  );
  const object5Footer = textEncoder.encode("\nendstream\nendobj\n");
  beginObject();
  push(object5Header);
  push(contentStreamBytes);
  push(object5Footer);

  const xrefOffset = position;
  const xrefHeader = textEncoder.encode(
    `xref\n0 ${offsets.length}\n0000000000 65535 f \n`
  );
  push(xrefHeader);
  for (let i = 1; i < offsets.length; i += 1) {
    const offset = offsets[i].toString().padStart(10, "0");
    push(textEncoder.encode(`${offset} 00000 n \n`));
  }
  const trailer = textEncoder.encode(
    `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );
  push(trailer);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let cursor = 0;
  for (const chunk of chunks) {
    result.set(chunk, cursor);
    cursor += chunk.length;
  }

  return result;
};

export const createElectronicTicketPdf = async (
  options: CreateTicketPdfOptions
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas API is not supported in this environment");
  }

  drawElectronicTicketTemplate(context, CANVAS_WIDTH, CANVAS_HEIGHT, options);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const imageBytes = dataUrlToBytes(dataUrl);
  const pdfBytes = buildPdfFromJpeg(imageBytes, CANVAS_WIDTH, CANVAS_HEIGHT);

  return new Blob([pdfBytes], { type: "application/pdf" });
};
