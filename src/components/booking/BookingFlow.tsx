"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchForm from "@/components/hero/SearchForm";
import SearchResults from "@/components/search/SearchResults";
import { useLanguage } from "@/components/common/LanguageProvider";

export type Criteria = {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  date: string;
  returnDate?: string;
  seatCount: number;
  discountCount: number;
};

type Step = {
  id:
    | "search"
    | "outbound"
    | "return"
    | "passengers"
    | "seats"
    | "extras"
    | "contacts"
    | "payment";
  title: string;
};

const stepTitles: Record<"ru" | "en" | "bg" | "ua", Step["title"][]> = {
  ru: [
    "Поиск рейса",
    "Выбор рейса туда",
    "Выбор рейса обратно",
    "Пассажиры",
    "Выбор мест",
    "Экстра / багаж",
    "Контакты",
    "Оплата",
  ],
  en: [
    "Search",
    "Outbound trip",
    "Return trip",
    "Passengers",
    "Seat selection",
    "Extras / baggage",
    "Contacts",
    "Payment",
  ],
  bg: [
    "Търсене",
    "Избор на тръгване",
    "Избор на връщане",
    "Пътници",
    "Места",
    "Екстри / багаж",
    "Контакти",
    "Плащане",
  ],
  ua: [
    "Пошук",
    "Вибір рейсу туди",
    "Вибір рейсу назад",
    "Пасажири",
    "Місця",
    "Екстра / багаж",
    "Контакти",
    "Оплата",
  ],
};

export default function BookingFlow() {
  const { lang } = useLanguage();
  const titles = stepTitles[lang ?? "ru"] ?? stepTitles.ru;
  const steps: Step[] = useMemo(
    () =>
      [
        "search",
        "outbound",
        "return",
        "passengers",
        "seats",
        "extras",
        "contacts",
        "payment",
      ].map((id, idx) => ({ id, title: titles[idx] })),
    [titles]
  );

  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [maxAvailableStep, setMaxAvailableStep] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const summaries = useMemo(() => {
    const baseRoute = criteria
      ? `${criteria.fromName || criteria.from} → ${criteria.toName || criteria.to}`
      : null;
    return steps.map((step) => {
      if (step.id === "search") {
        return baseRoute
          ? `${baseRoute}, ${criteria?.date}${criteria?.returnDate ? ` → ${criteria.returnDate}` : ""}`
          : titles[0];
      }
      if (!criteria) return "—";
      switch (step.id) {
        case "outbound":
          return `${criteria.date}`;
        case "return":
          return criteria.returnDate ? criteria.returnDate : "—";
        case "passengers":
          return `${criteria.seatCount} ${lang === "en" ? "travelers" : "пассажиров"}`;
        case "seats":
          return lang === "en" ? "Choose seats" : "Выбор внутри";
        case "extras":
          return lang === "en" ? "Baggage & extras" : "Багаж и доп. услуги";
        case "contacts":
          return lang === "en" ? "Contact info" : "Контактные данные";
        case "payment":
          return lang === "en" ? "Checkout" : "Оплата";
        default:
          return "";
      }
    });
  }, [criteria, lang, steps, titles]);

  useEffect(() => {
    if (!criteria) return;
    setActiveStep(1);
    setMaxAvailableStep(steps.length - 1);
  }, [criteria, steps.length]);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeStep]);

  const handleOpenStep = (index: number) => {
    if (index > maxAvailableStep) return;
    setActiveStep(index);
  };

  const hasCriteria = Boolean(criteria);

  return (
    <div className="w-full space-y-6" ref={contentRef}>
      <div className="rounded-3xl bg-white/70 p-4 shadow-lg ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px,1fr]">
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              const isLocked = index > maxAvailableStep;
              const isDone = hasCriteria && index < activeStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleOpenStep(index)}
                  disabled={isLocked}
                  className={[
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                    isActive
                      ? "border-sky-400 bg-sky-50 text-sky-800 shadow"
                      : "border-slate-200 bg-white text-slate-800 hover:border-sky-200",
                    isLocked ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold",
                        isActive
                          ? "border-sky-400 bg-white text-sky-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{step.title}</div>
                      <div className="text-xs text-slate-500">{summaries[index]}</div>
                    </div>
                  </div>
                  {isDone && !isActive && <span className="text-xs text-sky-600">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-inner ring-1 ring-slate-100">
            <div className={activeStep === 0 ? "block" : "hidden"}>
              <SearchForm lang={lang} embedded onSearch={(params) => setCriteria(params)} />
            </div>

            {criteria ? (
              <div className={activeStep === 0 ? "hidden" : "block"}>
                <SearchResults lang={lang} {...criteria} />
              </div>
            ) : (
              activeStep > 0 && (
                <div className="flex h-full min-h-[200px] items-center justify-center text-center text-slate-500">
                  {lang === "en"
                    ? "Start with a search to continue booking"
                    : "Сначала выполните поиск, чтобы продолжить бронирование"}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
