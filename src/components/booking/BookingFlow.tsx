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
  const description =
    lang === "en"
      ? "Real search, seats, extras and payment in a single tidy flow."
      : "Реальный поиск, выбор мест, допы и оплата — в одном аккуратном потоке.";

  return (
    <div className="w-full space-y-6" ref={contentRef}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-sky-50 shadow-xl ring-1 ring-slate-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-50/70 to-transparent" />

        <div className="flex flex-col gap-6 p-6 lg:p-8">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25rem] text-sky-600">
                {lang === "en" ? "Booking wizard" : "Пошаговое бронирование"}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{titles[activeStep]}</h2>
              <p className="text-sm text-slate-600">{description}</p>
            </div>

            {criteria && (
              <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {lang === "en" ? "Current selection" : "Ваш выбор"}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {criteria.fromName || criteria.from} → {criteria.toName || criteria.to}
                </div>
                <div className="text-xs text-slate-500">
                  {criteria.date}
                  {criteria.returnDate ? ` • ${criteria.returnDate}` : ""}
                  {" • "}
                  {criteria.seatCount} {lang === "en" ? "traveler(s)" : "пасс."}
                </div>
              </div>
            )}
          </header>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[320px,1fr] lg:items-start">
            <div className="relative space-y-2">
              <div className="absolute left-[18px] top-7 hidden h-[calc(100%-60px)] w-px bg-slate-200 lg:block" />
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
                      "group relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                      isActive
                        ? "border-sky-400 bg-white shadow-lg shadow-sky-100"
                        : "border-slate-200/80 bg-white/70 hover:border-sky-200 hover:bg-white",
                      isLocked ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "relative z-10 grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition",
                        isActive
                          ? "border-sky-500 bg-sky-500 text-white shadow"
                          : "border-slate-200 bg-slate-50 text-slate-600 group-hover:border-sky-300",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <div
                        className={[
                          "text-sm font-semibold leading-tight",
                          isActive ? "text-slate-900" : "text-slate-700",
                        ].join(" ")}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500">{summaries[index]}</div>
                    </div>
                    {isDone && !isActive && (
                      <span className="ml-auto text-xs font-semibold text-sky-600">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-white/90 p-4 shadow-inner ring-1 ring-slate-100 lg:p-6">
              <div className={activeStep === 0 ? "block" : "hidden"}>
                <SearchForm lang={lang} embedded onSearch={(params) => setCriteria(params)} />
              </div>

              {criteria ? (
                <div className={activeStep === 0 ? "hidden" : "block"}>
                  <SearchResults lang={lang} {...criteria} />
                </div>
              ) : (
                activeStep > 0 && (
                  <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {lang === "en" ? "Step locked" : "Шаг недоступен"}
                    </div>
                    <p className="text-sm text-slate-600">
                      {lang === "en"
                        ? "Start with a search to continue booking"
                        : "Сначала выполните поиск, чтобы продолжить бронирование"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
