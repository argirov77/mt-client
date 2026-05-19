type Props = {
  text?: string;
};

export default function LeadText({ text }: Props) {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return (
    <section className="bg-slate-50 pb-2 pt-4">
      <div className="mx-auto w-full max-w-3xl px-4">
        <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
          {trimmed}
        </p>
      </div>
    </section>
  );
}
