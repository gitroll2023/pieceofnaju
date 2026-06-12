"use client";

// 전역 로그인 시트 — 조각 버튼·드로어 등 어디서든 로그인 유도.
import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const openAuth = () => { if (!open) { open = true; emit(); } };
export const closeAuth = () => { if (open) { open = false; emit(); } };

export function useAuthPromptOpen() {
  return useSyncExternalStore(subscribe, () => open, () => false);
}
