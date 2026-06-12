"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Navigation, Plus, RefreshCw, Check, Wand2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { openAuth } from "@/lib/useAuthPrompt";
import { useCourses, type SavedCourse } from "@/lib/useCourses";
import { directionsUrl } from "@/lib/geo";

type Stop = { placeId: string; n: string; c: string; lat: number; lng: number; t?: string; note?: string; day?: number };
type Course = { id: string; title: string; summary: string; theme: string; days?: number; stops: Stop[] };

const REGIONS = [
  { key: "", label: "전체" }, { key: "oldtown", label: "원도심" }, { key: "yeongsanpo", label: "영산포" },
  { key: "nampyeong", label: "남평" }, { key: "innovation", label: "혁신도시" }, { key: "myeon", label: "면지역" },
];
const VIBES = [
  { key: "mixed", label: "두루두루" }, { key: "food", label: "🍚 미식" }, { key: "cafe", label: "☕ 카페" },
  { key: "nature", label: "🌿 자연" }, { key: "history", label: "🏛 역사" }, { key: "experience", label: "🧶 체험" },
];
const catColor = (c: string) => (c === "food" ? "#d9534f" : c === "cafe" ? "#c98a3b" : "#2e7d6b");

export default function AiCourse() {
  const { user } = useAuth();
  const { save, has } = useCourses();
  const [region, setRegion] = useState("");
  const [vibe, setVibe] = useState("mixed");
  const [kids, setKids] = useState(false);
  const [drink, setDrink] = useState(false);
  const [duration, setDuration] = useState("half");
  const [wish, setWish] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [limited, setLimited] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const pendingSave = useRef<SavedCourse | null>(null);

  async function ask() {
    setBusy(true); setErr(""); setLimited(false); setCourse(null);
    try {
      const r = await fetch("/api/ai-course", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, vibe, kids, drink, duration, wish: wish.trim() }),
      });
      const d = await r.json();
      if (!d.ok) {
        if (d.limited) setLimited(true);
        setErr(d.error || "잠시 후 다시 시도해주세요.");
        return;
      }
      setCourse({ ...d.course, id: `ai-${Date.now().toString(36)}` });
      setQuota({ used: d.used, limit: d.limit });
    } catch {
      setErr("연결이 불안정해요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  function buildSaved(c: Course): SavedCourse {
    return {
      id: c.id, title: c.title, theme: c.theme || "local", origin: "ai",
      items: c.stops.map((s) => ({ placeId: s.placeId, n: s.n, c: s.c, lat: s.lat, lng: s.lng, t: s.t, time: (c.days || 1) > 1 && s.day ? `${s.day}일차` : undefined, note: s.note, done: false })),
      createdAt: Date.now(),
    };
  }
  function onSave() {
    if (!course) return;
    const sc = buildSaved(course);
    if (!user) { pendingSave.current = sc; openAuth(); return; } // 비회원 → 로그인/가입 유도
    save(sc);
  }
  // 로그인/가입 완료되면 대기 중이던 코스 자동 저장
  useEffect(() => {
    if (user && pendingSave.current) { save(pendingSave.current); pendingSave.current = null; }
  }, [user, save]);

  const saved = course ? has(course.id) : false;

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink"><Wand2 className="size-4 text-pear-deep" /> AI에게 코스 받기</p>
        <p className="mt-1 text-[12px] text-ink-soft">조건만 고르면 나주 실제 가게·명소로 코스를 짜드려요.</p>

        {/* 동네 */}
        <p className="mt-3 text-[11.5px] font-bold text-ink-soft">동네</p>
        <div className="no-scrollbar mt-1 flex gap-1.5 overflow-x-auto">
          {REGIONS.map((r) => (
            <Chip key={r.key} on={region === r.key} onClick={() => setRegion(r.key)}>{r.label}</Chip>
          ))}
        </div>
        {/* 분위기 */}
        <p className="mt-3 text-[11.5px] font-bold text-ink-soft">분위기</p>
        <div className="no-scrollbar mt-1 flex gap-1.5 overflow-x-auto">
          {VIBES.map((v) => (
            <Chip key={v.key} on={vibe === v.key} onClick={() => setVibe(v.key)}>{v.label}</Chip>
          ))}
        </div>
        {/* 일정 */}
        <p className="mt-3 text-[11.5px] font-bold text-ink-soft">일정</p>
        <div className="no-scrollbar mt-1 flex gap-1.5 overflow-x-auto">
          {([["half", "반나절"], ["day", "하루"], ["overnight", "1박 2일"], ["twonight", "2박 3일"]] as const).map(([k, l]) => (
            <Chip key={k} on={duration === k} onClick={() => setDuration(k)}>{l}</Chip>
          ))}
        </div>
        {/* 옵션 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Toggle on={kids} onClick={() => setKids((v) => !v)}>아이 동반</Toggle>
          <Toggle on={drink} onClick={() => setDrink((v) => !v)}>술 한잔</Toggle>
        </div>

        {/* 자유 입력 */}
        <p className="mt-3 text-[11.5px] font-bold text-ink-soft">이런 걸 원해요 (선택)</p>
        <textarea value={wish} onChange={(e) => setWish(e.target.value.slice(0, 200))} rows={2}
          placeholder="예) 비 오는 날 실내 위주로 / 사진 찍기 좋은 곳 / 부모님 모시고 / 데이트 코스로…"
          className="mt-1 w-full resize-none rounded-xl border border-line bg-background px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-pear/60" />

        <button type="button" onClick={ask} disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-ink px-4 py-3 text-[14.5px] font-extrabold text-background transition active:scale-[0.98] disabled:opacity-50">
          {busy ? <><Sparkles className="size-4 animate-pulse" /> 코스 짜는 중…</> : course ? <><RefreshCw className="size-4" /> 다른 코스 받기</> : <><Sparkles className="size-4" /> AI 코스 받기</>}
        </button>
        {quota && <p className="mt-2 text-center text-[11px] text-ink-soft/60">오늘 {quota.used}/{quota.limit}회 사용{quota.limit < 3 ? " · 로그인하면 하루 3회" : ""}</p>}
        {err && (
          <div className="mt-2 text-center">
            <p className="text-[12px] font-semibold text-hongeo">{err}</p>
            {limited && !user && (
              <button type="button" onClick={() => openAuth()} className="mt-1 text-[12.5px] font-bold text-river underline">로그인하고 더 받기</button>
            )}
          </div>
        )}
      </div>

      {/* 결과 */}
      {course && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
          <div className="paper-grain px-4 pb-3 pt-4" style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--naju-pear) 16%, var(--card)), var(--card))" }}>
            <p className="flex items-center gap-1 text-[11px] font-bold text-pear-deep"><Sparkles className="size-3" /> AI 추천 코스</p>
            <h3 className="brand-serif mt-1 break-keep text-[19px] font-extrabold text-ink">{course.title}</h3>
            {course.summary && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{course.summary}</p>}
          </div>
          <ol className="px-4 pt-3">
            {course.stops.map((s, i) => {
              const multiDay = (course.days || 1) > 1;
              const newDay = multiDay && (i === 0 || s.day !== course.stops[i - 1].day);
              return (
                <Fragment key={i}>
                  {newDay && (
                    <li className="list-none pb-2 pt-1 text-[12.5px] font-extrabold text-pear-deep">📅 {s.day}일차</li>
                  )}
                  <li className="relative pb-4 pl-7">
                    {i < course.stops.length - 1 && <span className="absolute left-[10px] top-6 h-[calc(100%-8px)] w-px bg-line" />}
                    <span className="absolute left-0 top-0.5 grid size-[22px] place-items-center rounded-full text-[11px] font-extrabold text-white shadow" style={{ background: catColor(s.c) }}>{i + 1}</span>
                    <h4 className="brand-serif break-keep text-[15.5px] font-extrabold text-ink">{s.n}</h4>
                    {s.note && <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{s.note}</p>}
                    {s.lat != null && s.lng != null && (
                      <a href={directionsUrl(s.n, s.lat, s.lng)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-0.5 text-[11.5px] font-bold text-river"><Navigation className="size-3" />길찾기</a>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ol>
          <div className="flex items-center gap-2 border-t border-line/70 p-3">
            {saved ? (
              <Link href="/pieces" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-pear/15 px-4 py-2.5 text-[13.5px] font-extrabold text-pear-deep">
                <Check className="size-4" /> 내조각에 담았어요 · 보러가기
              </Link>
            ) : (
              <button type="button" onClick={onSave}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-pear px-4 py-2.5 text-[13.5px] font-extrabold text-[#2a1c06] active:scale-[0.98]">
                <Plus className="size-4" /> 내조각에 저장
              </button>
            )}
          </div>
          <p className="px-4 pb-3 text-[10.5px] text-ink-soft/55">AI가 짠 추천이라 영업시간·휴무는 방문 전 확인하세요.</p>
        </div>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
      style={on ? { background: "var(--naju-river)", borderColor: "var(--naju-river)", color: "#fff" } : { borderColor: "var(--naju-line)", background: "var(--background)", color: "var(--naju-ink-soft)" }}>
      {children}
    </button>
  );
}
function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
      style={on ? { background: "var(--naju-pear)", borderColor: "var(--naju-pear)", color: "#2a1c06" } : { borderColor: "var(--naju-line)", background: "var(--background)", color: "var(--naju-ink-soft)" }}>
      {children}
    </button>
  );
}
