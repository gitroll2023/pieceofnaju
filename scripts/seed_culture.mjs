// culture.ts의 CULTURE_EVENTS를 읽어 culture_events 테이블에 시드(upsert).
// 실행: node scripts/seed_culture.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim();
const sql = neon(url);

// TS 파일에서 배열 리터럴만 떼어내 평가(객체 리터럴뿐이라 안전)
const src = readFileSync("src/lib/data/culture.ts", "utf8");
const head = src.indexOf("CULTURE_EVENTS: CultureEvent[] =");
const open = src.indexOf("[", head);
const end = src.indexOf("\n];", open);
const literal = src.slice(open, end + 2); // "[ ... ]"
const events = eval("(" + literal + ")");

let n = 0;
for (const e of events) {
  await sql`
    INSERT INTO culture_events
      (id, title, badge, emoji, color, image, period, start_date, end_date, ev_time,
       place, audience, summary, highlights, schedule, salons, pick_note, host, contact, link,
       published, sort_order)
    VALUES
      (${e.id}, ${e.title}, ${e.badge || ""}, ${e.emoji || "🎉"}, ${e.color || "#c9821f"},
       ${e.image || ""}, ${e.period || ""}, ${e.start || null}, ${e.end || null}, ${e.time || ""},
       ${e.place || ""}, ${e.audience || ""}, ${e.summary || ""},
       ${JSON.stringify(e.highlights || [])}::jsonb, ${JSON.stringify(e.schedule || [])}::jsonb,
       ${JSON.stringify(e.salons || [])}::jsonb, ${e.pickNote || ""}, ${e.host || ""},
       ${e.contact || ""}, ${e.link || ""}, true, ${n})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title, badge = EXCLUDED.badge, emoji = EXCLUDED.emoji, color = EXCLUDED.color,
      image = EXCLUDED.image, period = EXCLUDED.period, start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date, ev_time = EXCLUDED.ev_time, place = EXCLUDED.place,
      audience = EXCLUDED.audience, summary = EXCLUDED.summary, highlights = EXCLUDED.highlights,
      schedule = EXCLUDED.schedule, salons = EXCLUDED.salons, pick_note = EXCLUDED.pick_note,
      host = EXCLUDED.host, contact = EXCLUDED.contact, link = EXCLUDED.link`;
  n++;
  console.log("✓", e.id);
}
console.log(`시드 완료: ${n}건`);
