"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API } from "@/config";
import Neoplan from "@/components/Neoplan";
import Travego from "@/components/Travego";
import { Wifi, Toilet, Snowflake, Plug, Armchair } from "lucide-react";

type SeatStatus = "available" | "occupied" | "blocked";
export type SeatMapSeat = { seat_id: number; seat_num: number; status: SeatStatus };

type SeatSelectionDetail = {
  seatId: number;
  seatNumber: number;
};

type LayoutVariant = "neoplan" | "travego" | string;

type Props = {
  tourId: number;
  departureStopId: number;
  arrivalStopId: number;
  layoutVariant?: LayoutVariant | null;
  selectedSeats: number[];
  maxSeats: number;
  onChange: (seats: number[]) => void;
  departureText?: string;
  arrivalText?: string;
  extraBaggage?: boolean;
  onExtraBaggageChange?: (v: boolean) => void;
  onSeatMapLoad?: (seats: SeatMapSeat[]) => void;
  onSelectionDetailsChange?: (selection: SeatSelectionDetail[]) => void;
};

const tiny = {
  legend: "flex items-center gap-4 text-sm text-slate-600 flex-wrap",
  badge: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border",
};

export default function SeatClient({
  tourId,
  departureStopId,
  arrivalStopId,
  layoutVariant = "neoplan",
  selectedSeats,
  maxSeats,
  onChange,
  departureText,
  arrivalText,
  extraBaggage = false,
  onExtraBaggageChange,
  onSeatMapLoad,
  onSelectionDetailsChange,
}: Props) {
  const [seats, setSeats] = useState<SeatMapSeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let aborted = false;
    setSeats([]);
    onChange([]);
    onSeatMapLoad?.([]);
    onSelectionDetailsChange?.([]);
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url = `${API}/seat?tour_id=${tourId}&departure_stop_id=${departureStopId}&arrival_stop_id=${arrivalStopId}`;
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
        }
        const data = (await res.json()) as { seats: SeatMapSeat[] };
        if (aborted) return;

        const seatData = data.seats || [];
        setSeats(seatData);
        onChange([]); // сброс при смене рейса
        onSeatMapLoad?.(seatData);
        onSelectionDetailsChange?.([]);
      } catch (e) {
        if (aborted) return;
        setErr(e instanceof Error ? e.message : String(e));
        onSeatMapLoad?.([]);
        onSelectionDetailsChange?.([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, departureStopId, arrivalStopId]);

  useEffect(() => {
    if (!onSelectionDetailsChange) {
      return;
    }

    const details = selectedSeats.reduce<SeatSelectionDetail[]>((accumulator, seatNumber) => {
      const seat = seats.find((item) => item.seat_num === seatNumber);
      if (!seat || typeof seat.seat_id !== "number") {
        return accumulator;
      }

      accumulator.push({ seatId: seat.seat_id, seatNumber });
      return accumulator;
    }, []);

    onSelectionDetailsChange(details);
  }, [onSelectionDetailsChange, seats, selectedSeats]);

  const statusMap = useMemo(() => {
    const m = new Map<number, SeatStatus>();
    seats.forEach((s) => m.set(s.seat_num, s.status));
    return m;
  }, [seats]);

  const toggleSeat = (n: number) => {
    const st = statusMap.get(n) || "available";
    if (st !== "available") return;

    const already = selectedSeats.includes(n);
    if (already) {
      onChange(selectedSeats.filter((x) => x !== n));
    } else {
      if (selectedSeats.length >= maxSeats) return;
      onChange([...selectedSeats, n]);
    }
  };

  const renderCell = (num: number) => {
    const st = statusMap.get(num) || "available";
    const isSel = selectedSeats.includes(num);

    let bg = "#e5e7eb";
    let cursor = "default";
    let opacity = 1;
    if (st === "available") {
      bg = isSel ? "#4ade80" : "#a7f3d0";
      cursor = "pointer";
    }
    if (st === "occupied") {
      bg = "#fecaca";
      opacity = 0.6;
    }
    if (st === "blocked") {
      bg = "#d1d5db";
      opacity = 0.6;
    }

    return (
      <button
        key={num}
        type="button"
        onClick={() => toggleSeat(num)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          border: "1px solid #94a3b8",
          background: bg,
          opacity,
          cursor,
        }}
        title={`Место ${num}`}
      >
        {num}
      </button>
    );
  };

  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className={tiny.legend}>
        <span className={tiny.badge}>
          <span style={{ width: 14, height: 14, background: "#a7f3d0", border: "1px solid #94a3b8" }} />
          Свободно
        </span>
        <span className={tiny.badge}>
          <span style={{ width: 14, height: 14, background: "#fecaca", border: "1px solid #94a3b8" }} />
          Занято
        </span>
        <span className={tiny.badge}>
          <span style={{ width: 14, height: 14, background: "#d1d5db", border: "1px solid #94a3b8" }} />
          Недоступно
        </span>
        <span className={tiny.badge}>
          <span style={{ width: 14, height: 14, background: "#4ade80", border: "1px solid #15803d" }} />
          Выбрано
        </span>
      </div>

      {err && <div className="mt-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-rose-900">{err}</div>}

      <div className="mt-3 flex gap-4">
        <div className="overflow-x-auto rounded-xl border p-3 bg-slate-50">
          {loading ? (
            <div className="text-sm text-slate-500">Загрузка схемы…</div>
          ) : (layoutVariant || "").toString().toLowerCase() === "travego" ? (
            <Travego
              seats={seats}
              selectedSeats={selectedSeats}
              toggleSeat={toggleSeat}
              interactive
              renderCell={renderCell}
            />
          ) : (
            <Neoplan
              seats={seats}
              selectedSeats={selectedSeats}
              toggleSeat={toggleSeat}
              interactive
              renderCell={renderCell}
            />
          )}
        </div>
        <div className="w-64 text-sm flex flex-col gap-2">
          {departureText && <div>Отправление: {departureText}</div>}
          {arrivalText && <div>Прибытие: {arrivalText}</div>}
          <div className="flex gap-2 flex-wrap">
            <Wifi size={24} title="Wi-Fi" />
            <Toilet size={24} title="Туалет" />
            <Snowflake size={24} title="Климат контроль" />
            <Plug size={24} title="Розетка" />
            <Armchair size={24} title="Сиденья откидываются" />
          </div>
          <div>
            В стоимость включены 1 чемодан и 1 ручная кладь.
            {extraBaggage && " Добавлен дополнительный чемодан."}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={extraBaggage}
              onChange={(e) => onExtraBaggageChange?.(e.target.checked)}
            />
            Добавить еще один чемодан
          </label>
        </div>
      </div>

      {!!selectedSeats.length && (
        <div className="mt-2 text-sm text-slate-600">
          Вы выбрали: {selectedSeats.slice().sort((a, b) => a - b).join(", ")}
        </div>
      )}
    </div>
  );
}
