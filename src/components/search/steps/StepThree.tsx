import React from "react";

import ContactsAndPaymentStep, { type BaggagePriceByDirection } from "../ContactsAndPaymentStep";
import TicketDownloadPrompt from "../TicketDownloadPrompt";
import type { ElectronicTicketData } from "@/types/ticket";

import type { Dict, Step } from "../types";

export type StepThreeProps = {
  renderStepHeader: (stepNumber: Step, title: string, summary: string) => React.ReactNode;
  t: Dict;
  passengerNames: string[];
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  fromName: string;
  toName: string;
  returnRequired: boolean;
  baggagePriceByDirection: BaggagePriceByDirection;
  extraBaggageOutbound: boolean[];
  setExtraBaggageOutbound: React.Dispatch<React.SetStateAction<boolean[]>>;
  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: React.Dispatch<React.SetStateAction<boolean[]>>;
  purchaseId: number | null;
  ticket: ElectronicTicketData | null;
  publicOfferUrl: string;
  handleAction: (action: "book" | "purchase") => Promise<void> | void;
  handlePay: () => Promise<void> | void;
  handleTicketDownloadClick: (ticketNumberOverride?: string) => void;
  handlePromptClose: () => void;
  showDownloadPrompt: boolean;
  step3Summary: string;
};

export default function StepThree({
  renderStepHeader,
  t,
  passengerNames,
  phone,
  setPhone,
  email,
  setEmail,
  fromName,
  toName,
  returnRequired,
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
  handleTicketDownloadClick,
  handlePromptClose,
  showDownloadPrompt,
  step3Summary,
}: StepThreeProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      {renderStepHeader(3, t.contactsAndPayment, step3Summary)}
      <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-3">
        <ContactsAndPaymentStep
          t={t}
          passengerNames={passengerNames}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          fromName={fromName}
          toName={toName}
          hasReturnSection={returnRequired}
          baggagePriceByDirection={baggagePriceByDirection}
          extraBaggageOutbound={extraBaggageOutbound}
          setExtraBaggageOutbound={setExtraBaggageOutbound}
          extraBaggageReturn={extraBaggageReturn}
          setExtraBaggageReturn={setExtraBaggageReturn}
          purchaseId={purchaseId}
          ticket={ticket}
          publicOfferUrl={publicOfferUrl}
          handleAction={handleAction}
          handlePay={handlePay}
          onDownloadTicket={handleTicketDownloadClick}
        />
        <TicketDownloadPrompt
          visible={showDownloadPrompt && !!ticket}
          t={t}
          onDownload={() => handleTicketDownloadClick()}
          onClose={handlePromptClose}
        />
      </div>
    </section>
  );
}
