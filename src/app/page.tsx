"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Search, Flower2, Navigation, Crosshair } from "lucide-react";
import MerchantsMap from "@/components/map/MerchantsMap";
import { CATEGORY_META, PROGRAM_META, type Merchant } from "@/lib/data/merchants";
import { spotMeta, flowerMonths, type Spot, type Flower } from "@/lib/data/spots";
import { distanceKm, distLabel, directionsUrl } from "@/lib/geo";
import InstaGlyph from "@/components/ui/InstaGlyph";
import StampButton from "@/components/ui/StampButton";
import TodayPiece from "@/components/home/TodayPiece";

const INSTA_URL = "https://instagram.com/piece_of_naju";

type Mode = "food" | "cafe" | "tour";
const TABS: { key: Mode; label: string; emoji: string }[] = [
  { key: "food", label: "음식점", emoji: CATEGORY_META.food.emoji },
  { key: "cafe", label: "카페", emoji: CATEGORY_META.cafe.emoji },
  { key: "tour", label: "관광·명소", emoji: "📷" },
];

function SkeletonList() {
  return (
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
  );
}

/** 나주 발견 메인 — 먹거리(KB 실가맹점) + 관광지(네이버 리서치) + 이 계절의 꽃 */
export default function GuidePage() {
  const [mer, setMer] = useState<Merchant[] | null>(null);
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [mode, setMode] = useState<Mode>("food");
  const [dong, setDong] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const [focus, setFocus] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/merchants?geo=naver&cat=food,cafe")
      .then((r) => r.json())
      .then((d: { items: Merchant[] }) => alive && setMer(d.items))
      .catch(() => alive && setMer([]));
    fetch("/data/spots.json").then((r) => r.json()).then((d: Spot[]) => alive && setSpots(d)).catch(() => alive && setSpots([]));
    fetch("/data/flowers.json").then((r) => r.json()).then((d: Flower[]) => alive && setFlowers(d)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const isTour = mode === "tour";
  const qq = q.trim();

  // 먹거리 필터
  const dongs = useMemo(() => {
    if (!mer) return [];
    const counts = new Map<string, number>();
    for (const m of mer) if (m.d) counts.set(m.d, 0);
    for (const m of mer) {
      if (!m.d) continue;
      if (m.c === mode && (!qq || m.n.includes(qq))) counts.set(m.d, (counts.get(m.d) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [mer, mode, qq]);

  const foodFiltered = useMemo(() => {
    if (!mer) return [];
    return mer.filter((m) => m.c === mode && (!dong || m.d === dong) && (!qq || m.n.includes(qq)));
  }, [mer, mode, dong, qq]);

  const spotFiltered = useMemo(() => {
    if (!spots) return [];
    return spots.filter((s) => !qq || s.n.includes(qq) || s.cat.includes(qq));
  }, [spots, qq]);

  // 내 주변순 정렬
  const foodSorted = useMemo(() => {
    if (!(nearby && userLoc)) return foodFiltered;
    return [...foodFiltered].sort(
      (a, b) =>
        distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) -
        distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng),
    );
  }, [foodFiltered, nearby, userLoc]);
  const spotSorted = useMemo(() => {
    if (!(nearby && userLoc)) return spotFiltered;
    return [...spotFiltered].sort(
      (a, b) =>
        distanceKm(userLoc.lat, userLoc.lng, a.lat, a.lng) -
        distanceKm(userLoc.lat, userLoc.lng, b.lat, b.lng),
    );
  }, [spotFiltered, nearby, userLoc]);

  // 지도에 그릴 포인트 (관광은 merchant 형태로 어댑트)
  const mapPoints: Merchant[] = useMemo(() => {
    if (isTour)
      return spotFiltered.map((s) => ({
        id: s.id, n: s.n, c: "etc", d: "", a: s.a, lat: s.lat, lng: s.lng,
        t: `${spotMeta(s.cat).emoji} ${s.cat}`, p: [], geo: "naver", tel: "",
      }));
    return foodFiltered;
  }, [isTour, spotFiltered, foodFiltered]);

  // 오늘의 한 조각 — 우선 추천(이화림) 고정, 없으면 날짜 시드
  const todayPick = useMemo(() => {
    if (!mer || mer.length === 0) return null;
    const featured = mer.find((m) => m.id === "115174656"); // 이화림(카페)
    if (featured) return featured;
    const d = new Date();
    let t = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return mer[Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * mer.length)];
  }, [mer]);

  // 이 계절의 꽃 (지금 피는 것 우선, 없으면 곧 피는 것)
  const month = new Date().getMonth() + 1;
  const flowerCard = useMemo(() => {
    const now = flowers.filter((f) => flowerMonths(f.when).includes(month));
    if (now.length) return { title: `${month}월, 지금 나주에 피는 꽃`, list: now };
    const upcoming = flowers
      .map((f) => ({ f, gap: Math.min(...flowerMonths(f.when).map((mm) => ((mm - month + 12) % 12) || 12)) }))
      .filter((x) => Number.isFinite(x.gap))
      .sort((a, b) => a.gap - b.gap);
    if (!upcoming.length) return null;
    const g = upcoming[0].gap;
    return { title: "곧, 나주에 피어요", list: upcoming.filter((x) => x.gap === g).map((x) => x.f) };
  }, [flowers, month]);

  const count = isTour ? spotFiltered.length : foodFiltered.length;
  const loading = isTour ? spots === null : mer === null;

  return (
    <div className="flex h-[calc(100dvh_-_72px)] flex-col bg-background">
      {/* 헤더 + 필터 */}
      <header className="shrink-0 border-b border-line/70 bg-background/95 pt-3 backdrop-blur">
        <div className="mb-2 flex items-end justify-between px-4">
          <div>
            <p className="text-[11.5px] font-bold tracking-wide text-pear-deep">나주를 한 조각씩</p>
            <h1 className="brand-serif text-[20px] font-extrabold leading-tight text-ink">
              오늘 나주, 어디 가지?
            </h1>
          </div>
          <a href={INSTA_URL} target="_blank" rel="noopener noreferrer"
            className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[11px] font-bold text-background active:scale-95">
            <InstaGlyph className="size-3.5" /> 나주한조각
          </a>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 pb-2.5">
          {TABS.map((t) => {
            const active = mode === t.key;
            const color = t.key === "cafe" ? CATEGORY_META.cafe.color : t.key === "tour" ? "#2e7d6b" : CATEGORY_META.food.color;
            return (
              <button key={t.key} type="button"
                onClick={() => { setMode(t.key); setDong(""); setLimit(50); }}
                className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
                style={active ? { backgroundColor: color, borderColor: color, color: "#fff" }
                  : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }}>
                <span>{t.emoji}</span>{t.label}
              </button>
            );
          })}
          {!isTour && (
            <>
              <span className="mx-0.5 w-px shrink-0 self-stretch bg-line" />
              <select value={dong} onChange={(e) => { setDong(e.target.value); setLimit(50); }}
                className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-soft">
                <option value="">전체 동</option>
                {dongs.map(([d, n]) => <option key={d} value={d}>{d} ({n})</option>)}
              </select>
            </>
          )}
          <span className="shrink-0 pl-1 text-[12px] font-bold text-ink-soft">
            {mer ? `${count.toLocaleString()}곳` : "…"}
          </span>
        </div>
      </header>

      {/* 지도 */}
      <div className="relative h-[42dvh] shrink-0 border-b border-line">
        <MerchantsMap merchants={mapPoints} focus={focus} onLocate={setUserLoc} className="absolute inset-0" />
      </div>

      {/* 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 이 계절의 꽃 */}
        {flowerCard && (
          <section className="px-4 pt-3">
            <div className="rounded-2xl border border-line bg-card p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-hongeo">
                <Flower2 className="size-4" /> {flowerCard.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {flowerCard.list.map((f, i) => (
                  <li key={i} className="text-[12.5px] leading-snug">
                    <b className="text-ink">{f.flower}</b>
                    <span className="text-ink-soft"> · {f.where} · {f.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {!isTour && todayPick && <TodayPiece m={todayPick} />}

        <div className="sticky top-0 z-[1] mt-2 flex items-center gap-2 bg-background/95 px-4 py-2 backdrop-blur">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(50); }}
            placeholder={isTour ? "관광지·명소 검색" : "상호명 검색"}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-soft" />
          {userLoc && (
            <button type="button" onClick={() => setNearby((v) => !v)} aria-pressed={nearby}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition active:scale-95"
              style={nearby ? { background: "#2b7fff", borderColor: "#2b7fff", color: "#fff" } : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }}>
              <Crosshair className="size-3" /> 내 주변순
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonList />
        ) : isTour ? (
          <ul className="space-y-2.5 px-4 pb-2">
            {spotSorted.slice(0, limit).map((s) => {
              const meta = spotMeta(s.cat);
              return (
                <li key={s.id} onClick={() => setFocus(s.id)} className="cursor-pointer rounded-2xl border border-line bg-card p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ background: `color-mix(in oklab, ${meta.color} 15%, white)`, color: meta.color }}>
                          {meta.emoji} {s.cat}
                        </span>
                        {s.season && <span className="text-[11px] font-semibold text-pear-deep">{s.season}</span>}
                        {userLoc && <span className="text-[11px] font-bold text-river">{distLabel(distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng))}</span>}
                      </div>
                      <h3 className="brand-serif mt-1.5 text-[16px] font-extrabold text-ink">{s.n}</h3>
                    </div>
                    <StampButton item={{ id: s.id, n: s.n, c: "spot", d: "" }} compact />
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{s.summary}</p>
                  {s.flower && (
                    <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-hongeo/10 px-1.5 py-0.5 text-[11px] font-bold text-hongeo">
                      🌸 {s.flower}
                    </p>
                  )}
                  {s.highlights.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.highlights.map((h, i) => (
                        <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-ink-soft">{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-ink-soft">
                    <span className="inline-flex items-center gap-1 truncate"><MapPin className="size-3 shrink-0" />{s.a}</span>
                    <a href={directionsUrl(s.n, s.lat, s.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-river">
                      <Navigation className="size-3" />길찾기
                    </a>
                  </div>
                  {s.tip && <p className="mt-1.5 text-[11.5px] leading-snug text-ink-soft/90">💡 {s.tip}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="divide-y divide-line/70 px-4">
            {foodSorted.slice(0, limit).map((m) => (
              <li key={m.id} onClick={() => setFocus(m.id)} className="cursor-pointer py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-ink">{m.n}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-soft">
                      {CATEGORY_META[m.c].emoji} {m.t || CATEGORY_META[m.c].label}
                      {userLoc && <span className="font-bold text-river"> · {distLabel(distanceKm(userLoc.lat, userLoc.lng, m.lat, m.lng))}</span>}
                    </p>
                    <p className="mt-0.5 flex items-start gap-1 text-[11.5px] text-ink-soft">
                      <MapPin className="mt-px size-3 shrink-0" /><span className="line-clamp-1">{m.a}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StampButton item={{ id: m.id, n: m.n, c: m.c, d: m.d }} compact />
                    <a href={directionsUrl(m.n, m.lat, m.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="길찾기" className="grid size-7 place-items-center rounded-full border border-line text-river active:scale-90">
                      <Navigation className="size-3.5" />
                    </a>
                    {m.tel && (
                      <a href={`tel:${m.tel.replace(/[^0-9]/g, "")}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-river active:scale-95">
                        <Phone className="size-3" />전화
                      </a>
                    )}
                  </div>
                </div>
                {m.p.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.p.map((k) => (
                      <span key={k} className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-white" style={{ backgroundColor: PROGRAM_META[k].color }}>{PROGRAM_META[k].short}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {count > limit && (
          <button type="button" onClick={() => setLimit((l) => l + 60)}
            className="mx-auto my-3 block rounded-full border border-line bg-card px-5 py-2 text-[13px] font-bold text-ink-soft active:scale-95">
            더보기 ({(count - limit).toLocaleString()}곳)
          </button>
        )}
        <p className="px-4 pb-6 pt-3 text-center text-[10.5px] text-ink-soft/70">
          {isTour ? "관광 정보: 네이버 검색 기반 정리(원작 요약)" : "먹거리: KB 사용처 · 네이버 실주소"}
        </p>
      </div>
    </div>
  );
}
