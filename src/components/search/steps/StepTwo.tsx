import React from "react";

import BookingPanel from "../BookingPanel";
import type { Dict, Step, Tour } from "../types";

export type StepTwoProps = {
  renderStepHeader: (stepNumber: Step, title: string, summary: string) => React.ReactNode;
  t: Dict;
  safeSeatCount: number;
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
  handleReadyForContacts: () => void;
  step2Summary: string;
};

export default function StepTwo({
  renderStepHeader,
  t,
  safeSeatCount,
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
  handleReadyForContacts,
  step2Summary,
}: StepTwoProps) {
  return (
    <section className="space-y-3 rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-4 sm:shadow-sm">
      {renderStepHeader(2, t.step2Title, step2Summary)}
      <div className="rounded-none border-0 bg-transparent p-0 sm:rounded-xl sm:border sm:border-slate-100 sm:bg-white sm:p-3">
        {selectedOutboundTour ? (
          <BookingPanel
            t={t}
            seatCount={safeSeatCount}
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
            onReadyForContacts={handleReadyForContacts}
          />
        ) : (
          <p className="text-sm text-slate-600">{t.outboundShort} {t.outboundNotSelected}</p>
        )}
      </div>
    </section>
  );
}
