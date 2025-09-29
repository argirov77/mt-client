import type { ElectronicTicketData } from "@/types/ticket";
import type { TicketPdfLocale } from "@/utils/ticketPdf";
import { formatDate } from "@/utils/date";

type TemplateOptions = {
  ticket: ElectronicTicketData;
  t: TicketPdfLocale;
  statusLabel: string;
  actionLabel: string;
  createdAt: string;
  onlineUrl: string;
  statusStyle: { background: string; text: string };
};

type CanvasContext = CanvasRenderingContext2D;

type QrMatrix = (boolean | null)[][];

const BACKGROUND_COLOR = "#e2e8f0";
const CONTAINER_COLOR = "#ffffff";
const SECONDARY_TEXT = "#475569";
const PRIMARY_TEXT = "#0f172a";
const ACCENT_COLOR = "#0ea5e9";
const PASSENGER_CARD = "#f8fafc";

const drawRoundedRect = (
  ctx: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
};

const wrapText = (
  ctx: CanvasContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
};

const drawBadge = (
  ctx: CanvasContext,
  text: string,
  x: number,
  y: number,
  background: string,
  color: string
) => {
  ctx.save();
  ctx.font = "600 26px 'Arial'";
  const paddingX = 20;
  const paddingY = 8;
  const textMetrics = ctx.measureText(text);
  const badgeWidth = textMetrics.width + paddingX * 2;
  const textHeight =
    (textMetrics.actualBoundingBoxAscent || 18) +
    (textMetrics.actualBoundingBoxDescent || 6);
  const badgeHeight = textHeight + paddingY * 2;
  drawRoundedRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2, background);
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + paddingX, y + badgeHeight / 2 + 1);
  ctx.restore();
  return badgeWidth;
};

const generatePseudoQrMatrix = (value: string, size = 29): QrMatrix => {
  const matrix: QrMatrix = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );

  const applyFinder = (offsetX: number, offsetY: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const globalX = offsetX + x;
        const globalY = offsetY + y;
        if (globalX < 0 || globalY < 0 || globalX >= size || globalY >= size) {
          continue;
        }
        const onBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const innerSquare = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[globalY][globalX] = onBorder || innerSquare;
      }
    }
  };

  applyFinder(0, 0);
  applyFinder(size - 7, 0);
  applyFinder(0, size - 7);

  let seed = 0;
  for (let i = 0; i < value.length; i += 1) {
    seed = (seed * 31 + value.charCodeAt(i)) & 0x7fffffff;
  }

  const randomBit = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed & 1 ? true : false;
  };

  let bitString = "";
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    bitString += code.toString(2).padStart(8, "0");
  }

  let bitIndex = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (matrix[y][x] !== null) {
        continue;
      }
      if (bitIndex < bitString.length) {
        matrix[y][x] = bitString[bitIndex] === "1";
        bitIndex += 1;
      } else {
        matrix[y][x] = randomBit();
      }
    }
  }

  return matrix;
};

