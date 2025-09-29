import type { ElectronicTicketData, TicketSegment } from "@/types/ticket";
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

const BACKGROUND_COLOR = "#f5f7fb";
const CONTAINER_COLOR = "#ffffff";
const BORDER_COLOR = "#e6edf5";
const BRAND_COLOR = "#1f4e79";
const ACCENT_COLOR = "#f28c28";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "#5b667a";
const CHIP_PLACE_BG = "#f3f6ff";
const CHIP_PLACE_BORDER = "#dbe2f3";
const CHIP_BAG_BG = "#fff4e8";
const CHIP_BAG_BORDER = "#ffe0bf";
const PASSENGER_CARD_BG = "#f8fafc";

const SEGMENT_TOP_PADDING = 32;
const SEGMENT_ENTRY_GAP = 112;
const SEGMENT_BOTTOM_PADDING = 56;
const PASSENGER_CARD_PADDING = 20;
const PASSENGER_CARD_GAP = 18;

const tintColor = (hex: string, ratio: number): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return hex;
  }
  const mix = (component: number) => {
    const value = Math.round(component + (255 - component) * ratio);
    return Math.max(0, Math.min(255, value));
  };
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
};

const createRoundedRectPath = (
  ctx: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
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
};

const fillRoundedRect = (
  ctx: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) => {
  ctx.save();
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
};

const strokeRoundedRect = (
  ctx: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number
) => {
  ctx.save();
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
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
  return currentY;
};

const drawChip = (
  ctx: CanvasContext,
  text: string,
  x: number,
  y: number,
  options: { background: string; border: string; color: string }
) => {
  ctx.save();
  ctx.font = "700 28px 'Arial'";
  const paddingX = 24;
  const paddingY = 10;
  const textMetrics = ctx.measureText(text);
  const badgeWidth = textMetrics.width + paddingX * 2;
  const badgeHeight = (textMetrics.actualBoundingBoxAscent || 16) + (textMetrics.actualBoundingBoxDescent || 8) + paddingY * 2;
  fillRoundedRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2, options.background);
  ctx.strokeStyle = options.border;
  ctx.lineWidth = 2;
  createRoundedRectPath(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.stroke();
  ctx.fillStyle = options.color;
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
  ctx.fillStyle = TEXT_PRIMARY;
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
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
};

const drawKeyValue = (
  ctx: CanvasContext,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number
) => {
  ctx.save();
  ctx.font = "500 28px 'Arial'";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(label, x, y);

  ctx.font = "700 30px 'Arial'";
  ctx.fillStyle = TEXT_PRIMARY;
  const lastLineY = wrapText(ctx, value, x, y + 36, maxWidth, 34);
  ctx.restore();
  return lastLineY + 34;
};

const measureSegmentHeight = (segment: TicketSegment): number => {
  const entryCount = 2;
  const duration = calculateSegmentDuration(segment);
  let baseHeight = SEGMENT_TOP_PADDING + SEGMENT_BOTTOM_PADDING;
  if (entryCount > 1) {
    baseHeight += SEGMENT_ENTRY_GAP * (entryCount - 1);
  }
  if (duration) {
    baseHeight += 40;
  }
  return baseHeight;
};

