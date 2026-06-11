"use client";

import { motion } from "framer-motion";
import { AGE_META, type AgeGroup } from "@/lib/data/types";

const AGES: AgeGroup[] = ["20", "30", "40", "50"];

/** 나이대 탭 — framer-motion 인디케이터가 선택 칸으로 슬라이드 */
export default function AgeTabs({
  value,
  onChange,
}: {
  value: AgeGroup;
  onChange: (age: AgeGroup) => void;
}) {
  return (
    <div className="px-5">
      <div className="relative grid grid-cols-4 gap-1 rounded-2xl border border-line bg-card p-1">
        {AGES.map((age) => {
          const active = age === value;
          return (
            <button
              key={age}
              type="button"
              onClick={() => onChange(age)}
              aria-pressed={active}
              className="relative z-10 rounded-xl py-2.5 text-center transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="age-tab-indicator"
                  className="absolute inset-0 -z-10 rounded-xl bg-river shadow-[0_6px_16px_rgba(31,78,95,0.28)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`block text-[14.5px] font-extrabold leading-none transition-colors ${
                  active ? "text-white" : "text-ink"
                }`}
              >
                {AGE_META[age].label}
              </span>
              <span
                className={`mt-1 block text-[10.5px] font-medium leading-none transition-colors ${
                  active ? "text-white/80" : "text-ink-soft"
                }`}
              >
                {AGE_META[age].persona.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
