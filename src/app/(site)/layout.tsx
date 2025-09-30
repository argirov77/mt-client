import type { ReactNode } from "react";

import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <SiteFooter />
    </>
  );
}
