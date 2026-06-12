"use client";

import { useSyncExternalStore, useCallback } from "react";

// 내가 모은 "나주 한조각" — localStorage 기반(백엔드 없음), 전 컴포넌트 동기화
export interface Stamp {
  id: string;
  n: string; // 상호/장소명
  c: string; // 카테고리 키
  d: string; // 동
  at: number; // 수집 시각
  lat?: number;
  lng?: number;
  t?: string; // 업종/분류 라벨
  memo?: string; // 나만 보는 메모(100자)
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

// ── 로그인 시 서버 동기화 훅(useAuth가 연결). 비회원이면 null이라 영향 없음 ──
let pushFn: ((s: Stamp, added: boolean) => void) | null = null;
export function setStampPush(fn: ((s: Stamp, added: boolean) => void) | null) {
  pushFn = fn;
}
let memoPushFn: ((s: Stamp) => void) | null = null;
export function setMemoPush(fn: ((s: Stamp) => void) | null) {
  memoPushFn = fn;
}
export function getStampsRaw(): Stamp[] {
  return stamps;
}
/** 서버에서 받은 조각을 로컬에 합침(중복 제외) */
export function mergeServerStamps(server: Stamp[]) {
  const ids = new Set(stamps.map((s) => s.id));
  const add = server.filter((s) => s.id && !ids.has(s.id));
  if (add.length) commit([...stamps, ...add]);
}

export interface StampInput {
  id: string;
  n: string;
  c: string;
  d: string;
  lat?: number;
  lng?: number;
  t?: string;
}

/** 단건 추가(중복이면 무시) + 서버 동기화 — 코스 체크인 시 자동 적립용 */
export function addStamp(m: StampInput) {
  if (stamps.some((s) => s.id === m.id)) return;
  const stamp: Stamp = { id: m.id, n: m.n, c: m.c, d: m.d, at: Date.now(), lat: m.lat, lng: m.lng, t: m.t };
  commit([...stamps, stamp]);
  pushFn?.(stamp, true);
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
    const stamp: Stamp = { id: m.id, n: m.n, c: m.c, d: m.d, at: Date.now(), lat: m.lat, lng: m.lng, t: m.t };
    commit(exists ? stamps.filter((s) => s.id !== m.id) : [...stamps, stamp]);
    // 로그인 상태면 서버에도 반영(낙관적, 실패해도 UI 영향 없음)
    pushFn?.(stamp, !exists);
  }, []);

  const clear = useCallback(() => commit([]), []);

  const setMemo = useCallback((id: string, memo: string) => {
    const m = (memo || "").slice(0, 100);
    if (!stamps.some((s) => s.id === id)) return;
    let updated: Stamp | null = null;
    commit(stamps.map((s) => (s.id === id ? (updated = { ...s, memo: m }) : s)));
    if (updated) memoPushFn?.(updated); // 로그인 시 서버 반영
  }, []);

  return { stamps: list, has, toggle, clear, setMemo, count: list.length };
}
