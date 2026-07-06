import { put, del } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_IMG = 8 * 1024 * 1024;
const MAX_PHOTOS = 5;
const unauth = () => Response.json({ ok: false, error: "권한이 없어요" }, { status: 401 });
const bad = (e: string) => Response.json({ ok: false, error: e }, { status: 400 });

async function uploadPhotos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`journal/${Date.now()}-${i}.${ext}`, f, { access: "public", addRandomSuffix: true });
    urls.push(blob.url);
  }
  return urls;
}

function validatePhotos(files: File[]): string | null {
  for (const f of files) {
    if (f.size > MAX_IMG || !f.type.startsWith("image/")) return "사진 형식·용량을 확인해주세요(8MB 이하)";
  }
  return null;
}

// 관리자가 직접 다니며 남기는 사진/릴스 기록
export async function GET() {
  if (!(await isAdmin())) return unauth();
  const rows = await sql`
    SELECT id, place_name, address, lat, lng, photo_urls, insta_url, memo, merchant_id,
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
  const merchantId = String(form.get("merchantId") || "").trim().slice(0, 40) || null;
  const photos = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);

  if (photos.length === 0 && !instaUrl) return bad("사진을 올리거나 릴스 링크를 넣어주세요");
  const photoErr = validatePhotos(photos);
  if (photoErr) return bad(photoErr);

  const photoUrls = await uploadPhotos(photos);

  const ins = await sql`
    INSERT INTO journal_pieces (place_name, address, lat, lng, photo_urls, insta_url, memo, merchant_id)
    VALUES (${placeName}, ${address}, ${Number.isFinite(lat) ? lat : null}, ${Number.isFinite(lng) ? lng : null},
            ${JSON.stringify(photoUrls)}::jsonb, ${instaUrl}, ${memo}, ${merchantId})
    RETURNING id`;
  return Response.json({ ok: true, id: ins[0].id });
}

// 수정 — 사진 일부 빼기/더하기(최대 5장), 메모 수정
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauth();
  const form = await req.formData().catch(() => null);
  if (!form) return bad("잘못된 요청");

  const id = String(form.get("id") || "");
  if (!id) return bad("id 없음");
  const rows = await sql`SELECT photo_urls FROM journal_pieces WHERE id = ${id}`;
  if (!rows.length) return bad("대상을 찾을 수 없어요");
  const existing = (rows[0].photo_urls || []) as string[];

  const keep = new Set<string>(JSON.parse(String(form.get("keepPhotoUrls") || "[]")));
  const removed = existing.filter((u) => !keep.has(u));
  const kept = existing.filter((u) => keep.has(u));

  const newPhotos = form
    .getAll("newPhotos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS - kept.length);
  const photoErr = validatePhotos(newPhotos);
  if (photoErr) return bad(photoErr);
  const newUrls = await uploadPhotos(newPhotos);
  const finalUrls = [...kept, ...newUrls].slice(0, MAX_PHOTOS);

  await Promise.all(removed.map((u) => del(u).catch(() => {})));

  if (form.has("memo")) {
    const memo = String(form.get("memo") || "").trim().slice(0, 300);
    await sql`UPDATE journal_pieces SET photo_urls = ${JSON.stringify(finalUrls)}::jsonb, memo = ${memo} WHERE id = ${id}`;
  } else {
    await sql`UPDATE journal_pieces SET photo_urls = ${JSON.stringify(finalUrls)}::jsonb WHERE id = ${id}`;
  }
  return Response.json({ ok: true, photoUrls: finalUrls });
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
