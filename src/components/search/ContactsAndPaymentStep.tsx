import FormInput from "../common/FormInput";

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
  const toggleBaggage = (idx: number, direction: "outbound" | "return") => {
    if (direction === "outbound") {
      const next = [...extraBaggageOutbound];
      next[idx] = !next[idx];
      setExtraBaggageOutbound(next);
      return;
    }

    const next = [...extraBaggageReturn];
    next[idx] = !next[idx];
    setExtraBaggageReturn(next);
  };

  const passengerLabel = (idx: number) =>
    lang === "en" ? `Passenger ${idx + 1}` : `Пассажир ${idx + 1}`;

  const renderDirection = (
    direction: "outbound" | "return",
    idx: number,
  ) => {
    const isReturn = direction === "return";
    const isAdded = isReturn
      ? extraBaggageReturn[idx] ?? false
      : extraBaggageOutbound[idx] ?? false;
    const arrow = isReturn ? "⬅️" : "➡️";
    const directionLabel = isReturn ? t.inboundShort : t.outboundShort;
    const routeLabel = isReturn
      ? `${toName} → ${fromName}`
      : `${fromName} → ${toName}`;

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-base">{arrow}</span>
            <span className="uppercase tracking-wide">{directionLabel}</span>
          </div>
          <span className="truncate text-right text-xs text-slate-500">{routeLabel}</span>
        </div>

        <button
          type="button"
          onClick={() => toggleBaggage(idx, direction)}
          className={`mt-3 flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
            isAdded
              ? "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300"
              : "border-slate-200 bg-white text-slate-900 hover:border-sky-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                isAdded
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-sky-50 text-sky-600"
              }`}
            >
              {isAdded ? "✓" : "+"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-5">
                {isAdded ? t.addedExtraBaggage : t.addExtraBaggage}
              </span>
              <span className="text-xs text-slate-500">
                {isAdded ? t.removeExtraBaggage : t.baggageIncludedNote}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span>{t.extraBaggagePrice}</span>
            {isAdded ? <span className="text-emerald-600">✓</span> : null}
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg">🎒</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg">🧳</div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">{t.baggageIncludedTitle}</div>
            <ul className="space-y-1 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✔</span>
                <span>{t.baggageIncludedCabin}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✔</span>
                <span>{t.baggageIncludedChecked}</span>
              </li>
            </ul>
            <p className="text-xs text-slate-600">{t.baggageIncludedNote}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">
          {lang === "en" ? "Extra baggage" : "Дополнительный багаж"}
        </div>
        <div className="grid gap-3">
          {passengerNames.map((name, idx) => (
            <div
              key={`baggage-${idx}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-lg">👤</div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {lang === "en" ? `Passenger #${idx + 1}` : `Пассажир #${idx + 1}`}
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {name || passengerLabel(idx)}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500">#{idx + 1}</div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {renderDirection("outbound", idx)}
                {hasReturnSection ? renderDirection("return", idx) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid max-w-xl gap-3">
        <FormInput
          type="tel"
          placeholder={t.contactsPhone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <FormInput
          type="email"
          placeholder={t.contactsEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="rounded-2xl bg-sky-50/70 p-4 text-sm text-slate-700">
        {t.contactsDescription}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleAction("book")}
          className="rounded-xl bg-sky-600 px-6 py-3 text-white shadow hover:bg-sky-700"
        >
          {t.book}
        </button>
        <button
          type="button"
          onClick={() => handleAction("purchase")}
          className="rounded-xl border border-emerald-600 px-6 py-3 text-emerald-700 shadow hover:bg-emerald-600 hover:text-white"
        >
          {t.buy}
        </button>
        {purchaseId && (
          <button
            type="button"
            onClick={handlePay}
            className="rounded-xl border border-emerald-600 px-6 py-3 text-emerald-700 shadow hover:bg-emerald-600 hover:text-white"
          >
            {t.pay}
          </button>
        )}
        {ticket?.ticketNumber && onDownloadTicket && (
          <button
            type="button"
            onClick={() => onDownloadTicket(ticket.ticketNumber)}
            className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 shadow hover:bg-slate-100"
          >
            {t.ticketDownload}
          </button>
        )}
      </div>
    </div>
  );
}
