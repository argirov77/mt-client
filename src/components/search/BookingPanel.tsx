import React, { useEffect, useMemo, useState } from "react";
import SeatClient from "../SeatClient";
import type { Tour } from "./SearchResults";
import FormInput from "../common/FormInput";

type Dict = {
  freeSeats: (n: number) => string;
  outboundShort: string;
  inboundShort: string;
  next: string;
  seatSelectionTitle: string;
  openSeatPicker: string;
  hideSeatPicker: string;
  selectedSeatsLabel: (selected: number, total: number) => string;
  passengersTitle: string;
  passengersHint: string;
  passengerPlaceholder: string;
  errorSelectSeat: string;
  errorFillName: string;
};

type Props = {
  t: Dict;
  seatCount: number;
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;

  selectedOutboundTour: Tour;
  selectedReturnTour: Tour | null;

  selectedOutboundSeats: number[];
  setSelectedOutboundSeats: (v: number[]) => void;

  selectedReturnSeats: number[];
  setSelectedReturnSeats: (v: number[]) => void;

  passengerNames: string[];
  setPassengerNames: (v: string[]) => void;

  extraBaggageOutbound: boolean[];
  setExtraBaggageOutbound: (v: boolean[]) => void;

  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: (v: boolean[]) => void;

  /** вызываем при готовности перейти к контактам */
  onReadyForContacts?: () => void;
};

export default function BookingPanel({
  t,
  seatCount,
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

  onReadyForContacts,
}: Props) {
  const [activeLeg, setActiveLeg] = useState<"outbound" | "return">("outbound");
  const [outboundSeatsOpen, setOutboundSeatsOpen] = useState(false);
  const [returnSeatsOpen, setReturnSeatsOpen] = useState(false);

  const outboundComplete = useMemo(
    () => selectedOutboundSeats.length === seatCount,
    [seatCount, selectedOutboundSeats.length]
  );
  const returnComplete = useMemo(
    () => !selectedReturnTour || selectedReturnSeats.length === seatCount,
    [seatCount, selectedReturnSeats.length, selectedReturnTour]
  );
  const namesFilled = useMemo(
    () =>
      passengerNames.length === seatCount &&
      passengerNames.every((n) => n.trim().length > 0),
    [passengerNames, seatCount]
  );

  const readyForNext = seatCount > 0 && outboundComplete && returnComplete && namesFilled;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (readyForNext) {
      setErrorMessage(null);
    }
  }, [readyForNext]);

  // гарантируем, что массивы багажа не пустые
  useEffect(() => {
    setExtraBaggageOutbound((prev) => {
      if (prev.length === seatCount) return prev;
      return Array(seatCount).fill(false);
    });
    setExtraBaggageReturn((prev) => {
      if (prev.length === seatCount) return prev;
      return Array(seatCount).fill(false);
    });
  }, [seatCount, setExtraBaggageOutbound, setExtraBaggageReturn]);

  const legTabs = selectedReturnTour ? (
    <div className="mt-5 inline-flex overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setActiveLeg("outbound")}
        className={`px-4 py-2 ${
          activeLeg === "outbound" ? "bg-sky-600 text-white" : "bg-white text-sky-600"
        }`}
      >
        {t.outboundShort}
      </button>
      <button
        type="button"
        onClick={() => setActiveLeg("return")}
        className={`px-4 py-2 ${
          activeLeg === "return" ? "bg-sky-600 text-white" : "bg-white text-sky-600"
        }`}
      >
        {t.inboundShort}
      </button>
    </div>
  ) : null;

  const renderSeatSection = (
    isOpen: boolean,
    setIsOpen: (v: boolean) => void,
    selectedSeats: number[],
    setSelectedSeats: (v: number[]) => void,
    tour: Tour,
    departureId: number,
    arrivalId: number,
    departureText: string,
    arrivalText: string,
    extraBaggage: boolean,
    onExtraBaggageChange: (v: boolean) => void
  ) => (
    <section className="space-y-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t.seatSelectionTitle}</h3>
          <p className="text-sm text-slate-600">
            {t.selectedSeatsLabel(selectedSeats.length, seatCount)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          {isOpen ? t.hideSeatPicker : t.openSeatPicker}
        </button>
      </div>

      {isOpen && (
        <SeatClient
          tourId={tour.id}
          departureStopId={departureId}
          arrivalStopId={arrivalId}
          layoutVariant={tour.layout_variant || undefined}
          selectedSeats={selectedSeats}
          maxSeats={seatCount}
          onChange={(seats) => {
            setSelectedSeats(seats);
            if (seats.length === seatCount) {
              setIsOpen(false);
            }
          }}
          departureText={departureText}
          arrivalText={arrivalText}
          extraBaggage={extraBaggage}
          onExtraBaggageChange={onExtraBaggageChange}
          showExtraBaggage={false}
        />
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      {legTabs}

      {(!selectedReturnTour || activeLeg === "outbound") &&
        renderSeatSection(
          outboundSeatsOpen,
          setOutboundSeatsOpen,
          selectedOutboundSeats,
          setSelectedOutboundSeats,
          selectedOutboundTour,
          fromId,
          toId,
          `${fromName} ${selectedOutboundTour.departure_time}`,
          `${toName} ${selectedOutboundTour.arrival_time}`,
          extraBaggageOutbound[0] || false,
          (v) => {
            const arr = [...extraBaggageOutbound];
            arr[0] = v;
            setExtraBaggageOutbound(arr);
          }
        )}

      {selectedReturnTour &&
        activeLeg === "return" &&
        renderSeatSection(
          returnSeatsOpen,
          setReturnSeatsOpen,
          selectedReturnSeats,
          setSelectedReturnSeats,
          selectedReturnTour,
          toId,
          fromId,
          `${toName} ${selectedReturnTour.departure_time}`,
          `${fromName} ${selectedReturnTour.arrival_time}`,
          extraBaggageReturn[0] || false,
          (v) => {
            const arr = [...extraBaggageReturn];
            arr[0] = v;
            setExtraBaggageReturn(arr);
          }
        )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-2 flex w-full max-w-[640px] flex-col gap-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200"
      >
        <div className="text-base font-semibold text-slate-900">{t.passengersTitle}</div>
        <p className="text-sm text-slate-600">{t.passengersHint}</p>

        {passengerNames.map((name, idx) => (
          <label key={idx} className="space-y-1 text-sm font-medium text-slate-800">

            <FormInput
              type="text"
              placeholder={t.passengerPlaceholder}
              required
              value={name}
              onChange={(e) => {
                const arr = [...passengerNames];
                arr[idx] = e.target.value;
                setPassengerNames(arr);
              }}
              className="flex-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-base shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </label>
        ))}
      </form>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          aria-disabled={!readyForNext}
          onClick={() => {
            if (readyForNext) {
              setErrorMessage(null);
              onReadyForContacts?.();
              return;
            }

            if (!outboundComplete || !returnComplete) {
              setErrorMessage(t.errorSelectSeat);
              return;
            }

            if (!namesFilled) {
              setErrorMessage(t.errorFillName);
            }
          }}
          className={`rounded-xl px-6 py-3 text-white shadow transition ${
            readyForNext
              ? "bg-sky-600 hover:bg-sky-700"
              : "cursor-not-allowed bg-slate-300 text-slate-600"
          }`}
        >
          {t.next}
        </button>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
