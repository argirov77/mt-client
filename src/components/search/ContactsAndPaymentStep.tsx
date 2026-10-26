import { useState, type Dispatch, type SetStateAction } from "react";

import FormInput from "../common/FormInput";
import PhoneInput from "../common/PhoneInput";
import { useLockBodyScroll } from "@/utils/useLockBodyScroll";
import { useModalVisibility } from "@/utils/useModalVisibility";

type Dict = {
  total: string;
  phoneHint: string;
  emailHint: string;
  baggageIncludedShort: string;
  addBaggageShort: string;
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
  setExtraBaggageOutbound: Dispatch<SetStateAction<boolean[]>>;
  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: Dispatch<SetStateAction<boolean[]>>;
  defaultDialCode: string;
  phoneError?: string | null;
  emailError?: string | null;
  totalText?: string;
  totalNote?: string;
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
  defaultDialCode,
  phoneError,
  emailError,
  totalText,
  totalNote,
}: Props) {
  // purchase_click удалён (дубль begin_checkout без полезной нагрузки).
  // begin_checkout шлётся один раз при попадании на этот экран из SearchResults.
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
      <div className="rounded-none border-0 bg-slate-50/70 p-3 shadow-none sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white/90 sm:shadow-sm">
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

  const baggageCount =
    extraBaggageOutbound.filter(Boolean).length + extraBaggageReturn.filter(Boolean).length;

  const fieldLabel = "text-sm font-semibold text-slate-800";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-sm text-slate-700">
          {t.baggageIncludedShort}
          {baggageCount > 0 ? ` · ${t.addedExtraBaggage}: ${baggageCount}` : ""}
        </span>
        <button
          type="button"
          onClick={() => setIsBaggageModalOpen(true)}
          aria-haspopup="dialog"
          className="min-h-[44px] shrink-0 whitespace-nowrap rounded-lg px-2 text-sm font-bold text-[#0a65b0] hover:bg-sky-50"
        >
          {t.addBaggageShort}
          {baggagePriceByDirection.outbound ? (
            <span className="block text-[11px] font-semibold text-slate-600">{baggagePriceByDirection.outbound}</span>
          ) : null}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <label className={fieldLabel} htmlFor="contact-phone">
            {t.contactsPhone}
          </label>
          <PhoneInput
            id="contact-phone"
            placeholder="50 123 4567"
            value={phone}
            onChange={setPhone}
            required
            defaultDialCode={defaultDialCode}
            invalid={Boolean(phoneError)}
            describedBy="contact-phone-note"
            className="w-full"
          />
          <p
            id="contact-phone-note"
            className={`text-xs ${phoneError ? "font-semibold text-red-700" : "text-slate-600"}`}
          >
            {phoneError || t.phoneHint}
          </p>
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className={fieldLabel} htmlFor="contact-email">
            {t.contactsEmail}
          </label>
          <FormInput
            id="contact-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={Boolean(emailError) || undefined}
            aria-describedby="contact-email-note"
            className={`h-12 w-full rounded-xl bg-white px-3 text-base text-slate-900 hover:bg-white focus:outline-none focus:ring-2 ${
              emailError
                ? "border-2 border-red-600 focus:ring-red-200"
                : "border border-slate-300 focus:border-sky-500 focus:ring-sky-200"
            }`}
          />
          <p
            id="contact-email-note"
            className={`text-xs ${emailError ? "font-semibold text-red-700" : "text-slate-600"}`}
          >
            {emailError || t.emailHint}
          </p>
        </div>
      </div>

      {totalText ? (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 lg:hidden">
          <div className="flex items-baseline justify-between">
            <b className="text-sm text-slate-900">{t.total}</b>
            <b className="text-base text-slate-900">{totalText}</b>
          </div>
          {totalNote ? <p className="text-xs text-slate-700">{totalNote}</p> : null}
        </div>
      ) : null}

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
