import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { clientIp } from "@/lib/ip";
import { notifyAdmin, notifyAdminPhoto, notifyAdminPhotos } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const MAX_IMG = 8 * 1024 * 1024;
const LABEL: Record<string, string> = { eat: "먹거리", drink: "마실거리", see: "볼거리", play: "즐길거리" };

function ipHash(req: Request) {
  return createHash("sha256").update(clientIp(req) + (process.env.AUTH_SECRET || "")).digest("hex").slice(0, 32);
}

// 가게/장소 등록 신청 — 가게 '사진 필수'. DB(store_requests)에 저장 + 텔레그램으로 사진과 승인 버튼 전송.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

  if (String(form.get("website") || "")) return Response.json({ ok: true }); // 허니팟
  if (String(form.get("agree") || "") !== "1") return Response.json({ ok: false, error: "보내기 전에 안내에 동의해주세요" }, { status: 400 });

  const name = clip(form.get("name"), 80);
  if (name.length < 2) return Response.json({ ok: false, error: "가게 이름을 입력해주세요" }, { status: 400 });
  const bucket = ["eat", "drink", "see", "play"].includes(String(form.get("bucket"))) ? String(form.get("bucket")) : "see";
  const summary = clip(form.get("summary"), 500);
  const contact = clip(form.get("contact"), 200);
  const shopInShop = String(form.get("shopInShop") || "") === "1";

  const photos = form
    .getAll("image")
    .filter((f): f is File => f instanceof File && f.size > 0 && f.size <= MAX_IMG && (f.type || "").startsWith("image/"))
    .slice(0, 4);
  if (photos.length === 0) return Response.json({ ok: false, error: "가게 사진을 한 장 이상 넣어주세요" }, { status: 400 });
  if (shopInShop && summary.length < 2) return Response.json({ ok: false, error: "샵인샵은 어디 안에 있는지 등 근거를 적어주세요" }, { status: 400 });

  // 레이트리밋(해시 IP)
  const h = ipHash(req);
  try {
    const r = (await sql`SELECT count(*)::int AS n FROM contact_throttle WHERE ip_hash = ${h} AND created_at > now() - interval '1 hour'`) as { n: number }[];
    if (r[0].n >= 8) return Response.json({ ok: false, error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    await sql`INSERT INTO contact_throttle (ip_hash) VALUES (${h})`;
  } catch {}

  const s = await readSession();
  const ins = (await sql`
    INSERT INTO store_requests (user_id, name, bucket, summary, contact)
    VALUES (${s?.uid ?? null}, ${name}, ${bucket}, ${shopInShop ? `[샵인샵] ${summary}` : summary}, ${contact})
    RETURNING id`) as { id: number }[];
  const id = ins[0].id;

  const who = s ? `(${s.nick})` : "(비회원)";
  const caption = `🏪 장소 등록 신청 ${who}\n[${LABEL[bucket]}] ${name}${shopInShop ? " · 🔁샵인샵" : ""}${summary ? `\n${summary}` : ""}`;
  const kb = {
    inline_keyboard: [
      [{ text: "✅ 승인", callback_data: `st:a:${id}` }, { text: "🚫 반려", callback_data: `st:r:${id}` }],
      [{ text: "🗺 위치 보기", url: `https://map.kakao.com/?q=${encodeURIComponent("나주 " + name)}` }],
    ],
  };

  if (photos.length === 1) {
    await notifyAdminPhoto(photos[0], caption, kb);
  } else {
    await notifyAdminPhotos(photos, caption);
    await notifyAdmin(`⬆️ 위 가게 신청 처리\n[${LABEL[bucket]}] ${name}`, kb);
  }
  return Response.json({ ok: true });
}
