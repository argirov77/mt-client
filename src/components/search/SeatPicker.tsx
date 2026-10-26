"use client";

import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";

import Neoplan, { NEOPLAN_LAYOUT } from "@/components/Neoplan";
import Travego, { TRAVEGO_LAYOUT } from "@/components/Travego";
import type { SeatData } from "@/components/BusLayout";
import { seatSides } from "@/utils/seatLayout";
import {
  arrivalWeekday,
  formatDayShort,
  shortTime,
  tripDuration,
} from "@/utils/tripFormat";

import type { Dict, Lang, Tour } from "./types";

export type SeatLeg = "outbound" | "return";

export type SeatLegInfo = {
  leg: SeatLeg;
  tour: Tour;
  fromName: string;
  toName: string;
  seats: SeatData[];
  loading: boolean;
  error?: string;
  selected: number[];
  autoPicked: boolean;
};

type Props = {
  t: Dict;
  lang: Lang;
  legs: SeatLegInfo[];
  seatCount: number;
  activeLeg: SeatLeg;
  onActiveLegChange: (leg: SeatLeg) => void;
  onChange: (leg: SeatLeg, seats: number[]) => void;
  compact?: boolean;
};

export const layoutForTour = (tour: Tour) =>
  (tour.layout_variant || "").toString().toLowerCase() === "travego" ? TRAVEGO_LAYOUT : NEOPLAN_LAYOUT;

export default function SeatPicker({
  t,
  lang,
  legs,
  seatCount,
  activeLeg,
  onActiveLegChange,
  onChange,
  compact = false,
}: Props) {
  const [fullHintLeg, setFullHintLeg] = useState<SeatLeg | null>(null);
  const current = legs.find((item) => item.leg === activeLeg) ?? legs[0];
  const layout = layoutForTour(current.tour);
  const sides = useMemo(() => seatSides(layout), [layout]);

  const statusMap = useMemo(() => {
    const map = new Map<number, string>();
    current.seats.forEach((seat) => map.set(seat.seat_num, seat.status));
    return map;
  }, [current.seats]);

  const seatLabels = useMemo(
    () =>
      current.selected.reduce<Record<number, number>>((acc, seat, index) => {
        acc[seat] = index + 1;
        return acc;
      }, {}),
    [current.selected],
  );

  const toggleSeat = (seat: number) => {
    if ((statusMap.get(seat) || "available") !== "available") return;
    if (current.selected.includes(seat)) {
      setFullHintLeg(null);
      onChange(current.leg, current.selected.filter((value) => value !== seat));
      return;
    }
    if (current.selected.length >= seatCount) {
      // раньше нажатие молча не срабатывало
      setFullHintLeg(current.leg);
      return;
    }
    setFullHintLeg(null);
    onChange(current.leg, [...current.selected, seat]);
  };

  const duration = tripDuration(current.tour.departure_time, current.tour.arrival_time);
  const arriveDay = duration?.dayShift
    ? arrivalWeekday(current.tour.date, current.tour.departure_time, current.tour.arrival_time, lang)
    : "";
  const freeCount = current.seats.filter((seat) => seat.status === "available").length;

  const firstMissing = current.selected.length < seatCount ? current.selected.length + 1 : null;
  const hint =
    fullHintLeg === current.leg
      ? t.seatsFull(seatCount)
      : firstMissing
        ? t.seatPickFor(firstMissing)
        : current.autoPicked
          ? t.seatsAutoPicked
          : null;

  const BusComponent = layout === TRAVEGO_LAYOUT ? Travego : Neoplan;

  return (
    <div className="space-y-3">
      {legs.length > 1 ? (
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-[#f6f4f1] p-1">
          {legs.map((item) => {
            const isActive = item.leg === current.leg;
            const complete = item.selected.length === seatCount;
            return (
              <button
                key={item.leg}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onActiveLegChange(item.leg)}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg px-2 py-1 text-center text-xs transition ${
                  isActive ? "bg-white text-[#173452] shadow" : "text-[#173452] hover:bg-white/70"
                }`}
              >
                <span className="font-bold">
                  {item.leg === "outbound" ? "⇢" : "⇠"}{" "}
                  {item.leg === "outbound" ? t.outboundShort : t.inboundShort} ·{" "}
                  {formatDayShort(item.tour.date, lang).replace(",", "")}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${complete ? "text-emerald-700" : "text-amber-800"}`}
                >
                  {t.selectedSeatsLabel(item.selected.length, seatCount).replace(/^\D+/, "")}
                  {complete ? <Check className="h-3 w-3" aria-hidden /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="text-xs text-[#173452]">
        <b>
          {current.fromName} {shortTime(current.tour.departure_time)} → {current.toName}{" "}
          {shortTime(current.tour.arrival_time)}
          {arriveDay ? ` ${arriveDay}` : ""}
        </b>
        {freeCount ? ` · ${t.legendFree} ${freeCount}` : ""}
      </p>

      <div className={`flex flex-col gap-3 ${compact ? "" : "sm:flex-row sm:items-start"}`}>
        <div className="flex justify-center overflow-x-auto rounded-xl bg-[#f6f4f1] p-2">
          {current.loading ? (
            <div className="px-6 py-10 text-sm text-[#5c6370]">{t.seatsLoading}</div>
          ) : current.error ? (
            <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {current.error}
            </div>
          ) : (
            <BusComponent
              seats={current.seats}
              selectedSeats={current.selected}
              toggleSeat={toggleSeat}
              interactive
              seatLabels={seatLabels}
              compact={compact}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-sm">
          {hint ? (
            <p
              role="status"
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                fullHintLeg === current.leg || firstMissing
                  ? "bg-amber-50 text-amber-900"
                  : "bg-emerald-50 text-emerald-900"
              }`}
            >
              {hint}
            </p>
          ) : null}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#5c6370]">{t.yourSeats}</p>
            <ul className="mt-1 space-y-1">
              {Array.from({ length: seatCount }, (_, index) => {
                const seat = current.selected[index];
                return (
                  <li key={index} className="flex items-center gap-2">
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#173452] px-1 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    {seat ? (
                      <span className="text-[#173452]">
                        <b>{seat}</b> · {sides.get(seat) === "window" ? t.seatWindow : t.seatAisle}
                      </span>
                    ) : (
                      <span className="text-[#5c6370]">{t.seatNotChosen}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[#173452]">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-3 rounded bg-[#7AC700]" />
              {t.legendFree}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-3 rounded bg-[#2563EB]" />
              {t.legendSelected}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-3 rounded bg-[#C8CCD8] opacity-60" />
              {t.legendTaken}
            </span>
          </div>

          <p className="text-xs text-[#5c6370]">
            <b className="text-[#173452]">{t.amenitiesLabel}:</b> {t.amenitiesList}
          </p>
        </div>
      </div>
    </div>
  );
}
