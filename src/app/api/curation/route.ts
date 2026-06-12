import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// 관리자가 등록한 큐레이션 꿀팁(place_id → {tip, pick}) — 발견/지도가 런타임에 1회 로드
export async function GET() {
  try {
    const rows = (await sql`SELECT place_id, tip, pick FROM curation_tips`) as { place_id: string; tip: string; pick: boolean }[];
    const map: Record<string, { tip: string; pick: boolean }> = {};
    for (const r of rows) map[r.place_id] = { tip: r.tip, pick: r.pick };
    return Response.json({ map });
  } catch {
    return Response.json({ map: {} });
  }
}
