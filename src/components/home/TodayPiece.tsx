"use client";

import { MapPin, Puzzle, Navigation } from "lucide-react";
import { CATEGORY_META, PROGRAM_META, visiblePrograms, type Merchant } from "@/lib/data/merchants";
import { directionsUrl } from "@/lib/geo";
import StampButton from "@/components/ui/StampButton";

/**
 * "오늘의 한 조각" — 저장 없이 날짜 기준으로 매일 바뀌는 추천 1곳(무상태).
 * 가벼운 브랜드 큐레이션 카드.
 */
export default function TodayPiece({ m }: { m: Merchant }) {
  const cat = CATEGORY_META[m.c] ?? CATEGORY_META.food;
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <section className="px-4 pt-3">
      <div
        className="paper-grain overflow-hidden rounded-2xl border"
        style={{
          borderColor: "color-mix(in oklab, var(--naju-pear) 45%, var(--naju-line))",
          background: "linear-gradient(135deg, var(--naju-cream) 0%, var(--card) 75%)",
        }}
      >
        <div className="flex items-center gap-1.5 px-4 pt-3 text-[11.5px] font-bold text-pear-deep">
          <Puzzle className="size-3.5" /> 오늘의 한 조각 · {dateLabel}
        </div>

        <div className="flex gap-3 px-4 pb-2.5 pt-2">
          <div
            className="grid size-[68px] shrink-0 place-items-center rounded-xl text-3xl"
            style={{ background: `color-mix(in oklab, ${cat.color} 18%, white)` }}
          >
            {cat.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="brand-serif truncate text-[17px] font-extrabold leading-tight text-ink">
              {m.n}
            </h3>
            <p className="mt-0.5 truncate text-[12px] text-ink-soft">
              {cat.emoji} {m.t || cat.label}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-soft">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{m.a}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3.5">
          <StampButton item={{ id: m.id, n: m.n, c: m.c, d: m.d, lat: m.lat, lng: m.lng, t: m.t }} />
          <a href={directionsUrl(m.n, m.lat, m.lng)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 rounded-full border border-line bg-card px-2 py-1 text-[11px] font-bold text-river active:scale-95">
            <Navigation className="size-3" />길찾기
          </a>
          {visiblePrograms(m.p).map((k) => (
            <span
              key={k}
              className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-white"
              style={{ backgroundColor: PROGRAM_META[k].color }}
            >
              {PROGRAM_META[k].short}
            </span>
          ))}
          {m.tel && (
            <a
              href={`tel:${m.tel.replace(/[^0-9]/g, "")}`}
              className="ml-auto text-[11.5px] font-semibold text-river"
            >
              전화
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
