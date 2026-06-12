"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Wallet, Puzzle, ChevronRight, ExternalLink, Phone } from "lucide-react";
import { CULTURE_EVENTS, type CultureEvent } from "@/lib/data/culture";
import HamburgerButton from "@/components/shell/HamburgerButton";
import AiCourse from "@/components/recommend/AiCourse";
import CurationNote from "@/components/ui/CurationNote";

type Stop = { name: string; cat: string; cost?: number };
type Course = {
  id: string; title: string; theme: string; summary: string;
  audience: { kids: boolean; drink: boolean; visitor: boolean; resident: boolean };
  days: number; durationHours: number; party: string[]; budgetKrw: number; region: string; tags: string[]; stops: Stop[];
  age?: string;
};
type Taste = { key: string; label: string; icon: string; blurb: string; match: { themes?: string[]; tags?: string[]; kids?: boolean; drink?: boolean }; picks: { name: string; blurb: string }[] };

const THEME: Record<string, { emoji: string; color: string }> = {
  core: { emoji: "🧭", color: "#2e7d6b" }, food: { emoji: "🍚", color: "#d9534f" }, retro_drink: { emoji: "🍶", color: "#8c3a4a" },
  family: { emoji: "👨‍👩‍👧", color: "#3f8fbf" }, couple: { emoji: "💑", color: "#c563a6" }, history: { emoji: "🏛️", color: "#8c6b3f" },
  experience: { emoji: "🧶", color: "#2f9d8f" }, nature: { emoji: "🌿", color: "#5b9c52" }, cafe: { emoji: "☕", color: "#c98a3b" }, local: { emoji: "🧩", color: "#c9821f" },
};
const catColor = (c: string) => (c === "food" ? "#d9534f" : c === "cafe" ? "#c98a3b" : THEME[c]?.color || "#9a9088");
const wonLabel = (krw: number) => (krw === 0 ? "무료" : `1인 ${krw.toLocaleString()}원`);

// 추천별 세부 분류(탭) — 행사·공연을 앞, 혜택·지원을 맨 뒤로
const EV_GROUPS = [
  { key: "festival", tab: "🎪 행사", label: "지금 열리는 행사·공연" },
  { key: "experience", tab: "🫖 체험·살롱", label: "체험·살롱·모임" },
  { key: "benefit", tab: "🎁 혜택", label: "관광객 혜택·지원" },
];
function evCat(e: CultureEvent): string {
  const b = e.badge || "";
  if (/혜택|지원/.test(b)) return "benefit";
  if (/체험|살롱|커뮤니티/.test(b)) return "experience";
  return "festival";
}

const NAV = [
  { key: "featured", label: "추천별" }, { key: "ai", label: "✨ AI추천" }, { key: "days", label: "일자별" },
  { key: "taste", label: "취향별" }, { key: "region", label: "동네별" }, { key: "age", label: "나이별" },
] as const;
type Nav = (typeof NAV)[number]["key"];

const REGIONS = [
  { key: "oldtown", label: "원도심" }, { key: "yeongsanpo", label: "영산포" }, { key: "nampyeong", label: "남평" },
  { key: "innovation", label: "혁신도시" }, { key: "myeon", label: "면지역" },
];
const AGES = [
  { key: "10s", label: "10대" }, { key: "20s", label: "20대" }, { key: "30s", label: "30대" },
  { key: "40s", label: "40대" }, { key: "50s", label: "50대" }, { key: "60s", label: "60대+" },
];
const TASTE_FALLBACK: Taste[] = [
  { key: "kids", label: "아이랑", icon: "👨‍👩‍👧", blurb: "아이와 함께 가기 좋은 코스", match: { kids: true }, picks: [] },
  { key: "food", label: "미식", icon: "🍚", blurb: "곰탕·홍어·장어, 나주 향토 미식", match: { themes: ["food", "retro_drink"] }, picks: [] },
  { key: "cafe", label: "카페·디저트", icon: "☕", blurb: "감성 카페 한 바퀴", match: { themes: ["cafe"] }, picks: [] },
  { key: "art", label: "미술·전시", icon: "🎨", blurb: "그림과 전시를 좋아한다면", match: { tags: ["미술", "전시", "갤러리"] }, picks: [] },
  { key: "nature", label: "자연·힐링", icon: "🌿", blurb: "수목원·강·산사에서 쉬어가기", match: { themes: ["nature"] }, picks: [] },
  { key: "drink", label: "술 한잔", icon: "🍶", blurb: "홍어·막걸리·수제맥주", match: { drink: true }, picks: [] },
  { key: "history", label: "역사·문화", icon: "🏛️", blurb: "문화재·고분·향교", match: { themes: ["history"] }, picks: [] },
];

