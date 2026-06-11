"use client";

import { REGION_META, REGION_ORDER, type RegionKey } from "@/lib/data/types";

export type RegionFilter = "all" | RegionKey;

/** 동·읍·면 권역 필터 칩 (각 권역의 장소 수 표시) */
export default function RegionChips({
  value,
  counts,
  onChange,
}: {
  value: RegionFilter;
  counts: Record<RegionFilter, number>;
  onChange: (next: RegionFilter) => void;
}) {
  const chips: { key: RegionFilter; label: string; admin?: string }[] = [
    { key: "all", label: "나주 전체" },
    ...REGION_ORDER.map((k) => ({
      key: k as RegionFilter,
      label: REGION_META[k].label,
      admin: REGION_META[k].admin,
    })),
  ];

  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2">
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            aria-pressed={active}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95 ${
              active
                ? "border-ink bg-ink text-background"
                : "border-line bg-card/90 text-ink-soft backdrop-blur"
            }`}
          >
            <span>{chip.label}</span>
            <span
              className={`rounded-full px-1.5 text-[10.5px] font-bold ${
                active ? "bg-background/25 text-background" : "bg-muted text-ink-soft"
              }`}
            >
              {counts[chip.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
