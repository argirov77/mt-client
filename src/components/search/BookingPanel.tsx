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
  seatSelectionSubtitle: string;
  openSeatPicker: string;
  changeSeatPicker: string;
  selectedSeatsLabel: (selected: number, total: number) => string;
  seatSummarySingle: (seat: number) => string;
  seatSummaryMultiple: (count: number, seats: number[]) => string;
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
  const [activeModal, setActiveModal] = useState<null | "outbound" | "return">(null);
  const [tempSeats, setTempSeats] = useState<number[]>([]);
  const [tempExtraBaggage, setTempExtraBaggage] = useState(false);

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

  const openModal = (leg: "outbound" | "return", seats: number[], extraBaggage: boolean) => {
    setTempSeats(seats);
    setTempExtraBaggage(extraBaggage);
    setActiveModal(leg);
  };

  const closeModal = () => {
    setActiveModal(null);
    setTempSeats([]);
  };

  const confirmSelection = () => {
    if (tempSeats.length === 0 || tempSeats.length !== seatCount || !activeModal) return;

    if (activeModal === "outbound") {
      setSelectedOutboundSeats(tempSeats);
      const arr = [...extraBaggageOutbound];
      arr[0] = tempExtraBaggage;
      setExtraBaggageOutbound(arr);
    } else {
      setSelectedReturnSeats(tempSeats);
      const arr = [...extraBaggageReturn];
      arr[0] = tempExtraBaggage;
      setExtraBaggageReturn(arr);
    }

    closeModal();
  };

  const renderSelectionSummary = (seats: number[]) => {
    if (!seats.length) return t.selectedSeatsLabel(seats.length, seatCount);

    const sorted = seats.slice().sort((a, b) => a - b);
    if (seatCount === 1 || sorted.length === 1) {
      return t.seatSummarySingle(sorted[0]);
    }

    return t.seatSummaryMultiple(sorted.length, sorted);
  };

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
    selectedSeats: number[],
    extraBaggage: boolean,
    isOutboundLeg: boolean
  ) => (
    <section className="space-y-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t.seatSelectionTitle}</h3>
          <p className="text-sm text-slate-600">{renderSelectionSummary(selectedSeats)}</p>
        </div>

        <button
          type="button"
          onClick={() => openModal(isOutboundLeg ? "outbound" : "return", selectedSeats, extraBaggage)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          {selectedSeats.length > 0 ? t.changeSeatPicker : t.openSeatPicker}
        </button>
      </div>
    </section>
  );

  const renderSeatModal = () => {
    if (!activeModal) return null;

    const isOutboundModal = activeModal === "outbound";
    const tour = isOutboundModal ? selectedOutboundTour : selectedReturnTour;

    if (!tour) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-3 py-6">
        <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-3 border-b px-6 py-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{t.seatSelectionTitle}</h3>
              <p className="text-sm text-slate-600">{t.seatSelectionSubtitle}</p>
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={closeModal}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              ×
            </button>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b px-6 py-3 text-sm font-medium text-slate-800">
              {t.selectedSeatsLabel(tempSeats.length, seatCount)}
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              <SeatClient
                tourId={tour.id}
                departureStopId={isOutboundModal ? fromId : toId}
                arrivalStopId={isOutboundModal ? toId : fromId}
                layoutVariant={tour.layout_variant || undefined}
                selectedSeats={tempSeats}
                maxSeats={seatCount}
                onChange={setTempSeats}
                departureText={
                  isOutboundModal
                    ? `${fromName} ${tour.departure_time}`
                    : `${toName} ${tour.departure_time}`
                }
                arrivalText={
                  isOutboundModal
                    ? `${toName} ${tour.arrival_time}`
                    : `${fromName} ${tour.arrival_time}`
                }
                extraBaggage={tempExtraBaggage}
                onExtraBaggageChange={setTempExtraBaggage}
                showExtraBaggage={false}
              />
            </div>

            <div className="flex flex-col gap-2 border-t bg-white px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={tempSeats.length !== seatCount}
                onClick={confirmSelection}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Подтвердить выбор
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSeatModal()}

      {legTabs}

      {(!selectedReturnTour || activeLeg === "outbound") &&
        renderSeatSection(
          selectedOutboundSeats,
          extraBaggageOutbound[0] || false,
          true
        )}

      {selectedReturnTour &&
        activeLeg === "return" &&
        renderSeatSection(
          selectedReturnSeats,
          extraBaggageReturn[0] || false,
          false
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