function matchCourse(c: Course, m: Taste["match"]) {
  if (m.kids && !c.audience.kids) return false;
  if (m.drink && !c.audience.drink) return false;
  const hasT = !!m.themes?.length, hasG = !!m.tags?.length;
  if (!hasT && !hasG) return true;
  return (hasT && m.themes!.includes(c.theme)) || (hasG && c.tags.some((t) => m.tags!.includes(t)));
}

function CourseCard({ c }: { c: Course }) {
  const t = THEME[c.theme] || THEME.core;
  const names = c.stops.map((s) => s.name);
  const route = names.length <= 3 ? names.join(" · ") : `${names.slice(0, 3).join(" · ")} 외 ${names.length - 3}곳`;
  return (
    <Link href={`/recommend/${c.id}`} className="block overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition active:scale-[0.99]">
      <div className="flex items-start gap-2 px-4 pt-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[15px]" style={{ background: `color-mix(in oklab, ${t.color} 16%, var(--card))` }}>{t.emoji}</span>
        <h3 className="brand-serif min-w-0 flex-1 break-keep text-[16.5px] font-extrabold leading-snug text-ink">{c.title}</h3>
        <ChevronRight className="mt-1 size-4 shrink-0 text-ink-soft/50" />
      </div>
      <div className="mt-2 px-4">
        <div className="flex items-center gap-1">
          {c.stops.map((s, i) => (
            <span key={i} className="flex items-center">
              <span className="size-1.5 rounded-full" style={{ background: catColor(s.cat) }} />
              {i < c.stops.length - 1 && <span className="h-px w-2.5" style={{ background: "var(--naju-line)" }} />}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[12px] font-semibold text-ink-soft">{route}</p>
      </div>
      <p className="mt-1.5 line-clamp-2 px-4 text-[12px] leading-relaxed text-ink-soft/80">{c.summary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3.5 text-[11.5px] font-bold text-ink-soft">
        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{c.days >= 2 ? `${c.days}일` : `약 ${c.durationHours}시간`}</span>
        <span className="inline-flex items-center gap-1 text-pear-deep"><Wallet className="size-3" />{wonLabel(c.budgetKrw)}</span>
        <span>· {c.stops.length}곳</span>
        {c.audience.kids && <span className="rounded bg-river/10 px-1.5 py-0.5 text-[10px] text-river">아이OK</span>}
        {c.audience.drink && <span className="rounded bg-hongeo/10 px-1.5 py-0.5 text-[10px] text-hongeo">술한잔</span>}
      </div>
    </Link>
  );
}

function Feed({ list }: { list: Course[] }) {
  if (list.length === 0) return <p className="px-5 pt-10 text-center text-[13px] text-ink-soft">해당하는 코스가 아직 없어요.</p>;
  return <ul className="space-y-3 px-4 pt-2.5">{list.map((c) => <li key={c.id}><CourseCard c={c} /></li>)}</ul>;
}

function Chips({ items, value, onPick }: { items: { key: string; label: string }[]; value: string; onPick: (k: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-1 pt-2">
      {items.map((c) => {
        const on = value === c.key;
        return (
          <button key={c.key} type="button" onClick={() => onPick(c.key)}
            className="shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition active:scale-95"
            style={on ? { background: "var(--naju-river)", borderColor: "var(--naju-river)", color: "#fff" } : { borderColor: "var(--naju-line)", background: "var(--card)", color: "var(--naju-ink-soft)" }}>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function CultureCard({ e, past }: { e: CultureEvent; past?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-card shadow-sm ${past ? "opacity-60" : ""}`}>
      {e.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.image} alt={e.title} loading="lazy" className="h-44 w-full object-cover" />
      )}
      <div className="flex items-start gap-2.5 px-4 pt-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl text-[20px]" style={{ background: `color-mix(in oklab, ${e.color} 16%, var(--card))` }}>{e.emoji}</span>
        <div className="min-w-0">
          {past ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">지난 일정</span>
          ) : (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `color-mix(in oklab, ${e.color} 16%, white)`, color: e.color }}>{e.badge}</span>
          )}
          <h3 className="brand-serif mt-0.5 break-keep text-[17px] font-extrabold leading-tight text-ink">{e.title}</h3>
        </div>
      </div>
      <div className="space-y-0.5 px-4 pt-2 text-[12px] text-ink-soft">
        <p>📅 {e.period}{e.time ? ` · ${e.time}` : ""}</p>
        <p>📍 {e.place}</p>
        {e.audience && <p>👥 {e.audience}</p>}
      </div>
      <p className="px-4 pt-2 text-[12.5px] leading-relaxed text-ink-soft">{e.summary}</p>
      <div className="flex flex-wrap gap-1 px-4 pt-2">
        {e.highlights.map((h) => <span key={h} className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-ink-soft">{h}</span>)}
      </div>
      {e.schedule && (
        <div className="space-y-1.5 px-4 pt-2.5">
          {e.schedule.map((d) => (
            <div key={d.day}>
              <p className="text-[11.5px] font-bold text-pear-deep">{d.day}</p>
              <ul className="mt-0.5 text-[11.5px] text-ink-soft">{d.items.map((it, i) => <li key={i}>· {it}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {e.pickNote && (
        <CurationNote className="mx-4 mt-2.5">
          <b className="text-pear-deep">🧩 나주한조각 큐레이션</b> <span className="text-ink">{e.pickNote}</span>
        </CurationNote>
      )}
      {e.salons && (
        <details className="px-4 pt-2.5">
          <summary className="cursor-pointer text-[12px] font-bold text-river">살롱 전체 보기 ({e.salons.length})</summary>
          <ul className="mt-1.5 space-y-0.5 text-[11.5px] text-ink-soft">{e.salons.map((s, i) => <li key={i}>· {s}</li>)}</ul>
        </details>
      )}
      <div className="mt-1 flex items-center gap-2 px-4 py-3 text-[11.5px]">
        {e.contact && (
          /[0-9]/.test(e.contact)
            ? <a href={`tel:${e.contact.replace(/[^0-9]/g, "")}`}
                className="inline-flex items-center gap-1 font-bold text-river active:scale-95">
                <Phone className="size-3" /> {e.contact}
              </a>
            : <span className="text-ink-soft">{e.contact}</span>
        )}
        {e.link && <a href={e.link} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-0.5 font-bold text-river">자세히 보기 <ExternalLink className="size-3" /></a>}
      </div>
      {e.host && <p className="px-4 pb-3 text-[10.5px] leading-relaxed text-ink-soft/60">{e.host}</p>}
    </div>
  );
}

export default function RecommendPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [tastes, setTastes] = useState<Taste[]>(TASTE_FALLBACK);
  const [nav, setNav] = useState<Nav>("days");
  const [days, setDays] = useState("all");
  const [region, setRegion] = useState("oldtown");
  const [taste, setTaste] = useState(TASTE_FALLBACK[0].key);
  const [age, setAge] = useState("10s");
  const [featTab, setFeatTab] = useState("festival");
  const [events, setEvents] = useState<CultureEvent[]>(CULTURE_EVENTS);

  useEffect(() => {
    // 발견 탭 "행사·혜택" 칩에서 들어오면 featured 탭 자동 선택
    try {
      const saved = sessionStorage.getItem("recommend.nav");
      if (saved) { setNav(saved as Nav); sessionStorage.removeItem("recommend.nav"); }
    } catch {}
    fetch("/data/seed-courses.json").then((r) => r.json()).then((d) => setCourses(d.courses || [])).catch(() => setCourses([]));
    fetch("/data/taste-categories.json").then((r) => r.json()).then((d) => { if (d?.categories?.length) { setTastes(d.categories); setTaste(d.categories[0].key); } }).catch(() => {});
    fetch("/api/culture").then((r) => r.json()).then((d) => { if (d?.events?.length) setEvents(d.events); }).catch(() => {});
  }, []);

  const main = useMemo(() => (courses || []).filter((c) => !c.age), [courses]);
  const ageCourses = useMemo(() => (courses || []).filter((c) => c.age), [courses]);
  const tasteCat = tastes.find((t) => t.key === taste);

  const list = useMemo(() => {
    if (nav === "days") return main.filter((c) => days === "all" || (days === "day" ? c.days === 1 : c.days >= 2));
    if (nav === "region") return main.filter((c) => c.region === region);
    if (nav === "taste") return tasteCat ? main.filter((c) => matchCourse(c, tasteCat.match)) : main;
    if (nav === "age") return ageCourses.filter((c) => c.age === age);
    return [];
  }, [nav, main, ageCourses, days, region, taste, age, tasteCat]);

  // 추천별: 지난 일정은 하단으로
  const featuredEvents = useMemo(() => {
    const now = Date.now();
    return events.map((e) => ({ e, past: e.end ? new Date(e.end + "T23:59:59").getTime() < now : false }))
      .sort((a, b) => (a.past ? 1 : 0) - (b.past ? 1 : 0) || (a.past ? (b.e.end || "").localeCompare(a.e.end || "") : (a.e.start || "").localeCompare(b.e.start || "")));
  }, [events]);

  return (
    <div className="min-h-[calc(100dvh_-_72px)] bg-background pb-10">
      <header className="paper-grain relative overflow-hidden px-5 pb-2 pt-7">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, var(--naju-cream) 0%, var(--background) 70%)" }} />
        <HamburgerButton />
        <p className="mt-4 flex items-center gap-1 text-[12px] font-bold tracking-wide text-pear-deep"><Puzzle className="size-3.5" /> 나주, 이렇게 돌아보세요</p>
        <h1 className="brand-serif mt-1 text-[26px] font-extrabold leading-tight text-ink">추천 코스</h1>
      </header>

      {/* 1차 분류 */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line/70 px-4">
        {NAV.map((n) => {
          const on = nav === n.key;
          return (
            <button key={n.key} type="button" onClick={() => setNav(n.key)}
              className="shrink-0 border-b-2 px-3 py-2.5 text-[13.5px] font-extrabold transition"
              style={on ? { borderColor: "var(--naju-ink)", color: "var(--naju-ink)" } : { borderColor: "transparent", color: "var(--naju-ink-soft)" }}>
              {n.label}
            </button>
          );
        })}
      </div>

      {nav === "featured" ? (
        <>
          <Chips
            items={[...EV_GROUPS.map((g) => ({ key: g.key, label: g.tab })), ...(featuredEvents.some((x) => x.past) ? [{ key: "past", label: "🗓 지난 일정" }] : [])]}
            value={featTab}
            onPick={setFeatTab}
          />
          <div className="px-4 pt-2.5">
            {featTab === "past" ? (
              <ul className="space-y-3">
                {featuredEvents.filter((x) => x.past).map(({ e }) => <li key={e.id}><CultureCard e={e} past /></li>)}
              </ul>
            ) : (() => {
              const g = EV_GROUPS.find((x) => x.key === featTab);
              const items = featuredEvents.filter((x) => !x.past && evCat(x.e) === featTab);
              return (
                <>
                  {g && <p className="px-1 pb-2 text-[12.5px] text-ink-soft">{g.label}예요 🎉</p>}
                  {items.length === 0 ? (
                    <p className="px-1 pt-8 text-center text-[13px] text-ink-soft">이 분류엔 지금 열리는 게 없어요.</p>
                  ) : (
                    <ul className="space-y-3">{items.map(({ e }) => <li key={e.id}><CultureCard e={e} /></li>)}</ul>
                  )}
                </>
              );
            })()}
          </div>
        </>
      ) : nav === "ai" ? (
        <AiCourse />
      ) : nav === "days" ? (
        <>
          <Chips items={[{ key: "all", label: "전체" }, { key: "day", label: "당일" }, { key: "stay", label: "1박 2일+" }]} value={days} onPick={setDays} />
          <Feed list={list} />
        </>
      ) : nav === "region" ? (
        <>
          <Chips items={REGIONS} value={region} onPick={setRegion} />
          <Feed list={list} />
        </>
      ) : nav === "taste" ? (
        <>
          <Chips items={tastes.map((t) => ({ key: t.key, label: `${t.icon} ${t.label}` }))} value={taste} onPick={setTaste} />
          {tasteCat && (
            <div className="px-5 pt-2">
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{tasteCat.blurb}</p>
              {tasteCat.picks.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {tasteCat.picks.map((p, i) => (
                    <li key={i} className="rounded-xl border border-line bg-card p-2.5">
                      <p className="text-[13px] font-bold text-ink">📍 {p.name}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{p.blurb}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Feed list={list} />
        </>
      ) : (
        <>
          <Chips items={AGES} value={age} onPick={setAge} />
          {ageCourses.length === 0 ? (
            <p className="px-5 pt-10 text-center text-[13px] text-ink-soft">나이대별 코스를 준비 중이에요.</p>
          ) : list.length === 0 ? (
            <div className="px-5 pt-10 text-center">
              <p className="text-[14px] font-bold text-ink">이 나이대 코스가 아직 없어요</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">전체 코스에서 마음에 드는 코스를 찾아보세요.</p>
              <button type="button" onClick={() => setNav("days")}
                className="mt-4 rounded-full bg-ink px-5 py-2 text-[13px] font-bold text-background active:scale-95">
                전체 코스 보기
              </button>
            </div>
          ) : (
            <Feed list={list} />
          )}
        </>
      )}

      <p className="px-5 pb-2 pt-6 text-center text-[10.5px] text-ink-soft/60">비용은 입장·식사·체험비 1인 기준 추정 · 교통·주차 별도</p>
    </div>
  );
}
