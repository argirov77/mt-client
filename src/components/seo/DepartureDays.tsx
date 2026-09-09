type Props = {
  text?: string | null;
};

/**
 * Дни отправления над таблицей остановок. Текст приходит из
 * `departureDaysText()` — хардкод по группе направления, не из данных остановок.
 */
export default function DepartureDays({ text }: Props) {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return (
    <section className="bg-white pt-4">
      <div className="mx-auto w-full max-w-3xl px-4">
        <p className="text-base leading-relaxed text-slate-700">{trimmed}</p>
      </div>
    </section>
  );
}
