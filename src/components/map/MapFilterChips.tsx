"use client";

import { CATEGORY_META, type Category } from "@/lib/data/types";

export type MapFilter = "all" | Category;

const ORDER: { key: MapFilter; label: string; emoji?: string }[] = [
  { key: "all", label: "전체" },
  { key: "food", label: CATEGORY_META.food.label, emoji: CATEGORY_META.food.emoji },
  { key: "cafe", label: CATEGORY_META.cafe.label, emoji: CATEGORY_META.cafe.emoji },
  { key: "spot", label: CATEGORY_META.spot.label, emoji: CATEGORY_META.spot.emoji },
];

/** 지도 상단 카테고리 필터 칩 가로줄 */
export default function MapFilterChips({
  value,
  onChange,
}: {
  value: MapFilter;
  onChange: (next: MapFilter) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
      {ORDER.map((chip) => {
        const active = chip.key === value;
        const color =
          chip.key === "all" ? "var(--naju-river)" : CATEGORY_META[chip.key].colorVar;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            aria-pressed={active}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition active:scale-95 ${
              active ? "text-white shadow-sm" : "border-line bg-card text-ink-soft"
            }`}
            style={
              active
                ? { backgroundColor: color, borderColor: color }
                : undefined
            }
          >
            {chip.emoji ? <span className="mr-1">{chip.emoji}</span> : null}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
