"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { login, signup } from "@/lib/useAuth";

export default function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nick, setNick] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        const res = await login(nick.trim(), pw, remember);
        if (res?.admin) { window.location.href = "/pieceadmin"; return; } // 관리자 → 대시보드로
      } else {
        await signup(nick.trim(), pw, remember);
      }
      onClose();
      setNick(""); setPw("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 후 다시 시도해주세요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
      <div onClick={(e) => e.stopPropagation()}
        className="animate-rise relative w-full max-w-[480px] rounded-t-3xl border-t border-line bg-card p-5 pb-7 shadow-[0_-12px_32px_-12px_rgba(31,28,24,0.5)]">
        <button type="button" onClick={onClose} aria-label="닫기"
          className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-muted text-ink-soft">
          <X className="size-4" />
        </button>

        <p className="text-[11.5px] font-bold tracking-wide text-pear-deep">나주한조각</p>
        <h2 className="brand-serif mt-0.5 text-[22px] font-extrabold text-ink">
          {mode === "login" ? "다시 오셨네요" : "조각, 함께 모아요"}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
          {mode === "login" ? "기기가 바뀌어도 내 조각을 이어가요." : "닉네임·비밀번호만 있으면 끝. 실명·생년월일·이메일은 받지 않아요."}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-2.5">
          <input value={nick} onChange={(e) => setNick(e.target.value)} autoComplete="username"
            placeholder="닉네임 (2~20자)" inputMode="text"
            className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-[14px] text-ink outline-none focus:border-pear/60 focus:ring-2 focus:ring-pear/20" />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "signup" ? "비밀번호 (8자+ 영문·숫자·특수문자)" : "비밀번호"}
            className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-[14px] text-ink outline-none focus:border-pear/60 focus:ring-2 focus:ring-pear/20" />
          {mode === "signup" && (
            <p className="px-1 text-[11px] leading-relaxed text-ink-soft/80">
              8자 이상 · 영문 · 숫자 · 특수문자(!@#$%^&) 포함. <b className="text-hongeo/90">비밀번호는 복구할 수 없으니 꼭 기억해주세요.</b>
            </p>
          )}
          {err && <p className="px-1 text-[12px] font-semibold text-hongeo">{err}</p>}
          <label className="flex items-center gap-2 px-1 py-0.5 text-[12.5px] font-semibold text-ink-soft">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-river" />
            자동 로그인
            <span className="text-[11px] font-normal text-ink-soft/70">· 공공장소에선 해제하세요</span>
          </label>
          <button type="submit" disabled={busy}
            className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-extrabold text-background transition active:scale-[0.98] disabled:opacity-50">
            {busy ? "잠시만요…" : mode === "login" ? "로그인" : "가입하고 시작"}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-[12.5px]">
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}
            className="font-bold text-river">
            {mode === "login" ? "처음이세요? 가입하기" : "이미 있어요? 로그인"}
          </button>
          <Link href="/privacy" className="text-ink-soft/70 underline underline-offset-2" onClick={onClose}>
            개인정보처리방침
          </Link>
        </div>
      </div>
    </div>
  );
}
