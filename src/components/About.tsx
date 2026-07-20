// src/components/About.tsx
"use client";

import AboutSection from "@/components/about/AboutSection";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useSectionView } from "@/utils/useSectionView";

export default function About() {
  const { lang } = useLanguage();
  const sectionRef = useSectionView<HTMLDivElement>("about");

  return (
    <div id="about" ref={sectionRef}>
      <AboutSection lang={lang} />
    </div>
  );
}
