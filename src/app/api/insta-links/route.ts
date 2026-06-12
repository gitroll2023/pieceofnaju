import { sql } from "@/lib/db";

// 공개 — 발견 화면이 1회 불러와 카드 인스타 링크에 사용
export async function GET() {
  const rows = await sql`SELECT place_id, url FROM insta_links`;
  const map: Record<string, string> = {};
  for (const r of rows as { place_id: string; url: string }[]) map[r.place_id] = r.url;
  return Response.json({ map }, { headers: { "Cache-Control": "public, max-age=120" } });
}
