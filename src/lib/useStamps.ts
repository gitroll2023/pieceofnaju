"use client";

import { useSyncExternalStore, useCallback } from "react";

// 내가 모은 "나주 한조각" — localStorage 기반(백엔드 없음), 전 컴포넌트 동기화
export interface Stamp {
  id: string;
  n: string; // 상호/장소명
  c: string; // 카테고리 키
  d: string; // 동
  at: number; // 수집 시각
}

const KEY = "naju-stamps-v1";
const EMPTY: Stamp[] = [];

function load(): Stamp[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return EMPTY;
  }
}

let stamps: Stamp[] = load();
const listeners = new Set<() => void>();

function commit(next: Stamp[]) {
  stamps = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export interface StampInput {
  id: string;
  n: string;
  c: string;
  d: string;
}

export function useStamps() {
  const list = useSyncExternalStore(
    subscribe,
    () => stamps,
    () => EMPTY,
  );

  const has = useCallback((id: string) => list.some((s) => s.id === id), [list]);

  const toggle = useCallback((m: StampInput) => {
    const exists = stamps.some((s) => s.id === m.id);
    commit(
      exists
        ? stamps.filter((s) => s.id !== m.id)
        : [...stamps, { id: m.id, n: m.n, c: m.c, d: m.d, at: Date.now() }],
    );
  }, []);

  const clear = useCallback(() => commit([]), []);

  return { stamps: list, has, toggle, clear, count: list.length };
}
