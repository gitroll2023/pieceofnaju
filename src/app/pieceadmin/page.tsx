"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LayoutDashboard, Store, Star, MessageSquare, Users, Menu, LogOut, Puzzle, Check, X, AtSign, Search, Trash2, CalendarDays, Eye, EyeOff, Plus, Home, Moon, Sun, Camera, MapPin } from "lucide-react";
import InstaGlyph from "@/components/ui/InstaGlyph";
import Lightbox from "@/components/journal/Lightbox";
import type { CultureEvent } from "@/lib/data/culture";

// 관리자 전용 팔레트(라이트/다크) — 본문 색은 var(--a-*) 사용
const A_DARK = {
  "--a-bg": "#13110e", "--a-surface": "#1a1714", "--a-input": "rgba(0,0,0,.30)",
  "--a-border": "rgba(255,255,255,.10)", "--a-border2": "rgba(255,255,255,.16)",
  "--a-chip": "rgba(255,255,255,.10)", "--a-hover": "rgba(255,255,255,.06)",
  "--a-text": "#f1ece1", "--a-text2": "#c4bcad", "--a-text3": "#948b7c", "--a-link": "#9bc2ff",
} as React.CSSProperties;
const A_LIGHT = {
  "--a-bg": "#ece7dd", "--a-surface": "#ffffff", "--a-input": "#f3efe7",
  "--a-border": "rgba(31,28,24,.14)", "--a-border2": "rgba(31,28,24,.24)",
  "--a-chip": "rgba(31,28,24,.07)", "--a-hover": "rgba(31,28,24,.05)",
  "--a-text": "#1c1813", "--a-text2": "#534b3f", "--a-text3": "#7c7264", "--a-link": "#1d4ed8",
} as React.CSSProperties;

type Overview = {
  stats: { users: number; feedback: number; storePending: number; creatorPending: number; visitsToday: { guest: number; member: number } };
  visitSeries: { d: string; guest: number; member: number }[];
  recentUsers: { nickname: string; creator_status: string; at: string }[];
  feedback: { id: number; message: string; contact: string; at: string; nickname: string | null }[];
  stores: { id: number; name: string; bucket: string; address: string; summary: string; contact: string; status: string; at: string; nickname: string | null }[];
  creators: { id: number; nickname: string; insta: string; blog: string; youtube: string; creator_status: string }[];
};

const BUCKET: Record<string, string> = { eat: "먹거리", drink: "마실거리", see: "볼거리", play: "즐길거리" };
const TABS = [
  { key: "dash", label: "대시보드", icon: LayoutDashboard },
  { key: "stores", label: "가게 신청", icon: Store },
  { key: "creators", label: "크리에이터", icon: Star },
  { key: "feedback", label: "건의함", icon: MessageSquare },
  { key: "culture", label: "문화이벤트", icon: CalendarDays },
  { key: "insta", label: "인스타 연결", icon: AtSign },
  { key: "journal", label: "내 조각", icon: Camera },
  { key: "users", label: "회원", icon: Users },
] as const;

