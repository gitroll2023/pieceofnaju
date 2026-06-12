import { sql } from "@/lib/db";
import { readSession, clearSession } from "@/lib/auth";

// 현재 로그인 사용자 — 클라이언트는 1회 호출해 캐시(매번 재호출 금지)
export async function GET() {
  const s = await readSession();
  if (!s) return Response.json({ user: null });
  const rows = await sql`SELECT nickname, bio, insta, blog, youtube, to_char(created_at,'YYYY-MM-DD') AS joined FROM users WHERE id = ${s.uid}`;
  if (!rows.length) {
    await clearSession();
    return Response.json({ user: null });
  }
  return Response.json({ user: rows[0] });
}
