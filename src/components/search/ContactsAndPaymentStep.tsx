import FormInput from "../common/FormInput";

import type { ElectronicTicketData } from "@/types/ticket";

type Dict = {
  book: string;
  buy: string;
  pay: string;
  ticketDownload: string;
  contactsDescription: string;
  contactsAndPayment: string;
  contactsPhone: string;
  contactsEmail: string;
  ticketPassengerBaggage: string;
  ticketPassengerBaggageReturn: string;
};

type Props = {
  t: Dict;
  lang?: "ru" | "bg" | "en" | "ua";
  passengerNames: string[];
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {lang === "en" ? "Extra baggage" : "Дополнительный багаж"}
            </div>
            <p className="text-xs text-slate-500">
              {lang === "en"
                ? "Set baggage separately for each ticket"
                : "Отметьте багаж отдельно для каждого билета"}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {passengerNames.map((name, idx) => (
            <div
              key={`baggage-${idx}`}
              className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span className="truncate">{name || passengerLabel(idx)}</span>
                <span className="text-xs font-medium text-slate-500">#{idx + 1}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 shadow-sm transition-colors hover:border-sky-200">
                  <input
                    type="checkbox"
                    checked={extraBaggageOutbound[idx] ?? false}
                    onChange={() => toggleBaggage(idx, "outbound")}
                  />
                  <span>{t.ticketPassengerBaggage}</span>
                </label>
                {hasReturnSection ? (
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 shadow-sm transition-colors hover:border-sky-200">
                    <input
                      type="checkbox"
                      checked={extraBaggageReturn[idx] ?? false}
                      onChange={() => toggleBaggage(idx, "return")}
                    />
                    <span>{t.ticketPassengerBaggageReturn}</span>
                  </label>
                ) : null}
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
