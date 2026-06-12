"use client";

import { useEffect, useRef, useState, type PointerEvent as RPE } from "react";
import Link from "next/link";
import { X, LogIn, LogOut, MessageCircleQuestion, Store, Lightbulb, CalendarPlus, Moon, Sun, ChevronRight, BookHeart, ExternalLink, Wrench } from "lucide-react";
import { useMenuOpen, closeMenu } from "@/lib/useMenu";
import { useAuth } from "@/lib/useAuth";
import { useStamps } from "@/lib/useStamps";
import { clearCourses } from "@/lib/useCourses";
import { openAuth, closeAuth, useAuthPromptOpen } from "@/lib/useAuthPrompt";
import AuthSheet from "@/components/account/AuthSheet";
import ContactSheet, { type ContactMode } from "./ContactSheet";
import InstaGlyph from "@/components/ui/InstaGlyph";

const INSTA = "https://instagram.com/piece_of_naju";

function joinedLabel(iso?: string) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${y}년 ${Number(m)}월부터 함께 🧩`;
}

export default function SideMenu() {
  const open = useMenuOpen();
  const authOpen = useAuthPromptOpen();
  const { user, logout, deleteAccount } = useAuth();
  const { clear } = useStamps();
  const [contact, setContact] = useState<ContactMode | null>(null);
  const [admin, setAdmin] = useState(false);
  const [dark, setDark] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  // 열 때 현재 테마 + 관리자 여부 동기화
  useEffect(() => {
    if (!open) return;
    setDark(document.documentElement.classList.contains("dark"));
    fetch("/api/admin/check").then((r) => r.json()).then((d) => setAdmin(!!d.admin)).catch(() => {});
  }, [open]);

  // 열림 중 본문 스크롤 잠금 + Esc 닫기
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("naju.theme", next ? "dark" : "light"); } catch {}
  }

  async function onDelete() {
    if (typeof window !== "undefined" && !window.confirm("정말 탈퇴할까요? 내 조각·코스가 모두 삭제되고 되돌릴 수 없어요.")) return;
    try { await deleteAccount(); clear(); clearCourses(); closeMenu(); } catch {}
  }

  // 왼쪽으로 스와이프하면 닫기
  const onDown = (e: RPE<HTMLDivElement>) => { dragging.current = true; startX.current = e.clientX; };
  const onMove = (e: RPE<HTMLDivElement>) => { if (dragging.current) setDragX(Math.min(0, e.clientX - startX.current)); };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX < -80) closeMenu();
    setDragX(0);
  };

  return (
    <>
      {/* 배경 */}
      <div
        onClick={closeMenu}
        aria-hidden
        className="fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />

      {/* 480 셸 정렬 레인 — 닫힌 드로어가 데스크톱 프레임 바깥으로 새지 않게 클립 */}
      <div className="pointer-events-none fixed inset-y-0 left-1/2 z-[70] w-full max-w-[480px] -translate-x-1/2 overflow-hidden">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="전체 메뉴"
          className="pointer-events-auto absolute inset-y-0 left-0 flex w-[84%] max-w-[330px] flex-col border-r border-line bg-background shadow-[12px_0_40px_-12px_rgba(31,28,24,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: open ? `translateX(${dragX}px)` : "translateX(-100%)", transition: dragging.current ? "none" : undefined }}
        >
          {/* 스와이프 감지 영역(헤더 전체) */}
          <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className="touch-pan-y">
            <header className="paper-grain relative overflow-hidden px-5 pb-5 pt-7">
              <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "linear-gradient(150deg, var(--naju-cream) 0%, var(--background) 72%)" }} />
              <button type="button" onClick={closeMenu} aria-label="닫기" className="absolute right-4 top-5 grid size-8 place-items-center rounded-full border border-line bg-card text-ink-soft active:scale-90">
                <X className="size-4" />
              </button>
              <p className="text-[11.5px] font-bold tracking-wide text-pear-deep">나주를 한 조각씩</p>
              <h2 className="brand-serif mt-1 text-[24px] font-extrabold leading-tight text-ink">나주한조각</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">발로 모은 나주 로컬 가이드.<br />맛집·카페·관광지를 한 조각씩.</p>
            </header>
          </div>

          {/* 스크롤 본문 */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
            {/* 계정 */}
            {user ? (
              <div className="rounded-2xl border border-line bg-card p-4">
                <p className="brand-serif text-[17px] font-extrabold text-ink">🧩 {user.nickname}</p>
                {joinedLabel(user.joined) && <p className="mt-0.5 text-[12px] text-ink-soft">{joinedLabel(user.joined)}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <Link href="/pieces" onClick={closeMenu} className="inline-flex items-center gap-1 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-bold text-background active:scale-95">내 조각 보기</Link>
                  <button type="button" onClick={() => { logout(); }} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12px] font-bold text-ink-soft active:scale-95">
                    <LogOut className="size-3.5" />로그아웃
                  </button>
                </div>
                <button type="button" onClick={onDelete} className="mt-2.5 text-[11px] text-ink-soft/50 underline underline-offset-2">회원 탈퇴</button>
              </div>
            ) : (
              <button type="button" onClick={() => { closeMenu(); openAuth(); }}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-4 text-left active:scale-[0.99]">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pear/15 text-pear-deep"><LogIn className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-extrabold text-ink">로그인하고 내 조각 모으기</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">닉네임과 비밀번호만 있으면 돼요.</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-soft/50" />
              </button>
            )}

            {/* 관리자 — 관리자 세션일 때만 */}
            {admin && (
              <Link href="/pieceadmin" onClick={closeMenu}
                className="mt-3 flex items-center gap-3 rounded-2xl border border-pear/40 bg-pear/10 p-4 active:scale-[0.99]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pear/20 text-pear-deep"><Wrench className="size-[18px]" /></span>
                <span className="flex-1 text-[14px] font-extrabold text-ink">관리자 페이지</span>
                <ChevronRight className="size-4 shrink-0 text-ink-soft/50" />
              </Link>
            )}

            {/* 메뉴 */}
            <nav className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
              <Row icon={<BookHeart className="size-[18px]" />} label="나주한조각 이야기" desc="이 페이지를 왜 만들었냐면" href="/about" />
              <Row icon={<InstaGlyph className="size-[17px]" />} label="인스타 가기" desc="@piece_of_naju" href={INSTA} external />
              <Row icon={<MessageCircleQuestion className="size-[18px]" />} label="문의하기" desc="궁금한 점은 편하게" onClick={() => { closeMenu(); setContact("contact"); }} />
              <Row icon={<Store className="size-[18px]" />} label="가게 제보하기" desc="빠진 가게·숨은 장소 알려주기" onClick={() => { closeMenu(); setContact("report"); }} />
              <Row icon={<CalendarPlus className="size-[18px]" />} label="지역 행사 알리기" desc="나주 행사를 추가해 달라고" onClick={() => { closeMenu(); setContact("event"); }} />
              <Row icon={<Lightbulb className="size-[18px]" />} label="건의하기" desc="이렇게 바뀌면 좋겠다" onClick={() => { closeMenu(); setContact("suggest"); }} last />
            </nav>

            {/* 다크 모드 */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
              <span className="grid size-9 place-items-center rounded-full bg-muted text-ink-soft">{dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}</span>
              <span className="flex-1 text-[14px] font-bold text-ink">다크 모드</span>
              <button type="button" onClick={toggleDark} role="switch" aria-checked={dark} aria-label="다크 모드 전환"
                className="relative h-6 w-11 rounded-full transition-colors" style={{ background: dark ? "var(--naju-river)" : "var(--naju-line)" }}>
                <span className="absolute top-0.5 size-5 rounded-full bg-white shadow transition-all" style={{ left: dark ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>

            {/* 하단 */}
            <div className="mt-6 px-1">
              <Link href="/about" onClick={closeMenu} className="text-[12px] font-bold text-river">나주한조각은 어떤 곳인가요? →</Link>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-soft/60">
                나주시·지자체가 아니라 인스타그램 @piece_of_naju가 만드는 나주 큐레이션이에요.
              </p>
              <p className="mt-1.5 text-[10.5px] text-ink-soft/45">© 나주한조각</p>
            </div>
          </div>
        </aside>
      </div>

      <AuthSheet open={authOpen} onClose={closeAuth} />
      <ContactSheet mode={contact} onClose={() => setContact(null)} />
    </>
  );
}

function Row({ icon, label, desc, href, external, onClick, last }: {
  icon: React.ReactNode; label: string; desc?: string; href?: string; external?: boolean; onClick?: () => void; last?: boolean;
}) {
  const inner = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-ink-soft">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink">{label}</span>
        {desc && <span className="mt-0.5 block truncate text-[11.5px] text-ink-soft">{desc}</span>}
      </span>
      {external ? <ExternalLink className="size-4 shrink-0 text-ink-soft/45" /> : <ChevronRight className="size-4 shrink-0 text-ink-soft/45" />}
    </>
  );
  const cls = `flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-muted/60 ${last ? "" : "border-b border-line/70"}`;
  if (href && external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className={cls}>{inner}</a>;
  }
  if (href) {
    return <Link href={href} onClick={closeMenu} className={cls}>{inner}</Link>;
  }
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}
