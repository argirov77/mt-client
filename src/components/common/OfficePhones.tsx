"use client";

import { trackContact } from "@/lib/analytics";
import { OFFICES, OFFICE_CITY_NAME, formatPhone } from "@/lib/offices";
import type { Lang } from "@/lib/locale";

type Props = {
  lang: Lang;
  // только первый номер каждого офиса
  primaryOnly?: boolean;
  className?: string;
  // источник для события contact в GA4
  source: string;
};

/** Телефоны офисов в Одессе и Варне — кнопками-ссылками tel:. */
export default function OfficePhones({ lang, primaryOnly = true, className = "", source }: Props) {
  return (
    <ul className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      {OFFICES.map((office) => (
        <li key={office.city} className="rounded-xl border border-[#e3dfd9] bg-white px-3 py-2 text-left">
          <p className="text-xs font-semibold text-[#5c6370]">{OFFICE_CITY_NAME[lang][office.city]}</p>
          {(primaryOnly ? office.phones.slice(0, 1) : office.phones).map((phone) => (
            <a
              key={phone}
              href={`tel:${phone}`}
              onClick={() => trackContact({ method: "phone", source, label: phone })}
              className="block min-h-[32px] text-base font-bold text-[#c2410c] hover:underline"
            >
              {formatPhone(phone)}
            </a>
          ))}
        </li>
      ))}
    </ul>
  );
}
