import React, { useEffect, useMemo, useState } from "react";
import SeatClient from "../SeatClient";
import type { Tour } from "./types";
import FormInput from "../common/FormInput";
import { useLockBodyScroll } from "@/utils/useLockBodyScroll";
import { useModalVisibility } from "@/utils/useModalVisibility";

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
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [modalLeg, setModalLeg] = useState<"outbound" | "return">("outbound");
  const [modalOutboundSeats, setModalOutboundSeats] = useState<number[]>([]);
  const [modalReturnSeats, setModalReturnSeats] = useState<number[]>([]);
  const [modalOutboundExtra, setModalOutboundExtra] = useState(false);
  const [modalReturnExtra, setModalReturnExtra] = useState(false);
  const seatModal = useModalVisibility(isSeatModalOpen, 300);

  useLockBodyScroll(seatModal.shouldRender);

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

  const openModal = (leg: "outbound" | "return") => {
    setModalLeg(leg);
    setModalOutboundSeats(selectedOutboundSeats);
    setModalReturnSeats(selectedReturnSeats);
    setModalOutboundExtra(extraBaggageOutbound[0] ?? false);
    setModalReturnExtra(extraBaggageReturn[0] ?? false);
    setIsSeatModalOpen(true);
  };

  const closeModal = () => {
    setIsSeatModalOpen(false);
  };

  const confirmSelection = () => {
    const outboundValid = modalOutboundSeats.length === seatCount;
    const returnValid = !selectedReturnTour || modalReturnSeats.length === seatCount;

    if (!outboundValid || !returnValid) return;

    setSelectedOutboundSeats(modalOutboundSeats);
    const outboundBaggage = Array.from({ length: seatCount }, (_, idx) => extraBaggageOutbound[idx] ?? false);
    outboundBaggage[0] = modalOutboundExtra;
    setExtraBaggageOutbound(outboundBaggage);

    if (selectedReturnTour) {
      setSelectedReturnSeats(modalReturnSeats);
      const returnBaggage = Array.from({ length: seatCount }, (_, idx) => extraBaggageReturn[idx] ?? false);
      returnBaggage[0] = modalReturnExtra;
      setExtraBaggageReturn(returnBaggage);
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

  const renderSeatOverview = () => (
    <section className="space-y-4 rounded-none bg-transparent p-0 sm:rounded-xl sm:bg-white/70 sm:p-4 sm:shadow-sm sm:ring-1 sm:ring-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">{t.seatSelectionTitle}</h3>
          <div className="space-y-1 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {t.outboundShort}
              </span>
              <span>{renderSelectionSummary(selectedOutboundSeats)}</span>
            </div>

            {selectedReturnTour && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {t.inboundShort}
                </span>
                <span>{renderSelectionSummary(selectedReturnSeats)}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => openModal("outbound")}
          className="inline-flex items-center justify-center self-start rounded-lg border border-sky-600 bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          {selectedOutboundSeats.length > 0 || selectedReturnSeats.length > 0
            ? t.changeSeatPicker
            : t.openSeatPicker}
        </button>
      </div>
    </section>
  );

  const renderSeatModal = () => {
    if (!seatModal.shouldRender) return null;

    const isOutboundModal = modalLeg === "outbound";
    const tour = isOutboundModal ? selectedOutboundTour : selectedReturnTour;

    if (!tour) return null;

    const currentSeats = isOutboundModal ? modalOutboundSeats : modalReturnSeats;
    const currentExtraBaggage = isOutboundModal ? modalOutboundExtra : modalReturnExtra;
    const onSeatsChange = isOutboundModal ? setModalOutboundSeats : setModalReturnSeats;
    const onBaggageChange = isOutboundModal ? setModalOutboundExtra : setModalReturnExtra;
    const outboundValid = modalOutboundSeats.length === seatCount;
    const returnValid = !selectedReturnTour || modalReturnSeats.length === seatCount;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] px-3 py-4 transition-opacity ease-in-out ${
          seatModal.isClosing ? "opacity-0" : "opacity-100"
        } ${
          seatModal.prefersReducedMotion ? "motion-reduce:transition-none" : ""
        }`}
        style={{ transitionDuration: `${seatModal.animationDuration}ms` }}
        onClick={closeModal}
      >
        <div
          className={`relative flex w-full max-w-5xl transform flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-[opacity,transform] ease-in-out max-h-[80vh] ${
            seatModal.isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
          } ${
            seatModal.prefersReducedMotion
              ? "motion-reduce:transform-none motion-reduce:transition-none"
              : ""
          }`}
          style={{ transitionDuration: `${seatModal.animationDuration}ms` }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="border-b px-5 py-3">
            <div className="flex items-start justify-between gap-3">
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
            </div>

            {selectedReturnTour ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Маршрут</p>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold text-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalLeg("outbound")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                      isOutboundModal
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-700 hover:bg-white/70"
                    }`}
                    aria-pressed={isOutboundModal}
                  >
                    <span aria-hidden>⇢</span>
                    {t.outboundShort}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedReturnTour && setModalLeg("return")}
                    disabled={!selectedReturnTour}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${
                      !isOutboundModal
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-700 hover:bg-white/70"
                    } ${!selectedReturnTour ? "cursor-not-allowed opacity-60" : ""}`}
                    aria-pressed={!isOutboundModal}
                  >
                    <span aria-hidden>⇠</span>
                    {t.inboundShort}
                  </button>
                </div>
              </div>
            ) : null}
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto px-5 py-3">
              <SeatClient
                tourId={tour.id}
                departureStopId={isOutboundModal ? fromId : toId}
                arrivalStopId={isOutboundModal ? toId : fromId}
                layoutVariant={tour.layout_variant || undefined}
                selectedSeats={currentSeats}
                maxSeats={seatCount}
                onChange={onSeatsChange}
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
                extraBaggage={currentExtraBaggage}
                onExtraBaggageChange={onBaggageChange}
                showExtraBaggage={false}
              />
            </div>

            <div className="flex flex-col gap-2 border-t bg-white px-5 py-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!outboundValid || !returnValid}
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

      {renderSeatOverview()}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-2 flex w-full max-w-[640px] flex-col gap-3 rounded-none bg-transparent p-0 shadow-none ring-0 sm:rounded-xl sm:bg-white/70 sm:p-4 sm:shadow-sm sm:ring-1 sm:ring-slate-200"
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
              className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-base shadow-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:shadow-sm"
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
