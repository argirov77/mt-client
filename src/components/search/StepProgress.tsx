import React from "react";

import type { Step } from "./types";

type StepState = {
  id: Step;
  label: string;
  summary: string;
  state: "active" | "done" | "future";
};

type StepProgressProps = {
  activeStep: Step;
  steps: StepState[];
  onNavigate: (step: Step) => void;
  stepCounterLabel: string;
};

const StepProgress: React.FC<StepProgressProps> = ({
  activeStep,
  steps,
  onNavigate,
  stepCounterLabel,
}) => {
  const progressPercent = ((activeStep - 1) / Math.max(steps.length - 1, 1)) * 100;
  const activeIndex = Math.max(0, steps.findIndex((step) => step.state === "active"));
  const underlineWidth = `${100 / Math.max(steps.length, 1)}%`;

  return (
    <div className="rounded-none border-0 bg-transparent p-0 pb-1 shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-4 sm:pb-3 sm:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 transition-all duration-400 ease-in-out"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {stepCounterLabel}
        </span>
      </div>
      <div className="relative mt-3">
        <div className="hidden pb-3 sm:grid sm:grid-cols-3 sm:gap-3">
          {steps.map((step) => {
            const isActive = step.state === "active";
            const isDone = step.state === "done";
            const isFuture = step.state === "future";

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onNavigate(step.id)}
                className={`group flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md duration-400 ease-in-out ${
                  isActive
                    ? "scale-[1.04] border-sky-400 bg-sky-50"
                    : isDone
                      ? "hover:scale-[1.01] border-emerald-100 bg-emerald-50"
                      : "hover:scale-[1.01] border-slate-200 bg-white"
                } ${isFuture ? "opacity-75" : ""}`}
              >
                <div className="flex w-full items-center gap-2">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-sky-600 text-white"
                        : isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isDone && !isActive ? "✓" : step.id}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{step.label}</div>
                    <div className="truncate text-xs text-slate-500">{step.summary}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute bottom-0 left-0 h-[3px] rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 transition-transform duration-400 ease-in-out"
            style={{
              width: underlineWidth,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
