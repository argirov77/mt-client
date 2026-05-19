type Props = {
  text?: string;
};

export default function FullText({ text }: Props) {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;
  return (
    <section className="bg-white py-12">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-base leading-relaxed text-slate-700"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
