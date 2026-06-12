import { sql } from "@/lib/db";

// 관리자 승인된 커뮤니티 장소(신청→승인) — 발견 화면이 1회 불러와 spots에 합침
export async function GET() {
  const rows = await sql`
    SELECT id, name, bucket, cat, dong, address, lat, lng, summary
    FROM store_requests WHERE status = 'approved' AND lat IS NOT NULL AND lng IS NOT NULL
    ORDER BY reviewed_at DESC NULLS LAST`;
  return Response.json(
    { places: rows },
    { headers: { "Cache-Control": "public, max-age=120" } },
  );
}
