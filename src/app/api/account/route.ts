import { sql } from "@/lib/db";
import { readSession, clearSession } from "@/lib/auth";

const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

// 프로필 수정(인스타/블로그/유튜브/소개)
export async function PATCH(req: Request) {
  const s = await readSession();
  if (!s) return bad("로그인이 필요해요", 401);
  const b = await req.json().catch(() => null);
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  const bio = clip(b?.bio, 300);
  const insta = clip(b?.insta, 200);
  const blog = clip(b?.blog, 300);
  const youtube = clip(b?.youtube, 300);
  await sql`UPDATE users SET bio = ${bio}, insta = ${insta}, blog = ${blog}, youtube = ${youtube} WHERE id = ${s.uid}`;
  return Response.json({ ok: true });
}

// 회원 탈퇴 — 즉시 삭제(pieces·courses·posts는 ON DELETE CASCADE로 함께 삭제)
export async function DELETE() {
  const s = await readSession();
  if (!s) return bad("로그인이 필요해요", 401);
  await sql`DELETE FROM users WHERE id = ${s.uid}`;
  await clearSession();
  return Response.json({ ok: true });
}
