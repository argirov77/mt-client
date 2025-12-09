import { useState } from "react";

import FormInput from "../common/FormInput";
import PhoneInput from "../common/PhoneInput";

import type { ElectronicTicketData } from "@/types/ticket";

type Dict = {
  book: string;
  buy: string;
  pay: string;
  outboundShort: string;
  inboundShort: string;
  ticketDownload: string;
  contactsDescription: string;
  contactsAndPayment: string;
  contactsPhone: string;
  contactsEmail: string;
  ticketPassengerBaggage: string;
  ticketPassengerBaggageReturn: string;
  baggageIncludedTitle: string;
  baggageIncludedCabin: string;
  baggageIncludedChecked: string;
  baggageIncludedNote: string;
  extraBaggagePrice: string;
  addExtraBaggage: string;
  addedExtraBaggage: string;
  removeExtraBaggage: string;
};

type Props = {
  t: Dict;
  lang?: "ru" | "bg" | "en" | "ua";
  passengerNames: string[];
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  fromName: string;
  toName: string;
  hasReturnSection: boolean;
  extraBaggageOutbound: boolean[];
  setExtraBaggageOutbound: (value: boolean[]) => void;
  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: (value: boolean[]) => void;
  purchaseId: number | null;
  ticket: ElectronicTicketData | null;
  handleAction: (action: "book" | "purchase") => void;
  handlePay: () => void;
  onDownloadTicket?: (ticketNumber: string) => void;
};

export default function ContactsAndPaymentStep({
  t,
  lang = "ru",
  passengerNames,
  phone,
  setPhone,
  email,
  setEmail,
  fromName,
  toName,
  hasReturnSection,
  extraBaggageOutbound,
  setExtraBaggageOutbound,
  extraBaggageReturn,
  setExtraBaggageReturn,
  purchaseId,
  ticket,
  handleAction,
  handlePay,
  onDownloadTicket,
}: Props) {
  const badgeTone = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";

  const setBaggageValue = (idx: number, direction: "outbound" | "return", value: boolean) => {
    if (direction === "outbound") {
      const next = [...extraBaggageOutbound];
      next[idx] = value;
      setExtraBaggageOutbound(next);
      return;
    }

    const next = [...extraBaggageReturn];
    next[idx] = value;
    setExtraBaggageReturn(next);
  };

  const passengerLabel = (idx: number) =>
    lang === "en" ? `Passenger ${idx + 1}` : `Пассажир ${idx + 1}`;

  const [isBaggageExpanded, setIsBaggageExpanded] = useState(false);
  const baggageToggleLabel = isBaggageExpanded
    ? lang === "en"
      ? "Hide"
      : "Свернуть"
    : t.addExtraBaggage;

  const renderDirection = (
    direction: "outbound" | "return",
    idx: number,
  ) => {
    const isReturn = direction === "return";
    const isAdded = isReturn
      ? extraBaggageReturn[idx] ?? false
      : extraBaggageOutbound[idx] ?? false;
    const directionLabel = isReturn ? t.inboundShort : t.outboundShort;
    const routeLabel = isReturn
      ? `${toName} → ${fromName}`
      : `${fromName} → ${toName}`;

    const handleDec = () => {
      setBaggageValue(idx, direction, false);
    };

    const handleInc = () => {
      setBaggageValue(idx, direction, true);
    };

    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
            {directionLabel}
          </span>
          <span className="text-slate-500">{routeLabel}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">
              {lang === "en" ? "Extra baggage" : "Дополнительный багаж"}
            </div>
            <p className="text-xs text-slate-500">
              {isAdded ? t.removeExtraBaggage : t.baggageIncludedNote}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">{t.extraBaggagePrice}</span>
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-900">
              <button
                type="button"
                onClick={handleDec}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200"
                aria-label={lang === "en" ? "Remove bag" : "Убрать багаж"}
              >
                −
              </button>
              <div className="w-6 text-center tabular-nums">{isAdded ? 1 : 0}</div>
              <button
                type="button"
                onClick={handleInc}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200"
                aria-label={lang === "en" ? "Add bag" : "Добавить багаж"}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`${badgeTone} bg-sky-100 text-sky-800`}>{t.baggageIncludedTitle}</div>
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">●</span>
                <span>{t.baggageIncludedCabin}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">●</span>
                <span>{t.baggageIncludedChecked}</span>
              </li>
            </ul>
            <p className="text-xs text-slate-500">{t.baggageIncludedNote}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2 text-right text-xs text-slate-500">
            <span className={`${badgeTone} bg-white text-slate-700 shadow-sm`}>{t.contactsAndPayment}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 shadow-sm">
              {lang === "en" ? "Bags included" : "Багаж включён"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {lang === "en" ? "Extra baggage" : "Дополнительный багаж"}
            </h3>
            <p className="text-sm text-slate-600">
              {lang === "en"
                ? "Configure baggage for each passenger"
                : "Добавьте места багажа для каждого пассажира"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`${badgeTone} bg-amber-50 text-amber-800 border border-amber-100`}>
              {lang === "en" ? "€ per bag" : "Цена за место"}: {t.extraBaggagePrice}
            </span>
            <button
              type="button"
              onClick={() => setIsBaggageExpanded((prev) => !prev)}
              aria-expanded={isBaggageExpanded}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              {baggageToggleLabel}
            </button>
          </div>
        </div>

        {isBaggageExpanded ? (
          <div className="mt-4 grid gap-3">
            {passengerNames.map((name, idx) => {
              const displayName = name || passengerLabel(idx);

              return (
                <div
                  key={`baggage-${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-semibold text-sky-800">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {lang === "en" ? "Passenger" : "Пассажир"}
                        </p>
                        <p className="text-base font-semibold text-slate-900">{displayName}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {renderDirection("outbound", idx)}
                    {hasReturnSection ? renderDirection("return", idx) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            {lang === "en"
              ? "Click \"Add baggage\" to configure checked bags for your passengers."
              : "Нажмите «Добавить багаж», чтобы настроить багаж для пассажиров."}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{t.contactsAndPayment}</h3>
        <p className="text-sm text-slate-600">{t.contactsDescription}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span className="text-slate-600">{t.contactsPhone}</span>
            <PhoneInput
              placeholder={t.contactsPhone}
              value={phone}
              onChange={setPhone}
              required
              className="w-full"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span className="text-slate-600">{t.contactsEmail}</span>
            <FormInput
              type="email"
              placeholder={t.contactsEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 shadow-inner focus:bg-white"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleAction("book")}
          className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:shadow"
        >
          {t.book}
        </button>
        <button
          type="button"
          onClick={() => handleAction("purchase")}
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          {t.buy}
        </button>
        {purchaseId && (
          <button
            type="button"
            onClick={handlePay}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-100"
          >
            {t.pay}
          </button>
        )}
        {ticket?.ticketNumber && onDownloadTicket && (
          <button
            type="button"
            onClick={() => onDownloadTicket(ticket.ticketNumber)}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:shadow"
          >
            {t.ticketDownload}
          </button>
        )}
      </div>
    </div>
  );
}
