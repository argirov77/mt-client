"use client";

import Image from "next/image";
import { useState } from "react";
import { Armchair, Bath, Snowflake, Usb, Wifi } from "lucide-react";

import {
  sectionBgMuted,
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionInnerClass,
  sectionPadClass,
  sectionTitleClass,
} from "../common/designGuide";
import { aboutContent, type Lang } from "./content";
import { aboutTranslations } from "@/translations/home";

type MediaItem = { src: string; alt: string; caption?: string };

const AMENITY_ICONS = [Snowflake, Wifi, Usb, Bath, Armchair];

/** «Автопарк»: три фото автобусов и строка удобств под ними. */
export default function FleetSection({ lang = "ru", id = "fleet" }: { lang?: Lang; id?: string }) {
  const copy = aboutTranslations[lang] ?? aboutTranslations.ru;
  const blocks = aboutContent[lang] ?? aboutContent.ru;
  const media = blocks.find((block) => block.media?.length)?.media ?? [];
  const [modalItem, setModalItem] = useState<MediaItem | null>(null);

  return (
    <section id={id} className={`${sectionBgMuted} ${sectionPadClass}`}>
      <div className={`${sectionInnerClass} flex flex-col gap-8 lg:gap-11`}>
        <div className="flex flex-wrap items-end justify-between gap-5 lg:gap-12">
          <div className="flex flex-1 basis-[520px] flex-col gap-4">
            <span className={sectionEyebrowClass}>{copy.fleetKicker}</span>
            <h2 className={sectionTitleClass}>{copy.fleetTitle}</h2>
          </div>
          <p className={`flex-1 basis-[380px] ${sectionDescriptionClass}`}>{copy.fleetDescription}</p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <li key={item.src}>
              <button
                type="button"
                onClick={() => setModalItem(item)}
                className="w-full overflow-hidden rounded-3xl bg-white text-left shadow-[0_1px_2px_rgba(23,52,82,0.06),0_8px_24px_rgba(23,52,82,0.06)] transition hover:shadow-[0_2px_4px_rgba(23,52,82,0.08),0_14px_32px_rgba(23,52,82,0.1)]"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={640}
                  height={400}
                  className="aspect-[16/10] w-full object-cover"
                />
                <span className="block px-5 pb-[18px] pt-4 text-[18px] font-bold text-[#173452]">
                  {item.caption ?? item.alt}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <ul className="grid gap-4 rounded-3xl bg-white p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-5">
          {copy.amenityList.map((amenity, index) => {
            const Icon = AMENITY_ICONS[index] ?? Snowflake;
            return (
              <li key={amenity} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[#fdf0e7]"
                >
                  <Icon className="h-6 w-6 text-[#173452]" strokeWidth={2} />
                </span>
                <span className="text-base font-semibold text-[#173452]">{amenity}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {modalItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#173452]/70 px-4"
          onClick={() => setModalItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalItem.caption ?? modalItem.alt}
            className="w-full max-w-4xl overflow-hidden rounded-3xl bg-[#173452]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={modalItem.src}
              alt={modalItem.alt}
              width={1200}
              height={800}
              className="h-[60vh] w-full object-contain"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-sm text-white/85">
              <span>{modalItem.caption ?? modalItem.alt}</span>
              <button
                type="button"
                className="min-h-[44px] rounded-xl border border-white/25 px-4 text-sm font-bold text-white"
                onClick={() => setModalItem(null)}
              >
                {copy.closeLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
