"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Search, X, Navigation, Crosshair } from "lucide-react";
import MerchantsMap from "@/components/map/MerchantsMap";
import { useIsLocalhost } from "@/lib/useIsLocalhost";
import { distanceKm, distLabel, directionsUrl } from "@/lib/geo";
import StampButton from "@/components/ui/StampButton";
import {
  CATEGORY_META, CATEGORY_ORDER, PROGRAM_META, PROGRAM_ORDER,
  type Merchant, type MerchantCat, type ProgramKey,
} from "@/lib/data/merchants";

type Mode = "naver" | "dong";

export default function MerchantsPage() {
  const isLocal = useIsLocalhost();
  const [mode, setMode] = useState<Mode>("naver");
  const [all, setAll] = useState<Merchant[] | null>(null);
  const [progs, setProgs] = useState<Set<ProgramKey>>(new Set());
  const [cats, setCats] = useState<Set<MerchantCat>>(new Set());
  const [dong, setDong] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(60);
  const [focus, setFocus] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/merchants?geo=${mode}`)
      .then((r) => r.json())
      .then((d: { items: Merchant[] }) => { if (alive) setAll(d.items); })
      .catch(() => { if (alive) setAll([]); });
    return () => { alive = false; };
  }, [mode]);

  // 동 드롭다운: 현재 혜택/업종/검색 필터 기준 동별 개수(0 포함)
  const dongs = useMemo(() => {
    if (!all) return [];
    const qq = q.trim();
    const counts = new Map<string, number>();
    for (const m of all) if (m.d) counts.set(m.d, 0);
    for (const m of all) {
      if (!m.d) continue;
      const ok =
        (progs.size === 0 || m.p.some((p) => progs.has(p))) &&
        (cats.size === 0 || cats.has(m.c)) &&
        (!qq || m.n.includes(qq));
      if (ok) counts.set(m.d, (counts.get(m.d) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [all, progs, cats, q]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const qq = q.trim();
    return all.filter(
      (m) =>
        (progs.size === 0 || m.p.some((p) => progs.has(p))) &&
        (cats.size === 0 || cats.has(m.c)) &&
        (!dong || m.d === dong) &&
        (!qq || m.n.includes(qq)),
    );
  }, [all, progs, cats, dong, q]);

  const sorted = useMemo(() => {
    if (!(nearby && userLoc)) return filtered;
    return [...filtered].sort(
      (a, b) =>
        distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) -
        distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng),
    );
  }, [filtered, nearby, userLoc]);

  const toggle = <T,>(set: Set<T>, v: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
    setLimit(60);
  };

  function switchMode(next: Mode) {
    setMode(next);
    setProgs(new Set());
    setCats(new Set());
    setDong("");
    setQ("");
    setLimit(60);
  }

  return (
    <div className="flex h-[calc(100dvh_-_72px)] flex-col bg-background">
      {/* 헤더 + 필터 */}
      <header className="shrink-0 border-b border-line/70 bg-background/95 pt-3 backdrop-blur">
        <div className="mb-2 flex items-end justify-between px-4">
          <h1 className="brand-serif text-[20px] font-extrabold leading-tight text-ink">
            나주 어디서 혜택 받지?
          </h1>
          <span className="pb-0.5 text-[12px] font-bold text-ink-soft">
            {all ? `${filtered.length.toLocaleString()}곳` : "불러오는 중…"}
          </span>
        </div>

        {/* 로컬 전용: 정밀 / 미매칭 전환 */}
        {isLocal && (
          <div className="mb-1 flex gap-1.5 px-4">
            {([["naver", "정밀매칭"], ["dong", "미매칭(검수)"]] as const).map(([m, label]) => {
              const on = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`rounded-full px-3 py-1 text-[12px] font-bold transition active:scale-95 ${
                    on ? "bg-ink text-background" : "border border-line bg-card text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* 혜택 칩 + 동 선택 */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2">
          {PROGRAM_ORDER.map((k) => {
            const active = progs.has(k);
            const meta = PROGRAM_META[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggle(progs, k, setProgs)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
                style={
                  active
                    ? { backgroundColor: meta.color, borderColor: meta.color, color: "#fff" }
                    : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }
                }
              >
                {meta.short}
              </button>
            );
          })}
          <span className="mx-0.5 w-px shrink-0 self-stretch bg-line" />
          <select
            value={dong}
            onChange={(e) => { setDong(e.target.value); setLimit(60); }}
            className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-soft"
          >
            <option value="">전체 동</option>
            {dongs.map(([d, n]) => (
              <option key={d} value={d}>{d} ({n})</option>
            ))}
          </select>
        </div>

        {/* 업종 칩 */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2.5">
          {CATEGORY_ORDER.map((c) => {
            const active = cats.has(c);
            const meta = CATEGORY_META[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(cats, c, setCats)}
                className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition active:scale-95"
                style={
                  active
                    ? { backgroundColor: meta.color, borderColor: meta.color, color: "#fff" }
                    : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }
                }
              >
                <span>{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* 지도 */}
      <div className="relative h-[42dvh] shrink-0 border-b border-line">
        <MerchantsMap merchants={filtered} focus={focus} onLocate={setUserLoc} className="absolute inset-0" />
        {(progs.size > 0 || cats.size > 0 || dong || q) && (
          <button
            type="button"
            onClick={() => { setProgs(new Set()); setCats(new Set()); setDong(""); setQ(""); }}
            className="absolute left-2 top-2 z-[5] inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm backdrop-blur active:scale-95"
          >
            <X className="size-3" /> 필터 초기화
          </button>
        )}
      </div>

      {/* 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-[1] flex items-center gap-2 bg-background/95 px-4 py-2 backdrop-blur">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setLimit(60); }}
            placeholder="상호명 검색"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-soft"
          />
          {userLoc && (
            <button type="button" onClick={() => setNearby((v) => !v)} aria-pressed={nearby}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition active:scale-95"
              style={nearby ? { background: "#2b7fff", borderColor: "#2b7fff", color: "#fff" } : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }}>
              <Crosshair className="size-3" /> 내 주변순
            </button>
          )}
        </div>
        {all === null ? (
          <ul className="space-y-3 px-4 pt-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="size-12 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="divide-y divide-line/70 px-4">
          {sorted.slice(0, limit).map((m) => (
            <li key={m.id} onClick={() => setFocus(m.id)} className="cursor-pointer py-3">
              {/* 1행: 이름/업종/주소 + 전화 */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-ink">{m.n}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-soft">
                    {CATEGORY_META[m.c].emoji} {m.t || CATEGORY_META[m.c].label}
                    {userLoc && <span className="font-bold text-river"> · {distLabel(distanceKm(userLoc.lat, userLoc.lng, m.lat, m.lng))}</span>}
                  </p>
                  <p className="mt-0.5 flex items-start gap-1 text-[11.5px] text-ink-soft">
                    <MapPin className="mt-px size-3 shrink-0" />
                    <span className="line-clamp-1">{m.a}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StampButton item={{ id: m.id, n: m.n, c: m.c, d: m.d }} compact />
                  <a href={directionsUrl(m.n, m.lat, m.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="길찾기" className="grid size-7 place-items-center rounded-full border border-line text-river active:scale-90">
                    <Navigation className="size-3.5" />
                  </a>
                  {m.tel && (
                    <a
                      href={`tel:${m.tel.replace(/[^0-9]/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-river active:scale-95"
                    >
                      <Phone className="size-3" />전화
                    </a>
                  )}
                </div>
              </div>
              {/* 2행: 혜택 뱃지 (전체폭, 자연스러운 줄바꿈) */}
              {m.p.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.p.map((k) => (
                    <span
                      key={k}
                      className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-white"
                      style={{ backgroundColor: PROGRAM_META[k].color }}
                    >
                      {PROGRAM_META[k].short}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        )}
        {filtered.length > limit && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + 80)}
            className="mx-auto my-3 block rounded-full border border-line bg-card px-5 py-2 text-[13px] font-bold text-ink-soft active:scale-95"
          >
            더보기 ({(filtered.length - limit).toLocaleString()}곳 남음)
          </button>
        )}
        {all && filtered.length === 0 && (
          <p className="py-12 text-center text-[13px] text-ink-soft">조건에 맞는 가맹점이 없어요.</p>
        )}
        <div className="px-4 pb-6 pt-2 text-center text-[10.5px] text-ink-soft/70">
          {mode === "dong"
            ? "주소 미매칭 · 동 중심 근사 좌표 · 로컬 검수용"
            : "출처: KB국민카드 사용처 · 네이버 지역검색 실주소 매칭"}{" "}
          · <Link href="/" className="underline">가이드로</Link>
        </div>
      </div>
    </div>
  );
}