const calculateSegmentDuration = (segment: TicketSegment): string | null => {
  const [depHours, depMinutes] = segment.departure_time.split(":").map(Number);
  const [arrHours, arrMinutes] = segment.arrival_time.split(":").map(Number);
  if (
    Number.isNaN(depHours) ||
    Number.isNaN(depMinutes) ||
    Number.isNaN(arrHours) ||
    Number.isNaN(arrMinutes)
  ) {
    return null;
  }
  const departureTotal = depHours * 60 + depMinutes;
  const arrivalTotal = arrHours * 60 + arrMinutes;
  let minutes = arrivalTotal - departureTotal;
  if (minutes < 0) {
    minutes += 24 * 60;
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours <= 0 && restMinutes <= 0) {
    return null;
  }
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}\u00A0ч.`);
  }
  if (restMinutes > 0) {
    parts.push(`${restMinutes}\u00A0мин.`);
  }
  return parts.length ? `~ ${parts.join(" ")}` : null;
};

const drawSegmentTimeline = (
  ctx: CanvasContext,
  segment: TicketSegment,
  label: string,
  x: number,
  y: number
) => {
  ctx.save();
  ctx.font = "700 30px 'Arial'";
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillText(label, x, y);
  ctx.restore();

  const entries = [
    {
      title: segment.fromName,
      subtitle: `${formatDate(segment.date)} · ${segment.departure_time}`,
    },
    {
      title: segment.toName,
      subtitle: `${formatDate(segment.date)} · ${segment.arrival_time}`,
    },
  ];

  const timelineX = x;
  const timelineY = y + SEGMENT_TOP_PADDING;
  const lineX = timelineX + 16;
  const textX = lineX + 36;

  ctx.save();
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lineX, timelineY);
  ctx.lineTo(lineX, timelineY + SEGMENT_ENTRY_GAP * (entries.length - 1));
  ctx.stroke();
  ctx.restore();

  entries.forEach((entry, index) => {
    const pointY = timelineY + SEGMENT_ENTRY_GAP * index;
    ctx.save();
    ctx.fillStyle = ACCENT_COLOR;
    ctx.beginPath();
    ctx.arc(lineX, pointY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = "700 32px 'Arial'";
    ctx.fillText(entry.title, textX, pointY + 6);
    ctx.font = "400 26px 'Arial'";
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(entry.subtitle, textX, pointY + 44);
    ctx.restore();
  });

  const duration = calculateSegmentDuration(segment);
  if (duration) {
    const pillY = timelineY + SEGMENT_ENTRY_GAP * (entries.length - 1) + 32;
    drawChip(ctx, duration, textX, pillY, {
      background: "#fff6ea",
      border: "#ffdfb8",
      color: "#a65300",
    });
  }
};

const measurePassengerCardHeight = (ticket: ElectronicTicketData, hasReturn: boolean): number => {
  const sectionTitleHeight = 32;
  const cardPadding = 36;
  const blockBaseHeight = () => {
    const infoLines = 2 + (hasReturn ? 2 : 0);
    const innerHeight =
      PASSENGER_CARD_PADDING * 2 +
      34 +
      infoLines * 28;
    return innerHeight;
  };

  const passengerBlocksHeight = ticket.passengers.reduce((total, _passenger, index) => {
    const blockHeight = blockBaseHeight();
    return total + blockHeight + (index > 0 ? PASSENGER_CARD_GAP : 0);
  }, 0);

  const infoRowCount = 3;
  const paymentSectionHeight = sectionTitleHeight + 40 + infoRowCount * 110;

  return (
    cardPadding * 2 +
    sectionTitleHeight +
    16 +
    passengerBlocksHeight +
    40 +
    paymentSectionHeight
  );
};

const drawPassengerPaymentCard = (
  ctx: CanvasContext,
  ticket: ElectronicTicketData,
  t: TicketPdfLocale,
  x: number,
  y: number,
  width: number,
  statusLabel: string,
  actionLabel: string,
  createdAt: string
) => {
  const hasReturn = Boolean(ticket.inbound);
  const cardHeight = measurePassengerCardHeight(ticket, hasReturn);
  fillRoundedRect(ctx, x, y, width, cardHeight, 24, CONTAINER_COLOR);
  strokeRoundedRect(ctx, x, y, width, cardHeight, 24, BORDER_COLOR, 2);

  const cardPadding = 36;
  let currentY = y + cardPadding;
  const contentX = x + cardPadding;
  const contentWidth = width - cardPadding * 2;

  ctx.save();
  ctx.font = "600 30px 'Arial'";
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillText(t.ticketPassengers, contentX, currentY);
  ctx.restore();

  currentY += 16;

  ticket.passengers.forEach((passenger) => {
    const infoLines = [
      `${t.ticketPassengerSeat}: ${passenger.seatOutbound ?? "—"}`,
      `${t.ticketPassengerBaggage}: ${passenger.extraBaggageOutbound ? t.ticketYes : t.ticketNo}`,
    ];
    if (hasReturn) {
      infoLines.push(
        `${t.ticketPassengerSeatReturn}: ${passenger.seatReturn ?? "—"}`,
        `${t.ticketPassengerBaggageReturn}: ${passenger.extraBaggageReturn ? t.ticketYes : t.ticketNo}`
      );
    }

    const blockHeight =
      PASSENGER_CARD_PADDING * 2 +
      34 +
      infoLines.length * 28;

    fillRoundedRect(
      ctx,
      contentX,
      currentY,
      contentWidth,
      blockHeight,
      20,
      PASSENGER_CARD_BG
    );

    ctx.save();
    ctx.font = "600 30px 'Arial'";
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.fillText(passenger.name, contentX + PASSENGER_CARD_PADDING, currentY + PASSENGER_CARD_PADDING + 28);

    ctx.font = "400 26px 'Arial'";
    ctx.fillStyle = TEXT_MUTED;
    let infoY = currentY + PASSENGER_CARD_PADDING + 28 + 32;
    infoLines.forEach((line) => {
      ctx.fillText(line, contentX + PASSENGER_CARD_PADDING, infoY);
      infoY += 28;
    });
    ctx.restore();

    currentY += blockHeight + PASSENGER_CARD_GAP;
  });

  currentY += 8;

  ctx.save();
  ctx.font = "600 30px 'Arial'";
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillText(t.ticketStatus, contentX, currentY);
  ctx.restore();

  currentY += 40;

  const infoRows = [
    { label: t.ticketStatus, value: `${statusLabel} · ${actionLabel}` },
    { label: t.ticketCreated, value: createdAt },
    { label: t.ticketContacts, value: `${ticket.contact.phone}, ${ticket.contact.email}` },
  ];

  infoRows.forEach((row) => {
    currentY = drawKeyValue(ctx, row.label, row.value, contentX, currentY, contentWidth) + 20;
  });
};

const drawTripCard = (
  ctx: CanvasContext,
  ticket: ElectronicTicketData,
  t: TicketPdfLocale,
  x: number,
  y: number,
  width: number
) => {
  const segments: Array<{ label: string; segment: TicketSegment }> = [
    { label: t.ticketOutbound, segment: ticket.outbound },
  ];
  if (ticket.inbound) {
    segments.push({ label: t.ticketReturn, segment: ticket.inbound });
  }

  const cardPadding = 36;
  const sectionTitleHeight = 32;
  const segmentHeights = segments.map((item) => measureSegmentHeight(item.segment));
  const segmentsTotalHeight = segmentHeights.reduce(
    (total, height, index) => total + height + (index > 0 ? 40 : 0),
    0
  );
  const totalHeight = cardPadding * 2 + sectionTitleHeight + segmentsTotalHeight;

  fillRoundedRect(ctx, x, y, width, totalHeight, 24, CONTAINER_COLOR);
  strokeRoundedRect(ctx, x, y, width, totalHeight, 24, BORDER_COLOR, 2);

  const contentX = x + cardPadding;
  let currentY = y + cardPadding;

  ctx.save();
  ctx.font = "600 30px 'Arial'";
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillText(t.ticketOutbound, contentX, currentY);
  ctx.restore();

  currentY += sectionTitleHeight;

  segments.forEach((item, index) => {
    if (index > 0) {
      currentY += 40;
    }
    drawSegmentTimeline(ctx, item.segment, item.label, contentX, currentY);
    currentY += measureSegmentHeight(item.segment);
  });
};

const drawHeader = (
  ctx: CanvasContext,
  options: TemplateOptions,
  x: number,
  y: number,
  width: number
) => {
  const { ticket, t, statusLabel, createdAt, onlineUrl, statusStyle } = options;
  const headerHeight = 360;
  const gradient = ctx.createLinearGradient(0, y, 0, y + headerHeight);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#fbfdff");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, headerHeight);

  const paddingX = 48;
  const paddingY = 40;
  const contentX = x + paddingX;
  const contentWidth = width - paddingX * 2;
  const leftWidth = contentWidth - 360 - 36;
  const leftX = contentX;
  const summaryX = leftX + leftWidth + 36;
  const summaryWidth = 360;
  let currentY = y + paddingY;

  const logoRadius = 24;
  const logoX = leftX + logoRadius;
  const logoY = currentY + logoRadius;
  const radial = ctx.createRadialGradient(
    logoX - logoRadius * 0.4,
    logoY - logoRadius * 0.4,
    logoRadius * 0.2,
    logoX,
    logoY,
    logoRadius
  );
  radial.addColorStop(0, "#ffffff");
  radial.addColorStop(1, BRAND_COLOR);
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
  ctx.fillStyle = radial;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = "900 34px 'Arial'";
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillText("МАКСИМОВ ТУРС", logoX + logoRadius + 16, currentY + 34);
  ctx.font = "600 26px 'Arial'";
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.fillText(`${t.ticketTitle}`, logoX + logoRadius + 16, currentY + 70);
  ctx.restore();

  currentY += 96;

  ctx.save();
  ctx.font = "800 64px 'Arial'";
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.fillText(ticket.outbound.fromName, leftX, currentY);
  ctx.font = "400 48px 'Arial'";
  ctx.fillText("→", leftX + ctx.measureText(ticket.outbound.fromName).width + 24, currentY);
  const toCityX = leftX + ctx.measureText(ticket.outbound.fromName).width + 24 + ctx.measureText("→").width + 24;
  ctx.font = "800 64px 'Arial'";
  ctx.fillText(ticket.outbound.toName, toCityX, currentY);
  ctx.restore();

  currentY += 40;

  const metaText = `${t.ticketNumber}: ${ticket.purchaseId} · ${t.ticketCreated}: ${createdAt}`;

  ctx.save();
  ctx.font = "400 26px 'Arial'";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(metaText, leftX, currentY);
  ctx.restore();

  currentY += 48;

  const statusBackground = tintColor(statusStyle.background, 0.75);
  const statusBorder = tintColor(statusStyle.background, 0.6);

  const chips = [
    {
      text: statusLabel,
      colors: {
        background: statusBackground,
        border: statusBorder,
        color: statusStyle.background,
      },
    },
  ];

  const seatNumbers = ticket.outbound.seatNumbers.length
    ? ticket.outbound.seatNumbers.map((seat) => `${seat}`).join(", ")
    : "—";
  chips.push({
    text: `${t.ticketPassengerSeat}: ${seatNumbers}`,
    colors: { background: CHIP_PLACE_BG, border: CHIP_PLACE_BORDER, color: BRAND_COLOR },
  });

  const baggageCount = ticket.outbound.extraBaggage.filter(Boolean).length;
  chips.push({
    text: `${t.ticketPassengerBaggage}: ${baggageCount > 0 ? baggageCount : t.ticketNo}`,
    colors: { background: CHIP_BAG_BG, border: CHIP_BAG_BORDER, color: "#a65300" },
  });

  let chipX = leftX;
  chips.forEach((chip, index) => {
    const widthUsed = drawChip(ctx, chip.text, chipX, currentY, chip.colors);
    chipX += widthUsed + 16;
    if (index === chips.length - 1) {
      currentY += 70;
    }
  });

  let summaryY = y + paddingY;

  const passengerPrimary = ticket.passengers[0]?.name ?? "—";
  const extraPassengers = ticket.passengers.length - 1;
  const passengerSummary =
    extraPassengers > 0 ? `${passengerPrimary} +${extraPassengers}` : passengerPrimary;

  summaryY = drawKeyValue(ctx, t.ticketPassengers, passengerSummary, summaryX, summaryY, summaryWidth) + 12;
  summaryY = drawKeyValue(
    ctx,
    t.ticketOutbound,
    `${ticket.outbound.fromName} → ${ticket.outbound.toName}`,
    summaryX,
    summaryY,
    summaryWidth
  ) + 12;
  summaryY = drawKeyValue(
    ctx,
    t.ticketTotal,
    ticket.total.toFixed(2),
    summaryX,
    summaryY,
    summaryWidth
  ) + 20;

  ctx.save();
  ctx.font = "700 26px 'Arial'";
  const buttonTextMetrics = ctx.measureText(t.ticketOpenOnline);
  const buttonPaddingX = 28;
  const buttonWidth = Math.max(buttonTextMetrics.width + buttonPaddingX * 2, 220);
  const buttonHeight = 56;
  fillRoundedRect(ctx, summaryX, summaryY, buttonWidth, buttonHeight, 16, BRAND_COLOR);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(t.ticketOpenOnline, summaryX + buttonPaddingX, summaryY + buttonHeight / 2 + 1);
  ctx.restore();

  summaryY += buttonHeight + 20;

  const qrSize = 220;
  drawQrCode(ctx, onlineUrl, summaryX, summaryY, qrSize);
};

export const drawElectronicTicketTemplate = (
  ctx: CanvasContext,
  width: number,
  height: number,
  options: TemplateOptions
) => {
  const { ticket, t, statusLabel, actionLabel, createdAt } = options;

  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  const margin = 72;
  const containerX = margin;
  const containerY = margin;
  const containerWidth = width - margin * 2;
  const containerHeight = height - margin * 2;

  fillRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, 32, CONTAINER_COLOR);
  strokeRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, 32, BORDER_COLOR, 3);

  drawHeader(ctx, options, containerX, containerY, containerWidth);

  const headerHeight = 360;
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(containerX, containerY + headerHeight);
  ctx.lineTo(containerX + containerWidth, containerY + headerHeight);
  ctx.stroke();

  const bodyPadding = 48;
  const contentX = containerX + bodyPadding;
  const contentY = containerY + headerHeight + bodyPadding;
  const contentWidth = containerWidth - bodyPadding * 2;
  const columnGap = 36;
  const leftRatio = 1.12;
  const rightRatio = 0.88;
  const baseWidth = (contentWidth - columnGap) / (leftRatio + rightRatio);
  const leftWidth = baseWidth * leftRatio;
  const rightWidth = baseWidth * rightRatio;

  drawTripCard(ctx, ticket, t, contentX, contentY, leftWidth);
  drawPassengerPaymentCard(
    ctx,
    ticket,
    t,
    contentX + leftWidth + columnGap,
    contentY,
    rightWidth,
    statusLabel,
    actionLabel,
    createdAt
  );

  const footerHeight = 92;
  const footerY = containerY + containerHeight - footerHeight;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(containerX, footerY, containerWidth, footerHeight);
  ctx.strokeStyle = BORDER_COLOR;
  ctx.beginPath();
  ctx.moveTo(containerX, footerY);
  ctx.lineTo(containerX + containerWidth, footerY);
  ctx.stroke();

  ctx.save();
  ctx.font = "400 26px 'Arial'";
  ctx.fillStyle = TEXT_MUTED;
  const footerTextLeft = "Полис страхования ответственности перевозчика действует на протяжении всего рейса.";
  const footerTextRight = "Since 1992 · Максимов Турс";
  ctx.fillText(footerTextLeft, contentX, footerY + 52);
  const rightTextWidth = ctx.measureText(footerTextRight).width;
  ctx.fillText(footerTextRight, containerX + containerWidth - bodyPadding - rightTextWidth, footerY + 52);
  ctx.restore();
};
