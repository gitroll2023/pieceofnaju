import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { clientIp } from "@/lib/ip";
import { notifyAdminPhotos } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { contact: "문의", suggest: "건의", event: "지역 행사 제보" };
const MAX_IMG = 8 * 1024 * 1024; // 장당 8MB
const MAX_COUNT = 4; // 한 번에 최대 4장
const HOURLY_LIMIT = 8; // 같은 IP 시간당 제출 한도

function ipHash(req: Request): string {
  return createHash("sha256").update(clientIp(req) + (process.env.AUTH_SECRET || "")).digest("hex").slice(0, 32);
}

// 문의·건의·행사 제보 — DB에 내용 저장 없이 텔레그램으로만. 비회원도 가능.
// 악용 방지: 약관 동의 필수 · 허니팟 · 해시 IP 레이트리밋(내용 아닌 메타만, 2시간 후 삭제).
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

  // 봇 허니팟 — 숨은 필드가 채워지면 성공한 척하고 버림
  if (String(form.get("website") || "")) return Response.json({ ok: true });

  // 약관 동의 필수
  if (String(form.get("agree") || "") !== "1") {
    return Response.json({ ok: false, error: "보내기 전에 안내에 동의해주세요" }, { status: 400 });
  }

  const type = String(form.get("type") || "");
  const title = TITLE[type] || "메시지";
  const message = String(form.get("message") || "").trim().slice(0, 2000);
  const contact = String(form.get("contact") || "").trim().slice(0, 200);

  // 이미지: image/* 만, 장당 8MB 이하, 최대 4장
  const photos = form
    .getAll("image")
    .filter((f): f is File => f instanceof File && f.size > 0 && f.size <= MAX_IMG && (f.type || "").startsWith("image/"))
    .slice(0, MAX_COUNT);

  if (message.length < 2 && photos.length === 0) {
    return Response.json({ ok: false, error: "내용을 입력하거나 사진을 첨부해주세요" }, { status: 400 });
  }

  // 레이트리밋 (해시 IP)
  const h = ipHash(req);
  try {
    const r = (await sql`SELECT count(*)::int AS n FROM contact_throttle WHERE ip_hash = ${h} AND created_at > now() - interval '1 hour'`) as { n: number }[];
    if (r[0].n >= HOURLY_LIMIT) {
      return Response.json({ ok: false, error: "잠시 후 다시 시도해주세요. (단시간 제출 제한)" }, { status: 429 });
    }
    await sql`INSERT INTO contact_throttle (ip_hash) VALUES (${h})`;
    await sql`DELETE FROM contact_throttle WHERE created_at < now() - interval '2 hours'`;
  } catch {
    // 레이트리밋 실패는 전송을 막지 않음
  }

  const s = await readSession();
  const who = s ? `회원 ${s.nick}` : `비회원·#${h.slice(0, 6)}`; // 비회원은 식별용 짧은 해시
  const caption = `📨 ${title} (${who})\n${message || "(내용 없음)"}${contact ? `\n📮 ${contact}` : ""}${photos.length ? `\n🖼 사진 ${photos.length}장` : ""}`;

  await notifyAdminPhotos(photos, caption);
  return Response.json({ ok: true });
}
