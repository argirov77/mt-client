// src/components/About.tsx
"use client";

import AboutSection from "@/components/about/AboutSection";
import FleetSection from "@/components/about/FleetSection";
import OfficesSection from "@/components/about/OfficesSection";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useSectionView } from "@/utils/useSectionView";

/** Три раздела подряд, как в макетах: о компании, автопарк, офисы и контакты. */
export default function About() {
  const { lang } = useLanguage();
  const sectionRef = useSectionView<HTMLDivElement>("about");

  return (
    <div ref={sectionRef}>
      <AboutSection lang={lang} />
      <FleetSection lang={lang} />
      <OfficesSection lang={lang} />
    </div>
  );
}
