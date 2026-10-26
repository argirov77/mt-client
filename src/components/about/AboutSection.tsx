"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionInnerClass,
  sectionPadClass,
  sectionTitleClass,
} from "../common/designGuide";
import { aboutTranslations } from "@/translations/home";
import { yearsOnLine } from "@/lib/years";
import type { Lang } from "./content";

type Props = {
  lang?: Lang;
  id?: string;
  className?: string;
};

/**
 * «О компании» по макету: слева факты и две кнопки, справа тёмная карточка
 * с фотографией и четырьмя цифрами.
 */
export default function AboutSection({ lang = "ru", id = "about", className = "" }: Props) {
  const copy = aboutTranslations[lang] ?? aboutTranslations.ru;
  // Срок работы считается от текущего года — его видно и в заголовке, и в цифрах.
  const years = yearsOnLine(lang);
  const withYears = (text: string) => text.replace("{years}", years);

  return (
    <section id={id} className={`bg-white ${sectionPadClass} ${className}`}>
      <div className={`${sectionInnerClass} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div className="flex flex-col gap-5">
          <span className={sectionEyebrowClass}>{copy.kicker}</span>
          <h2 className={sectionTitleClass} suppressHydrationWarning>
            {withYears(copy.title)}
          </h2>
          <p className={`max-w-xl ${sectionDescriptionClass}`}>{copy.subtitle}</p>

          <ul className="flex flex-col gap-3">
            {copy.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-[17px] text-[#173452]">
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[#fdf0e7]"
                >
                  <Check className="h-4 w-4 text-[#c2410c]" strokeWidth={3} />
                </span>
                {bullet}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="#booking" className={buttonPrimaryClass}>
              {copy.ctaBuy}
            </Link>
            <Link href="#offices" className={buttonSecondaryClass}>
              {copy.ctaOffices}
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-[#173452]">
          <Image
            src="/images/hero-webp.webp"
            alt={copy.photoAlt}
            width={1536}
            height={1024}
            className="h-40 w-full object-cover sm:h-56 lg:h-60"
            priority={false}
          />
          <div className="grid grid-cols-2 gap-px bg-white/15">
            {copy.facts.map((fact, index) => (
              <div key={fact.label} className="flex flex-col gap-1 bg-[#173452] p-5 sm:p-7">
                <span
                  className={`font-display text-[24px] font-bold leading-tight sm:text-[30px] lg:text-[34px] ${
                    index > 1 ? "text-[#fdba74]" : "text-white"
                  }`}
                  suppressHydrationWarning
                >
                  {withYears(fact.value)}
                </span>
                <span className="text-[15px] text-white/75">{fact.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
