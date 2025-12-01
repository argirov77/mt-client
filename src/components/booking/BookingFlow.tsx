"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDate } from "@/utils/date";

const STEP_NUMBERS = {
  search: 1,
  outbound: 2,
  return: 3,
  passengers: 4,
  seatsOutbound: 5,
  seatsReturn: 6,
  extras: 7,
  contact: 8,
  payment: 9,
} as const;

type StepKey = keyof typeof STEP_NUMBERS;

type SearchState = {
  from: string;
  to: string;
  date: string;
  returnDate: string;
  roundTrip: boolean;
};

type PassengerState = {
  count: number;
  names: string[];
};

type SeatState = {
  seats: string[];
};

type ExtrasState = {
  baggage: boolean;
  insurance: boolean;
};

type ContactState = {
  phone: string;
  email: string;
};

type PaymentState = {
  method: string;
};

type Status = "idle" | "done";

type BookingState = {
  search: SearchState;
  outbound: string;
  return: string;
  passengers: PassengerState;
  seatsOutbound: SeatState;
  seatsReturn: SeatState;
  extras: ExtrasState;
  contact: ContactState;
  payment: PaymentState;
};

const initialState: BookingState = {
  search: {
    from: "",
    to: "",
    date: "",
    returnDate: "",
    roundTrip: false,
  },
  outbound: "",
  return: "",
  passengers: { count: 1, names: [""] },
  seatsOutbound: { seats: [] },
  seatsReturn: { seats: [] },
  extras: { baggage: false, insurance: false },
  contact: { phone: "", email: "" },
  payment: { method: "" },
};

const protectedSteps: StepKey[] = ["passengers", "extras", "contact"];

