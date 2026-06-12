"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Navigation, Share2, Clock, Wallet, Car, Check, Plus } from "lucide-react";
import { distanceKm, distLabel, directionsUrl } from "@/lib/geo";
import { useCourses, type SavedCourse } from "@/lib/useCourses";
import { curationFor } from "@/lib/data/curation";

type Stop = { order: number; placeId: string | null; name: string; kind: string; cat: string; lat: number | null; lng: number | null; stayMin: number; arriveLabel: string; note: string; cost?: number; costNote?: string; gap: boolean };
type Course = {
  id: string; title: string; theme: string; summary: string;
  audience: { kids: boolean; drink: boolean; visitor: boolean; resident: boolean };
  days: number; durationHours: number; party: string[]; budgetKrw: number; region: string; tags: string[]; stops: Stop[];
};

const THEME: Record<string, { emoji: string; color: string }> = {
  core: { emoji: "🧭", color: "#2e7d6b" }, retro_drink: { emoji: "🍶", color: "#8c3a4a" },
  family: { emoji: "👨‍👩‍👧", color: "#3f8fbf" }, couple: { emoji: "💑", color: "#c563a6" },
  history: { emoji: "🏛️", color: "#8c6b3f" }, experience: { emoji: "🧶", color: "#2f9d8f" }, nature: { emoji: "🌿", color: "#5b9c52" },
};
const catColor = (c: string) => (c === "food" ? "#d9534f" : c === "cafe" ? "#c98a3b" : THEME[c]?.color || "#9a9088");
const catLabel = (c: string) => (c === "food" ? "먹거리" : c === "cafe" ? "마실거리" : c);
const fmtTime = (a: string) => a.replace(/Day\s*1/i, "첫째날 ").replace(/Day\s*2/i, "둘째날 ").replace(/Day\s*3/i, "셋째날 ").replace(/\s+/g, " ").trim();

function travel(a: Stop, b: Stop) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const km = distanceKm(a.lat, a.lng, b.lat, b.lng) * 1.3;
  const walk = km < 1.2;
  const min = walk ? Math.round((km / 4) * 60) : Math.round((km / 26) * 60) + 6;
  return { km, min, walk };
}

