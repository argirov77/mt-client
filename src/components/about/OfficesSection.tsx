"use client";

import Image from "next/image";
import { MapPin, Phone } from "lucide-react";

import {
  accentPillClass,
  cardTitleClass,
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionInnerClass,
  sectionPadClass,
  sectionTitleClass,
} from "../common/designGuide";
import { aboutContent, type Lang } from "./content";
import { aboutTranslations } from "@/translations/home";
import { trackContact } from "@/lib/analytics";
import { formatPhone } from "@/lib/offices";

const MESSENGERS = ["viber", "telegram", "whatsapp"] as const;

const messengerHref = (messenger: (typeof MESSENGERS)[number], phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (messenger === "viber") return `viber://chat?number=%2B${digits}`;
  if (messenger === "telegram") return `https://t.me/+${digits}`;
  return `https://wa.me/${digits}`;
};

/** «Офисы и контакты»: фото офиса, адрес и номера с мессенджерами. */
export default function OfficesSection({
  lang = "ru",
  id = "offices",
}: {
  lang?: Lang;
  id?: string;
}) {
  const copy = aboutTranslations[lang] ?? aboutTranslations.ru;
  const blocks = aboutContent[lang] ?? aboutContent.ru;
  const offices = blocks.find((block) => block.offices?.length)?.offices ?? [];
  // В макете Одесса идёт первой — это офис отправления для большинства пассажиров.
  const ordered = [...offices].sort((a, b) =>
    a.image.src.includes("privoz") === b.image.src.includes("privoz") ? 0 : a.image.src.includes("privoz") ? -1 : 1,
  );

  return (
    <section id={id} className={`bg-white ${sectionPadClass}`}>
      <div className={`${sectionInnerClass} flex flex-col gap-8 lg:gap-11`}>
        <div className="flex flex-wrap items-end justify-between gap-5 lg:gap-12">
          <div className="flex flex-1 basis-[520px] flex-col gap-4">
            <span className={sectionEyebrowClass}>{copy.officesKicker}</span>
            <h2 className={sectionTitleClass}>{copy.officesTitle}</h2>
          </div>
          <p className={`flex-1 basis-[380px] ${sectionDescriptionClass}`}>{copy.officesDescription}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {ordered.map((office) => (
            <article key={office.city} className="flex flex-col overflow-hidden rounded-3xl bg-[#f6f4f1]">
              <Image
                src={office.image.src}
                alt={office.image.alt}
                width={800}
                height={600}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-col gap-3.5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className={`${cardTitleClass} text-[22px]`}>{office.city}</h3>
                  <span className={accentPillClass}>{office.tag}</span>
                </div>
                <p className="flex gap-2 text-[15px] leading-snug text-[#5c6370]">
                  <MapPin className="mt-0.5 h-[18px] w-[18px] flex-none" strokeWidth={2} aria-hidden />
                  {office.address}
                </p>

                <div className="flex flex-col gap-2">
                  {office.phones.map((phone) => (
                    <div
                      key={phone}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-white py-2.5 pl-4 pr-2.5"
                    >
                      <a
                        href={`tel:${phone}`}
                        onClick={() => trackContact({ method: "phone", source: "about_section", label: phone })}
                        className="flex-1 basis-[180px] text-[18px] font-bold text-[#173452] hover:text-[#c2410c]"
                      >
                        {formatPhone(phone)}
                      </a>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${phone}`}
                          onClick={() => trackContact({ method: "phone", source: "about_section", label: phone })}
                          aria-label={`${copy.call} ${formatPhone(phone)}`}
                          className="grid h-11 w-11 place-items-center rounded-xl bg-[#173452] text-white transition hover:bg-[#2a4a6b]"
                        >
                          <Phone className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </a>
                        {MESSENGERS.map((messenger) => (
                          <a
                            key={messenger}
                            href={messengerHref(messenger, phone)}
                            onClick={() =>
                              trackContact({ method: messenger, source: "about_section", label: messenger })
                            }
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${messenger} ${formatPhone(phone)}`}
                            className="grid h-11 w-11 place-items-center rounded-xl border border-[#e3dfd9] bg-white transition hover:border-[#173452]"
                          >
                            <Image src={`/icons/${messenger}.png`} alt="" width={24} height={24} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