export default function BookingFlow() {
  const [state, setState] = useState<BookingState>(initialState);
  const [statuses, setStatuses] = useState<Record<StepKey, Status>>({
    search: "idle",
    outbound: "idle",
    return: "idle",
    passengers: "idle",
    seatsOutbound: "idle",
    seatsReturn: "idle",
    extras: "idle",
    contact: "idle",
    payment: "idle",
  });
  const [activeStep, setActiveStep] = useState<StepKey>("search");
  const [roundTripChoice, setRoundTripChoice] = useState(state.search.roundTrip);

  const visibleSteps = useMemo(() => {
    const list: StepKey[] = [
      "search",
      "outbound",
      "return",
      "passengers",
      "seatsOutbound",
      "seatsReturn",
      "extras",
      "contact",
      "payment",
    ];

    if (!state.search.roundTrip) {
      return list.filter((step) => step !== "return" && step !== "seatsReturn");
    }

    return list;
  }, [state.search.roundTrip]);

  useEffect(() => {
    if (!visibleSteps.includes(activeStep)) {
      const fallback = visibleSteps[visibleSteps.indexOf("search") + 1] || "search";
      setActiveStep(fallback);
    }
  }, [activeStep, visibleSteps]);

  useEffect(() => {
    setRoundTripChoice(state.search.roundTrip);
  }, [state.search.roundTrip]);

  const canOpenStep = (target: StepKey) => {
    const targetIdx = visibleSteps.indexOf(target);
    if (targetIdx === -1) return false;

    return visibleSteps.slice(0, targetIdx).every((key) => statuses[key] === "done");
  };

  const setStepDone = (step: StepKey) => {
    setStatuses((prev) => ({ ...prev, [step]: "done" }));
  };

  const resetSteps = (fromStep: StepKey) => {
    const resetMap: Partial<Record<StepKey, StepKey[]>> = {
      search: ["outbound", "return", "seatsOutbound", "seatsReturn", "payment"],
      outbound: ["return", "seatsOutbound", "seatsReturn", "payment"],
      return: ["seatsReturn", "payment"],
      passengers: ["seatsOutbound", "seatsReturn", "payment"],
      seatsOutbound: ["payment"],
      seatsReturn: ["payment"],
      extras: ["payment"],
    };

    const toReset = resetMap[fromStep] || [];

    if (toReset.length === 0) return;

    setState((prev) => {
      const updated: BookingState = { ...prev };

      toReset.forEach((step) => {
        if (protectedSteps.includes(step)) return;
        switch (step) {
          case "outbound":
            updated.outbound = "";
            break;
          case "return":
            updated.return = "";
            break;
          case "seatsOutbound":
            updated.seatsOutbound = { seats: [] };
            break;
          case "seatsReturn":
            updated.seatsReturn = { seats: [] };
            break;
          case "payment":
            updated.payment = { method: "" };
            break;
          default:
            break;
        }
      });

      return updated;
    });

    setStatuses((prev) => {
      const next = { ...prev };
      toReset.forEach((step) => {
        if (protectedSteps.includes(step)) return;
        next[step] = "idle";
      });
      return next;
    });

    const firstReset = toReset.find((step) => visibleSteps.includes(step));
    if (firstReset) {
      setActiveStep(firstReset);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const roundTrip = formData.get("roundTrip") === "on";

    setRoundTripChoice(roundTrip);

    setState((prev) => ({
      ...prev,
      search: {
        from: String(formData.get("from") || ""),
        to: String(formData.get("to") || ""),
        date: String(formData.get("date") || ""),
        returnDate: roundTrip ? String(formData.get("returnDate") || "") : "",
        roundTrip,
      },
    }));

    resetSteps("search");
    setStepDone("search");
    const next = visibleSteps[visibleSteps.indexOf("search") + 1];
    if (next) setActiveStep(next);
  };

  const handleOutboundSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    setState((prev) => ({ ...prev, outbound: String(formData.get("outbound") || "") }));
    resetSteps("outbound");
    setStepDone("outbound");

    const next = visibleSteps.includes("return") ? "return" : "passengers";
    setActiveStep(next);
  };

  const handleReturnSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    setState((prev) => ({ ...prev, return: String(formData.get("return") || "") }));
    resetSteps("return");
    setStepDone("return");
    setActiveStep("passengers");
  };

  const handlePassengersSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const count = Math.max(1, Number(formData.get("count") || 1));

    setState((prev) => ({
      ...prev,
      passengers: {
        count,
        names: Array.from({ length: count }, (_, idx) =>
          prev.passengers.names[idx] ? prev.passengers.names[idx] : "",
        ),
      },
    }));

    resetSteps("passengers");
    setStepDone("passengers");
    setActiveStep("seatsOutbound");
  };

  const handleSeatsSubmit = (
    step: "seatsOutbound" | "seatsReturn",
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const seats = String(formData.get("seats") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, state.passengers.count);

    setState((prev) => ({
      ...prev,
      [step]: { seats },
    }));

    resetSteps(step);
    setStepDone(step);

    if (step === "seatsOutbound") {
      const next = visibleSteps.includes("seatsReturn") ? "seatsReturn" : "extras";
      setActiveStep(next);
    } else {
      setActiveStep("extras");
    }
  };

  const handleExtrasSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    setState((prev) => ({
      ...prev,
      extras: {
        baggage: formData.get("baggage") === "on",
        insurance: formData.get("insurance") === "on",
      },
    }));

    resetSteps("extras");
    setStepDone("extras");
    setActiveStep("contact");
  };

  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    setState((prev) => ({
      ...prev,
      contact: {
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || ""),
      },
    }));

    setStepDone("contact");
    setActiveStep("payment");
  };

  const handlePaymentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    setState((prev) => ({
      ...prev,
      payment: { method: String(formData.get("method") || "") },
    }));

    setStepDone("payment");
  };

  const updatePassengerName = (idx: number, value: string) => {
    setState((prev) => {
      const names = [...prev.passengers.names];
      names[idx] = value;
      return { ...prev, passengers: { ...prev.passengers, names } };
    });
  };

  const renderSummary = (step: StepKey) => {
    switch (step) {
      case "search":
        if (!state.search.from || !state.search.to || !state.search.date) return "Не выбрано";
        return `${state.search.from} → ${state.search.to}, ${formatDate(state.search.date)}${
          state.search.roundTrip && state.search.returnDate
            ? ` · обратно ${formatDate(state.search.returnDate)}`
            : ""
        }`;
      case "outbound":
        return state.outbound || "Рейс не выбран";
      case "return":
        return state.return || "Рейс не выбран";
      case "passengers":
        return `${state.passengers.count} пассаж.`;
      case "seatsOutbound":
        return state.seatsOutbound.seats.length
          ? `Места: ${state.seatsOutbound.seats.join(", ")}`
          : "Места не выбраны";
      case "seatsReturn":
        return state.seatsReturn.seats.length
          ? `Места: ${state.seatsReturn.seats.join(", ")}`
          : "Места не выбраны";
      case "extras":
        if (!state.extras.baggage && !state.extras.insurance) return "Без доп. услуг";
        return [state.extras.baggage ? "Багаж" : null, state.extras.insurance ? "Страховка" : null]
          .filter(Boolean)
          .join(" · ");
      case "contact":
        if (!state.contact.email && !state.contact.phone) return "Контакты не указаны";
        return [state.contact.email, state.contact.phone].filter(Boolean).join(" · ");
      case "payment":
        return state.payment.method ? `Метод: ${state.payment.method}` : "Оплата не выбрана";
      default:
        return "";
    }
  };

  const resumeVisible = useMemo(() => {
    const passengerIdx = visibleSteps.indexOf("passengers");
    const activeIdx = visibleSteps.indexOf(activeStep);
    return passengerIdx !== -1 && activeIdx >= passengerIdx;
  }, [activeStep, visibleSteps]);

  const renderStepHeader = (step: StepKey) => {
    const number = STEP_NUMBERS[step];
    const done = statuses[step] === "done";
    const isActive = activeStep === step;

    return (
      <div className="flex items-center justify-between gap-4 w-full text-left">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
              done ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
            }`}
          >
            {number}
          </span>
          <div>
            <p className="font-semibold">
              {labelByStep[step]}
              {isActive ? " (активен)" : done ? " (готов)" : ""}
            </p>
            {!isActive && <p className="text-sm text-slate-500">{renderSummary(step)}</p>}
          </div>
        </div>
        {!isActive && (
          <button
            type="button"
            onClick={() => canOpenStep(step) && setActiveStep(step)}
            className={`text-sm font-medium ${
              canOpenStep(step) ? "text-sky-700 underline" : "text-slate-400"
            }`}
          >
            Открыть
          </button>
        )}
      </div>
    );
  };

  return (
    <section id="booking" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 space-y-2">
          <p className="text-sm uppercase tracking-wide text-sky-600">Покупка билета</p>
          <h2 className="text-3xl font-bold text-slate-900">Линейный процесс из 9 шагов</h2>
          <p className="text-slate-600">
            Всегда открыт только один шаг. Переход к другим шагам возможен, если предыдущие завершены.
            Изменение шага автоматически сбрасывает зависимые шаги, кроме пассажиров, экстра и контактов.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {visibleSteps.map((step) => {
              const isActive = activeStep === step;

              return (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="cursor-pointer p-4" onClick={() => canOpenStep(step) && setActiveStep(step)}>
                    {renderStepHeader(step)}
                  </div>

                  {isActive && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      {step === "search" && (
                        <form className="space-y-3" onSubmit={handleSearchSubmit}>
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                              Откуда
                              <input
                                name="from"
                                required
                                className="rounded-lg border px-3 py-2"
                                defaultValue={state.search.from}
                                placeholder="Например, София"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                              Куда
                              <input
                                name="to"
                                required
                                className="rounded-lg border px-3 py-2"
                                defaultValue={state.search.to}
                                placeholder="Например, Варна"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                              Дата отправления
                              <input
                                name="date"
                                type="date"
                                required
                                className="rounded-lg border px-3 py-2"
                                defaultValue={state.search.date}
                              />
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                name="roundTrip"
                                checked={roundTripChoice}
                                onChange={(e) => setRoundTripChoice(e.target.checked)}
                              />
                              Поездка туда-обратно
                            </label>
                            {roundTripChoice && (
                              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
                                Дата обратного рейса
                                <input
                                  name="returnDate"
                                  type="date"
                                  required={roundTripChoice}
                                  className="rounded-lg border px-3 py-2"
                                  defaultValue={state.search.returnDate}
                                />
                              </label>
                            )}
                          </div>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Сохранить поиск
                          </button>
                        </form>
                      )}

                      {step === "outbound" && (
                        <form className="space-y-3" onSubmit={handleOutboundSubmit}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Выберите рейс туда
                            <input
                              name="outbound"
                              required
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.outbound}
                              placeholder="Например, 17:00 – 21:30 · €45"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Продолжить
                          </button>
                        </form>
                      )}

                      {step === "return" && (
                        <form className="space-y-3" onSubmit={handleReturnSubmit}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Выберите рейс обратно
                            <input
                              name="return"
                              required={state.search.roundTrip}
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.return}
                              placeholder="Например, 10:00 – 14:20 · €38"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Продолжить
                          </button>
                        </form>
                      )}

                      {step === "passengers" && (
                        <form className="space-y-4" onSubmit={handlePassengersSubmit}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Количество пассажиров
                            <input
                              name="count"
                              type="number"
                              min={1}
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.passengers.count}
                            />
                          </label>
                          <div className="space-y-2">
                            {Array.from({ length: state.passengers.count }).map((_, idx) => (
                              <input
                                key={idx}
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder={`Пассажир ${idx + 1}`}
                                value={state.passengers.names[idx] || ""}
                                onChange={(e) => updatePassengerName(idx, e.target.value)}
                              />
                            ))}
                          </div>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Продолжить к выбору мест
                          </button>
                        </form>
                      )}

                      {step === "seatsOutbound" && (
                        <form className="space-y-3" onSubmit={(e) => handleSeatsSubmit("seatsOutbound", e)}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Места туда
                            <input
                              name="seats"
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.seatsOutbound.seats.join(", ")}
                              placeholder="Например: 12A, 12B"
                            />
                            <span className="text-xs text-slate-500">
                              Введите через запятую. Количество мест = пассажирам.
                            </span>
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Сохранить места
                          </button>
                        </form>
                      )}

                      {step === "seatsReturn" && (
                        <form className="space-y-3" onSubmit={(e) => handleSeatsSubmit("seatsReturn", e)}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Места обратно
                            <input
                              name="seats"
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.seatsReturn.seats.join(", ")}
                              placeholder="Например: 8C, 8D"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Сохранить места
                          </button>
                        </form>
                      )}

                      {step === "extras" && (
                        <form className="space-y-3" onSubmit={handleExtrasSubmit}>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" name="baggage" defaultChecked={state.extras.baggage} />
                            Багаж
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" name="insurance" defaultChecked={state.extras.insurance} />
                            Страховка
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Продолжить к контактам
                          </button>
                        </form>
                      )}

                      {step === "contact" && (
                        <form className="space-y-3" onSubmit={handleContactSubmit}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Телефон
                            <input
                              name="phone"
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.contact.phone}
                              placeholder="+359 ..."
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Email
                            <input
                              name="email"
                              type="email"
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.contact.email}
                              placeholder="you@example.com"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow"
                          >
                            Продолжить к оплате
                          </button>
                        </form>
                      )}

                      {step === "payment" && (
                        <form className="space-y-3" onSubmit={handlePaymentSubmit}>
                          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Способ оплаты
                            <select
                              name="method"
                              className="rounded-lg border px-3 py-2"
                              defaultValue={state.payment.method}
                            >
                              <option value="">Не выбрано</option>
                              <option value="card">Карта</option>
                              <option value="cash">Наличные</option>
                              <option value="apple-pay">Apple Pay</option>
                            </select>
                          </label>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-white shadow"
                          >
                            Зафиксировать оплату
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Резюме</h3>
            {!resumeVisible && <p className="text-sm text-slate-500">Появится с шага 4.</p>}

            {resumeVisible && (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Маршруты</p>
                  <p>{renderSummary("search")}</p>
                  <p className="text-slate-500">Туда: {renderSummary("outbound")}</p>
                  {state.search.roundTrip && <p className="text-slate-500">Обратно: {renderSummary("return")}</p>}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Пассажиры</p>
                  <p>{renderSummary("passengers")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Места</p>
                  <p className="text-slate-500">Туда: {renderSummary("seatsOutbound")}</p>
                  {state.search.roundTrip && (
                    <p className="text-slate-500">Обратно: {renderSummary("seatsReturn")}</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Экстра</p>
                  <p>{renderSummary("extras")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Контакты</p>
                  <p>{renderSummary("contact")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Оплата</p>
                  <p>{renderSummary("payment")}</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

const labelByStep: Record<StepKey, string> = {
  search: "Поиск рейса",
  outbound: "Рейс туда",
  return: "Рейс обратно",
  passengers: "Пассажиры",
  seatsOutbound: "Места туда",
  seatsReturn: "Места обратно",
  extras: "Экстра",
  contact: "Контакты",
  payment: "Оплата",
};
