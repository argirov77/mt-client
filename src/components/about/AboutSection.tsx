"use client";

import React from "react";
import Image from "next/image";
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
  const { heading, tagline } = aboutTranslations[lang] ?? aboutTranslations.ru;

  return (
    <section id={id} className={`${sectionBgMuted} py-14 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur">
            Maksimov Tours
          </span>
          <h2 className={`${sectionTitleClass} mt-4`}>
            {heading}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            {tagline}
          </p>
        </div>

        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {blocks.map((block, idx) => (
            <li
              key={`${block.title}-${idx}`}
              className={`${cardBaseClass} group flex h-full flex-col gap-5 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg shadow-slate-200/40 backdrop-blur`}
            >
              <div className="flex items-center gap-3">
                <span className={`${iconCircleClass} h-10 w-10 text-sm font-semibold text-slate-700`}>
                  {idx + 1}
                </span>
                <h3 className="text-lg font-semibold text-slate-900">
                  {block.title}
                </h3>
              </div>

              <div className="min-w-0 space-y-3">
                {block.text.map((p, i) => (
                  <p key={i} className={`${bodyTextClass} text-slate-700`}>
                    {p}
                  </p>
                ))}
              </div>

              {block.media ? (
                <div className="mt-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {block.media.map((item, mediaIndex) => (
                    <figure key={`${item.src}-${mediaIndex}`} className="space-y-2">
                      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-md shadow-slate-200/50">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={640}
                          height={420}
                          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                      {item.caption ? (
                        <figcaption className="text-sm font-medium text-slate-700">
                          {item.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
