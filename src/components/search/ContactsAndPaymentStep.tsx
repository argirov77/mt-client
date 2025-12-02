import FormInput from "../common/FormInput";

import type { ElectronicTicketData } from "@/types/ticket";

type Dict = {
  book: string;
  pay: string;
  ticketDownload: string;
  contactsDescription: string;
  contactsAndPayment: string;
  contactsPhone: string;
  contactsEmail: string;
};

type Props = {
  t: Dict;
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  purchaseId: number | null;
  ticket: ElectronicTicketData | null;
  handleAction: (action: "book" | "purchase") => void;
  handlePay: () => void;
  onDownloadTicket?: (ticketNumber: string) => void;
};

export default function ContactsAndPaymentStep({
  t,
  phone,
  setPhone,
  email,
  setEmail,
  purchaseId,
  ticket,
  handleAction,
  handlePay,
  onDownloadTicket,
}: Props) {
  return (
    <div className="space-y-4">
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
