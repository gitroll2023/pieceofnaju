"use client";

import { Puzzle } from "lucide-react";
import { useStamps, type StampInput } from "@/lib/useStamps";

/** "나주 한조각" 수집 토글 — 가게/장소를 내 조각에 담는다 */
export default function StampButton({
  item,
  compact = false,
}: {
  item: StampInput;
  compact?: boolean;
}) {
  const { has, toggle } = useStamps();
  const on = has(item.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-pressed={on}
      title={on ? "내 조각에서 빼기" : "내 조각에 담기"}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition active:scale-90"
      style={
        on
          ? { background: "var(--naju-pear)", borderColor: "var(--naju-pear)", color: "#3a2a0c" }
          : { background: "var(--card)", borderColor: "var(--naju-line)", color: "var(--naju-ink-soft)" }
      }
    >
      <Puzzle className="size-3.5" fill={on ? "currentColor" : "none"} />
      {!compact && (on ? "담음" : "조각")}
    </button>
  );
}
