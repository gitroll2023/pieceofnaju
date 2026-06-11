import Link from "next/link";

export default function SectionTitle({
  eyebrow,
  title,
  moreHref,
  moreLabel = "더보기",
}: {
  eyebrow?: string;
  title: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-5">
      <div>
        {eyebrow && (
          <p className="mb-0.5 text-[12px] font-semibold tracking-wide text-pear-deep">
            {eyebrow}
          </p>
        )}
        <h2 className="brand-serif text-[19px] font-extrabold text-ink">
          {title}
        </h2>
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          className="shrink-0 pb-0.5 text-[12.5px] font-semibold text-ink-soft"
        >
          {moreLabel} →
        </Link>
      )}
    </div>
  );
}
