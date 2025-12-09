import React, { useEffect, useMemo, useState } from "react";
import SeatClient from "../SeatClient";
import type { Tour } from "./SearchResults";
import FormInput from "../common/FormInput";

type Dict = {
  freeSeats: (n: number) => string;
  outboundShort: string;
  inboundShort: string;
  next: string;
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

  return (
    <div className="space-y-4">
      {legTabs}

      {(!selectedReturnTour || activeLeg === "outbound") && (
        <section className="space-y-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Выберите места:</h3>

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
            showExtraBaggage={false}
          />
        </section>
      )}

      {selectedReturnTour && activeLeg === "return" && (
        <section className="space-y-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Выберите места:</h3>

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
            showExtraBaggage={false}
          />
        </section>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-2 flex w-full max-w-[640px] flex-col gap-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200"
      >
        <div className="text-base font-semibold text-slate-900">Пассажиры</div>
        <p className="text-sm text-slate-600">Укажите имя и фамилию как в документе.</p>

        {passengerNames.map((name, idx) => (
          <label key={idx} className="space-y-1 text-sm font-medium text-slate-800">
            <FormInput
              type="text"
              placeholder="Имя Фамилия"
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

      {readyForNext && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => onReadyForContacts?.()}
            className="rounded-xl bg-sky-600 px-6 py-3 text-white shadow hover:bg-sky-700"
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
