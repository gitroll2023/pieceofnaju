"use client";

// 사이드 드로어 열림상태 — 전 탭(발견/추천/내조각) 헤더에서 열고 셸에서 렌더.
// useAuth와 동일한 모듈스코프 store + useSyncExternalStore 패턴.
import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const openMenu = () => { if (!open) { open = true; emit(); } };
export const closeMenu = () => { if (open) { open = false; emit(); } };
export const toggleMenu = () => { open = !open; emit(); };

export function useMenuOpen() {
  return useSyncExternalStore(subscribe, () => open, () => false);
}
