import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// 인증 — 비번은 bcrypt 해시(평문 저장 X), 세션은 HS256 서명 httpOnly 쿠키.
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-insecure-secret");
const COOKIE = "naju_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

export type Session = { uid: number; nick: string };

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(uid: number, nick: string, remember = true) {
  const token = await new SignJWT({ uid, nick })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // 자동 로그인 체크 시에만 지속(30일). 미체크면 세션 쿠키(브라우저 닫으면 해제) — 공공장소 보호
    ...(remember ? { maxAge: MAX_AGE } : {}),
  });
}

export async function readSession(): Promise<Session | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { uid: Number(payload.uid), nick: String(payload.nick) };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

// ── 관리자(/pieceadmin) — 사용자 세션과 분리된 쿠키 ──
const ADMIN_COOKIE = "naju_admin";

export function checkAdminCreds(id: unknown, pw: unknown): boolean {
  const aid = process.env.PIECEADMIN_ID;
  const apw = process.env.PIECEADMIN_PW;
  return !!aid && !!apw && id === aid && pw === apw;
}

export async function createAdminSession() {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
  const c = await cookies();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}

// 입력 검증
export function validNickname(n: unknown): n is string {
  return typeof n === "string" && /^[a-zA-Z0-9가-힣_.]{2,20}$/.test(n);
}
// 비밀번호 정책: 8자 이상, 영문(대소문자 무관)·숫자·특수문자(!@#$%^&) 각 1개 이상.
// 코딩에 문제되는 따옴표·백슬래시·공백·유니코드 등은 불허(허용 문자만).
export const PW_RULE = "8자 이상, 영문·숫자·특수문자(!@#$%^&) 포함";
export function validPassword(p: unknown): p is string {
  if (typeof p !== "string") return false;
  if (p.length < 8 || p.length > 100) return false;
  if (!/[a-zA-Z]/.test(p)) return false; // 영문
  if (!/[0-9]/.test(p)) return false; // 숫자
  if (!/[!@#$%^&]/.test(p)) return false; // 특수문자 1개 이상
  if (!/^[a-zA-Z0-9!@#$%^&]+$/.test(p)) return false; // 허용 문자만(별표·따옴표 등 제외)
  return true;
}
