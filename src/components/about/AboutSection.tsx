"use client";

import React from "react";
import {
  bodyTextClass,
  cardBaseClass,
  iconCircleClass,
  sectionBgMuted,
  sectionTitleClass,
} from "../common/designGuide";
import { aboutContent, type Lang } from "./content";
import { aboutTranslations } from "@/translations/home";

type Props = {
  lang?: Lang;
  id?: string;
  className?: string;
};

export default function AboutSection({
  lang = "ru",
  id = "about",
  className = "",
}: Props) {
  const blocks = aboutContent[lang] ?? aboutContent.ru;
  const heading = aboutTranslations[lang]?.heading ?? aboutTranslations.ru.heading;

  return (
    <section id={id} className={`${sectionBgMuted} py-12 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <h2 className={`${sectionTitleClass} text-center`}>
          {heading}
        </h2>

        <ol className="mt-10 grid gap-5 md:grid-cols-2">
          {blocks.map((block, idx) => (
            <li
              key={`${block.title}-${idx}`}
              className={`${cardBaseClass} flex items-start gap-4 p-6`}
            >
              <span className={`${iconCircleClass} h-9 w-9 text-sm font-semibold`}>{idx + 1}</span>

              <div className="min-w-0 space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {block.title}
                </h3>

                {block.text.map((p, i) => (
                  <p key={i} className={`${bodyTextClass} text-slate-700`}>
                    {p}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
