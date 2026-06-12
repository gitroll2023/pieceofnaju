"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Puzzle, Share2, X, MapPin, Navigation, Route, Trash2 } from "lucide-react";
import { useStamps, type Stamp } from "@/lib/useStamps";
import { useCourses } from "@/lib/useCourses";
import HamburgerButton from "@/components/shell/HamburgerButton";
import { CATEGORY_META } from "@/lib/data/merchants";
import { spotMeta } from "@/lib/data/spots";
import { directionsUrl } from "@/lib/geo";

function stampMeta(s: Stamp) {
  if (s.c === "spot") {
    const m = spotMeta(s.t || "");
    return { emoji: m.emoji, color: m.color, label: s.t || "관광" };
  }
  const m =
    (CATEGORY_META as Record<string, { label: string; emoji: string; color: string }>)[s.c] ??
    { label: "조각", emoji: "🧩", color: "#9a9088" };
  return { emoji: m.emoji, color: m.color, label: s.t || m.label };
}

function dirUrl(s: Stamp) {
  return s.lat && s.lng
    ? directionsUrl(s.n, s.lat, s.lng)
    : `https://map.kakao.com/?q=${encodeURIComponent("나주 " + s.n)}`;
}

const cColor = (c: string) => (c === "food" ? "#d9534f" : c === "cafe" ? "#c98a3b" : spotMeta(c).color);

