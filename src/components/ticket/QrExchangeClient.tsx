"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface QrExchangeClientProps {
  opaque: string;
}

export default function QrExchangeClient({ opaque }: QrExchangeClientProps) {
  const router = useRouter();
  const targetPath = useMemo(() => (opaque ? `/purchase/${opaque}` : "/"), [opaque]);

  useEffect(() => {
    router.replace(targetPath);
  }, [router, targetPath]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200 p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white/95 p-6 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-slate-800">Переходим в миникабинет…</h1>
        <p className="text-sm text-slate-500">
          Мы открываем покупку в новой вкладке. Если переход не произошёл автоматически, воспользуйтесь кнопкой ниже.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.replace(targetPath)}
            className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Открыть покупку
          </button>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow hover:bg-slate-100"
          >
            На главную
          </button>
        </div>
      </div>
    </main>
  );
}
