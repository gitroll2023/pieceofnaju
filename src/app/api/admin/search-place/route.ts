import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import merchantsData from "@/data/merchants.json";

type M = { id: string; n: string; c: string; d: string };
const ALL = merchantsData as unknown as M[];

// 관리자 — 가게명으로 검색해 id 없이 인스타 연결할 수 있게(현재 연결 상태 포함)
export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 1) return Response.json({ results: [] });
  const matched = ALL.filter((m) => m.n.includes(q)).slice(0, 40);
  const links = await sql`SELECT place_id, url FROM insta_links`;
  const map = new Map((links as { place_id: string; url: string }[]).map((l) => [l.place_id, l.url]));
  return Response.json({
    results: matched.map((m) => ({ id: m.id, name: m.n, c: m.c, d: m.d, url: map.get(m.id) || "" })),
  });
}
