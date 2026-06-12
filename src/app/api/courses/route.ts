import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const unauth = () => Response.json({ ok: false, error: "로그인이 필요해요" }, { status: 401 });

// 회원의 저장 코스 목록
export async function GET() {
  const s = await readSession();
  if (!s) return Response.json({ courses: [] });
  const rows = await sql`
    SELECT course_id, title, theme, origin, items,
           (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS at
    FROM courses WHERE user_id = ${s.uid} ORDER BY created_at`;
  return Response.json({ courses: rows });
}

// 코스 저장/갱신(체크인 상태 포함) — upsert
export async function POST(req: Request) {
  const s = await readSession();
  if (!s) return unauth();
  const c = await req.json().catch(() => null);
  if (!c?.id || !Array.isArray(c?.items)) return Response.json({ ok: false, error: "필수 값 없음" }, { status: 400 });
  await sql`
    INSERT INTO courses (user_id, course_id, title, theme, origin, items)
    VALUES (${s.uid}, ${String(c.id)}, ${String(c.title || "").slice(0, 120)}, ${String(c.theme || "local")},
            ${String(c.origin || "mine")}, ${JSON.stringify(c.items)}::jsonb)
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      title = EXCLUDED.title, theme = EXCLUDED.theme, origin = EXCLUDED.origin, items = EXCLUDED.items`;
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await readSession();
  if (!s) return unauth();
  const id = new URL(req.url).searchParams.get("courseId");
  if (!id) return Response.json({ ok: false }, { status: 400 });
  await sql`DELETE FROM courses WHERE user_id = ${s.uid} AND course_id = ${id}`;
  return Response.json({ ok: true });
}
