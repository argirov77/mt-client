"use client";

import { PropsWithChildren } from "react";

type AlertProps = PropsWithChildren<{
  type?: "info" | "success" | "error";
}>;

export default function UiAlert({ type = "info", children }: AlertProps) {
  const map = {
    info: "bg-[#fdf0e7] text-[#c2410c]",
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
  } as const;

  return (
    <div className={`rounded-lg px-4 py-3 text-sm ${map[type]}`}>
      {children}
    </div>
  );
}
