import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";

const unauth = () => Response.json({ ok: false, error: "로그인이 필요해요" }, { status: 401 });
const bad = (e: string) => Response.json({ ok: false, error: e }, { status: 400 });

// 회원의 저장 조각 목록 (비회원이면 빈 배열 — 클라가 localStorage 사용)
export async function GET() {
  const s = await readSession();
  if (!s) return Response.json({ pieces: [] });
  const rows = await sql`
    SELECT piece_id, kind, name, cat, dong, lat, lng, label, visited, memo,
           (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS at
    FROM pieces WHERE user_id = ${s.uid} ORDER BY created_at`;
  return Response.json({ pieces: rows });
}

// 조각 추가(있으면 무시)
export async function POST(req: Request) {
  const s = await readSession();
  if (!s) return unauth();
  const p = await req.json().catch(() => null);
  if (!p?.id || !p?.n) return bad("필수 값 없음");
  await sql`
    INSERT INTO pieces (user_id, piece_id, kind, name, cat, dong, lat, lng, label, memo)
    VALUES (${s.uid}, ${String(p.id)}, ${p.kind || "spot"}, ${String(p.n).slice(0, 120)},
            ${p.c || ""}, ${p.d || ""}, ${p.lat ?? null}, ${p.lng ?? null}, ${p.t || ""}, ${String(p.memo || "").slice(0, 100)})
    ON CONFLICT (user_id, piece_id) DO NOTHING`;
  return Response.json({ ok: true });
}

// 조각 빼기
export async function DELETE(req: Request) {
  const s = await readSession();
  if (!s) return unauth();
  const id = new URL(req.url).searchParams.get("pieceId");
  if (!id) return bad("pieceId 없음");
  await sql`DELETE FROM pieces WHERE user_id = ${s.uid} AND piece_id = ${id}`;
  return Response.json({ ok: true });
}

// 다녀옴 토글 / 나만보기 메모 수정
export async function PATCH(req: Request) {
  const s = await readSession();
  if (!s) return unauth();
  const b = await req.json().catch(() => null);
  if (!b?.pieceId) return bad("pieceId 없음");
  if (typeof b.memo === "string") {
    await sql`UPDATE pieces SET memo = ${b.memo.slice(0, 100)} WHERE user_id = ${s.uid} AND piece_id = ${b.pieceId}`;
  }
  if (typeof b.visited === "boolean") {
    await sql`UPDATE pieces SET visited = ${b.visited} WHERE user_id = ${s.uid} AND piece_id = ${b.pieceId}`;
  }
  return Response.json({ ok: true });
}