function buildSaved(c: Course): SavedCourse {
  return {
    id: c.id, title: c.title, theme: c.theme, origin: "seed",
    items: c.stops.map((s) => ({ placeId: s.placeId, n: s.name, c: s.cat, lat: s.lat, lng: s.lng, t: s.cat, time: s.arriveLabel, note: s.note, done: false })),
    createdAt: Date.now(),
  };
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const { courses: saved, save, checkIn } = useCourses();
  const mine = course ? saved.find((c) => c.id === course.id) : undefined;
  const following = !!mine;

  useEffect(() => {
    fetch("/data/seed-courses.json").then((r) => r.json())
      .then((d) => setCourse((d.courses as Course[]).find((c) => c.id === id) || null))
      .catch(() => setCourse(null));
  }, [id]);

  async function share() {
    if (!course) return;
    const text = `나주 추천 코스 「${course.title}」 🧩 #나주한조각`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: course.title, text, url });
      else await navigator.clipboard.writeText(`${text}\n${url}`);
    } catch {}
  }

  if (course === undefined) return <div className="grid min-h-[60dvh] place-items-center text-[13px] text-ink-soft">불러오는 중…</div>;
  if (course === null) return (
    <div className="grid min-h-[60dvh] place-items-center gap-3 text-center">
      <p className="text-[14px] text-ink-soft">코스를 찾을 수 없어요.</p>
      <Link href="/recommend" className="rounded-full border border-line bg-card px-4 py-2 text-[13px] font-bold text-river">추천으로</Link>
    </div>
  );

  const t = THEME[course.theme] || THEME.core;
  const totalStay = course.stops.reduce((a, s) => a + s.stayMin, 0);
  const totalCost = course.stops.reduce((a, s) => a + (s.cost || 0), 0);
  const doneCount = mine ? mine.items.filter((i) => i.done).length : 0;
  const allDone = following && doneCount === course.stops.length;

  return (
    <div className="min-h-[calc(100dvh_-_72px)] bg-background pb-10">
      <header className="paper-grain relative overflow-hidden px-5 pb-5 pt-5">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${t.color} 22%, var(--naju-cream)) 0%, var(--background) 75%)` }} />
        <Link href="/recommend" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-ink-soft"><ArrowLeft className="size-4" />추천</Link>
        <h1 className="brand-serif mt-2 text-[24px] font-extrabold leading-tight text-ink" style={{ wordBreak: "keep-all", textWrap: "balance" }}>{t.emoji} {course.title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{course.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-ink-soft">
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{course.days >= 2 ? `${course.days}일` : `약 ${course.durationHours}시간`}</span>
          <span className="inline-flex items-center gap-1"><Wallet className="size-3.5" />1인 ~{Math.round(course.budgetKrw / 10000)}만원</span>
          <span>· {course.stops.length}곳</span>
          {course.audience.kids && <span className="rounded-md bg-river/15 px-1.5 py-0.5 text-[10.5px] text-river">아이OK</span>}
          {course.audience.drink && <span className="rounded-md bg-hongeo/15 px-1.5 py-0.5 text-[10.5px] text-hongeo">술한잔</span>}
        </div>

        {/* 담기 / 진행 */}
        <div className="mt-3.5 flex items-center gap-2">
          {following ? (
            <div className="flex flex-1 items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-pear transition-all" style={{ width: `${(doneCount / course.stops.length) * 100}%` }} />
              </div>
              <span className="shrink-0 text-[12px] font-bold text-pear-deep">{allDone ? "완주 ✦" : `${doneCount}/${course.stops.length} 다녀옴`}</span>
            </div>
          ) : (
            <button type="button" onClick={() => save(buildSaved(course))}
              className="inline-flex items-center gap-1.5 rounded-full bg-pear px-4 py-2 text-[13px] font-extrabold text-[#2a1c06] active:scale-95">
              <Plus className="size-4" />이 코스 담기
            </button>
          )}
          <button type="button" onClick={share} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[13px] font-bold text-background active:scale-95">
            <Share2 className="size-4" />공유
          </button>
        </div>
        {following && !allDone && <p className="mt-2 text-[11.5px] text-ink-soft/80">코스를 따라가며 각 장소에서 <b className="text-pear-deep">체크인</b>하면 조각이 채워져요.</p>}
      </header>

      {/* 타임라인 */}
      <ol className="px-5 pt-4">
        {course.stops.map((s, i) => {
          const tv = i < course.stops.length - 1 ? travel(s, course.stops[i + 1]) : null;
          const done = mine ? mine.items[i]?.done : false;
          const dim = following && !done;
          return (
            <li key={i} className="relative pl-7">
              {i < course.stops.length - 1 && <span className={`absolute left-[10px] top-6 h-[calc(100%-6px)] w-px ${dim ? "border-l border-dashed border-line" : "bg-line"}`} />}
              <span className="absolute left-0 top-1 grid size-[22px] place-items-center rounded-full text-[11px] font-extrabold text-white shadow"
                style={{ background: done ? catColor(s.cat) : dim ? "transparent" : catColor(s.cat), border: dim ? "1.5px dashed var(--naju-line)" : "none", color: dim ? "var(--naju-ink-soft)" : "#fff" }}>
                {done ? <Check className="size-3.5" /> : s.order}
              </span>

              <div className={`pb-5 ${dim ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2">
                  {s.arriveLabel && <span className="text-[12px] font-bold text-pear-deep">{fmtTime(s.arriveLabel)}</span>}
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `color-mix(in oklab, ${catColor(s.cat)} 16%, white)`, color: catColor(s.cat) }}>{catLabel(s.cat)}</span>
                  <span className="text-[11px] text-ink-soft/70">{s.stayMin}분</span>
                  {(s.cost ?? 0) > 0 ? (
                    <span className="text-[11px] font-bold text-pear-deep" title={s.costNote}>{(s.cost as number).toLocaleString()}원</span>
                  ) : (
                    <span className="text-[11px] text-ink-soft/55">무료</span>
                  )}
                </div>
                <h3 className="brand-serif mt-0.5 break-keep text-[16px] font-extrabold text-ink">{s.name}</h3>
                {s.note && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{s.note}</p>}
                {curationFor(s.name) && (
                  <div className="mt-1.5 rounded-xl border px-2.5 py-2 text-[11.5px] leading-relaxed"
                    style={{ borderColor: "color-mix(in oklab, var(--naju-pear) 40%, var(--naju-line))", background: "color-mix(in oklab, var(--naju-pear) 10%, var(--card))" }}>
                    <b className="text-pear-deep">🧩 나주한조각 큐레이션</b> <span className="text-ink">{curationFor(s.name)}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-[11.5px]">
                  {s.lat != null && s.lng != null && (
                    <a href={directionsUrl(s.name, s.lat, s.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-bold text-river"><Navigation className="size-3" />길찾기</a>
                  )}
                  {following && (
                    <button type="button" onClick={() => checkIn(course.id, i)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition active:scale-95"
                      style={done ? { background: "color-mix(in oklab, #2f9d8f 18%, white)", color: "#1f7a6e" } : { border: "1px solid var(--naju-line)", color: "var(--naju-ink-soft)" }}>
                      {done ? <><Check className="size-3" />다녀옴</> : "여기 체크인"}
                    </button>
                  )}
                </div>
              </div>

              {tv && (
                <div className="-mt-2 mb-3 ml-1 flex items-center gap-1 text-[11px] text-ink-soft/80">
                  <Car className="size-3" />{tv.walk ? "걸어서" : "차로"} {tv.min}분 · {distLabel(tv.km)}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mx-5 rounded-2xl border border-line bg-card p-3.5 text-[12.5px] text-ink-soft">
        <p className="text-[14px]"><b className="text-ink">1인 예상 비용</b> <b className="text-pear-deep">약 {totalCost.toLocaleString()}원</b></p>
        <p className="mt-0.5 text-[11.5px] text-ink-soft/70">입장·식사·체험비 1인 기준 추정 · 교통·주차는 별도예요.</p>
        <p className="mt-2 text-[12px]"><b className="text-ink">머무는 시간</b> 약 {Math.round(totalStay / 60 * 10) / 10}시간 (이동 별도)</p>
        <p className="mt-1.5 text-[11.5px] text-ink-soft/70">⏰ 가게는 브레이크타임·휴무가 있을 수 있어요. 방문 전 확인을 권해요.</p>
      </div>
    </div>
  );
}
