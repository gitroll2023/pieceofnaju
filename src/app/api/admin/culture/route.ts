import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CULTURE_EVENTS, type CultureEvent } from "@/lib/data/culture";
import { rowToEvent } from "@/app/api/culture/route";

export const dynamic = "force-dynamic";

type EventInput = Partial<CultureEvent> & { published?: boolean; sortOrder?: number };

function slug(s: string): string {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
    `ev-${Date.now()}`
  );
}

async function upsert(e: EventInput, published = true) {
  const id = (e.id && e.id.trim()) || slug(e.title || "");
  await sql`
    INSERT INTO culture_events
      (id, title, badge, emoji, color, image, period, start_date, end_date, ev_time,
       place, audience, summary, highlights, schedule, salons, pick_note, host, contact, link,
       published, sort_order)
    VALUES
      (${id}, ${e.title || ""}, ${e.badge || ""}, ${e.emoji || "🎉"}, ${e.color || "#c9821f"},
       ${e.image || ""}, ${e.period || ""}, ${e.start || null}, ${e.end || null}, ${e.time || ""},
       ${e.place || ""}, ${e.audience || ""}, ${e.summary || ""},
       ${JSON.stringify(e.highlights || [])}::jsonb, ${JSON.stringify(e.schedule || [])}::jsonb,
       ${JSON.stringify(e.salons || [])}::jsonb, ${e.pickNote || ""}, ${e.host || ""},
       ${e.contact || ""}, ${e.link || ""}, ${e.published ?? published}, ${e.sortOrder ?? 0})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title, badge = EXCLUDED.badge, emoji = EXCLUDED.emoji, color = EXCLUDED.color,
      image = EXCLUDED.image, period = EXCLUDED.period, start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date, ev_time = EXCLUDED.ev_time, place = EXCLUDED.place,
      audience = EXCLUDED.audience, summary = EXCLUDED.summary, highlights = EXCLUDED.highlights,
      schedule = EXCLUDED.schedule, salons = EXCLUDED.salons, pick_note = EXCLUDED.pick_note,
      host = EXCLUDED.host, contact = EXCLUDED.contact, link = EXCLUDED.link,
      published = EXCLUDED.published, sort_order = EXCLUDED.sort_order`;
  return id;
}

// 전체 목록(미발행 포함)
export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  type AdminRow = Parameters<typeof rowToEvent>[0] & { published: boolean; sort_order: number };
  const rows = (await sql`
    SELECT id, title, badge, emoji, color, image, period,
           to_char(start_date, 'YYYY-MM-DD') AS start_date,
           to_char(end_date, 'YYYY-MM-DD') AS end_date,
           ev_time, place, audience, summary, highlights, schedule, salons, pick_note, host, contact, link,
           published, sort_order
    FROM culture_events
    ORDER BY sort_order ASC, start_date ASC NULLS LAST, created_at ASC
  `) as AdminRow[];
  const events = rows.map((r) => ({ ...rowToEvent(r), published: r.published, sortOrder: r.sort_order }));
  return Response.json({ ok: true, events });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return Response.json({ ok: false, error: "잘못된 요청" }, { status: 400 });

  // 기본 이벤트 시드(DB가 비어있을 때 코드 기본값을 한 번에 불러오기)
  if (b.seed === true) {
    let n = 0;
    for (const e of CULTURE_EVENTS) { await upsert(e, true); n++; }
    return Response.json({ ok: true, seeded: n });
  }

  if (!b.title || !String(b.title).trim()) {
    return Response.json({ ok: false, error: "제목은 필수예요" }, { status: 400 });
  }
  const id = await upsert(b as EventInput);
  return Response.json({ ok: true, id });
}

// 발행/미발행 토글
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.id) return Response.json({ ok: false }, { status: 400 });
  await sql`UPDATE culture_events SET published = ${!!b.published} WHERE id = ${b.id}`;
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false }, { status: 400 });
  await sql`DELETE FROM culture_events WHERE id = ${id}`;
  return Response.json({ ok: true });
}
