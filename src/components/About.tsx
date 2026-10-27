// src/components/About.tsx
"use client";

import AboutSection from "@/components/about/AboutSection";
import FleetSection from "@/components/about/FleetSection";
import OfficesSection from "@/components/about/OfficesSection";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useSectionView } from "@/utils/useSectionView";

/** Три раздела подряд: о компании, офисы и контакты, автопарк. */
export default function About() {
  const { lang } = useLanguage();
  const sectionRef = useSectionView<HTMLDivElement>("about");

  return (
    <div ref={sectionRef}>
      <AboutSection lang={lang} />
      <OfficesSection lang={lang} />
      <FleetSection lang={lang} />
    </div>
  );
}
