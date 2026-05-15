"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import UiAlert from "@/components/common/Alert";

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

type Props = {
  initialStatus: string;
  shouldCleanUrl: boolean;
};

export default function PaymentBanner({ initialStatus, shouldCleanUrl }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [status] = useState(initialStatus);

  useEffect(() => {
    if (!shouldCleanUrl) return;
    router.replace(pathname || "/", { scroll: false });
  }, [pathname, router, shouldCleanUrl]);

  const banner = PAYMENT_BANNER[status];
  if (!banner) return null;
  return <UiAlert type={banner.type}>{banner.message}</UiAlert>;
}
