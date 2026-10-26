"use client";

import { useEffect } from "react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] page error:", error);
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
      <h1 className="text-2xl font-semibold text-[#173452]">
        Произошла ошибка
      </h1>
      <p className="text-[#5c6370] max-w-sm">
        Что-то пошло не так. Попробуйте обновить страницу.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-full bg-[#173452] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a4a6b] transition"
          onClick={reset}
        >
          Обновить
        </button>
        <a
          href="/"
          className="rounded-full border border-[#e3dfd9] px-6 py-3 text-sm font-semibold text-[#173452] hover:bg-[#f6f4f1] transition"
        >
          На главную
        </a>
      </div>
    </main>
  );
}
