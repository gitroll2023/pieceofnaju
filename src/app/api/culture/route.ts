import { sql } from "@/lib/db";
import { CULTURE_EVENTS, type CultureEvent } from "@/lib/data/culture";

export const dynamic = "force-dynamic";

type Row = {
  id: string; title: string; badge: string; emoji: string; color: string; image: string;
  period: string; start_date: string | null; end_date: string | null; ev_time: string;
  place: string; audience: string; summary: string;
  highlights: string[]; schedule: { day: string; items: string[] }[]; salons: string[];
  pick_note: string; host: string; contact: string; link: string;
};

function d(v: string | null): string | undefined {
  return v ? String(v).slice(0, 10) : undefined;
}

export function rowToEvent(r: Row): CultureEvent {
  return {
    id: r.id, title: r.title, badge: r.badge, emoji: r.emoji, color: r.color,
    image: r.image || undefined,
    period: r.period, start: d(r.start_date), end: d(r.end_date),
    time: r.ev_time || undefined,
    place: r.place, audience: r.audience || undefined, summary: r.summary,
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
    schedule: Array.isArray(r.schedule) && r.schedule.length ? r.schedule : undefined,
    salons: Array.isArray(r.salons) && r.salons.length ? r.salons : undefined,
    pickNote: r.pick_note || undefined,
    host: r.host || undefined, contact: r.contact || undefined, link: r.link || undefined,
  };
}

// 발행된 문화·이벤트 — DB에 있으면 DB, 비어있으면 코드 기본값(CULTURE_EVENTS) 폴백
export async function GET() {
  try {
    const rows = (await sql`
      SELECT id, title, badge, emoji, color, image, period,
             to_char(start_date, 'YYYY-MM-DD') AS start_date,
             to_char(end_date, 'YYYY-MM-DD') AS end_date,
             ev_time, place, audience, summary, highlights, schedule, salons, pick_note, host, contact, link
      FROM culture_events
      WHERE published = true
      ORDER BY sort_order ASC, start_date ASC NULLS LAST, created_at ASC
    `) as Row[];
    if (rows.length) return Response.json({ events: rows.map(rowToEvent) });
  } catch {
    // DB 미설정/오류 시 폴백
  }
  return Response.json({ events: CULTURE_EVENTS });
}
