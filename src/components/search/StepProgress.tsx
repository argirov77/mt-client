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
  const activeLabel = steps.find((step) => step.id === activeStep)?.label ?? "";
  const progressPercent = (activeStep / Math.max(steps.length, 1)) * 100;

  return (
    <nav aria-label={stepCounterLabel} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4">
      {/* Телефон: название шага, «Шаг 1 из 3» и тонкая полоса */}
      <div className="sm:hidden">
        <div className="flex justify-between text-xs font-bold text-slate-600">
          <span>{activeLabel}</span>
          <span>{stepCounterLabel}</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-slate-200">
          <div
            className="h-1 rounded-full bg-[#0a65b0] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Компьютер: три пронумерованных шага */}
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, index) => {
          const isActive = step.state === "active";
          const isDone = step.state === "done";
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                aria-current={isActive ? "step" : undefined}
                className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-xl px-1 text-left"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    isActive
                      ? "bg-[#0a65b0] text-white"
                      : isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isDone && !isActive ? "✓" : step.id}
                </span>
                <span
                  className={`truncate text-sm ${isActive ? "font-bold text-slate-900" : "font-semibold text-slate-600"}`}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span aria-hidden className="h-px flex-1 bg-slate-200" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepProgress;