export default function PiecesPage() {
  const { stamps, toggle, count, setMemo } = useStamps();
  const { courses, remove: removeCourse } = useCourses();
  const [tab, setTab] = useState<"pieces" | "course">("pieces");
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Stamp | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [memoSaved, setMemoSaved] = useState(false);
  useEffect(() => { setMemoDraft(selected?.memo || ""); setMemoSaved(false); }, [selected]);

  function saveMemo() {
    if (!selected) return;
    setMemo(selected.id, memoDraft);
    setSelected({ ...selected, memo: memoDraft });
    setMemoSaved(true);
  }

  const dongCount = useMemo(() => new Set(stamps.map((s) => s.d).filter(Boolean)).size, [stamps]);
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
      <header className="paper-grain relative overflow-hidden px-5 pb-6 pt-6">
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, var(--naju-cream) 0%, var(--background) 70%)" }} />
        <HamburgerButton />
        <p className="mt-4 flex items-center gap-1 text-[12px] font-bold tracking-wide text-pear-deep">
          <Puzzle className="size-3.5" /> 나주를 한 조각씩
        </p>
        <h1 className="brand-serif mt-1 text-[30px] font-extrabold leading-tight text-ink">
          내 조각 <span className="text-pear-deep">{count}</span>
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">돌아다니며 모은 나주의 조각들 · {dongCount}개 동네</p>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={share} disabled={count === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-background transition active:scale-95 disabled:opacity-40">
            <Share2 className="size-4" />{copied ? "복사됨!" : "내 조각 공유"}
          </button>
          <Link href="/" className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-4 py-2 text-[13px] font-bold text-ink-soft active:scale-95">
            더 모으러 가기
          </Link>
        </div>

        {byCat.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto">
            {byCat.map(([c, n]) => {
              const meta = stampMeta({ c } as Stamp);
              return (
                <span key={c} className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                  style={{ background: `color-mix(in oklab, ${meta.color} 16%, white)`, color: meta.color }}>
                  {meta.emoji} {c === "spot" ? "관광" : meta.label} {n}
                </span>
              );
            })}
          </div>
        )}
      </header>

      {/* 탭: 조각 / 코스 */}
      <div className="px-5 pt-3.5">
        <div className="inline-flex rounded-full border border-line bg-card p-0.5 text-[12.5px] font-bold">
          {([["pieces", `조각 ${count}`], ["course", `코스 ${courses.length}`]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className="rounded-full px-4 py-1.5 transition"
              style={tab === k ? { background: "var(--naju-ink)", color: "var(--background)" } : { color: "var(--naju-ink-soft)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "pieces" ? (
        <>
          {count === 0 ? (
            <div className="grid place-items-center px-8 py-16 text-center">
              <Puzzle className="size-10 text-line" />
              <p className="mt-3 text-[14px] font-bold text-ink">아직 모은 조각이 없어요</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
                발견에서 마음에 든 곳의 <b className="text-pear-deep">조각</b> 버튼을 누르면
                <br />여기에 한 조각씩 쌓여요.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-x-2 gap-y-3 px-4 pt-4">
              {stamps.slice().sort((a, b) => b.at - a.at).map((s) => {
                const meta = stampMeta(s);
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSelected(s)} className="block w-full text-center active:scale-95">
                      <div className="piece-thumb paper-grain grid aspect-square w-full place-items-center text-3xl shadow-sm"
                        style={{ background: `radial-gradient(120% 120% at 30% 25%, color-mix(in oklab, ${meta.color} 30%, white), color-mix(in oklab, ${meta.color} 16%, var(--naju-cream)))` }}>
                        {meta.emoji}
                      </div>
                      <p className="mt-1 line-clamp-1 px-0.5 text-[11.5px] font-bold text-ink">{s.memo ? "📝 " : ""}{s.n}</p>
                      <p className="text-[10px] font-medium" style={{ color: meta.color }}>{s.d || "나주"}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="px-5 pt-6 text-center text-[10.5px] text-ink-soft/70">
            조각은 이 기기에 저장돼요. 눌러서 정보·길찾기를 볼 수 있어요.
          </p>
        </>
      ) : courses.length === 0 ? (
        <div className="grid place-items-center px-8 py-16 text-center">
          <Route className="size-10 text-line" />
          <p className="mt-3 text-[14px] font-bold text-ink">담은 코스가 없어요</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
            추천 탭에서 마음에 드는 코스를 <b className="text-pear-deep">담기</b> 하면
            <br />여기서 순서대로 따라갈 수 있어요.
          </p>
          <Link href="/recommend" className="mt-4 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-background active:scale-95">추천 코스 보기</Link>
        </div>
      ) : (
        <ul className="space-y-2.5 px-4 pt-4">
          {courses.map((c) => {
            const done = c.items.filter((i) => i.done).length;
            const total = c.items.length;
            return (
              <li key={c.id} className="overflow-hidden rounded-2xl border border-line bg-card">
                <Link href={`/recommend/${c.id}`} className="block active:scale-[0.99]">
                  <div className="relative h-9 w-full" style={{ background: `linear-gradient(90deg, ${c.items.map((i) => cColor(i.c)).join(",")})`, opacity: 0.9 }}>
                    <div className="absolute inset-0 flex items-center gap-1 px-3">
                      {c.items.map((it, i) => (
                        <span key={i} className="flex items-center">
                          <span className={`size-2 rounded-full ${it.done ? "bg-white shadow" : "bg-white/40"}`} />
                          {i < total - 1 && <span className="h-px w-3 bg-white/50" />}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <h3 className="brand-serif text-[16px] font-extrabold leading-tight text-ink">{c.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line/70">
                        <div className="h-full rounded-full bg-pear" style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                      <span className="font-bold text-pear-deep">{done === total ? "완주 ✦" : `${done}/${total}`}</span>
                      <span className="ml-auto text-[11px] text-ink-soft/55">{c.origin === "seed" ? "추천 코스" : c.origin === "ai" ? "AI 코스" : c.origin === "received" ? "받은 코스" : "내 코스"}</span>
                    </div>
                  </div>
                </Link>
                <button type="button" onClick={() => removeCourse(c.id)}
                  className="flex w-full items-center justify-center gap-1 border-t border-line/60 py-2 text-[11.5px] font-bold text-ink-soft/60 active:scale-95">
                  <Trash2 className="size-3" />코스 빼기
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 선택한 조각 시트 */}
      {selected && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
          <div onClick={(e) => e.stopPropagation()}
            className="animate-rise relative w-full max-w-[480px] rounded-t-3xl border-t border-line bg-card p-5 pb-7 shadow-[0_-12px_32px_-12px_rgba(31,28,24,0.5)]">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            {(() => {
              const meta = stampMeta(selected);
              return (
                <>
                  <div className="flex items-center gap-3.5">
                    <div className="piece-thumb grid size-16 shrink-0 place-items-center text-3xl"
                      style={{ background: `radial-gradient(120% 120% at 30% 25%, color-mix(in oklab, ${meta.color} 30%, white), color-mix(in oklab, ${meta.color} 18%, var(--naju-cream)))` }}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: `color-mix(in oklab, ${meta.color} 14%, white)`, color: meta.color }}>
                        {meta.emoji} {selected.c === "spot" ? selected.t || "관광" : meta.label}
                      </span>
                      <h2 className="brand-serif mt-1 truncate text-[19px] font-extrabold text-ink">{selected.n}</h2>
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-soft">
                        <MapPin className="size-3 shrink-0" />{selected.d || "나주"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-ink-soft">📝 나만 보는 메모</label>
                      <span className="text-[10.5px] text-ink-soft/55">{memoDraft.length}/100</span>
                    </div>
                    <textarea
                      value={memoDraft}
                      onChange={(e) => { setMemoDraft(e.target.value.slice(0, 100)); setMemoSaved(false); }}
                      rows={2} placeholder="여기 왜 갔었는지, 어떤 추억인지… (나만 보여요)"
                      className="mt-1 w-full resize-none rounded-xl border border-line bg-background px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-pear/60" />
                    <div className="mt-1 flex items-center justify-end gap-2">
                      {memoSaved && <span className="text-[11px] font-bold text-pear-deep">저장됐어요 ✓</span>}
                      <button type="button" onClick={saveMemo}
                        className="rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-bold text-background active:scale-95">메모 저장</button>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <a href={dirUrl(selected)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-river px-4 py-3 text-[14px] font-bold text-white transition active:scale-[0.98]">
                      <Navigation className="size-4" />길찾기
                    </a>
                    <button type="button" onClick={() => { toggle(selected); setSelected(null); }}
                      className="inline-flex items-center justify-center gap-1 rounded-2xl border border-line bg-card px-4 py-3 text-[13px] font-bold text-ink-soft active:scale-95">
                      <X className="size-4" />조각 빼기
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
