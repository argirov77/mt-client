"use client";

import { useEffect } from "react";

type Translation = {
  ticketDownloadReady: string;
  ticketDownload: string;
  ticketDownloadDismiss: string;
};

type Props = {
  visible: boolean;
  t: Translation;
  onDownload: () => void;
  onClose: () => void;
};

export default function TicketDownloadPrompt({
  visible,
  t,
  onDownload,
  onClose,
}: Props) {
  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(onClose, 15000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-full max-w-xs sm:max-w-sm">
      <div className="pointer-events-auto rounded-3xl border border-sky-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold text-sky-900">
            {t.ticketDownloadReady}
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.ticketDownloadDismiss}
            className="rounded-full border border-transparent p-1 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            {t.ticketDownload}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
          >
            {t.ticketDownloadDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
