import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";

// 세션당 1회 방문 집계(일자×유형). 회원 여부는 서버 세션으로 판단(클라 신뢰 X).
export async function POST() {
  const s = await readSession();
  const kind = s ? "member" : "guest";
  try {
    await sql`INSERT INTO visits (day, kind, count) VALUES (CURRENT_DATE, ${kind}, 1)
              ON CONFLICT (day, kind) DO UPDATE SET count = visits.count + 1`;
  } catch {}
  return Response.json({ ok: true });
}
