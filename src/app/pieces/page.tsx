"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Puzzle, Share2, X, MapPin } from "lucide-react";
import { useStamps } from "@/lib/useStamps";
import { CATEGORY_META } from "@/lib/data/merchants";

function catMeta(c: string) {
  return (CATEGORY_META as Record<string, { label: string; emoji: string; color: string }>)[c]
    ?? { label: "조각", emoji: "🧩", color: "#9a9088" };
}

export default function PiecesPage() {
  const { stamps, toggle, count } = useStamps();
  const [copied, setCopied] = useState(false);

  const dongCount = useMemo(
    () => new Set(stamps.map((s) => s.d).filter(Boolean)).size,
    [stamps],
  );
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stamps) m.set(s.c, (m.get(s.c) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [stamps]);

  async function share() {
    const text = `나주에서 ${count}조각을 모았어요 🧩 #나주한조각 @piece_of_naju`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "나주한조각", text, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
    }
  }

  return (
    <div className="min-h-[calc(100dvh_-_72px)] bg-background pb-6">
      {/* 진행도 헤더 */}
      <header className="paper-grain relative overflow-hidden px-5 pb-6 pt-7">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, var(--naju-cream) 0%, var(--background) 70%)" }}
        />
        <p className="flex items-center gap-1 text-[12px] font-bold tracking-wide text-pear-deep">
          <Puzzle className="size-3.5" /> 나주를 한 조각씩
        </p>
        <h1 className="brand-serif mt-1 text-[30px] font-extrabold leading-tight text-ink">
          내 조각 <span className="text-pear-deep">{count}</span>
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          돌아다니며 모은 나주의 조각들 · {dongCount}개 동네 정복
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={share}
            disabled={count === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-background transition active:scale-95 disabled:opacity-40"
          >
            <Share2 className="size-4" />
            {copied ? "복사됨!" : "내 조각 공유"}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-4 py-2 text-[13px] font-bold text-ink-soft active:scale-95"
          >
            더 모으러 가기
          </Link>
        </div>

        {/* 카테고리별 작은 진행 */}
        {byCat.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto">
            {byCat.map(([c, n]) => {
              const meta = catMeta(c);
              return (
                <span
                  key={c}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                  style={{ background: `color-mix(in oklab, ${meta.color} 16%, white)`, color: meta.color }}
                >
                  {meta.emoji} {meta.label} {n}
                </span>
              );
            })}
          </div>
        )}
      </header>

      {/* 조각 그리드 (퍼즐 타일) */}
      {count === 0 ? (
        <div className="grid place-items-center px-8 py-16 text-center">
          <Puzzle className="size-10 text-line" />
          <p className="mt-3 text-[14px] font-bold text-ink">아직 모은 조각이 없어요</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
            가이드·혜택에서 마음에 든 곳의 <b className="text-pear-deep">조각</b> 버튼을 누르면
            <br />여기에 한 조각씩 쌓여요.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 px-4 pt-4">
          {stamps
            .slice()
            .sort((a, b) => b.at - a.at)
            .map((s) => {
              const meta = catMeta(s.c);
              return (
                <li
                  key={s.id}
                  className="paper-grain relative overflow-hidden rounded-2xl border p-3"
                  style={{
                    borderColor: `color-mix(in oklab, ${meta.color} 35%, var(--naju-line))`,
                    background: `color-mix(in oklab, ${meta.color} 9%, var(--card))`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    aria-label="조각 빼기"
                    className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/70 text-ink-soft active:bg-white"
                  >
                    <X className="size-3.5" />
                  </button>
                  <span className="text-2xl">{meta.emoji}</span>
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] font-bold leading-snug text-ink">
                    {s.n}
                  </p>
                  <p className="mt-1 flex items-center gap-0.5 text-[11px] font-medium" style={{ color: meta.color }}>
                    <MapPin className="size-3" />
                    {s.d || "나주"}
                  </p>
                </li>
              );
            })}
        </ul>
      )}

      <p className="px-5 pt-6 text-center text-[10.5px] text-ink-soft/70">
        조각은 이 기기에만 저장돼요(로그인 없음). 공유는 진행도를 텍스트로 전해요.
      </p>
    </div>
  );
}
