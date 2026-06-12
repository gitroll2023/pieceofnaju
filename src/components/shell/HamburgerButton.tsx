"use client";

import { Menu } from "lucide-react";
import { openMenu } from "@/lib/useMenu";

// 전 탭 공통 햄버거 — 누르면 사이드 드로어 열림
export default function HamburgerButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openMenu}
      aria-label="메뉴 열기"
      className={`grid size-9 shrink-0 place-items-center rounded-full border border-line bg-card text-ink transition active:scale-90 ${className}`}
    >
      <Menu className="size-5" strokeWidth={2} />
    </button>
  );
}
