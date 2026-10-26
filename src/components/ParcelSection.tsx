// src/components/ParcelSection.tsx
"use client";

import Image from "next/image";
import { Phone } from "lucide-react";

import { useLanguage } from "@/components/common/LanguageProvider";
import { parcelTranslations } from "@/translations/home";
import {
  cardTitleClass,
  sectionEyebrowOnDarkClass,
  sectionInnerClass,
  sectionPadClass,
  sectionTitleOnDarkClass,
} from "@/components/common/designGuide";
import { useSectionView } from "@/utils/useSectionView";
import { trackContact } from "@/lib/analytics";
import { OFFICES, OFFICE_ADDRESS, formatPhone, type OfficeCity } from "@/lib/offices";

export default function ParcelSection() {
  const { lang } = useLanguage();
  const t = parcelTranslations[lang];
  const sectionRef = useSectionView<HTMLElement>("parcel");

  // Прямые кнопки вместо общего окна: из Украины пишут в Одессу, из Болгарии — в Варну.
  const directions: { city: OfficeCity; tag: string }[] = [
    { city: "odessa", tag: t.fromUa },
    { city: "varna", tag: t.fromBg },
  ];

  return (
    <section id="parcel" ref={sectionRef} className={`bg-[#173452] text-white ${sectionPadClass}`}>
      <div className={`${sectionInnerClass} grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16`}>
        <div className="flex flex-col gap-5">
          <span className={sectionEyebrowOnDarkClass}>{t.kicker}</span>
          <h2 className={sectionTitleOnDarkClass}>{t.title}</h2>
          <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-[18px]">{t.description}</p>

          <div className="grid grid-cols-2 gap-3">
            {t.facts.map((fact) => (
              <div
                key={fact.title}
                className="flex flex-col gap-1 rounded-2xl border border-white/15 bg-white/[0.08] p-4 sm:p-[18px]"
              >
                <span className="text-sm text-white/75">{fact.title}</span>
                <span className="font-display text-[22px] font-bold leading-tight text-[#fdba74] sm:text-[28px]">
                  {fact.value}
                </span>
                {fact.hint ? <span className="text-[13px] text-white/75">{fact.hint}</span> : null}
              </div>
            ))}
          </div>

          <ol className="flex flex-col gap-3.5 pt-2">
            {t.steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3.5 text-[17px]">
                <span
                  aria-hidden="true"
                  className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full border-2 border-[#fdba74] font-bold text-[#fdba74]"
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-4">
          {directions.map(({ city, tag }) => {
            const phone = OFFICES.find((office) => office.city === city)?.phones[0] ?? "";
            const digits = phone.replace(/\D/g, "");
            return (
              <div key={city} className="flex flex-col gap-3.5 rounded-3xl bg-white p-5 text-[#173452] sm:p-7">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#c2410c]">{tag}</span>
                  <h3 className={cardTitleClass}>{t.officeIn[city]}</h3>
                  <span className="text-[15px] text-[#5c6370]">{OFFICE_ADDRESS[lang][city]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`viber://chat?number=%2B${digits}`}
                    onClick={() => trackContact({ method: "viber", source: "parcel_section", label: "viber" })}
                    className="flex min-h-[48px] flex-1 basis-24 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#e3dfd9] text-[15px] font-bold transition hover:border-[#173452]"
                  >
                    <Image src="/icons/viber.png" alt="" width={22} height={22} />
                    Viber
                  </a>
                  <a
                    href={`https://t.me/+${digits}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackContact({ method: "telegram", source: "parcel_section", label: "telegram" })}
                    className="flex min-h-[48px] flex-1 basis-24 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#e3dfd9] text-[15px] font-bold transition hover:border-[#173452]"
                  >
                    <Image src="/icons/telegram.png" alt="" width={22} height={22} />
                    Telegram
                  </a>
                  <a
                    href={`tel:${phone}`}
                    onClick={() => trackContact({ method: "phone", source: "parcel_section", label: phone })}
                    className="flex min-h-[48px] flex-[2] basis-48 items-center justify-center gap-2 rounded-2xl bg-[#c2410c] text-[15px] font-bold text-white transition hover:bg-[#a8380b]"
                  >
                    <Phone className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                    {formatPhone(phone)}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
