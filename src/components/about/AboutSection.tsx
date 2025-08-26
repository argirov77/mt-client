"use client";

import React from "react";
import { aboutContent, type Lang } from "./content";

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

  return (
    <section id={id} className={`py-16 bg-slate-50 ${className}`}>
      <div className="container mx-auto max-w-5xl px-4">
        {/* Заголовок секции (можно локализовать отдельно, если нужно) */}
        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
          {lang === "en"
            ? "About company"
            : lang === "bg"
            ? "За компанията"
            : lang === "ua"
            ? "Про компанію"
            : "О компании"}
        </h2>

        {/* Список блоков «О нас» */}
        <ol className="mt-8 space-y-6">
          {blocks.map((block, idx) => (
            <li
              key={`${block.title}-${idx}`}
              className="rounded-2xl bg-white p-6 shadow ring-1 ring-slate-200"
            >
              <div className="flex items-start gap-4">
                {/* Номер блока как визуальный маркер/бейдж */}
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-600 text-[11px] font-semibold text-white ring-2 ring-white shadow">
                  {idx + 1}
                </span>

                {/* Контент блока */}
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {block.title}
                  </h3>

                  {block.text.map((p, i) => (
                    <p key={i} className="mt-3 text-slate-700">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