const drawQrCode = (
  ctx: CanvasContext,
  value: string,
  x: number,
  y: number,
  size: number
) => {
  const matrix = generatePseudoQrMatrix(value);
  const cellSize = size / matrix.length;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#0f172a";
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col]) {
        ctx.fillRect(
          x + col * cellSize,
          y + row * cellSize,
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
};

const drawInfoRow = (
  ctx: CanvasContext,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number
) => {
  ctx.save();
  ctx.font = "600 30px 'Arial'";
  ctx.fillStyle = SECONDARY_TEXT;
  const labelText = `${label}:`;
  const labelWidth = ctx.measureText(labelText).width;
  ctx.fillText(labelText, x, y);

  ctx.font = "400 30px 'Arial'";
  ctx.fillStyle = PRIMARY_TEXT;
  const availableWidth = Math.max(maxWidth - labelWidth - 16, 0);
  wrapText(ctx, value, x + labelWidth + 16, y, availableWidth, 36);
  ctx.restore();
};

const drawSegmentCard = (
  ctx: CanvasContext,
  label: string,
  segment: ElectronicTicketData["outbound"],
  x: number,
  y: number,
  width: number
) => {
  const height = 200;
  drawRoundedRect(ctx, x, y, width, height, 28, "#e0f2fe");
  ctx.save();
  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = "600 30px 'Arial'";
  ctx.fillText(label, x + 28, y + 48);

  ctx.font = "400 28px 'Arial'";
  ctx.fillText(`${segment.fromName} → ${segment.toName}`, x + 28, y + 92);

  ctx.fillStyle = SECONDARY_TEXT;
  ctx.font = "400 26px 'Arial'";
  ctx.fillText(
    `${formatDate(segment.date)} · ${segment.departure_time} – ${segment.arrival_time}`,
    x + 28,
    y + 132
  );
  ctx.restore();
  return height;
};

const drawPassengerCard = (
  ctx: CanvasContext,
  passenger: ElectronicTicketData["passengers"][number],
  index: number,
  hasReturn: boolean,
  x: number,
  y: number,
  width: number,
  t: TicketPdfLocale
) => {
  const padding = 24;
  const entries: Array<{ label: string; value: string }> = [
    {
      label: t.ticketPassengerSeat,
      value:
        passenger.seatOutbound !== null ? `${passenger.seatOutbound}` : "—",
    },
    {
      label: t.ticketPassengerBaggage,
      value: passenger.extraBaggageOutbound ? t.ticketYes : t.ticketNo,
    },
  ];

  if (hasReturn) {
    entries.push(
      {
        label: t.ticketPassengerSeatReturn,
        value: passenger.seatReturn !== null ? `${passenger.seatReturn}` : "—",
      },
      {
        label: t.ticketPassengerBaggageReturn,
        value: passenger.extraBaggageReturn ? t.ticketYes : t.ticketNo,
      }
    );
  }

  const lineHeight = 34;
  const headerHeight = 40;
  const contentHeight = entries.length * lineHeight;
  const height = padding * 2 + headerHeight + contentHeight;

  drawRoundedRect(ctx, x, y, width, height, 24, PASSENGER_CARD);
  ctx.save();
  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = "600 28px 'Arial'";
  ctx.fillText(`${index + 1}. ${passenger.name}`, x + padding, y + padding + 32);

  ctx.font = "600 26px 'Arial'";
  const labelWidths = entries.map((entry) => ctx.measureText(`${entry.label}:`).width);
  const maxLabelWidth = Math.max(...labelWidths, 0);
  let currentY = y + padding + headerHeight + 24;

  entries.forEach((entry) => {
    ctx.font = "600 26px 'Arial'";
    const labelText = `${entry.label}:`;
    ctx.fillStyle = SECONDARY_TEXT;
    ctx.fillText(labelText, x + padding, currentY);

    ctx.font = "400 26px 'Arial'";
    ctx.fillStyle = PRIMARY_TEXT;
    const valueX = x + padding + maxLabelWidth + 16;
    ctx.fillText(entry.value, valueX, currentY);

    currentY += lineHeight;
  });

  ctx.restore();
  return height;
};

export const drawElectronicTicketTemplate = (
  ctx: CanvasContext,
  width: number,
  height: number,
  options: TemplateOptions
) => {
  const { ticket, t, statusLabel, actionLabel, createdAt, onlineUrl, statusStyle } =
    options;

  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  const margin = 80;
  const containerX = margin;
  const containerY = margin;
  const containerWidth = width - margin * 2;
  const containerHeight = height - margin * 2;

  drawRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, 40, CONTAINER_COLOR);

  const innerPadding = 64;
  const contentX = containerX + innerPadding;
  const contentY = containerY + innerPadding;
  const contentWidth = containerWidth - innerPadding * 2;

  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = "700 60px 'Arial'";
  ctx.fillText(t.ticketTitle, contentX, contentY + 60);

  ctx.fillStyle = SECONDARY_TEXT;
  ctx.font = "400 32px 'Arial'";
  ctx.fillText(
    `${t.ticketNumber}: ${ticket.purchaseId}`,
    contentX,
    contentY + 60 + 48
  );

  const qrSize = 280;
  const qrX = contentX + contentWidth - qrSize;
  const qrY = contentY;
  drawQrCode(ctx, `${onlineUrl}`, qrX, qrY, qrSize);

  ctx.fillStyle = ACCENT_COLOR;
  ctx.font = "600 30px 'Arial'";
  ctx.fillText(t.ticketOpenOnline, qrX, qrY + qrSize + 48);

  ctx.fillStyle = SECONDARY_TEXT;
  ctx.font = "400 24px 'Arial'";
  wrapText(ctx, onlineUrl, qrX, qrY + qrSize + 84, qrSize, 28);

  let currentY = Math.max(contentY + 60 + 48 + 32, qrY + qrSize + 140);

  ctx.save();
  ctx.font = "600 30px 'Arial'";
  ctx.fillStyle = SECONDARY_TEXT;
  ctx.fillText(`${t.ticketStatus}:`, contentX, currentY);
  const statusLabelWidth = ctx.measureText(`${t.ticketStatus}:`).width;
  ctx.restore();

  const badgeY = currentY - 28;
  const statusBadgeWidth = drawBadge(
    ctx,
    statusLabel,
    contentX + statusLabelWidth + 16,
    badgeY,
    statusStyle.background,
    statusStyle.text
  );
  drawBadge(
    ctx,
    actionLabel,
    contentX + statusLabelWidth + 32 + statusBadgeWidth,
    badgeY,
    "#1d4ed8",
    "#ffffff"
  );

  currentY += 64;
  drawInfoRow(ctx, t.ticketCreated, createdAt, contentX, currentY, contentWidth);
  currentY += 48;
  drawInfoRow(
    ctx,
    t.ticketTotal,
    ticket.total.toFixed(2),
    contentX,
    currentY,
    contentWidth
  );
  currentY += 48;
  drawInfoRow(
    ctx,
    t.ticketContacts,
    `${ticket.contact.phone}, ${ticket.contact.email}`,
    contentX,
    currentY,
    contentWidth
  );

  currentY += 72;

  const columnGap = 36;
  const columnCount = ticket.inbound ? 2 : 1;
  const columnWidth =
    (contentWidth - columnGap * (columnCount - 1)) / columnCount;
  const outboundHeight = drawSegmentCard(
    ctx,
    t.ticketOutbound,
    ticket.outbound,
    contentX,
    currentY,
    ticket.inbound ? columnWidth : contentWidth
  );

  let segmentHeight = outboundHeight;
  if (ticket.inbound) {
    const inboundHeight = drawSegmentCard(
      ctx,
      t.ticketReturn,
      ticket.inbound,
      contentX + columnWidth + columnGap,
      currentY,
      columnWidth
    );
    segmentHeight = Math.max(outboundHeight, inboundHeight);
  }

  currentY += segmentHeight + 72;

  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = "600 36px 'Arial'";
  ctx.fillText(t.ticketPassengers, contentX, currentY);

  currentY += 48;
  const cardGap = 28;
  const cardsPerRow = ticket.passengers.length > 1 ? 2 : 1;
  const cardWidth =
    (contentWidth - cardGap * (cardsPerRow - 1)) / cardsPerRow;
  let cardX = contentX;
  let cardY = currentY;
  let maxRowHeight = 0;

  ticket.passengers.forEach((passenger, index) => {
    const cardHeight = drawPassengerCard(
      ctx,
      passenger,
      index,
      Boolean(ticket.inbound),
      cardX,
      cardY,
      cardWidth,
      t
    );
    maxRowHeight = Math.max(maxRowHeight, cardHeight);
    if ((index + 1) % cardsPerRow === 0) {
      cardX = contentX;
      cardY += maxRowHeight + cardGap;
      maxRowHeight = 0;
    } else {
      cardX += cardWidth + cardGap;
    }
  });
};
