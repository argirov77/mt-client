"use client";

import { useEffect, useState } from "react";

import apiClient from "@/lib/apiClient";
import type { Tour } from "@/components/search/types";

export type NearestTrip = {
  date: string;
  tour: Tour;
  freeSeats: number;
};

type State = {
  loading: boolean;
  dates: string[];
  trips: NearestTrip[];
};

const freeSeatsOf = (tour: Tour) =>
  typeof tour.seats === "number" ? tour.seats : tour.seats?.free ?? 0;

/**
 * Ближайшие рейсы направления — те же /search/dates и /tours/search,
 * что использует форма. Возвращает даты с рейсами и первые `count` рейсов
 * со свободными местами.
 */
export function useNearestTrips(fromId?: number, toId?: number, count = 3): State {
  const [state, setState] = useState<State>({ loading: Boolean(fromId && toId), dates: [], trips: [] });

  useEffect(() => {
    if (!fromId || !toId) {
      setState({ loading: false, dates: [], trips: [] });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    (async () => {
      try {
        const datesRes = await apiClient.get<string[]>("/search/dates", {
          params: { departure_stop_id: fromId, arrival_stop_id: toId, seats: 1 },
        });
        const today = new Date().toISOString().slice(0, 10);
        const dates = (datesRes.data || []).filter((d) => d >= today).sort();
        const firstDates = dates.slice(0, count);
        const results = await Promise.all(
          firstDates.map((date) =>
            apiClient
              .get<Tour[]>("/tours/search", {
                params: { departure_stop_id: fromId, arrival_stop_id: toId, date, seats: 1 },
              })
              .then((res) => res.data || [])
              .catch(() => [] as Tour[]),
          ),
        );
        const trips: NearestTrip[] = [];
        results.forEach((tours, index) => {
          const tour = tours.find((item) => freeSeatsOf(item) > 0);
          if (tour) trips.push({ date: firstDates[index], tour, freeSeats: freeSeatsOf(tour) });
        });
        if (!cancelled) setState({ loading: false, dates, trips });
      } catch {
        if (!cancelled) setState({ loading: false, dates: [], trips: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromId, toId, count]);

  return state;
}

/** Открыть шаг 1 с выбранным рейсом в форме бронирования на этой странице. */
export const OPEN_TRIP_EVENT = "mt:open-trip";

export type OpenTripDetail = {
  from: number;
  to: number;
  fromName: string;
  toName: string;
  date: string;
  tourId?: number;
};

export const openTripInBooking = (detail: OpenTripDetail) => {
  window.dispatchEvent(new CustomEvent<OpenTripDetail>(OPEN_TRIP_EVENT, { detail }));
};
