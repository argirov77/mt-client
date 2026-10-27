"use client";

import React, { useEffect, useMemo, useState } from "react";

import FormInput from "../common/FormInput";
import type { SeatData } from "../BusLayout";
import SeatPicker, { type SeatLeg, type SeatLegInfo } from "./SeatPicker";
import type { Dict, Lang, Tour } from "./types";
import { API } from "@/config";
import { formatDayShort } from "@/utils/tripFormat";
import { useLockBodyScroll } from "@/utils/useLockBodyScroll";
import { useModalVisibility } from "@/utils/useModalVisibility";

type Props = {
  t: Dict;
  lang: Lang;
  seatCount: number;
  discountCount: number;
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
  setExtraBaggageOutbound: React.Dispatch<React.SetStateAction<boolean[]>>;

  extraBaggageReturn: boolean[];
  setExtraBaggageReturn: React.Dispatch<React.SetStateAction<boolean[]>>;

  /** индекс поля имени, которое подсвечиваем как незаполненное */
  highlightNameIndex: number | null;
};

type SeatMapState = { seats: SeatData[]; loading: boolean; error?: string };

// Схема мест рейса: тот же запрос /seat/, что и раньше делал SeatClient.
function useSeatMap(tourId: number | null, departureStopId: number, arrivalStopId: number) {
  const [state, setState] = useState<SeatMapState>({ seats: [], loading: false });

  useEffect(() => {
    if (!tourId) {
      setState({ seats: [], loading: false });
      return;
    }
    let aborted = false;
    setState({ seats: [], loading: true });
    (async () => {
      try {
        const url = `${API}/seat/?tour_id=${tourId}&departure_stop_id=${departureStopId}&arrival_stop_id=${arrivalStopId}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { seats?: SeatData[] };
        if (!aborted) setState({ seats: data.seats || [], loading: false });
      } catch (e) {
        if (!aborted) {
          setState({ seats: [], loading: false, error: e instanceof Error ? e.message : String(e) });
        }
      }
    })();
    return () => {
      aborted = true;
    };
  }, [tourId, departureStopId, arrivalStopId]);

  return state;
}

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
};

export default function BookingPanel({
  t,
  lang,
  seatCount,
  discountCount,
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

  setExtraBaggageOutbound,
  setExtraBaggageReturn,

  highlightNameIndex,
}: Props) {
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [activeLeg, setActiveLeg] = useState<SeatLeg>("outbound");
  const seatModal = useModalVisibility(isSeatModalOpen, 300);
  const isDesktop = useIsDesktop();

  useLockBodyScroll(seatModal.shouldRender);

  const outboundMap = useSeatMap(selectedOutboundTour.id, fromId, toId);
  const returnMap = useSeatMap(selectedReturnTour?.id ?? null, toId, fromId);

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

  // Места не подбираем сами: пассажир выбирает их на схеме.
  const legs = useMemo<SeatLegInfo[]>(() => {
    const items: SeatLegInfo[] = [
      {
        leg: "outbound",
        tour: selectedOutboundTour,
        fromName,
        toName,
        ...outboundMap,
        selected: selectedOutboundSeats,
      },
    ];
    if (selectedReturnTour) {
      items.push({
        leg: "return",
        tour: selectedReturnTour,
        fromName: toName,
        toName: fromName,
        ...returnMap,
        selected: selectedReturnSeats,
      });
    }
    return items;
  }, [
    fromName,
    outboundMap,
    returnMap,
    selectedOutboundSeats,
    selectedOutboundTour,
    selectedReturnSeats,
    selectedReturnTour,
    toName,
  ]);

  const handleSeatsChange = (leg: SeatLeg, seats: number[]) => {
    if (leg === "outbound") setSelectedOutboundSeats(seats);
    else setSelectedReturnSeats(seats);
  };

  const openModal = (leg: SeatLeg = "outbound") => {
    setActiveLeg(leg);
    setIsSeatModalOpen(true);
  };

  const closeModal = () => setIsSeatModalOpen(false);

  const seatsText = (seats: number[]) =>
    seats.length
      ? seats.slice().sort((a, b) => a - b).join(lang === "en" ? " and " : lang === "ua" ? " і " : " и ")
      : t.seatNotChosen;

  const anySeats = selectedOutboundSeats.length > 0 || selectedReturnSeats.length > 0;

  const renderSeatOverview = () => (
    <section className="space-y-2 rounded-2xl border border-[#e3dfd9] bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#5c6370]">{t.seatsTitle}</p>
      {legs.map((item) => (
        <div key={item.leg} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[#173452]">
            {item.leg === "outbound" ? t.outboundShort : t.inboundShort}, {formatDayShort(item.tour.date, lang)}
          </span>
          <b className={item.selected.length === seatCount ? "text-[#173452]" : "text-amber-800"}>
            {item.loading ? t.seatsLoading : seatsText(item.selected)}
          </b>
        </div>
      ))}
      <p className="text-xs text-[#5c6370]">
        {t.amenitiesLabel}: {t.amenitiesList}
      </p>
      <button
        type="button"
        onClick={() => {
          const firstIncomplete = legs.find((item) => item.selected.length < seatCount);
          openModal(firstIncomplete?.leg ?? "outbound");
        }}
        className={`flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm ${
          anySeats
            ? "border border-[#e3dfd9] font-semibold text-[#c2410c] hover:bg-[#fdf0e7]"
            : "bg-[#c2410c] font-bold text-white hover:bg-[#a8380b]"
        }`}
      >
        {anySeats ? t.changeOnMap : t.chooseSeats(seatCount)}
      </button>
    </section>
  );

  const renderSeatModal = () => {
    if (!seatModal.shouldRender) return null;
    const hasReturn = Boolean(selectedReturnTour);
    const onOutbound = activeLeg === "outbound";

    return (
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center bg-[#173452]/50 backdrop-blur-[2px] transition-opacity ease-in-out sm:items-center sm:px-3 sm:py-4 ${
          seatModal.isClosing ? "opacity-0" : "opacity-100"
        } ${seatModal.prefersReducedMotion ? "motion-reduce:transition-none" : ""}`}
        style={{ transitionDuration: `${seatModal.animationDuration}ms` }}
        onClick={closeModal}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.seatSelectionTitle}
          className={`relative flex max-h-[100dvh] w-full max-w-3xl transform flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-[opacity,transform] ease-in-out sm:max-h-[92vh] sm:rounded-2xl ${
            seatModal.isClosing ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
          } ${seatModal.prefersReducedMotion ? "motion-reduce:transform-none motion-reduce:transition-none" : ""}`}
          style={{ transitionDuration: `${seatModal.animationDuration}ms` }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h3 className="text-lg font-bold text-[#173452]">{t.seatSelectionTitle}</h3>
            <button
              type="button"
              aria-label={t.done}
              onClick={closeModal}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e3dfd9] text-lg font-semibold text-[#5c6370] hover:bg-[#f6f4f1]"
            >
              ×
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <SeatPicker
              t={t}
              lang={lang}
              legs={legs}
              seatCount={seatCount}
              activeLeg={activeLeg}
              onActiveLegChange={setActiveLeg}
              onChange={handleSeatsChange}
              compact
            />
          </div>

          <div className="border-t bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {(() => {
              const current = legs.find((item) => item.leg === activeLeg) ?? legs[0];
              const missing = current.selected.length < seatCount;
              return (
                <>
                  {missing ? (
                    <p className="mb-1.5 text-center text-xs font-semibold text-amber-800">
                      {t.missingSeats(current.leg, current.selected.length, seatCount)}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => (hasReturn && onOutbound ? setActiveLeg("return") : closeModal())}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#c2410c] px-4 text-sm font-bold text-white hover:bg-[#a8380b]"
                  >
                    {hasReturn && onOutbound ? t.nextReturnSeats : t.done}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isDesktop ? (
        <section className="rounded-2xl border border-[#e3dfd9] bg-white p-4">
          <SeatPicker
            t={t}
            lang={lang}
            legs={legs}
            seatCount={seatCount}
            activeLeg={activeLeg}
            onActiveLegChange={setActiveLeg}
            onChange={handleSeatsChange}
          />
        </section>
      ) : (
        <>
          {renderSeatModal()}
          {renderSeatOverview()}
        </>
      )}

      <form
        onSubmit={(e) => {
          // form_submit удалён как дубль search без полезной нагрузки.
          e.preventDefault();
        }}
        className="flex w-full flex-col gap-3"
      >
        <div>
          <div className="text-base font-bold text-[#173452]">{t.passengersTitle}</div>
          <p className="text-sm text-[#5c6370]">{t.passengersHint}</p>
        </div>

        {passengerNames.map((name, idx) => {
          const isChild = idx >= seatCount - discountCount;
          const highlighted = highlightNameIndex === idx && !name.trim();
          const seatsInfo = [selectedOutboundSeats[idx], selectedReturnTour ? selectedReturnSeats[idx] : undefined]
            .filter(Boolean)
            .join(" / ");
          const seatsLabel = seatsInfo ? t.seatLabel(seatsInfo) : "";
          return (
            <div key={idx} className="space-y-1">
              <label
                htmlFor={`passenger-name-${idx}`}
                className="flex items-center justify-between gap-2 text-xs font-semibold text-[#173452]"
              >
                <span>
                  {t.passengerLabel(idx + 1)} · {isChild ? t.passengerKindChild : t.passengerKindAdult}
                </span>
                {seatsLabel ? <span className="font-normal text-[#5c6370]">{seatsLabel}</span> : null}
              </label>
              <FormInput
                id={`passenger-name-${idx}`}
                type="text"
                autoComplete={idx === 0 ? "name" : "off"}
                placeholder={t.passengerPlaceholder}
                required
                value={name}
                aria-invalid={highlighted || undefined}
                onChange={(e) => {
                  const arr = [...passengerNames];
                  arr[idx] = e.target.value;
                  setPassengerNames(arr);
                }}
                className={`h-12 w-full rounded-xl bg-white px-3 text-base hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                  highlighted ? "border-2 border-amber-500" : "border border-[#e3dfd9] focus:border-sky-500"
                }`}
              />
            </div>
          );
        })}
      </form>
    </div>
  );
}
