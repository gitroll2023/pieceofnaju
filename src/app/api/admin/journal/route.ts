import { put, del } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_IMG = 8 * 1024 * 1024;
const MAX_PHOTOS = 5;
const unauth = () => Response.json({ ok: false, error: "권한이 없어요" }, { status: 401 });
const bad = (e: string) => Response.json({ ok: false, error: e }, { status: 400 });

// 관리자가 직접 다니며 남기는 사진/릴스 기록
export async function GET() {
  if (!(await isAdmin())) return unauth();
  const rows = await sql`
    SELECT id, place_name, address, lat, lng, photo_urls, insta_url, memo,
           (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS at
    FROM journal_pieces ORDER BY created_at DESC`;
  return Response.json({ pieces: rows });
}

// 등록 — 주소 검색으로 고른 장소 + (사진 1~5장 또는 인스타 릴스 링크)
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauth();
  const form = await req.formData().catch(() => null);
  if (!form) return bad("잘못된 요청");

  const placeName = String(form.get("placeName") || "").trim().slice(0, 120);
  if (!placeName) return bad("장소를 선택해주세요");
  const address = String(form.get("address") || "").trim().slice(0, 200);
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const memo = String(form.get("memo") || "").trim().slice(0, 300);
  const instaUrl = String(form.get("instaUrl") || "").trim().slice(0, 300);
  const photos = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);

  if (photos.length === 0 && !instaUrl) return bad("사진을 올리거나 릴스 링크를 넣어주세요");
  for (const f of photos) {
    if (f.size > MAX_IMG || !f.type.startsWith("image/")) {
      return bad("사진 형식·용량을 확인해주세요(8MB 이하)");
    }
  }

  const photoUrls: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const f = photos[i];
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`journal/${Date.now()}-${i}.${ext}`, f, { access: "public", addRandomSuffix: true });
    photoUrls.push(blob.url);
  }

  const ins = await sql`
    INSERT INTO journal_pieces (place_name, address, lat, lng, photo_urls, insta_url, memo)
    VALUES (${placeName}, ${address}, ${Number.isFinite(lat) ? lat : null}, ${Number.isFinite(lng) ? lng : null},
            ${JSON.stringify(photoUrls)}::jsonb, ${instaUrl}, ${memo})
    RETURNING id`;
  return Response.json({ ok: true, id: ins[0].id });
}

// 삭제 — DB 행 + 업로드된 사진(있으면) 정리
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauth();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id 없음");
  const rows = await sql`DELETE FROM journal_pieces WHERE id = ${id} RETURNING photo_urls`;
  const urls = (rows[0]?.photo_urls || []) as string[];
  await Promise.all(urls.map((u) => del(u).catch(() => {})));
  return Response.json({ ok: true });
}
