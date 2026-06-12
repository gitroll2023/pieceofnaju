"use client";

import { useEffect, useMemo, useState, useRef, useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { MapPin, Phone, Search, Flower2, Navigation, Crosshair, X } from "lucide-react";
import MerchantsMap from "@/components/map/MerchantsMap";
import { CATEGORY_META, PROGRAM_META, visiblePrograms, type Merchant } from "@/lib/data/merchants";
import { spotMeta, flowerMonths, type Spot, type Flower } from "@/lib/data/spots";
import { distanceKm, distLabel, directionsUrl } from "@/lib/geo";
import { regionOf, regionScore, REGION_META, REGION_ORDER, type Region } from "@/lib/region";
import { PLAY_MERCHANT_IDS, EXPERIENCE_MERCHANT_IDS } from "@/lib/data/play";
import { isFranchise } from "@/lib/data/franchise";
import { instaOf, setInstaRuntime } from "@/lib/data/insta";
import { curationFor, curationPickOf } from "@/lib/data/curation";
import InstaGlyph from "@/components/ui/InstaGlyph";
import StampButton from "@/components/ui/StampButton";
import CurationNote from "@/components/ui/CurationNote";
import WeatherChip from "@/components/home/WeatherChip";
import HamburgerButton from "@/components/shell/HamburgerButton";

type Mode = "eat" | "drink" | "see" | "play" | "experience" | "pick";
const MODES: { key: Mode; label: string; emoji: string; color: string }[] = [
  { key: "eat", label: "먹거리", emoji: "🍚", color: CATEGORY_META.food.color },
  { key: "drink", label: "마실거리", emoji: "☕", color: CATEGORY_META.cafe.color },
  { key: "see", label: "볼거리", emoji: "🏛️", color: "#2e7d6b" },
  { key: "play", label: "즐길거리", emoji: "🎢", color: "#8c6bb1" },
  { key: "experience", label: "체험거리", emoji: "🧶", color: "#2f9d8f" },
  { key: "pick", label: "조각Pick", emoji: "🧩", color: "#e8a33d" },
];

const SEE_CATS = new Set(["문화재", "박물관미술관", "사찰", "자연", "꽃명소", "전망", "공원", "기타"]);
const PLAY_CATS = new Set(["축제", "레저"]);
const EXPERIENCE_CATS = new Set(["체험"]);

type Item = { kind: "merchant"; m: Merchant } | { kind: "spot"; s: Spot };
const iName = (it: Item) => (it.kind === "merchant" ? it.m.n : it.s.n);
const iLat = (it: Item) => (it.kind === "merchant" ? it.m.lat : it.s.lat);
const iLng = (it: Item) => (it.kind === "merchant" ? it.m.lng : it.s.lng);
const iRegionStr = (it: Item) => (it.kind === "merchant" ? it.m.d : it.s.a);
// 동/읍/면 단위: 가맹점은 d, 관광지는 주소에서 첫 동/읍/면 토큰 추출
const iDong = (it: Item) => {
  if (it.kind === "merchant") return it.m.d || "";
  const m = it.s.a.match(/([가-힣]+[동읍면])/);
  return m ? m[1] : "";
};

// 지도용: spot을 Merchant 형태로 어댑트
function spotAsMerchant(s: Spot): Merchant {
  return {
    id: s.id, n: s.n, c: "etc", d: "", a: s.a, lat: s.lat, lng: s.lng,
    t: `${spotMeta(s.cat).emoji} ${s.cat}`, p: [], geo: "naver", tel: "",
  };
}

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

/** 나주 발견 — 먹거리/마실거리/볼거리/즐길거리 4조각, 권역 균형 큐레이션 */
export default function DiscoverPage() {
  const [mer, setMer] = useState<Merchant[] | null>(null);
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [mode, setMode] = useState<Mode>("eat");
  const [region, setRegion] = useState<Region | "">("");
  const [dong, setDong] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const [focus, setFocus] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState(false);
  const [showFranchise, setShowFranchise] = useState(false);
  const [searchAll, setSearchAll] = useState(true); // 기본: 전체 검색. '이 조각만' 토글로 현재 모드로 제한 가능
  const [instaTick, setInstaTick] = useState(0);

  useEffect(() => {
    let alive = true;
    // 내조각에서 "발견에서 찾기" 눌렀을 때 검색어 복원
    try {
      const saved = sessionStorage.getItem("discover.search");
      if (saved) { setQ(saved); setSearchAll(true); sessionStorage.removeItem("discover.search"); }
    } catch {}
    fetch("/api/insta-links").then((r) => r.json()).then((d) => { if (alive) { setInstaRuntime(d.map || {}); setInstaTick((t) => t + 1); } }).catch(() => {});
    // 전체를 받아 표시단에서 관광 포인트만 거른다(food·cafe + 즐길거리 allowlist).
    // 즐길거리 가게는 c가 etc/mart 등으로 흩어져 있어 cat 필터로는 누락되므로 id로 거른다.
    fetch("/api/merchants?geo=naver")
      .then((r) => r.json())
      .then((d: { items: Merchant[] }) => alive && setMer(d.items))
      .catch(() => alive && setMer([]));
    fetch("/data/spots.json").then((r) => r.json()).then((d: Spot[]) => alive && setSpots(d)).catch(() => alive && setSpots([]));
    fetch("/data/flowers.json").then((r) => r.json()).then((d: Flower[]) => alive && setFlowers(d)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const qq = q.trim();
  const isMerchantMode = mode === "eat" || mode === "drink";

  // 모드별 기본 아이템 (관광 포인트만 / 프랜차이즈 토글 적용)
  const baseItems = useMemo(() => {
    const out: Item[] = [];
    const M = mer ?? [];
    const S = spots ?? [];
    const okFr = (name: string) => showFranchise || !isFranchise(name);
    if (mode === "eat") {
      for (const m of M) if (m.c === "food" && okFr(m.n)) out.push({ kind: "merchant", m });
    } else if (mode === "drink") {
      for (const m of M) if (m.c === "cafe" && okFr(m.n)) out.push({ kind: "merchant", m });
      for (const s of S) if (s.cat === "전망카페" || s.cat === "양조장") out.push({ kind: "spot", s });
    } else if (mode === "see") {
      for (const s of S) if (SEE_CATS.has(s.cat)) out.push({ kind: "spot", s });
    } else if (mode === "play") {
      for (const s of S) if (PLAY_CATS.has(s.cat)) out.push({ kind: "spot", s });
      for (const m of M) if (PLAY_MERCHANT_IDS.has(m.id)) out.push({ kind: "merchant", m });
    } else if (mode === "pick") {
      // 나주한조각이 직접 다녀온 곳 — pick:true 큐레이션(또는 DB 등록)만. 인스타 링크 단독은 제외.
      for (const m of M) if (curationPickOf(m.id, m.n)) out.push({ kind: "merchant", m });
      for (const s of S) if (curationPickOf(s.id, s.n)) out.push({ kind: "spot", s });
    } else {
      for (const s of S) if (EXPERIENCE_CATS.has(s.cat)) out.push({ kind: "spot", s });
      for (const m of M) if (EXPERIENCE_MERCHANT_IDS.has(m.id)) out.push({ kind: "merchant", m });
    }
    return out;
  }, [mer, spots, mode, showFranchise, instaTick]);

  // 통합검색용 전체 풀(먹·마실·볼·즐 상관없이) — 검색어가 있으면 모드 무시하고 전체에서 찾음
  const allItems = useMemo(() => {
    const out: Item[] = [];
    const M = mer ?? [];
    const S = spots ?? [];
    const okFr = (name: string) => showFranchise || !isFranchise(name);
    for (const m of M) if ((m.c === "food" || m.c === "cafe") && okFr(m.n)) out.push({ kind: "merchant", m });
    for (const m of M) if (PLAY_MERCHANT_IDS.has(m.id) || EXPERIENCE_MERCHANT_IDS.has(m.id)) out.push({ kind: "merchant", m });
    for (const s of S) out.push({ kind: "spot", s });
    return out;
  }, [mer, spots, showFranchise]);

  const searched = useMemo(() => {
    if (!qq) return baseItems;
    // 기본: 현재 조각(baseItems) 안에서만. '전체' 토글 시에만 통합검색(allItems).
    const pool = searchAll ? allItems : baseItems;
    return pool.filter((it) => iName(it).includes(qq) || (it.kind === "spot" && it.s.cat.includes(qq)));
  }, [allItems, baseItems, qq, searchAll]);

  const regionCounts = useMemo(() => {
    const c = new Map<Region, number>();
    for (const it of searched) {
      const r = regionOf(iRegionStr(it));
      c.set(r, (c.get(r) || 0) + 1);
    }
    return c;
  }, [searched]);

  // 동/읍/면 옵션 — 권역 선택 시 그 권역의 동만, 개수순
  const dongOptions = useMemo(() => {
    const c = new Map<string, number>();
    for (const it of searched) {
      const dg = iDong(it);
      if (!dg) continue;
      if (region && regionOf(dg) !== region) continue;
      c.set(dg, (c.get(dg) || 0) + 1);
    }
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [searched, region]);

  const filtered = useMemo(() => {
    let arr = searched;
    if (region) arr = arr.filter((it) => regionOf(iRegionStr(it)) === region);
    if (dong) arr = arr.filter((it) => iDong(it) === dong);
    return arr;
  }, [searched, region, dong]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (nearby && userLoc) {
      arr.sort((a, b) => distanceKm(userLoc.lat, userLoc.lng, iLat(a), iLng(a)) - distanceKm(userLoc.lat, userLoc.lng, iLat(b), iLng(b)));
    } else {
      arr.sort((a, b) => regionScore(iRegionStr(b)) - regionScore(iRegionStr(a)));
    }
    return arr;
  }, [filtered, nearby, userLoc]);

  const mapPoints: Merchant[] = useMemo(
    () => filtered.map((it) => (it.kind === "merchant" ? it.m : spotAsMerchant(it.s))),
    [filtered],
  );
  // 나주한조각이 직접 다녀온 곳 — 지도에서 골드 핀으로 강조(pick:true만)
  const pickIds = useMemo(() => {
    const s = new Set<string>();
    for (const m of mapPoints) if (curationPickOf(m.id, m.n)) s.add(m.id);
    return s;
  }, [mapPoints, instaTick]);

  // 조각Pick 개수 — 프로모 카드용
  const pickCount = useMemo(() => {
    let n = 0;
    for (const m of mer ?? []) if (curationPickOf(m.id, m.n)) n++;
    for (const s of spots ?? []) if (curationPickOf(s.id, s.n)) n++;
    return n;
  }, [mer, spots, instaTick]);

  const month = new Date().getMonth() + 1;
  const flowerCard = useMemo(() => {
    // 이번 달에 실제로 피는 꽃만(앞당겨 "곧 피어요"는 표시하지 않음)
    const now = flowers.filter((f) => flowerMonths(f.when).includes(month));
    return now.length ? { title: `${month}월, 지금 나주에 피는 꽃`, list: now } : null;
  }, [flowers, month]);

  // 지도 화면 범위 + "이 화면만 / 전체" 토글(기본=이 화면). 검색 중엔 항상 전체(포괄).
  const [viewMode, setViewMode] = useState<"screen" | "all">("screen");
  const [bounds, setBounds] = useState<{ swLat: number; swLng: number; neLat: number; neLng: number } | null>(null);
  const applyViewport = viewMode === "screen" && !qq;
  const inBounds = useCallback(
    (it: Item) => {
      if (!bounds) return true;
      const la = iLat(it), ln = iLng(it);
      return la >= bounds.swLat && la <= bounds.neLat && ln >= bounds.swLng && ln <= bounds.neLng;
    },
    [bounds],
  );
  const listItems = useMemo(
    () => (applyViewport ? sorted.filter(inBounds) : sorted),
    [sorted, applyViewport, inBounds],
  );

  // 목록 바텀시트 — 스와이프로 내리고 올리기
  const sheetWrapRef = useRef<HTMLDivElement>(null);
  const sheetHeadRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true); // 처음엔 접어서 지도(나주 중앙)부터 넓게
  const [metrics, setMetrics] = useState({ sheetH: 0, peek: 150 });
  const [dragY, setDragY] = useState<number | null>(null);
  const dragRef = useRef<{ startY: number; base: number } | null>(null);
  useEffect(() => {
    const measure = () => {
      const w = sheetWrapRef.current;
      if (!w) return;
      setMetrics({ sheetH: Math.round(w.clientHeight * 0.7), peek: (sheetHeadRef.current?.offsetHeight ?? 142) + 6 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const maxY = Math.max(0, metrics.sheetH - metrics.peek);
  const sheetTranslate = dragY != null ? dragY : collapsed ? maxY : 0;
  const onGripDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startY: e.clientY, base: collapsed ? maxY : 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onGripMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setDragY(Math.max(0, Math.min(maxY, dragRef.current.base + (e.clientY - dragRef.current.startY))));
  };
  const onGripUp = () => {
    if (!dragRef.current) return;
    const y = dragY ?? (collapsed ? maxY : 0);
    setCollapsed(y > maxY * 0.4);
    setDragY(null);
    dragRef.current = null;
  };

  const count = listItems.length;
  const loading = mer === null || spots === null;

  return (
    <div className="flex h-[calc(100dvh_-_72px)] flex-col bg-background">
      {/* 헤더 + 필터 */}
      <header className="shrink-0 border-b border-line/70 bg-background/95 pt-3 backdrop-blur">
        <div className="mb-2 flex items-center gap-2.5 px-4">
          <HamburgerButton />
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-bold tracking-wide text-pear-deep">나주를 한 조각씩</p>
            <h1 className="brand-serif text-[20px] font-extrabold leading-tight text-ink">오늘 나주, 어디 가지?</h1>
          </div>
          <WeatherChip />
        </div>

        {/* 조각 칩 */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 pb-1.5">
          {MODES.map((t) => {
            const active = mode === t.key;
            return (
              <button key={t.key} type="button"
                onClick={() => { setMode(t.key); setRegion(""); setDong(""); setLimit(50); }}
                className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
                style={active ? { backgroundColor: t.color, borderColor: t.color, color: "#fff" }
                  : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }}>
                <span>{t.emoji}</span>{t.label}
              </button>
            );
          })}
        </div>

        {/* 권역 선택 + 개수 */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 pb-2.5">
          <select value={region} onChange={(e) => { setRegion(e.target.value as Region | ""); setDong(""); setLimit(50); }}
            className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-soft">
            <option value="">전체 권역</option>
            {REGION_ORDER.map((r) => (
              <option key={r} value={r}>{REGION_META[r].label} ({regionCounts.get(r) || 0})</option>
            ))}
          </select>
          <select value={dong} onChange={(e) => { setDong(e.target.value); setLimit(50); }}
            className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-soft">
            <option value="">{region ? `${REGION_META[region].label} 전체` : "동·읍·면"}</option>
            {dongOptions.map(([d, n]) => (
              <option key={d} value={d}>{d} ({n})</option>
            ))}
          </select>
          <span className="shrink-0 pl-1 text-[12px] font-bold text-ink-soft">
            {loading ? "…" : `${filtered.length.toLocaleString()}곳`}
          </span>
        </div>
      </header>

      {/* 지도(풀스크린) + 목록 바텀시트 */}
      <div ref={sheetWrapRef} className="relative min-h-0 flex-1 overflow-hidden">
        <MerchantsMap merchants={mapPoints} pickIds={pickIds} focus={focus} onLocate={setUserLoc} fitKey={dong || region} onBoundsChange={setBounds} onSelect={() => setCollapsed(true)} className="absolute inset-0" />

        <section
          className="absolute inset-x-0 bottom-0 z-30 flex h-[70%] flex-col rounded-t-3xl border-t border-line bg-card shadow-[0_-12px_32px_-12px_rgba(31,28,24,0.4)]"
          style={{ transform: `translateY(${sheetTranslate}px)`, transition: dragY != null ? "none" : "transform 0.28s cubic-bezier(0.22,1,0.36,1)" }}
        >
          {/* 드래그 핸들 + 검색 + 토글 */}
          <div ref={sheetHeadRef} className="shrink-0 touch-none select-none"
            onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} onPointerCancel={onGripUp}>
            <button type="button" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? "목록 올리기" : "목록 내리기"}
              className="flex w-full justify-center pb-1 pt-2.5">
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </button>
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 rounded-full border border-line bg-background px-3.5 py-2 focus-within:border-pear/60 focus-within:ring-2 focus-within:ring-pear/20">
                <Search className="size-4 shrink-0 text-ink-soft" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(50); }} onPointerDown={(e) => e.stopPropagation()}
                  onFocus={() => setCollapsed(false)}
                  placeholder={searchAll ? "나주 전체 검색" : `${MODES.find((mm) => mm.key === mode)?.label ?? ""} 안에서 검색`}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft/80" />
                {qq && (
                  <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setQ(""); setLimit(50); }} aria-label="검색어 지우기"
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-ink-soft active:scale-90">
                    <X className="size-3" />
                  </button>
                )}
                {qq && (
                  <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setSearchAll((v) => !v); setLimit(50); }}
                    aria-pressed={!searchAll}
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold transition"
                    style={!searchAll ? { background: "var(--naju-pear)", color: "#2a1c06" } : { background: "var(--muted)", color: "var(--naju-ink-soft)" }}>
                    이 조각만
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 pb-2.5">
              <div className="inline-flex rounded-full border border-line bg-background p-0.5" onPointerDown={(e) => e.stopPropagation()}>
                {([["screen", "이 화면"], ["all", "나주 전역"]] as const).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => { setViewMode(v); setLimit(50); }}
                    className="rounded-full px-3 py-1 text-[12px] font-bold transition"
                    style={viewMode === v ? { background: "var(--naju-ink)", color: "var(--background)" } : { color: "var(--naju-ink-soft)" }}>
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[12px] font-bold text-ink-soft">{loading ? "…" : `${count.toLocaleString()}곳`}</span>
              <button type="button" onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  if (!userLoc) {
                    if (typeof navigator !== "undefined") {
                      navigator.geolocation?.getCurrentPosition(
                        (p) => { setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setNearby(true); },
                        () => {},
                      );
                    }
                  } else {
                    setNearby((v) => !v);
                  }
                }}
                aria-pressed={nearby}
                className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold transition active:scale-95"
                style={nearby ? { background: "#2b7fff", borderColor: "#2b7fff", color: "#fff" } : { borderColor: "var(--naju-line)", background: "var(--background)", color: "var(--naju-ink-soft)" }}>
                <Crosshair className="size-3" /> 내 주변순
              </button>
            </div>
          </div>

          {/* 스크롤 목록 */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* 조각Pick 프로모 — 다른 모드에서도 "직접 다녀온 곳" 상단 노출 */}
            {mode !== "pick" && pickCount > 0 && !qq && (
              <section className="px-4 pt-2.5">
                <button type="button"
                  onClick={() => { setMode("pick"); setRegion(""); setDong(""); setLimit(50); }}
                  className="w-full overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.99]"
                  style={{ borderColor: "color-mix(in oklab, var(--naju-pear) 40%, var(--naju-line))", background: "color-mix(in oklab, var(--naju-pear) 10%, var(--card))" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-pear-deep">나주한조각이 직접 다녀왔어요</p>
                      <p className="mt-0.5 text-[13px] font-extrabold text-ink">직접 가본 곳 {pickCount}곳 보기 →</p>
                    </div>
                    <span className="shrink-0 text-2xl">🧩</span>
                  </div>
                </button>
              </section>
            )}
            {flowerCard && (
              <section className="px-4 pt-2">
                <div className="rounded-2xl border border-line bg-background p-3">
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

            {loading ? (
              <SkeletonList />
            ) : count === 0 ? (
              <p className="whitespace-pre-line px-6 py-12 text-center text-[13px] leading-relaxed text-ink-soft">
                {applyViewport ? "이 화면엔 표시할 곳이 없어요.\n지도를 움직이거나 ‘전체’로 보세요." : "조건에 맞는 곳이 없어요."}
              </p>
            ) : (
              <ul className="px-4 pb-2">
                {listItems.slice(0, limit).map((it) =>
                  it.kind === "spot" ? (
                    <SpotCard key={it.s.id} s={it.s} userLoc={userLoc} onFocus={() => { setFocus(it.s.id); setCollapsed(true); }} />
                  ) : (
                    <MerchantRow key={it.m.id} m={it.m} userLoc={userLoc} onFocus={() => { setFocus(it.m.id); setCollapsed(true); }} />
                  ),
                )}
              </ul>
            )}

            {count > limit && (
              <button type="button" onClick={() => setLimit((l) => l + 60)}
                className="mx-auto my-3 block rounded-full border border-line bg-background px-5 py-2 text-[13px] font-bold text-ink-soft active:scale-95">
                더보기 ({(count - limit).toLocaleString()}곳)
              </button>
            )}

            {isMerchantMode && (
              <label className="flex items-center justify-center gap-1.5 px-4 pb-1 pt-3 text-[11.5px] text-ink-soft/70">
                <input type="checkbox" checked={showFranchise} onChange={(e) => { setShowFranchise(e.target.checked); setLimit(50); }}
                  className="size-3.5 accent-ink-soft" />
                프랜차이즈도 보기
              </label>
            )}
            <p className="px-4 pb-6 pt-1 text-center text-[10.5px] text-ink-soft/60">
              {isMerchantMode ? "먹거리·마실거리: 지역 가게 위주" : "관광 정보·이미지: 한국관광공사(공공누리)"}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function MerchantRow({ m, userLoc, onFocus }: { m: Merchant; userLoc: { lat: number; lng: number } | null; onFocus: () => void }) {
  const progs = visiblePrograms(m.p);
  return (
    <li onClick={onFocus} className="cursor-pointer border-b border-line/70 py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sub font-bold text-ink">{m.n}</p>
          <p className="mt-0.5 truncate text-cap text-ink-soft">
            {CATEGORY_META[m.c].emoji} {m.t || CATEGORY_META[m.c].label}
            {userLoc && <span className="font-bold text-river"> · {distLabel(distanceKm(userLoc.lat, userLoc.lng, m.lat, m.lng))}</span>}
          </p>
          <p className="mt-0.5 flex items-start gap-1 text-cap text-ink-soft">
            <MapPin className="mt-px size-3 shrink-0" /><span className="line-clamp-1">{m.a}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StampButton item={{ id: m.id, n: m.n, c: m.c, d: m.d, lat: m.lat, lng: m.lng, t: m.t }} compact />
          {instaOf(m.id) && (
            <a href={instaOf(m.id)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="인스타그램" className="grid size-7 place-items-center rounded-full border border-line text-hongeo active:scale-90">
              <InstaGlyph className="size-3.5" />
            </a>
          )}
          <a href={directionsUrl(m.n, m.lat, m.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="길찾기" className="grid size-7 place-items-center rounded-full border border-line text-river active:scale-90">
            <Navigation className="size-3.5" />
          </a>
          {m.tel && (
            <a href={`tel:${m.tel.replace(/[^0-9]/g, "")}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 rounded-full border border-line px-2.5 py-1 text-cap font-semibold text-river active:scale-95">
              <Phone className="size-3" />전화
            </a>
          )}
        </div>
      </div>
      {curationFor(m.n) && (
        <CurationNote className="mt-2 line-clamp-2 text-ink">🧩 {curationFor(m.n)}</CurationNote>
      )}
      {progs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {progs.map((k) => (
            <span key={k} className="rounded-md px-1.5 py-0.5 text-cap font-bold text-white" style={{ backgroundColor: PROGRAM_META[k].color }}>{PROGRAM_META[k].short}</span>
          ))}
        </div>
      )}
    </li>
  );
}

function SpotCard({ s, userLoc, onFocus }: { s: Spot; userLoc: { lat: number; lng: number } | null; onFocus: () => void }) {
  const meta = spotMeta(s.cat);
  return (
    <li onClick={onFocus} className="mb-2.5 cursor-pointer overflow-hidden rounded-2xl border border-line bg-card">
      {s.img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.img.replace(/^http:/, "https:")} alt={s.n} loading="lazy" className="h-32 w-full object-cover" />
      )}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-cap font-bold"
                style={{ background: `color-mix(in oklab, ${meta.color} 15%, white)`, color: meta.color }}>
                {meta.emoji} {s.cat}
              </span>
              {s.season && <span className="text-cap font-semibold text-pear-deep">{s.season}</span>}
              {userLoc && <span className="text-cap font-bold text-river">{distLabel(distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng))}</span>}
            </div>
            <h3 className="brand-serif mt-1.5 text-[16px] font-extrabold text-ink">{s.n}</h3>
          </div>
          <StampButton item={{ id: s.id, n: s.n, c: "spot", d: "", lat: s.lat, lng: s.lng, t: s.cat }} compact />
        </div>
        {s.summary && <p className="mt-1.5 line-clamp-3 text-body leading-relaxed text-ink-soft">{s.summary}</p>}
        {curationFor(s.n) && (
          <CurationNote className="mt-1.5 line-clamp-2 text-ink">🧩 {curationFor(s.n)}</CurationNote>
        )}
        {s.flower && (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-hongeo/10 px-1.5 py-0.5 text-cap font-bold text-hongeo">🌸 {s.flower}</p>
        )}
        {s.highlights.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {s.highlights.map((h, i) => (
              <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-cap font-medium text-ink-soft">{h}</span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2 text-cap text-ink-soft">
          <span className="inline-flex items-center gap-1 truncate"><MapPin className="size-3 shrink-0" />{s.a}</span>
          <div className="flex shrink-0 items-center gap-2.5">
            {(s.insta || instaOf(s.id)) && (
              <a href={s.insta || instaOf(s.id)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 font-semibold text-hongeo">
                <InstaGlyph className="size-3.5" />인스타
              </a>
            )}
            <a href={directionsUrl(s.n, s.lat, s.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 font-semibold text-river">
              <Navigation className="size-3" />길찾기
            </a>
          </div>
        </div>
        {s.tip && <p className="mt-1.5 text-cap leading-snug text-ink-soft/90">💡 {s.tip}</p>}
      </div>
    </li>
  );
}
