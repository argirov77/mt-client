"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import SearchForm from "@/components/hero/SearchForm";
import SearchResults from "@/components/search/SearchResults";
import { useLanguage } from "@/components/common/LanguageProvider";
import { OPEN_TRIP_EVENT, type OpenTripDetail } from "@/utils/useNearestTrips";

const backToSearchLabel = {
  ru: "Назад к поиску",
  en: "Back to search",
  bg: "Назад към търсене",
  ua: "Назад до пошуку",
};

export type Criteria = {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  returnDate?: string;
  openReturn?: boolean;
  seatCount: number;
  discountCount: number;
  // рейс, выбранный на первом экране («Ближайшие рейсы»)
  preselectTourId?: number;
};

type BookingFlowProps = {
  forcedFromId?: number;
  forcedToId?: number;
  // сообщает, показаны ли результаты поиска (а не форма)
  onFlowChange?: (active: boolean) => void;
};

export default function BookingFlow({ forcedFromId, forcedToId, onFlowChange }: BookingFlowProps = {}) {
  const { lang } = useLanguage();
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  // запоминаем последний поиск, чтобы при возврате форма не была пустой
  const [lastCriteria, setLastCriteria] = useState<Criteria | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onFlowChange?.(Boolean(criteria));
  }, [criteria, onFlowChange]);

  // «Ближайшие рейсы» на первом экране сразу открывают шаг 1 с этим рейсом.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OpenTripDetail>).detail;
      if (!detail) return;
      const next: Criteria = {
        from: String(detail.from),
        to: String(detail.to),
        fromName: detail.fromName,
        toName: detail.toName,
        date: detail.date,
        seatCount: 1,
        discountCount: 0,
        preselectTourId: detail.tourId,
      };
      setCriteria(next);
      setLastCriteria(next);
    };
    window.addEventListener(OPEN_TRIP_EVENT, handler);
    return () => window.removeEventListener(OPEN_TRIP_EVENT, handler);
  }, []);

  // после нового поиска скроллим к заголовку результатов с небольшим отступом
  useEffect(() => {
    if (criteria && resultsRef.current) {
      const rect = resultsRef.current.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const currentTop = window.scrollY;
      const distance = Math.abs(elementTop - currentTop);
      const alreadyVisible = rect.top >= 0 && rect.top < window.innerHeight;

      if (!alreadyVisible && distance > 40) {
        window.scrollTo({
          top: Math.max(elementTop - 80, 0),
          behavior: "smooth",
        });
      }
    }
  }, [criteria]);

  return (
    <div className="w-full space-y-6">
      {!criteria && (
        <div className="mx-auto w-full max-w-5xl rounded-none bg-transparent p-0 shadow-none ring-0 sm:rounded-3xl sm:bg-white/80 sm:p-5 sm:shadow-lg sm:ring-1 sm:ring-[#e3dfd9]">
          <SearchForm
            lang={lang}
            embedded
            prefilled={Boolean(forcedFromId && forcedToId)}
            initialFromId={forcedFromId ?? lastCriteria?.from}
            initialToId={forcedToId ?? lastCriteria?.to}
            initialDate={lastCriteria?.date}
            initialReturnDate={lastCriteria?.returnDate}
            initialSeats={
              lastCriteria
                ? lastCriteria.seatCount - lastCriteria.discountCount
                : undefined
            }
            initialDiscount={lastCriteria?.discountCount}
            initialOpenReturn={lastCriteria?.openReturn}
            onSearch={(params) => {
              setCriteria(params);
              setLastCriteria(params);
            }}
          />
        </div>
      )}

      {/* Блок результатов: появляется только после поиска */}
      {criteria && (
        <div
          ref={resultsRef}
          className="mx-auto w-full max-w-5xl rounded-none bg-transparent p-0 shadow-none ring-0 sm:rounded-3xl sm:bg-white/90 sm:p-5 sm:shadow-lg sm:ring-1 sm:ring-[#e3dfd9]"
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#c2410c] ring-1 ring-sky-100 transition hover:bg-[#fdf0e7] hover:text-sky-900"
              onClick={() => setCriteria(null)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <Search className="h-4 w-4" aria-hidden />
              {backToSearchLabel[lang]}
            </button>
          </div>
          <SearchResults lang={lang} {...criteria} />
        </div>
      )}
    </div>
  );
}
