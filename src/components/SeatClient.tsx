"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { API } from "@/config";
import Neoplan from "@/components/Neoplan";
import Travego from "@/components/Travego";
import { Wifi, Toilet, Snowflake, Plug, Armchair } from "lucide-react";

import seatAvailableIcon from "./icons/seat-avail.svg";
import seatTakenIcon from "./icons/seat-blocked.svg";

type SeatStatus = "available" | "occupied" | "blocked";
export type SeatMapSeat = { seat_id: number; seat_num: number; status: SeatStatus };

export type SeatSelectionDetail = {
  seatId: number | null;
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
  showExtraBaggage?: boolean;
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
  showExtraBaggage = true,
}: Props) {
  const [seats, setSeats] = useState<SeatMapSeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let aborted = false;
    setSeats([]);
    if (selectedSeats.length === 0) {
      onChange([]);
      onSelectionDetailsChange?.([]);
    }
    onSeatMapLoad?.([]);
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
        if (selectedSeats.length === 0) {
          onChange([]); // сброс при смене рейса
          onSelectionDetailsChange?.([]);
        }
        onSeatMapLoad?.(seatData);
      } catch (e) {
        if (aborted) return;
        setErr(e instanceof Error ? e.message : String(e));
        onSeatMapLoad?.([]);
        if (selectedSeats.length === 0) {
          onSelectionDetailsChange?.([]);
        }
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
      const seatId = seat && typeof seat.seat_id === "number" ? seat.seat_id : null;

      accumulator.push({ seatId, seatNumber });
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

  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className={tiny.legend}>
        <span className={tiny.badge}>
          <Image src={seatAvailableIcon} alt="Свободно" width={20} height={20} />
          Свободно
        </span>
        <span className={tiny.badge}>
          <Image
            src={seatTakenIcon}
            alt="Недоступно"
            width={20}
            height={20}
            style={{ opacity: 0.65 }}
          />
          Недоступно
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
            />
          ) : (
            <Neoplan
              seats={seats}
              selectedSeats={selectedSeats}
              toggleSeat={toggleSeat}
              interactive
            />
          )}
        </div>
        <div className="w-64 text-sm flex flex-col gap-2">
          {departureText && <div>Отправление: {departureText}</div>}
          {arrivalText && <div>Прибытие: {arrivalText}</div>}
          <div className="flex gap-2 flex-wrap">
            <span title="Wi-Fi">
              <Wifi size={24} aria-label="Wi-Fi" />
            </span>
            <span title="Туалет">
              <Toilet size={24} aria-label="Туалет" />
            </span>
            <span title="Климат контроль">
              <Snowflake size={24} aria-label="Климат контроль" />
            </span>
            <span title="Розетка">
              <Plug size={24} aria-label="Розетка" />
            </span>
            <span title="Сиденья откидываются">
              <Armchair size={24} aria-label="Сиденья откидываются" />
            </span>
          </div>
          {showExtraBaggage && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-white/70 p-3">
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
          )}
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
