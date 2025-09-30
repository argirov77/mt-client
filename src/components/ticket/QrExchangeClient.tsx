"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API } from "@/config";
import { fetchWithInclude } from "@/utils/fetchWithInclude";

type ResolverState = "loading" | "error" | "stale";

interface QrExchangeClientProps {
  opaque: string;
}

const extractTicketId = (payload: Record<string, unknown> | null | undefined): string | null => {
  if (!payload) {
    return null;
  }

  const candidates: Array<unknown> = [
    payload["ticket_id"],
    payload["ticketId"],
    payload["id"],
    payload["ticket"],
    payload["purchase_id"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  const ticketUrl = payload["ticket_url"] ?? payload["url"];
  if (typeof ticketUrl === "string" && ticketUrl.trim().length > 0) {
    try {
      const url = new URL(ticketUrl, "http://localhost");
      const segments = url.pathname.split("/").filter(Boolean);
      const ticketIndex = segments.findIndex((segment) => segment === "ticket");
      if (ticketIndex >= 0 && segments.length > ticketIndex + 1) {
        return segments[ticketIndex + 1];
      }
      return segments.pop() ?? null;
    } catch {
      const parts = ticketUrl.split("/").filter(Boolean);
      return parts.pop() ?? null;
    }
  }

  return null;
};

const STALE_MESSAGE =
  "Ссылка по QR-коду больше недействительна. Попросите у перевозчика новую ссылку на билет.";

const ERROR_MESSAGE = "Не удалось открыть билет. Попробуйте снова или обратитесь в поддержку.";

export default function QrExchangeClient({ opaque }: QrExchangeClientProps) {
  const router = useRouter();
  const [state, setState] = useState<ResolverState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!opaque) {
      setState("error");
      setMessage(ERROR_MESSAGE);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const resolveTicket = async () => {
      setState("loading");
      setMessage(null);

      try {
        const response = await fetchWithInclude(`${API}/public/q/exchange`, {
          method: "POST",
          body: JSON.stringify({ code: opaque }),
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403 || response.status === 404) {
          if (!isActive) {
            return;
          }
          setState("stale");
          setMessage(STALE_MESSAGE);
          return;
        }

        if (!response.ok) {
          throw new Error(`Exchange failed with status ${response.status}`);
        }

        let payload: Record<string, unknown> | null = null;

        try {
          payload = (await response.json()) as Record<string, unknown>;
        } catch {
          payload = null;
        }

        const ticketId = extractTicketId(payload);

        if (!ticketId) {
          throw new Error("Ticket id missing in exchange response");
        }

        router.replace(`/ticket/${ticketId}`);
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        console.error(error);

        if (!isActive) {
          return;
        }

        setState("error");
        setMessage(ERROR_MESSAGE);
      }
    };

    void resolveTicket();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [attempt, opaque, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200 p-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white/95 p-6 text-center shadow-xl">
        {state === "loading" ? (
          <>
            <h1 className="text-xl font-semibold text-slate-800">Открываем билет…</h1>
            <p className="text-sm text-slate-500">
              Пожалуйста, подождите. Мы проверяем данные по QR-коду.
            </p>
          </>
        ) : state === "stale" ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800">Ссылка устарела</h1>
            <p className="text-sm text-slate-500">{message ?? STALE_MESSAGE}</p>
            <button
              type="button"
              onClick={retry}
              className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
            >
              Попробовать ещё раз
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800">Не удалось открыть билет</h1>
            <p className="text-sm text-slate-500">{message ?? ERROR_MESSAGE}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={retry}
                className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
              >
                Попробовать снова
              </button>
              <button
                type="button"
                onClick={() => router.replace("/")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow hover:bg-slate-100"
              >
                На главную
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

