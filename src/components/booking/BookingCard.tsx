"use client";

import React, { useState } from "react";

const steps = ["Поиск", "Рейсы", "Места", "Пассажиры"] as const;

export default function BookingCard() {
  const [current, setCurrent] = useState(0);

  const renderStep = (index: number) => {
    switch (index) {
      case 0:
        return <div>Поиск: форма поиска</div>;
      case 1:
        return <div>Рейсы: список рейсов</div>;
      case 2:
        return <div>Места: схема мест</div>;
      case 3:
        return <div>Пассажиры и оплата: форма</div>;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row">
      <div className="flex-1 space-y-4">
        <Stepper current={current} onSelect={setCurrent} />

        {/* Steps as accordion */}
        {steps.map((step, index) => (
          <details
            key={step}
            open={index === current}
            className="rounded-md border"
          >
            <summary
              className="cursor-pointer p-4 font-medium"
              onClick={() => setCurrent(index)}
            >
              {step}
            </summary>
            {index === current && (
              <div className="p-4">{renderStep(index)}</div>
            )}
          </details>
        ))}
      </div>

      <Summary current={current} />
    </div>
  );
}

function Stepper({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <nav aria-label="Прогресс">
      <ol className="flex w-full items-center">
        {steps.map((label, index) => {
          const status =
            index < current ? "done" : index === current ? "active" : "todo";
          return (
            <li
              key={label}
              className={`flex items-center ${
                index < steps.length - 1 ? "flex-1" : ""
              }`}
              aria-current={status === "active" ? "step" : undefined}
            >
              <button
                type="button"
                onClick={() => index <= current && onSelect(index)}
                className="flex items-center"
              >
                <span
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full text-white " +
                    (status === "active"
                      ? "bg-blue-600"
                      : status === "done"
                      ? "bg-green-600"
                      : "bg-gray-300 text-gray-600")
                  }
                >
                  {status === "done" ? "✓" : index + 1}
                </span>
                <span className="ml-2 text-sm">{label}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={
                    "mx-2 h-0.5 flex-1 " +
                    (index < current ? "bg-green-600" : "bg-gray-300")
                  }
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Summary({ current }: { current: number }) {
  const cta = current === steps.length - 1 ? "Оплатить" : "Далее";
  return (
    <aside className="fixed bottom-0 left-0 right-0 border bg-white p-4 md:sticky md:top-4 md:w-64 md:self-start md:rounded-md">
      <h4 className="mb-2 font-semibold">Итоги</h4>
      <div className="space-y-1 text-sm">
        <p>Маршрут + дата</p>
        <p>Пассажиры: -</p>
        <p>Места: -</p>
        <p>Сумма: -</p>
      </div>
      <button className="mt-4 w-full border p-2">{cta}</button>
    </aside>
  );
}