export default function PieceAdmin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("dash");
  const [drawer, setDrawer] = useState(false);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [adark, setAdark] = useState(true);
  useEffect(() => { try { setAdark(localStorage.getItem("naju.admin.theme") !== "light"); } catch {} }, []);
  const pal = adark ? A_DARK : A_LIGHT;
  function toggleTheme() { const n = !adark; setAdark(n); try { localStorage.setItem("naju.admin.theme", n ? "dark" : "light"); } catch {} }

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/overview");
    if (r.status === 401) { setAuthed(false); return; }
    const d = await r.json();
    setData(d); setAuthed(true);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, pw }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) { setErr(d.error || "로그인 실패"); return; }
    setPw(""); await load();
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthed(false); setData(null); }

  async function reviewStore(sid: number, action: "approve" | "reject") {
    await fetch("/api/admin/store-request", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sid, action }) });
    await load();
  }
  async function reviewCreator(userId: number, action: "approve" | "reject") {
    await fetch("/api/admin/creator", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) });
    await load();
  }

  // ── 로그인 게이트 ──
  if (authed === null) {
    return <div style={pal} className="fixed inset-0 z-[3000] grid place-items-center bg-[var(--a-bg)] text-[var(--a-text2)]">불러오는 중…</div>;
  }
  if (!authed) {
    return (
      <div style={pal} className="fixed inset-0 z-[3000] grid place-items-center bg-[var(--a-bg)] px-6">
        <form onSubmit={doLogin} className="w-full max-w-[340px] rounded-3xl border border-[var(--a-border)] bg-[var(--a-surface)] p-6 text-[var(--a-text2)]">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-pear"><Puzzle className="size-4" /> 나주한조각 관리자</p>
          <h1 className="brand-serif mt-2 text-[22px] font-extrabold text-[var(--a-text)]">로그인</h1>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" autoComplete="username"
            className="mt-4 w-full rounded-2xl border border-[var(--a-border)] bg-[var(--a-input)] px-4 py-3 text-[14px] text-[var(--a-text)] outline-none focus:border-pear/60" />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="비밀번호" autoComplete="current-password"
            className="mt-2 w-full rounded-2xl border border-[var(--a-border)] bg-[var(--a-input)] px-4 py-3 text-[14px] text-[var(--a-text)] outline-none focus:border-pear/60" />
          {err && <p className="mt-2 text-[12px] font-semibold text-red-400">{err}</p>}
          <button type="submit" className="mt-4 w-full rounded-2xl bg-pear py-3 text-[15px] font-extrabold text-[#2a1c06] active:scale-[0.98]">들어가기</button>
        </form>
      </div>
    );
  }

  const s = data?.stats;
  return (
    <div style={pal} className="fixed inset-0 z-[3000] flex bg-[var(--a-bg)] text-[var(--a-text)]">
      {/* 사이드바 (데스크탑 고정 / 모바일 드로어) */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-60 transform border-r border-[var(--a-border)] bg-[var(--a-surface)] p-4 transition-transform md:static md:translate-x-0 ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
        <p className="flex items-center gap-1.5 px-2 text-[13px] font-extrabold text-pear"><Puzzle className="size-4" /> 나주한조각 관리</p>
        <nav className="mt-5 space-y-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            const badge = t.key === "stores" ? s?.storePending : t.key === "creators" ? s?.creatorPending : 0;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setDrawer(false); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition ${active ? "bg-pear text-[#2a1c06]" : "text-[var(--a-text2)] hover:bg-[var(--a-hover)]"}`}>
                <t.icon className="size-4" /> {t.label}
                {!!badge && badge > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <button onClick={toggleTheme} className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-[var(--a-text2)] hover:bg-[var(--a-hover)]">
          {adark ? <Sun className="size-4" /> : <Moon className="size-4" />} {adark ? "라이트 모드" : "다크 모드"}
        </button>
        <a href="/" className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-[var(--a-text2)] hover:bg-[var(--a-hover)]">
          <Home className="size-4" /> 메인으로
        </a>
        <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-[var(--a-text2)] hover:bg-[var(--a-hover)]">
          <LogOut className="size-4" /> 로그아웃
        </button>
      </aside>
      {drawer && <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setDrawer(false)} />}

      {/* 본문 */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-[5] flex items-center gap-3 border-b border-[var(--a-border)] bg-[var(--a-bg)]/95 px-4 py-3 backdrop-blur md:px-6">
          <button onClick={() => setDrawer(true)} className="md:hidden"><Menu className="size-5" /></button>
          <h2 className="text-[16px] font-extrabold text-[var(--a-text)]">{TABS.find((t) => t.key === tab)?.label}</h2>
        </header>

        <div className="p-4 md:p-6">
          {!data ? (
            <p className="text-[13px] text-[var(--a-text2)]">불러오는 중…</p>
          ) : tab === "dash" ? (
            <Dash data={data} />
          ) : tab === "stores" ? (
            <Stores rows={data.stores} onReview={reviewStore} />
          ) : tab === "creators" ? (
            <Creators rows={data.creators} onReview={reviewCreator} />
          ) : tab === "feedback" ? (
            <Feedback rows={data.feedback} />
          ) : tab === "culture" ? (
            <CulturePanel />
          ) : tab === "insta" ? (
            <InstaPanel />
          ) : tab === "journal" ? (
            <JournalPanel />
          ) : (
            <UsersPanel rows={data.recentUsers} />
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-pear/40 bg-pear/10" : "border-[var(--a-border)] bg-[var(--a-surface)]"}`}>
      <p className="text-[11.5px] font-bold text-[var(--a-text2)]">{label}</p>
      <p className={`mt-1 text-[26px] font-extrabold ${accent ? "text-pear" : "text-[var(--a-text)]"}`}>{value}</p>
    </div>
  );
}

function Dash({ data }: { data: Overview }) {
  const s = data.stats;
  const max = Math.max(1, ...data.visitSeries.map((v) => v.guest + v.member));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="회원" value={s.users} />
        <Card label="대기 가게신청" value={s.storePending} accent={s.storePending > 0} />
        <Card label="대기 크리에이터" value={s.creatorPending} accent={s.creatorPending > 0} />
        <Card label="건의 누적" value={s.feedback} />
      </div>
      <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4">
        <p className="text-[12.5px] font-bold text-[var(--a-text)]">최근 14일 방문 <span className="text-[var(--a-text2)]">(오늘 비회원 {s.visitsToday.guest} · 회원 {s.visitsToday.member})</span></p>
        <div className="mt-3 flex items-end gap-1.5" style={{ height: 110 }}>
          {data.visitSeries.length === 0 && <p className="text-[12px] text-[var(--a-text3)]">아직 방문 기록이 없어요.</p>}
          {data.visitSeries.map((v) => (
            <div key={v.d} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t" style={{ height: 90 }}>
                <div style={{ height: `${(v.member / max) * 100}%`, background: "var(--naju-pear)" }} />
                <div style={{ height: `${(v.guest / max) * 100}%`, background: "#4a5b6b" }} />
              </div>
              <span className="text-[9px] text-[var(--a-text3)]">{v.d}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] text-[var(--a-text3)]"><span className="text-pear">■</span> 회원 <span className="ml-2 text-[#4a5b6b]">■</span> 비회원</p>
      </div>
    </div>
  );
}

function Stores({ rows, onReview }: { rows: Overview["stores"]; onReview: (id: number, a: "approve" | "reject") => void }) {
  if (!rows.length) return <Empty>신청된 가게가 없어요.</Empty>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--a-text)]">{r.name} <span className="ml-1 rounded bg-[var(--a-chip)] px-1.5 py-0.5 text-[10px] font-bold text-pear">{BUCKET[r.bucket] || r.bucket}</span></p>
              <p className="mt-1 text-[12px] text-[var(--a-text2)]">{r.address || "주소 미입력"}</p>
              {r.summary && <p className="mt-1 text-[12px] text-[var(--a-text2)]">{r.summary}</p>}
              <p className="mt-1 text-[11px] text-[var(--a-text3)]">{r.at} · {r.nickname || "비회원"}{r.contact ? ` · ${r.contact}` : ""}</p>
            </div>
            <StatusTag status={r.status} />
          </div>
          {r.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => onReview(r.id, "approve")} className="inline-flex items-center gap-1 rounded-xl bg-pear px-3 py-1.5 text-[12px] font-bold text-[#2a1c06]"><Check className="size-3.5" />승인</button>
              <button onClick={() => onReview(r.id, "reject")} className="inline-flex items-center gap-1 rounded-xl border border-[var(--a-border2)] px-3 py-1.5 text-[12px] font-bold text-[var(--a-text2)]"><X className="size-3.5" />반려</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Creators({ rows, onReview }: { rows: Overview["creators"]; onReview: (id: number, a: "approve" | "reject") => void }) {
  if (!rows.length) return <Empty>크리에이터 신청이 없어요.</Empty>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--a-text)]">🧩 {r.nickname}</p>
              <div className="mt-1 space-y-0.5 text-[12px] text-[var(--a-link)]">
                {r.insta && <a href={r.insta} target="_blank" rel="noreferrer" className="block truncate underline">insta: {r.insta}</a>}
                {r.blog && <a href={r.blog} target="_blank" rel="noreferrer" className="block truncate underline">blog: {r.blog}</a>}
                {r.youtube && <a href={r.youtube} target="_blank" rel="noreferrer" className="block truncate underline">yt: {r.youtube}</a>}
              </div>
            </div>
            <StatusTag status={r.creator_status} />
          </div>
          {r.creator_status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => onReview(r.id, "approve")} className="inline-flex items-center gap-1 rounded-xl bg-pear px-3 py-1.5 text-[12px] font-bold text-[#2a1c06]"><Check className="size-3.5" />승인</button>
              <button onClick={() => onReview(r.id, "reject")} className="inline-flex items-center gap-1 rounded-xl border border-[var(--a-border2)] px-3 py-1.5 text-[12px] font-bold text-[var(--a-text2)]"><X className="size-3.5" />반려</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Feedback({ rows }: { rows: Overview["feedback"] }) {
  if (!rows.length) return <Empty>건의가 없어요.</Empty>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4">
          <p className="whitespace-pre-line text-[13px] text-[var(--a-text)]">{r.message}</p>
          <p className="mt-2 text-[11px] text-[var(--a-text3)]">{r.at} · {r.nickname || "비회원"}{r.contact ? ` · 📮 ${r.contact}` : ""}</p>
        </li>
      ))}
    </ul>
  );
}

