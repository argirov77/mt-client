"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import HeroSection from "@/components/hero/HeroSection";
import Routes from "@/components/Routes";
import Schedule from "@/components/Schedule";
import About from "@/components/About";
import BookingCard from "@/components/booking/BookingCard";
import ParcelSection from "@/components/ParcelSection";
import UiAlert from "@/components/common/Alert";
import PurchaseClient from "@/components/purchase/PurchaseClient";
import { useLanguage } from "@/components/common/LanguageProvider";
import {
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionTitleClass,
} from "@/components/common/designGuide";
import { bookingTranslations } from "@/translations/home";

const PAYMENT_BANNER: Record<string, { type: "info" | "success" | "error"; message: string }> = {
  success: {
    type: "success",
    message: "Оплата подтверждена.",
  },
  pending: {
    type: "info",
    message: "Оплата обрабатывается.",
  },
  failed: {
    type: "error",
    message: "Оплата не прошла. Попробуйте еще раз.",
  },
};

function HomeContent() {
  const { lang } = useLanguage();
  const bookingCopy = bookingTranslations[lang];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [resolvedPurchaseId, setResolvedPurchaseId] = useState<string | null>(null);
  const [resolvedPaymentStatus, setResolvedPaymentStatus] = useState<string>("");

  const queryPurchaseId = useMemo(() => {
    const direct = searchParams.get("purchase_id");
    const fallback = searchParams.get("purchaseId");
    return (direct ?? fallback ?? "").trim();
  }, [searchParams]);

  const queryPaymentStatus = useMemo(() => {
    return (searchParams.get("payment") ?? "").trim().toLowerCase();
  }, [searchParams]);

  useEffect(() => {
    if (queryPurchaseId) {
      setResolvedPurchaseId(queryPurchaseId);
    }
    if (queryPaymentStatus) {
      setResolvedPaymentStatus(queryPaymentStatus);
    }

    if (!queryPurchaseId && !queryPaymentStatus) {
      return;
    }

    router.replace(pathname || "/", { scroll: false });
  }, [pathname, queryPaymentStatus, queryPurchaseId, router]);

  const activePurchaseId = resolvedPurchaseId || queryPurchaseId;
  const activePaymentStatus = resolvedPaymentStatus || queryPaymentStatus;
  const paymentBanner = PAYMENT_BANNER[activePaymentStatus] ?? null;

  if (activePurchaseId) {
    return (
      <main className="min-h-screen bg-slate-50 py-6">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4">
          {paymentBanner ? <UiAlert type={paymentBanner.type}>{paymentBanner.message}</UiAlert> : null}
          <PurchaseClient purchaseId={activePurchaseId} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section id="hero">
        <HeroSection lang={lang} />
      </section>

      <section id="booking" className="-mt-12 bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p className={sectionEyebrowClass}>{bookingCopy.eyebrow}</p>
            <h2 className={sectionTitleClass}>{bookingCopy.title}</h2>
            <p className={sectionDescriptionClass}>{bookingCopy.description}</p>
          </div>
          <BookingCard />
        </div>
      </section>

      <About />
      <ParcelSection />
      <Routes />
      <Schedule lang={lang} />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <HomeContent />
    </Suspense>
  );
}
