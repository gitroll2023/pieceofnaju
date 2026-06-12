import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/telegram";

// 건의/피드백 — 비회원도 가능
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const message = typeof b?.message === "string" ? b.message.trim().slice(0, 1000) : "";
  if (message.length < 2) return Response.json({ ok: false, error: "내용을 입력해주세요" }, { status: 400 });
  const contact = typeof b?.contact === "string" ? b.contact.slice(0, 200) : "";
  const s = await readSession();
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);
  await sql`INSERT INTO feedback (user_id, message, contact, ua) VALUES (${s?.uid ?? null}, ${message}, ${contact}, ${ua})`;
  void notifyAdmin(`✍️ 새 건의${s ? ` (${s.nick})` : " (비회원)"}\n${message.slice(0, 400)}${contact ? `\n📮 ${contact}` : ""}`);
  return Response.json({ ok: true });
}
