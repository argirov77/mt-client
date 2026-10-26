import React from "react";

import BookingPanel from "../BookingPanel";
import type { Dict, Lang, Step, Tour } from "../types";

export type StepTwoProps = {
  renderStepHeader: (stepNumber: Step, title: string, summary: string) => React.ReactNode;
  t: Dict;
  lang: Lang;
  safeSeatCount: number;
  safeDiscountCount: number;
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  selectedOutboundTour: Tour | null;
  selectedReturnTour: Tour | null;
  selectedOutboundSeats: number[];
  setSelectedOutboundSeats: React.Dispatch<React.SetStateAction<number[]>>;
  selectedReturnSeats: number[];
  setSelectedReturnSeats: React.Dispatch<React.SetStateAction<number[]>>;
  passengerNames: string[];
  setPassengerNames: React.Dispatch<React.SetStateAction<string[]>>;
  extraBaggageOutbound: boolean[];
  setExtraBaggageOutbound: React.Dispatch<React.SetStateAction<boolean[]>>;
  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: React.Dispatch<React.SetStateAction<boolean[]>>;
  highlightNameIndex: number | null;
  step2Summary: string;
};

export default function StepTwo({
  renderStepHeader,
  t,
  lang,
  safeSeatCount,
  safeDiscountCount,
  fromId,
  toId,
  fromName,
  toName,
  selectedOutboundTour,
  selectedReturnTour,
  selectedOutboundSeats,
  setSelectedOutboundSeats,
  selectedReturnSeats,
  setSelectedReturnSeats,
  passengerNames,
  setPassengerNames,
  extraBaggageOutbound,
  setExtraBaggageOutbound,
  extraBaggageReturn,
  setExtraBaggageReturn,
  highlightNameIndex,
  step2Summary,
}: StepTwoProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-[#e3dfd9] bg-white p-4 shadow-sm">
      {renderStepHeader(2, t.step2Title, step2Summary)}
      <div>
        {selectedOutboundTour ? (
          <BookingPanel
            t={t}
            lang={lang}
            seatCount={safeSeatCount}
            discountCount={safeDiscountCount}
            fromId={fromId}
            toId={toId}
            fromName={fromName}
            toName={toName}
            selectedOutboundTour={selectedOutboundTour}
            selectedReturnTour={selectedReturnTour}
            selectedOutboundSeats={selectedOutboundSeats}
            setSelectedOutboundSeats={setSelectedOutboundSeats}
            selectedReturnSeats={selectedReturnSeats}
            setSelectedReturnSeats={setSelectedReturnSeats}
            passengerNames={passengerNames}
            setPassengerNames={setPassengerNames}
            extraBaggageOutbound={extraBaggageOutbound}
            setExtraBaggageOutbound={setExtraBaggageOutbound}
            extraBaggageReturn={extraBaggageReturn}
            setExtraBaggageReturn={setExtraBaggageReturn}
            highlightNameIndex={highlightNameIndex}
          />
        ) : (
          <p className="text-sm text-[#5c6370]">{t.outboundShort} {t.outboundNotSelected}</p>
        )}
      </div>
    </section>
  );
}