function UsersPanel({ rows }: { rows: Overview["recentUsers"] }) {
  if (!rows.length) return <Empty>회원이 없어요.</Empty>;
  return (
    <ul className="divide-y divide-[var(--a-border)]">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between py-2.5">
          <span className="text-[13.5px] font-bold text-[var(--a-text)]">🧩 {r.nickname}</span>
          <span className="text-[11px] text-[var(--a-text3)]">{r.at}{r.creator_status === "approved" ? " · ⭐크리에이터" : ""}</span>
        </li>
      ))}
    </ul>
  );
}

function InstaPanel() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; c: string; d: string; url: string }[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<{ place_id: string; name: string; url: string; at: string }[]>([]);

  const loadLinks = useCallback(async () => {
    const d = await fetch("/api/admin/insta").then((r) => r.json());
    setLinks(d.links || []);
  }, []);
  useEffect(() => { void loadLinks(); }, [loadLinks]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const d = await fetch("/api/admin/search-place?q=" + encodeURIComponent(q.trim())).then((r) => r.json());
    setResults(d.results || []);
    const dr: Record<string, string> = {};
    for (const r of d.results || []) dr[r.id] = r.url || "";
    setDraft(dr);
  }
  async function save(id: string, name: string) {
    const url = (draft[id] || "").trim();
    if (!url) return;
    await fetch("/api/admin/insta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId: id, name, url }) });
    await loadLinks();
    setResults((rs) => rs.map((x) => (x.id === id ? { ...x, url } : x)));
  }
  async function del(placeId: string) {
    await fetch("/api/admin/insta?placeId=" + encodeURIComponent(placeId), { method: "DELETE" });
    await loadLinks();
  }

  return (
    <div className="space-y-5">
      <p className="text-[12.5px] text-[var(--a-text2)]">가게 이름으로 검색해서 인스타를 연결하세요. (코드를 몰라도 됩니다)</p>
      <form onSubmit={search} className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2.5">
          <Search className="size-4 text-[var(--a-text3)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="가게 이름 (예: 이화림)"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--a-text)] outline-none placeholder:text-[var(--a-text3)]" />
        </div>
        <button type="submit" className="rounded-xl bg-pear px-4 text-[13px] font-bold text-[#2a1c06]">검색</button>
      </form>

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id} className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-3">
              <p className="text-[13.5px] font-bold text-[var(--a-text)]">{r.name} <span className="text-[11px] text-[var(--a-text3)]">{r.d}</span>{r.url && <span className="ml-1 text-[10px] text-emerald-400">● 연결됨</span>}</p>
              <div className="mt-2 flex gap-2">
                <input value={draft[r.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                  placeholder="instagram.com/..." className="min-w-0 flex-1 rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] px-3 py-2 text-[12.5px] text-[var(--a-link)] outline-none" />
                <button onClick={() => save(r.id, r.name)} className="rounded-lg bg-pear px-3 text-[12px] font-bold text-[#2a1c06]">저장</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-2 text-[12.5px] font-bold text-[var(--a-text2)]">연결된 인스타 ({links.length})</p>
        {links.length === 0 ? (
          <Empty>아직 연결된 가게가 없어요. 위에서 검색해 추가하세요.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {links.map((l) => (
              <li key={l.place_id} className="flex items-center gap-2 rounded-xl border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--a-text)]">{l.name || l.place_id}</p>
                  <a href={l.url} target="_blank" rel="noreferrer" className="block truncate text-[11px] text-[var(--a-link)] underline">{l.url}</a>
                </div>
                <button onClick={() => del(l.place_id)} className="text-[var(--a-text3)] hover:text-red-400"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type JournalPiece = {
  id: number; place_name: string; address: string; lat: number | null; lng: number | null;
  photo_urls: string[]; insta_url: string; memo: string; at: number;
};

function JournalPanel() {
  const [pieces, setPieces] = useState<JournalPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; at: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/journal").then((r) => r.json()).catch(() => ({}));
    setPieces(d.pieces || []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function del(id: number) {
    if (typeof window !== "undefined" && !window.confirm("이 조각을 삭제할까요?")) return;
    await fetch("/api/admin/journal?id=" + id, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-bold text-[var(--a-text2)]">직접 남긴 조각 ({pieces.length})</p>
        <Link href="/pieceadmin/journal" className="inline-flex items-center gap-1 rounded-xl bg-pear px-3 py-1.5 text-[12px] font-bold text-[#2a1c06]">
          <Plus className="size-3.5" />새로 등록
        </Link>
      </div>
      {loading ? (
        <Empty>불러오는 중…</Empty>
      ) : pieces.length === 0 ? (
        <Empty>아직 남긴 조각이 없어요. &quot;새로 등록&quot;에서 휴대폰으로 바로 추가해보세요.</Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {pieces.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)]">
              <button type="button" onClick={() => p.photo_urls.length && setLightbox({ images: p.photo_urls, at: 0 })}
                className="relative grid aspect-square w-full place-items-center overflow-hidden bg-[var(--a-input)]">
                {p.photo_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_urls[0]} alt={p.place_name} className="size-full object-cover" />
                ) : (
                  <InstaGlyph className="size-8 text-[var(--a-text3)]" />
                )}
                {p.photo_urls.length > 1 && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    +{p.photo_urls.length - 1}
                  </span>
                )}
              </button>
              <div className="p-2.5">
                <p className="truncate text-[12.5px] font-bold text-[var(--a-text)]">{p.place_name}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-[var(--a-text3)]">
                  <MapPin className="size-3 shrink-0" />{p.address || "주소 없음"}
                </p>
                {p.memo && <p className="mt-1 line-clamp-2 text-[11px] text-[var(--a-text2)]">{p.memo}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  {p.insta_url && (
                    <a href={p.insta_url} target="_blank" rel="noreferrer" className="text-[10.5px] font-bold text-[var(--a-link)] underline">릴스 보기</a>
                  )}
                  <button onClick={() => del(p.id)} className="ml-auto text-[var(--a-text3)] hover:text-red-400"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.at} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

type AdminEvent = CultureEvent & { published?: boolean; sortOrder?: number };
const EMPTY_DRAFT = {
  id: "", title: "", emoji: "🎉", badge: "", color: "#c9821f", period: "", start: "", end: "",
  time: "", place: "", audience: "", summary: "", highlights: "", pickNote: "", host: "",
  contact: "", link: "", image: "", published: true,
};
type Draft = typeof EMPTY_DRAFT;

function CulturePanel() {
  const [list, setList] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/culture");
    const d = await r.json().catch(() => ({}));
    setList(d.events || []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const set = (k: keyof Draft, v: string | boolean) => setDraft((p) => ({ ...p, [k]: v }));
  function reset() { setDraft({ ...EMPTY_DRAFT }); setEditing(false); }
  function edit(e: AdminEvent) {
    setEditing(true);
    setDraft({
      id: e.id, title: e.title, emoji: e.emoji, badge: e.badge, color: e.color,
      period: e.period, start: e.start || "", end: e.end || "", time: e.time || "",
      place: e.place, audience: e.audience || "", summary: e.summary,
      highlights: (e.highlights || []).join("\n"), pickNote: e.pickNote || "",
      host: e.host || "", contact: e.contact || "", link: e.link || "", image: e.image || "",
      published: e.published !== false,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!draft.title.trim()) { setMsg("제목을 입력하세요"); return; }
    const body = {
      ...draft,
      highlights: draft.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
      start: draft.start || undefined, end: draft.end || undefined,
    };
    const r = await fetch("/api/admin/culture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!d.ok) { setMsg(d.error || "저장 실패"); return; }
    setMsg("저장됐어요 ✓"); reset(); await load();
  }
  async function seed() {
    const r = await fetch("/api/admin/culture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: true }) });
    const d = await r.json().catch(() => ({}));
    setMsg(d.ok ? `기본 ${d.seeded}건 불러왔어요 ✓` : "실패"); await load();
  }
  async function togglePub(e: AdminEvent) {
    await fetch("/api/admin/culture", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: e.id, published: e.published === false }) });
    await load();
  }
  async function del(id: string) {
    if (typeof window !== "undefined" && !window.confirm("이 이벤트를 삭제할까요?")) return;
    await fetch("/api/admin/culture?id=" + encodeURIComponent(id), { method: "DELETE" });
    await load();
  }

  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      {/* 추가/수정 폼 */}
      <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-4">
        <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-pear">
          {editing ? <>✏️ 이벤트 수정</> : <><Plus className="size-4" /> 새 이벤트</>}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <CInput label="제목 *" value={draft.title} onChange={(v) => set("title", v)} full />
          <CInput label="이모지" value={draft.emoji} onChange={(v) => set("emoji", v)} />
          <CInput label="배지(예: 관광객 혜택)" value={draft.badge} onChange={(v) => set("badge", v)} />
          <CInput label="기간 표시(예: 2026.6.1~6.30)" value={draft.period} onChange={(v) => set("period", v)} full />
          <CInput label="시작일" type="date" value={draft.start} onChange={(v) => set("start", v)} />
          <CInput label="종료일" type="date" value={draft.end} onChange={(v) => set("end", v)} />
          <CInput label="시간(예: 오후 4시)" value={draft.time} onChange={(v) => set("time", v)} />
          <CInput label="색상" type="color" value={draft.color} onChange={(v) => set("color", v)} />
          <CInput label="장소" value={draft.place} onChange={(v) => set("place", v)} full />
          <CInput label="대상(예: 관광객, 시민 제외)" value={draft.audience} onChange={(v) => set("audience", v)} full />
          <CInput label="요약" value={draft.summary} onChange={(v) => set("summary", v)} full textarea />
          <CInput label="하이라이트 (한 줄에 하나)" value={draft.highlights} onChange={(v) => set("highlights", v)} full textarea />
          <CInput label="🧩 큐레이션 한마디(선택)" value={draft.pickNote} onChange={(v) => set("pickNote", v)} full textarea />
          <CInput label="주최/주관" value={draft.host} onChange={(v) => set("host", v)} />
          <CInput label="문의" value={draft.contact} onChange={(v) => set("contact", v)} />
          <CInput label="자세히 보기 링크" value={draft.link} onChange={(v) => set("link", v)} full />
          <CInput label="이미지 URL(선택)" value={draft.image} onChange={(v) => set("image", v)} full />
        </div>
        <label className="mt-3 flex items-center gap-2 text-[12.5px] font-bold text-[var(--a-text2)]">
          <input type="checkbox" checked={draft.published} onChange={(e) => set("published", e.target.checked)} className="size-4 accent-pear" />
          바로 발행(앱에 노출)
        </label>
        {msg && <p className="mt-2 text-[12px] font-semibold text-emerald-300">{msg}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={save} className="rounded-xl bg-pear px-4 py-2 text-[13px] font-extrabold text-[#2a1c06]">{editing ? "수정 저장" : "추가"}</button>
          {editing && <button onClick={reset} className="rounded-xl border border-[var(--a-border2)] px-4 py-2 text-[13px] font-bold text-[var(--a-text2)]">취소</button>}
        </div>
      </div>

      {/* 목록 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] font-bold text-[var(--a-text2)]">등록된 이벤트 ({list.length})</p>
          {list.length === 0 && !loading && (
            <button onClick={seed} className="rounded-xl border border-pear/40 bg-pear/10 px-3 py-1.5 text-[12px] font-bold text-pear">기본 이벤트 불러오기</button>
          )}
        </div>
        {loading ? (
          <Empty>불러오는 중…</Empty>
        ) : list.length === 0 ? (
          <Empty>아직 이벤트가 없어요. ‘기본 이벤트 불러오기’로 시작하거나 위에서 추가하세요.</Empty>
        ) : (
          <ul className="space-y-2">
            {list.map((e) => {
              const past = e.end ? e.end < today : false;
              return (
                <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[17px]" style={{ background: `${e.color}22` }}>{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[var(--a-text)]">{e.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--a-text3)]">📅 {e.period || "-"} · 📍 {e.place || "-"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.published === false ? "bg-[var(--a-chip)] text-[var(--a-text2)]" : "bg-emerald-500/20 text-emerald-300"}`}>{e.published === false ? "미발행" : "발행중"}</span>
                      {past && <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-300">지난 일정</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button onClick={() => edit(e)} className="rounded-lg border border-[var(--a-border2)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--a-text2)]">수정</button>
                    <button onClick={() => togglePub(e)} title={e.published === false ? "발행" : "숨김"} className="grid place-items-center rounded-lg border border-[var(--a-border2)] px-2.5 py-1 text-[var(--a-text2)]">{e.published === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                    <button onClick={() => del(e.id)} className="grid place-items-center rounded-lg border border-[var(--a-border2)] px-2.5 py-1 text-[var(--a-text3)] hover:text-red-400"><Trash2 className="size-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CInput({ label, value, onChange, full, textarea, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; full?: boolean; textarea?: boolean; type?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-[11px] font-bold text-[var(--a-text3)]">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full resize-y rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] px-3 py-2 text-[12.5px] text-[var(--a-text)] outline-none focus:border-pear/60" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] px-3 py-2 text-[12.5px] text-[var(--a-text)] outline-none focus:border-pear/60 ${type === "color" ? "h-9 p-1" : ""}`} />
      )}
    </label>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { t: string; c: string }> = {
    pending: { t: "대기", c: "bg-yellow-500/20 text-yellow-300" },
    approved: { t: "승인", c: "bg-emerald-500/20 text-emerald-300" },
    rejected: { t: "반려", c: "bg-red-500/20 text-red-300" },
  };
  const m = map[status] || map.pending;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${m.c}`}>{m.t}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-[13px] text-[var(--a-text3)]">{children}</p>;
}
