"use client";

import { useSyncExternalStore, useEffect, useCallback } from "react";
import { getStampsRaw, mergeServerStamps, setStampPush, setMemoPush, type Stamp } from "./useStamps";
import { getCoursesRaw, mergeServerCourses, setCoursePush, type SavedCourse } from "./useCourses";

export interface AuthUser {
  nickname: string;
  bio?: string;
  insta?: string;
  blog?: string;
  youtube?: string;
  joined?: string; // 가입일 YYYY-MM-DD (/api/auth/me)
}

const USER_KEY = "naju.user.v1";

let user: AuthUser | null = null;
let ready = false; // /api/auth/me 1회 확인 완료
let synced = false; // 조각 병합 1회 완료(매번 재호출 금지)
let coursesSynced = false; // 코스 병합 1회 완료
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function cache(u: AuthUser | null) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

const rowToStamp = (r: Record<string, unknown>): Stamp => ({
  id: String(r.piece_id),
  n: String(r.name ?? ""),
  c: String(r.cat ?? ""),
  d: String(r.dong ?? ""),
  at: Number(r.at) || Date.now(),
  lat: r.lat == null ? undefined : Number(r.lat),
  lng: r.lng == null ? undefined : Number(r.lng),
  t: String(r.label ?? ""),
  memo: String(r.memo ?? ""),
});
const stampToBody = (s: Stamp) => ({
  id: s.id, n: s.n, c: s.c, d: s.d, lat: s.lat, lng: s.lng, t: s.t, memo: s.memo || "",
  kind: s.c === "spot" ? "spot" : "merchant",
});

// toggle 시 서버 반영(낙관적)
function pushStamp(s: Stamp, added: boolean) {
  if (!user) return;
  if (added) {
    fetch("/api/pieces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stampToBody(s)) }).catch(() => {});
  } else {
    fetch(`/api/pieces?pieceId=${encodeURIComponent(s.id)}`, { method: "DELETE" }).catch(() => {});
  }
}
// 메모 수정 시 서버 반영
function pushMemo(s: Stamp) {
  if (!user) return;
  fetch("/api/pieces", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pieceId: s.id, memo: s.memo || "" }) }).catch(() => {});
}
// 코스 저장/갱신·삭제 서버 반영
function pushCourseUpsert(c: SavedCourse) {
  if (!user) return;
  fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) }).catch(() => {});
}
function pushCourseRemove(id: string) {
  if (!user) return;
  fetch(`/api/courses?courseId=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
}

// 로그인 후 1회: 서버 조각 ↔ 로컬 병합(서버→로컬 합치고, 로컬 전용은 서버로 업로드)
async function syncPiecesOnce() {
  if (synced || !user) return;
  synced = true;
  try {
    const d = await fetch("/api/pieces").then((r) => r.json());
    const server: Stamp[] = (d.pieces || []).map(rowToStamp);
    const serverIds = new Set(server.map((s) => s.id));
    const localOnly = getStampsRaw().filter((s) => !serverIds.has(s.id));
    mergeServerStamps(server);
    await Promise.allSettled(
      localOnly.map((s) =>
        fetch("/api/pieces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stampToBody(s)) }),
      ),
    );
  } catch {
    synced = false; // 실패 시 다음 기회에 재시도 허용
  }
}

const rowToCourse = (r: Record<string, unknown>): SavedCourse => ({
  id: String(r.course_id),
  title: String(r.title ?? ""),
  theme: String(r.theme ?? "local"),
  origin: (String(r.origin ?? "mine") as SavedCourse["origin"]),
  items: Array.isArray(r.items) ? (r.items as SavedCourse["items"]) : [],
  createdAt: Number(r.at) || Date.now(),
});

// 로그인 후 1회: 서버 코스 ↔ 로컬 병합
async function syncCoursesOnce() {
  if (coursesSynced || !user) return;
  coursesSynced = true;
  try {
    const d = await fetch("/api/courses").then((r) => r.json());
    const server: SavedCourse[] = (d.courses || []).map(rowToCourse);
    const serverIds = new Set(server.map((c) => c.id));
    const localOnly = getCoursesRaw().filter((c) => !serverIds.has(c.id));
    mergeServerCourses(server);
    await Promise.allSettled(
      localOnly.map((c) => fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) })),
    );
  } catch {
    coursesSynced = false;
  }
}

function applyUser(u: AuthUser | null) {
  user = u;
  cache(u);
  if (u) {
    setStampPush(pushStamp);
    setMemoPush(pushMemo);
    setCoursePush(pushCourseUpsert, pushCourseRemove);
    void syncPiecesOnce();
    void syncCoursesOnce();
  } else {
    setStampPush(null);
    setMemoPush(null);
    setCoursePush(null, null);
    synced = false;
    coursesSynced = false;
  }
  emit();
}

let initStarted = false;
async function init() {
  if (initStarted) return;
  initStarted = true;
  // 캐시로 즉시 표시(Neon 해외 지연 동안 빈 화면 방지)
  try {
    const c = localStorage.getItem(USER_KEY);
    if (c) { user = JSON.parse(c); emit(); }
  } catch {}
  try {
    const d = await fetch("/api/auth/me").then((r) => r.json());
    applyUser(d.user || null);
  } catch {
    // 네트워크 실패 시 캐시 유지
  } finally {
    ready = true;
    emit();
  }
}

async function postJson(url: string, body?: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.ok === false) throw new Error(d.error || "요청에 실패했어요");
  return d;
}

export async function signup(nickname: string, password: string, remember = true) {
  const d = await postJson("/api/auth/signup", { nickname, password, remember });
  applyUser(d.user);
}
export async function login(nickname: string, password: string, remember = true): Promise<{ admin: boolean }> {
  const d = await postJson("/api/auth/login", { nickname, password, remember });
  if (d.admin) return { admin: true }; // 관리자 세션(일반 회원 아님)
  applyUser(d.user);
  return { admin: false };
}
export async function logout() {
  await postJson("/api/auth/logout");
  applyUser(null);
}
export async function deleteAccount() {
  const r = await fetch("/api/account", { method: "DELETE" });
  if (!r.ok) throw new Error("탈퇴에 실패했어요");
  applyUser(null);
}
export async function updateProfile(p: Partial<AuthUser>) {
  await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
  if (user) applyUser({ ...user, ...p });
}

export function useAuth() {
  const u = useSyncExternalStore(subscribe, () => user, () => null);
  useEffect(() => { void init(); }, []);
  const isReady = useSyncExternalStore(subscribe, () => ready, () => false);
  return {
    user: u,
    ready: isReady,
    signup: useCallback(signup, []),
    login: useCallback(login, []),
    logout: useCallback(logout, []),
    deleteAccount: useCallback(deleteAccount, []),
    updateProfile: useCallback(updateProfile, []),
  };
}
