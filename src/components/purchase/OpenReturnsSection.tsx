"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import SeatClient from "@/components/SeatClient";
import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";
import type {
  OpenReturnTour,
  OpenReturnVoucher,
  OpenReturnStop,
} from "@/types/purchase";

type Props = {
  purchaseId: string | number;
  onActivated: () => void;
};

const stopName = (stop: OpenReturnVoucher["from_stop"]): string => {
  if (!stop) return "—";
  if (typeof stop === "string") return stop;
  return stop.name ?? "—";
};

const stopId = (stop: OpenReturnVoucher["from_stop"]): number | null => {
  if (!stop || typeof stop === "string") return null;
  const raw = (stop as OpenReturnStop).id;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount: number, currency: string): string =>
  `${Number(amount).toFixed(2)} ${currency || "₴"}`;

const statusLabel = (status: OpenReturnVoucher["status"]): string => {
  switch (status) {
    case "redeemed":
      return "Использован";
    case "cancelled":
      return "Отменён";
    case "expired":
      return "Срок истёк";
    default:
      return "Активен";
  }
};

export default function OpenReturnsSection({ purchaseId, onActivated }: Props) {
  const [vouchers, setVouchers] = useState<OpenReturnVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeVoucherId, setActiveVoucherId] = useState<string | number | null>(null);
  const [tours, setTours] = useState<OpenReturnTour[]>([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [activating, setActivating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithInclude(
        `${API}/public/purchase/${encodeURIComponent(String(purchaseId))}/open-returns`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OpenReturnVoucher[];
      setVouchers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const resetSelection = useCallback(() => {
    setActiveVoucherId(null);
    setTours([]);
    setSelectedTourId(null);
    setSelectedSeats([]);
    setActionError(null);
  }, []);

  const openPicker = useCallback(
    async (voucher: OpenReturnVoucher) => {
      setActiveVoucherId(voucher.id);
      setTours([]);
      setSelectedTourId(null);
      setSelectedSeats([]);
      setActionError(null);
      setToursLoading(true);
      try {
        const res = await fetchWithInclude(
          `${API}/public/open-return/${encodeURIComponent(String(voucher.id))}/tours`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as OpenReturnTour[];
        setTours(Array.isArray(data) ? data : []);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : String(e));
      } finally {
        setToursLoading(false);
      }
    },
    []
  );

  const activeVoucher = useMemo(
    () => vouchers.find((v) => v.id === activeVoucherId) ?? null,
    [vouchers, activeVoucherId]
  );
  const selectedTour = useMemo(
    () => tours.find((tour) => tour.tour_id === selectedTourId) ?? null,
    [tours, selectedTourId]
  );

  const handleActivate = useCallback(async () => {
    if (!activeVoucher || selectedTourId == null || selectedSeats.length !== 1) return;
    setActivating(true);
    setActionError(null);
    try {
      const res = await fetchWithInclude(
        `${API}/public/open-return/${encodeURIComponent(String(activeVoucher.id))}/activate`,
        {
          method: "POST",
          body: JSON.stringify({ tour_id: selectedTourId, seat_num: selectedSeats[0] }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      resetSelection();
      await loadVouchers();
      onActivated();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setActivating(false);
    }
  }, [activeVoucher, selectedTourId, selectedSeats, resetSelection, loadVouchers, onActivated]);

  if (loading) return null;
  if (!vouchers.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-semibold text-slate-900">Открытые обратные билеты</h3>
      {error ? (
        <p className="mt-2 text-sm text-rose-600">{error}</p>
      ) : null}
      <div className="mt-4 space-y-4">
        {vouchers.map((voucher) => {
          const expired =
            voucher.status === "expired" ||
            (voucher.status === "open" && new Date(voucher.expires_at).getTime() <= Date.now());
          const activatable = voucher.status === "open" && !expired;
          const isActive = voucher.id === activeVoucherId;
          const depId = stopId(voucher.from_stop);
          const arrId = stopId(voucher.to_stop);

          return (
            <div key={voucher.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {stopName(voucher.from_stop)} → {stopName(voucher.to_stop)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Оплачено: {formatAmount(voucher.amount_paid, voucher.currency)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Действует до {formatDate(voucher.expires_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    activatable
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {expired && voucher.status === "open" ? "Срок истёк" : statusLabel(voucher.status)}
                </span>
              </div>

              {activatable ? (
                <div className="mt-3">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => void openPicker(voucher)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Выбрать дату и место
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {toursLoading ? (
                        <p className="text-sm text-slate-500">Загрузка рейсов…</p>
                      ) : tours.length ? (
                        <div className="flex flex-wrap gap-2">
                          {tours.map((tour) => (
                            <button
                              key={tour.tour_id}
                              type="button"
                              onClick={() => {
                                setSelectedTourId(tour.tour_id);
                                setSelectedSeats([]);
                              }}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                tour.tour_id === selectedTourId
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {formatDate(tour.date)} · {tour.departure_time}–{tour.arrival_time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Нет доступных рейсов.</p>
                      )}

                      {selectedTour && depId != null && arrId != null ? (
                        <SeatClient
                          tourId={selectedTour.tour_id}
                          departureStopId={depId}
                          arrivalStopId={arrId}
                          layoutVariant={selectedTour.layout_variant ?? "neoplan"}
                          selectedSeats={selectedSeats}
                          maxSeats={1}
                          onChange={setSelectedSeats}
                          showExtraBaggage={false}
                        />
                      ) : null}

                      {actionError ? (
                        <p className="text-sm text-rose-600">{actionError}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={selectedSeats.length !== 1 || activating}
                          onClick={() => void handleActivate()}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activating ? "Бронируем…" : "Забронировать обратный билет"}
                        </button>
                        <button
                          type="button"
                          onClick={resetSelection}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
