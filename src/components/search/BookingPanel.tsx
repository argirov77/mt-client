import React, { useEffect, useRef, useState } from "react";
import SeatClient from "../SeatClient";
import type { Tour } from "./SearchResults";
import FormInput from "../common/FormInput";
import { formatDate } from "@/utils/date";

type Dict = {
  freeSeats: (n: number) => string;
  book: string;
  buy: string;
  paid: string;
  canceled: string;
  pay: string;
  cancel: string;
  outboundShort: string;
  inboundShort: string;
  ticketDownload: string;
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

  phone: string;
  setPhone: (v: string) => void;

  email: string;
  setEmail: (v: string) => void;

  extraBaggageOutbound: boolean[];
  setExtraBaggageOutbound: (v: boolean[]) => void;

  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: (v: boolean[]) => void;

  handleAction: (action: "book" | "purchase") => void;
  handlePay: () => void;
  handleCancel: () => void;
  purchaseId: number | null;
  ticketNumber: string | null;
  onDownloadTicket: (ticketNumber: string) => void;

  /** вызвать, когда шаг «места + пассажиры» полностью заполнен */
  onReadyForContacts?: () => void;
};

const free = (s: Tour["seats"]) => (typeof s === "number" ? s : s?.free ?? 0);

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

  ticketNumber,
  onDownloadTicket,
  onReadyForContacts,
}: Props) {
  const [activeLeg, setActiveLeg] = useState<"outbound" | "return">("outbound");
  const formRef = useRef<HTMLFormElement | null>(null);
  const seatsScrollTriggered = useRef(false);
  const [stepReady, setStepReady] = useState(false);

  // скролл к форме, когда выбраны все места
  useEffect(() => {
    const outboundComplete = selectedOutboundSeats.length === seatCount;
    const returnComplete =
      !selectedReturnTour || selectedReturnSeats.length === seatCount;

    if (seatCount > 0 && outboundComplete && returnComplete) {
      if (!seatsScrollTriggered.current) {
        seatsScrollTriggered.current = true;
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      seatsScrollTriggered.current = false;
    }
  }, [seatCount, selectedOutboundSeats, selectedReturnSeats, selectedReturnTour]);

  // авто-переход на 3-й шаг, когда:
  // 1) выбраны все места (туда / обратно)
  // 2) у всех пассажиров заполнены имена
  useEffect(() => {
    const outboundComplete = selectedOutboundSeats.length === seatCount;
    const returnComplete =
      !selectedReturnTour || selectedReturnSeats.length === seatCount;
    const namesFilled =
      passengerNames.length === seatCount &&
      passengerNames.every((n) => n.trim().length > 0);

    const ready =
      seatCount > 0 && outboundComplete && returnComplete && namesFilled;

    if (ready && !stepReady) {
      setStepReady(true);
      onReadyForContacts?.();
    } else if (!ready && stepReady) {
      setStepReady(false);
    }
  }, [
    seatCount,
    selectedOutboundSeats,
    selectedReturnSeats,
    selectedReturnTour,
    passengerNames,
    stepReady,
    onReadyForContacts,
  ]);

  return (
    <>
      {selectedReturnTour && (
        <div className="mt-5 inline-flex overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setActiveLeg("outbound")}
            className={`px-4 py-2 ${
              activeLeg === "outbound"
                ? "bg-sky-600 text-white"
                : "bg-white text-sky-600"
            }`}
          >
            {t.outboundShort}
          </button>
          <button
            type="button"
            onClick={() => setActiveLeg("return")}
            className={`px-4 py-2 ${
              activeLeg === "return"
                ? "bg-sky-600 text-white"
                : "bg-white text-sky-600"
            }`}
          >
            {t.inboundShort}
          </button>
        </div>
      )}

      {/* места туда */}
      {(!selectedReturnTour || activeLeg === "outbound") && (
        <>
          <h3 className="mt-5">
            Рейс туда #{selectedOutboundTour.id}, дата:{" "}
            {formatDate(selectedOutboundTour.date)}
          </h3>
          <p>{t.freeSeats(free(selectedOutboundTour.seats))}</p>
          <p>Выберите места:</p>

          <SeatClient
            tourId={selectedOutboundTour.id}
            departureStopId={fromId}
            arrivalStopId={toId}
            layoutVariant={selectedOutboundTour.layout_variant || undefined}
            selectedSeats={selectedOutboundSeats}
            maxSeats={seatCount}
            onChange={setSelectedOutboundSeats}
            departureText={`${fromName} ${selectedOutboundTour.departure_time}`}
            arrivalText={`${toName} ${selectedOutboundTour.arrival_time}`}
            extraBaggage={extraBaggageOutbound[0] || false}
            onExtraBaggageChange={(v) => {
              const arr = [...extraBaggageOutbound];
              arr[0] = v;
              setExtraBaggageOutbound(arr);
            }}
          />
        </>
      )}

      {/* места обратно */}
      {selectedReturnTour && activeLeg === "return" && (
        <>
          <h3 className="mt-5">
            Рейс обратно #{selectedReturnTour.id}, дата:{" "}
            {formatDate(selectedReturnTour.date)}
          </h3>
          <p>{t.freeSeats(free(selectedReturnTour.seats))}</p>
          <p>Выберите места:</p>

          <SeatClient
            tourId={selectedReturnTour.id}
            departureStopId={toId}
            arrivalStopId={fromId}
            layoutVariant={selectedReturnTour.layout_variant || undefined}
            selectedSeats={selectedReturnSeats}
            maxSeats={seatCount}
            onChange={setSelectedReturnSeats}
            departureText={`${toName} ${selectedReturnTour.departure_time}`}
            arrivalText={`${fromName} ${selectedReturnTour.arrival_time}`}
            extraBaggage={extraBaggageReturn[0] || false}
            onExtraBaggageChange={(v) => {
              const arr = [...extraBaggageReturn];
              arr[0] = v;
              setExtraBaggageReturn(arr);
            }}
          />
        </>
      )}

      {/* пассажиры (без багажа и без контактов) */}
      <form
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
        className="mt-5 flex w-full max-w-[440px] flex-col gap-2"
      >
        {passengerNames.map((name, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <FormInput
              type="text"
              placeholder={`Имя пассажира ${idx + 1}`}
              required
              value={name}
              onChange={(e) => {
                const arr = [...passengerNames];
                arr[idx] = e.target.value;
                setPassengerNames(arr);
              }}
              className="flex-1"
            />

            {ticketNumber && (
              <button
                type="button"
                onClick={() => onDownloadTicket(ticketNumber)}
                className="whitespace-nowrap rounded border px-2 py-1 text-sm hover:bg-slate-100"
              >
                {t.ticketDownload}
              </button>
            )}
          </div>
        ))}
      </form>
    </>
  );
}
