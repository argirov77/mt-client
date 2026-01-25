import { useState } from "react";

import FormInput from "../common/FormInput";
import PhoneInput from "../common/PhoneInput";
import { useLockBodyScroll } from "@/utils/useLockBodyScroll";
import { useModalVisibility } from "@/utils/useModalVisibility";

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
  publicOfferConsent: string;
  publicOfferLink: string;
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
  extraBaggageHeading: string;
  configureBaggage: string;
  pricePerBagLabel: string;
  baggageToggleHide: string;
  baggageIncludedBadge: string;
  baggageCollapsedHint: string;
  passengerLabel: (index: number) => string;
  addBagAria: string;
  removeBagAria: string;
};

export type BaggagePriceByDirection = {
  outbound: string | null;
  return: string | null;
};

type Props = {
  t: Dict;
  passengerNames: string[];
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  fromName: string;
  toName: string;
  hasReturnSection: boolean;
  baggagePriceByDirection: BaggagePriceByDirection;
  extraBaggageOutbound: boolean[];
  setExtraBaggageOutbound: (value: boolean[]) => void;
  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: (value: boolean[]) => void;
  purchaseId: number | null;
  ticket: ElectronicTicketData | null;
  publicOfferUrl: string;
  handleAction: (action: "book" | "purchase") => void;
  handlePay: () => void;
  onDownloadTicket?: (ticketNumber: string) => void;
};

export default function ContactsAndPaymentStep({
  t,
  passengerNames,
  phone,
  setPhone,
  email,
  setEmail,
  fromName,
  toName,
  hasReturnSection,
  baggagePriceByDirection,
  extraBaggageOutbound,
  setExtraBaggageOutbound,
  extraBaggageReturn,
  setExtraBaggageReturn,
  purchaseId,
  ticket,
  publicOfferUrl,
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

  const passengerLabel = (idx: number) => t.passengerLabel(idx + 1);

  const getBaggagePriceLabel = (direction: "outbound" | "return") => {
    const directionPrice =
      direction === "return"
        ? baggagePriceByDirection.return ?? baggagePriceByDirection.outbound
        : baggagePriceByDirection.outbound;

    return directionPrice ?? t.extraBaggagePrice;
  };

  const renderPriceBadgeContent = () => {
    const outboundLabel = baggagePriceByDirection.outbound;
    const returnLabel = hasReturnSection ? baggagePriceByDirection.return : null;

    if (returnLabel && returnLabel !== outboundLabel) {
      return `${t.outboundShort}: ${outboundLabel ?? t.extraBaggagePrice} · ${t.inboundShort}: ${returnLabel}`;
    }

    return outboundLabel ?? returnLabel ?? t.extraBaggagePrice;
  };

  const [isBaggageModalOpen, setIsBaggageModalOpen] = useState(false);
  const baggageModal = useModalVisibility(isBaggageModalOpen);

  useLockBodyScroll(baggageModal.shouldRender);

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
              {t.extraBaggageHeading}
            </div>
            <p className="text-xs text-slate-500">
              {isAdded ? t.removeExtraBaggage : t.baggageIncludedNote}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">{getBaggagePriceLabel(direction)}</span>
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-900">
              <button
                type="button"
                onClick={handleDec}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200"
                aria-label={t.removeBagAria}
              >
                −
              </button>
              <div className="w-6 text-center tabular-nums">{isAdded ? 1 : 0}</div>
              <button
                type="button"
                onClick={handleInc}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200"
                aria-label={t.addBagAria}
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
            <button
              type="button"
              onClick={() => setIsBaggageModalOpen(true)}
              aria-haspopup="dialog"
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              {t.addExtraBaggage}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{t.contactsAndPayment}</h3>
        <p className="text-sm text-slate-600">{t.contactsDescription}</p>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:flex-wrap">
          <div className="w-full min-w-0 flex-1 space-y-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-sky-50 to-blue-50/60 p-4 shadow-inner">
            <label
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
              htmlFor="contact-phone"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-slate-100">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.5 3.75h1.25c.35 0 .64.26.7.6l.6 3.52a.7.7 0 01-.41.75l-1.1.48c.86 2.22 2.57 3.94 4.79 4.79l.48-1.1a.7.7 0 01.75-.41l3.52.6c.34.06.6.35.6.7V18c0 .69-.56 1.25-1.25 1.25H17A12.25 12.25 0 014.75 7V4.99c0-.68.56-1.24 1.25-1.24z"
                  />
                </svg>
              </span>
              <span>{t.contactsPhone}</span>
            </label>
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-2 shadow-sm">
              <PhoneInput
                id="contact-phone"
                placeholder={t.contactsPhone}
                value={phone}
                onChange={setPhone}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="w-full min-w-0 flex-1 space-y-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-sky-50/70 p-4 shadow-inner">
            <label
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
              htmlFor="contact-email"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.75 6.5h14.5a.75.75 0 01.75.75v9.5a.75.75 0 01-.75.75H4.75A.75.75 0 014 16.75v-9.5a.75.75 0 01.75-.75z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l7 5 7-5" />
                </svg>
              </span>
              <span>{t.contactsEmail}</span>
            </label>
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-2 shadow-sm">
              <FormInput
                id="contact-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-full border border-slate-200 bg-gradient-to-r from-white to-slate-50/80 px-4 text-base text-slate-900 shadow-inner focus:border-emerald-200 focus:bg-white"
              />
            </div>
          </div>
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

      {purchaseId && (
        <p className="text-xs text-slate-500">
          {t.publicOfferConsent}{" "}
          <a
            href={publicOfferUrl}
            className="font-semibold text-slate-700 underline decoration-dotted underline-offset-2 hover:text-slate-900"
            target="_blank"
            rel="noreferrer"
          >
            {t.publicOfferLink}
          </a>
          .
        </p>
      )}

      {baggageModal.shouldRender ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4 py-6 transition-opacity ease-out ${
            baggageModal.isClosing ? "opacity-0" : "opacity-100"
          } ${
            baggageModal.prefersReducedMotion ? "motion-reduce:transition-none" : ""
          }`}
          role="presentation"
          style={{ transitionDuration: `${baggageModal.animationDuration}ms` }}
          onClick={() => setIsBaggageModalOpen(false)}
        >
          <div
            className="absolute inset-0 h-full w-full cursor-default"
            aria-hidden
            onClick={() => setIsBaggageModalOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.extraBaggageHeading}
            className={`relative z-10 w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all ease-out ${
              baggageModal.isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
            } ${
              baggageModal.prefersReducedMotion
                ? "motion-reduce:transform-none motion-reduce:transition-none"
                : ""
            }`}
            style={{ transitionDuration: `${baggageModal.animationDuration}ms` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.extraBaggageHeading}</p>
                <p className="text-sm text-slate-700">{t.configureBaggage}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${badgeTone} border border-amber-100 bg-amber-50 text-amber-800`}>
                  {t.pricePerBagLabel}: {renderPriceBadgeContent()}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBaggageModalOpen(false)}
                  aria-label={t.baggageToggleHide}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50"
                >
                  <span aria-hidden>✕</span>
                  {t.baggageToggleHide}
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
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
                          <p className="text-xs uppercase tracking-wide text-slate-500">{t.passengerLabel(idx + 1)}</p>
                          <p className="text-base font-semibold text-slate-900">{displayName}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow">#{idx + 1}</span>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {renderDirection("outbound", idx)}
                      {hasReturnSection ? renderDirection("return", idx) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
