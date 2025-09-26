// src/components/About.tsx
"use client";

import AboutSection from "@/components/about/AboutSection";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function About() {
  const { lang } = useLanguage();

  return (
    <div id="about">
      <AboutSection lang={lang} />
    </div>
  );
}
