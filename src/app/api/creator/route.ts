import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/telegram";

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// 크리에이터(SNS) 승인 신청 — 본인 인스타/블로그/유튜브를 등록하고 승인 요청
export async function POST(req: Request) {
  const s = await readSession();
  if (!s) return Response.json({ ok: false, error: "로그인이 필요해요" }, { status: 401 });
  const b = await req.json().catch(() => null);
  const insta = clip(b?.insta, 200);
  const blog = clip(b?.blog, 300);
  const youtube = clip(b?.youtube, 300);
  if (!insta && !blog && !youtube) return Response.json({ ok: false, error: "SNS를 하나 이상 입력해주세요" }, { status: 400 });
  await sql`UPDATE users SET insta = ${insta}, blog = ${blog}, youtube = ${youtube},
            creator_status = 'pending' WHERE id = ${s.uid} AND creator_status <> 'approved'`;
  const instaUrl = insta ? (/^https?:\/\//.test(insta) ? insta : `https://instagram.com/${insta.replace(/^@/, "")}`) : "";
  void notifyAdmin(
    `⭐ 크리에이터 승인 신청: ${s.nick}\ninsta: ${insta || "-"}\nblog: ${blog || "-"}\nyoutube: ${youtube || "-"}`,
    {
      inline_keyboard: [
        [{ text: "✅ 승인", callback_data: `cr:a:${s.uid}` }, { text: "🚫 반려", callback_data: `cr:r:${s.uid}` }],
        ...(instaUrl ? [[{ text: "📷 인스타 보기", url: instaUrl }]] : []),
      ],
    },
  );
  return Response.json({ ok: true });
}
