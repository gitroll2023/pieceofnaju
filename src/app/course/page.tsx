"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Clock3, Camera, Utensils } from "lucide-react";
import MerchantsMap from "@/components/map/MerchantsMap";
import { type Merchant } from "@/lib/data/merchants";

interface CourseStop {
  kind: "spot" | "food";
  name: string;
  time: string;
  why: string;
  lat?: number;
  lng?: number;
  spotId?: string;
  cat?: string;
}
interface PCourse {
  id: string;
  persona: string;
  title: string;
  vibe: string;
  duration: string;
  area: string;
  stops: CourseStop[];
}

const EMOJI = ["🧭", "🍜", "👨‍👩‍👧", "💑", "📸", "🏛️"];
const shortPersona = (p: string) => p.split("—")[0].trim();

export default function CoursePage() {
  const [courses, setCourses] = useState<PCourse[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/courses.json")
      .then((r) => r.json())
      .then((d: PCourse[]) => setCourses(d))
      .catch(() => setCourses([]));
  }, []);

  const course = courses?.[idx];

  const mapPoints: Merchant[] = useMemo(() => {
    if (!course) return [];
    return course.stops
      .filter((s) => s.lat && s.lng)
      .map((s, i) => ({
        id: s.spotId || `${course.id}-${i}`,
        n: s.name, c: "etc", d: "", a: s.name,
        lat: s.lat as number, lng: s.lng as number,
        t: s.cat || "관광", p: [], geo: "naver", tel: "",
      }));
  }, [course]);

  return (
    <div className="pb-6">
      <header className="px-5 pb-1 pt-6">
        <p className="mb-1 text-[12px] font-semibold tracking-wide text-pear-deep">나주 추천 코스</p>
        <h1 className="brand-serif text-[26px] font-extrabold leading-tight text-ink">누구의 나주를 걸을까요?</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
          여섯 여행자의 하루 — 관광지와 먹거리를 권역으로 엮은 실제 동선이에요.
        </p>
      </header>

      {/* 페르소나 선택 */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 py-3">
        {(courses ?? []).map((c, i) => {
          const active = i === idx;
          return (
            <button key={c.id} type="button" onClick={() => { setIdx(i); setFocus(null); }}
              className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
              style={active ? { background: "var(--naju-river)", borderColor: "var(--naju-river)", color: "#fff" }
                : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }}>
              <span>{EMOJI[i]}</span>{shortPersona(c.persona)}
            </button>
          );
        })}
      </div>

      {!courses && (
        <div className="px-5 pt-4">
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        </div>
      )}

      {course && (
        <div key={course.id} className="animate-rise mt-1 space-y-5">
          {/* 코스 헤더 카드 */}
          <section className="px-5">
            <div className="paper-grain relative overflow-hidden rounded-2xl border border-river p-5 text-white shadow-[0_10px_28px_rgba(31,78,95,0.22)]"
              style={{ background: "linear-gradient(135deg, var(--naju-river) 0%, var(--naju-river-soft) 100%)" }}>
              <span aria-hidden className="brand-serif pointer-events-none absolute -right-1 -top-3 select-none text-[80px] leading-none text-white/10">
                {EMOJI[idx]}
              </span>
              <div className="relative">
                <span className="inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-semibold leading-none backdrop-blur">
                  {shortPersona(course.persona)}
                </span>
                <h2 className="brand-serif mt-3 text-[21px] font-extrabold leading-snug">{course.title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-white/85">{course.vibe}</p>
                <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-medium text-white/80">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{course.duration}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{course.area}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 코스 지도 (관광 stop) */}
          <section className="px-5">
            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="flex items-center justify-between px-4 pt-3.5">
                <p className="brand-serif text-[14px] font-extrabold text-ink">한눈에 보는 동선</p>
                <span className="text-[11.5px] font-medium text-ink-soft">관광 {mapPoints.length}곳</span>
              </div>
              <MerchantsMap merchants={mapPoints} focus={focus} className="mt-3 h-[200px] w-full" />
            </div>
          </section>

          {/* 타임라인 */}
          <section>
            <p className="mb-3 px-5 text-[12.5px] font-semibold text-ink-soft">순서대로 따라가 보세요 →</p>
            <ol className="px-5">
              {course.stops.map((s, i) => {
                const last = i === course.stops.length - 1;
                const isFood = s.kind === "food";
                return (
                  <li key={i} className="flex gap-3">
                    {/* 왼쪽 순번 + 선 */}
                    <div className="flex w-[20px] shrink-0 flex-col items-center">
                      <div className="grid size-6 place-items-center rounded-full text-[11px] font-bold text-white shadow-sm"
                        style={{ background: isFood ? "var(--cat-food)" : "var(--naju-river)" }}>
                        {i + 1}
                      </div>
                      {!last && <div className="mt-1 w-[2px] flex-1 rounded-full bg-line" />}
                    </div>
                    {/* 오른쪽 내용 */}
                    <div
                      className={`min-w-0 flex-1 ${last ? "pb-1" : "pb-5"} ${s.spotId ? "cursor-pointer" : ""}`}
                      onClick={s.spotId ? () => setFocus(s.spotId!) : undefined}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-pear-deep">{s.time}</span>
                        <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                          style={isFood
                            ? { background: "color-mix(in oklab, var(--cat-food) 14%, white)", color: "var(--cat-food)" }
                            : { background: "color-mix(in oklab, var(--cat-spot) 14%, white)", color: "var(--cat-spot)" }}>
                          {isFood ? <Utensils className="size-2.5" /> : <Camera className="size-2.5" />}
                          {isFood ? "먹거리" : "관광"}
                        </span>
                      </div>
                      <h3 className="brand-serif mt-1 text-[15.5px] font-extrabold text-ink">{s.name}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{s.why}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <p className="px-5 pt-2 text-center text-[10.5px] text-ink-soft/70">
            관광지: 네이버 검색 정리 · 먹거리: KB 사용처 · 동선은 권역 기준 추천
          </p>
        </div>
      )}
    </div>
  );
}
