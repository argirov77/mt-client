"use client";

import { useEffect } from "react";

export default function ReturnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[return] page error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Произошла ошибка
      </h1>
      <p className="text-slate-600 max-w-sm">
        Не удалось загрузить страницу оплаты. Попробуйте обновить страницу или
        вернуться на главную.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition"
          onClick={reset}
        >
          Обновить
        </button>
        <a
          href="/"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          На главную
        </a>
      </div>
    </main>
  );
}
