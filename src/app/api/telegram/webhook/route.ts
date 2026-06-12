import { sql } from "@/lib/db";
import { tgAnswer, tgEdit } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// 이름으로 카카오 좌표 보정(승인 시 좌표 없으면 채워 발견에 노출)
async function geocode(name: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent("나주 " + name)}&size=1`,
      { headers: { Authorization: `KakaoAK ${key}` } },
    );
    const d = await r.json();
    const doc = d.documents?.[0];
    if (!doc) return null;
    return { lat: Number(doc.y), lng: Number(doc.x), address: doc.road_address_name || doc.address_name || "" };
  } catch {
    return null;
  }
}

// 텔레그램 봇 인라인 버튼 콜백 — 승인/반려를 봇에서 바로 처리(관리자 페이지와 동일 DB 반영)
export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  const update = await req.json().catch(() => null);
  const cq = update?.callback_query;
  if (!cq) return Response.json({ ok: true }); // 콜백 외 업데이트는 무시

  // 관리자 본인만(봇이 관리자에게만 보내지만 이중 확인)
  if (String(cq.from?.id) !== String(process.env.TELEGRAM_ADMIN_CHAT_ID)) {
    await tgAnswer(cq.id, "권한이 없어요");
    return Response.json({ ok: true });
  }

  const [kind, act, idRaw] = String(cq.data || "").split(":");
  const id = Number(idRaw);
  let result = "처리됨";
  try {
    if (kind === "st" && id) {
      if (act === "a") {
        const rows = (await sql`SELECT name, lat, lng FROM store_requests WHERE id = ${id}`) as { name: string; lat: number | null; lng: number | null }[];
        if (!rows.length) result = "대상을 찾을 수 없어요";
        else {
          let hasCoord = rows[0].lat != null && rows[0].lng != null;
          if (!hasCoord) {
            const g = await geocode(rows[0].name);
            if (g) { await sql`UPDATE store_requests SET lat = ${g.lat}, lng = ${g.lng}, address = ${g.address} WHERE id = ${id}`; hasCoord = true; }
          }
          await sql`UPDATE store_requests SET status = 'approved', reviewed_at = now() WHERE id = ${id}`;
          result = hasCoord ? "✅ 승인 — 발견에 노출돼요" : "✅ 승인 (좌표 없음 · 위치 직접 확인 필요)";
        }
      } else if (act === "r") {
        await sql`UPDATE store_requests SET status = 'rejected', reviewed_at = now() WHERE id = ${id}`;
        result = "🚫 반려했어요";
      }
    } else if (kind === "cr" && id) {
      await sql`UPDATE users SET creator_status = ${act === "a" ? "approved" : "rejected"} WHERE id = ${id}`;
      result = act === "a" ? "✅ 크리에이터 승인" : "🚫 반려했어요";
    } else {
      result = "알 수 없는 동작";
    }
  } catch {
    result = "처리 중 오류가 났어요";
  }

  await tgAnswer(cq.id, result);
  if (cq.message?.message_id) {
    await tgEdit(cq.message.chat.id, cq.message.message_id, `${cq.message.text || ""}\n\n— ${result}`);
  }
  return Response.json({ ok: true });
}
