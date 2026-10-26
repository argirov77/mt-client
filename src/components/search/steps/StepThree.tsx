import React from "react";

import ContactsAndPaymentStep, { type BaggagePriceByDirection } from "../ContactsAndPaymentStep";

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
  defaultDialCode: string;
  phoneError?: string | null;
  emailError?: string | null;
  totalText?: string;
  totalNote?: string;
  step3Summary: string;
};

export default function StepThree({
  renderStepHeader,
  t,
  step3Summary,
  returnRequired,
  ...rest
}: StepThreeProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {renderStepHeader(3, t.contactsAndPayment, step3Summary)}
      <ContactsAndPaymentStep t={t} hasReturnSection={returnRequired} {...rest} />
    </section>
  );
}
