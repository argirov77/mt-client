import React from "react";
import SeatClient from "../SeatClient";
import type { Tour } from "./SearchResults";

type Dict = {
  freeSeats: (n: number) => string;
  book: string;
  buy: string;
  paid: string;
  canceled: string;
  pay: string;
  cancel: string;
};

type Props = {
  t: Dict;
  seatCount: number;
  fromId: number;
  toId: number;

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
};

const free = (s: Tour["seats"]) => (typeof s === "number" ? s : s?.free ?? 0);

export default function BookingPanel({
  t,
  seatCount,
  fromId,
  toId,
  selectedOutboundTour,
  selectedReturnTour,

  selectedOutboundSeats,
  setSelectedOutboundSeats,
  selectedReturnSeats,
  setSelectedReturnSeats,

  passengerNames,
  setPassengerNames,
  phone,
  setPhone,
  email,
  setEmail,

  extraBaggageOutbound,
  setExtraBaggageOutbound,
  extraBaggageReturn,
  setExtraBaggageReturn,

  handleAction,
  handlePay,
  handleCancel,
  purchaseId,
}: Props) {
  return (
    <>
      <h3 style={{ marginTop: 20 }}>
        Рейс туда #{selectedOutboundTour.id}, дата: {selectedOutboundTour.date}
      </h3>
      <p>{t.freeSeats(free(selectedOutboundTour.seats))}</p>
      <p>Выберите место:</p>

      <SeatClient
        tourId={selectedOutboundTour.id}
        departureStopId={fromId}
        arrivalStopId={toId}
        layoutVariant={selectedOutboundTour.layout_variant || undefined}
        selectedSeats={selectedOutboundSeats}
        maxSeats={seatCount}
        onChange={setSelectedOutboundSeats}
      />

      {selectedOutboundSeats.length > 0 && (
        <p>Вы выбрали места: {selectedOutboundSeats.join(", ")}</p>
      )}

      {selectedReturnTour && (
        <>
          <h3 style={{ marginTop: 20 }}>
            Рейс обратно #{selectedReturnTour.id}, дата: {selectedReturnTour.date}
          </h3>
          <p>{t.freeSeats(free(selectedReturnTour.seats))}</p>
          <p>Выберите место:</p>

          <SeatClient
            tourId={selectedReturnTour.id}
            departureStopId={toId}
            arrivalStopId={fromId}
            layoutVariant={selectedReturnTour.layout_variant || undefined}
            selectedSeats={selectedReturnSeats}
            maxSeats={seatCount}
            onChange={setSelectedReturnSeats}
          />

          {selectedReturnSeats.length > 0 && (
            <p>Вы выбрали места обратно: {selectedReturnSeats.join(", ")}</p>
          )}
        </>
      )}

      {/* ФОРМА ПАССАЖИРОВ */}
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 440,
        }}
      >
        {passengerNames.map((name, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              placeholder={`Имя пассажира ${idx + 1}`}
              required
              value={name}
              onChange={(e) => {
                const arr = [...passengerNames];
                arr[idx] = e.target.value;
                setPassengerNames(arr);
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="checkbox"
                checked={!!extraBaggageOutbound[idx]}
                onChange={(e) => {
                  const arr = [...extraBaggageOutbound];
                  arr[idx] = e.target.checked;
                  setExtraBaggageOutbound(arr);
                }}
              />
              Багаж туда
            </label>
            {selectedReturnTour && (
              <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={!!extraBaggageReturn[idx]}
                  onChange={(e) => {
                    const arr = [...extraBaggageReturn];
                    arr[idx] = e.target.checked;
                    setExtraBaggageReturn(arr);
                  }}
                />
                Багаж обратно
              </label>
            )}
          </div>
        ))}

        <input
          type="tel"
          placeholder="Телефон"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => handleAction("book")}>
            {t.book}
          </button>
          <button type="button" onClick={() => handleAction("purchase")}>
            {t.buy}
          </button>
          {purchaseId && (
            <>
              <button type="button" onClick={handlePay}>
                {t.pay}
              </button>
              <button type="button" onClick={handleCancel}>
                {t.cancel}
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
}
