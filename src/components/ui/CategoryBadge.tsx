import { CATEGORY_META, type Category } from "@/lib/data/types";

export default function CategoryBadge({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{
        color: meta.colorVar,
        backgroundColor: `color-mix(in oklab, ${meta.colorVar} 14%, white)`,
      }}
    >
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
