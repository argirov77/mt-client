import BookingCard from "@/components/booking/BookingCard";
import {
  sectionDescriptionClass,
  sectionEyebrowClass,
  sectionTitleClass,
} from "@/components/common/designGuide";
import type { Lang } from "@/lib/locale";
import { bookingTranslations } from "@/translations/home";

type Props = {
  lang: Lang;
  forcedFromId?: number;
  forcedToId?: number;
};

export default function BookingSection({ lang, forcedFromId, forcedToId }: Props) {
  const bookingCopy = bookingTranslations[lang];
  return (
    <section id="booking" className="-mt-12 bg-slate-50 py-12">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-2 text-center">
          <p className={sectionEyebrowClass}>{bookingCopy.eyebrow}</p>
          <h2 className={sectionTitleClass}>{bookingCopy.title}</h2>
          <p className={sectionDescriptionClass}>{bookingCopy.description}</p>
        </div>
        <BookingCard forcedFromId={forcedFromId} forcedToId={forcedToId} />
      </div>
    </section>
  );
}
