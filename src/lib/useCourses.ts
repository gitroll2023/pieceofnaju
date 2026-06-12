"use client";

import { useSyncExternalStore, useCallback } from "react";
import { addStamp } from "./useStamps";

export interface CourseStop {
  placeId: string | null;
  n: string;
  c: string; // 카테고리(food/cafe/문화재 등)
  lat: number | null;
  lng: number | null;
  t?: string;
  time?: string;
  note?: string;
  done: boolean;
  doneAt?: number;
}
export interface SavedCourse {
  id: string;
  title: string;
  theme: string;
  origin: "seed" | "mine" | "received" | "ai";
  items: CourseStop[];
  createdAt: number;
}

const KEY = "naju.courses.v1";
const EMPTY: SavedCourse[] = [];

function load(): SavedCourse[] {
  if (typeof window === "undefined") return EMPTY;
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return EMPTY; }
}

let courses: SavedCourse[] = load();
const listeners = new Set<() => void>();
function commit(next: SavedCourse[]) {
  courses = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

// ── 로그인 시 서버 동기화 훅(useAuth가 연결) ──
let upsertFn: ((c: SavedCourse) => void) | null = null;
let removeFn: ((id: string) => void) | null = null;
export function setCoursePush(up: ((c: SavedCourse) => void) | null, rm: ((id: string) => void) | null) {
  upsertFn = up; removeFn = rm;
}
export function getCoursesRaw() { return courses; }
/** 서버 코스를 로컬에 합침(중복 id 제외) */
export function mergeServerCourses(server: SavedCourse[]) {
  const ids = new Set(courses.map((c) => c.id));
  const add = server.filter((c) => c.id && !ids.has(c.id));
  if (add.length) commit([...courses, ...add]);
}

export function saveCourse(c: SavedCourse) {
  if (courses.some((x) => x.id === c.id)) return;
  commit([...courses, c]);
  upsertFn?.(c);
}
export function removeCourse(id: string) {
  commit(courses.filter((c) => c.id !== id));
  removeFn?.(id);
}
export function clearCourses() { commit([]); }

/** stop 체크인 토글. 체크인(완료 전환) 시 일반 조각 자동 적립. */
export function checkInStop(courseId: string, idx: number) {
  const cur = courses.find((x) => x.id === courseId);
  if (!cur) return;
  const wasDone = cur.items[idx]?.done;
  commit(
    courses.map((x) =>
      x.id !== courseId
        ? x
        : { ...x, items: x.items.map((it, i) => (i === idx ? { ...it, done: !it.done, doneAt: !it.done ? Date.now() : undefined } : it)) },
    ),
  );
  if (!wasDone) {
    const it = cur.items[idx];
    addStamp({ id: it.placeId || `course_${courseId}_${idx}`, n: it.n, c: it.c, d: "", lat: it.lat ?? undefined, lng: it.lng ?? undefined, t: it.t });
  }
  // 체크인 상태도 서버에 반영
  const updated = courses.find((x) => x.id === courseId);
  if (updated) upsertFn?.(updated);
}

export function useCourses() {
  const list = useSyncExternalStore(subscribe, () => courses, () => EMPTY);
  const has = useCallback((id: string) => list.some((c) => c.id === id), [list]);
  return { courses: list, has, save: saveCourse, remove: removeCourse, checkIn: checkInStop, count: list.length };
}
