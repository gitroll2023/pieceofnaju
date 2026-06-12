// 에이전트가 생성한 코스(data/generated-courses.json)를 실데이터로 검증 + 카카오로 좌표 보강 +
// 품질 필터 후 시드 7종과 병합 → public/data/seed-courses.json
// 실행: node scripts/merge_generated_courses.mjs  (카카오 REST 사용)
import { readFile, writeFile } from "node:fs/promises";

const KKEY = "6a565a7a5c71203575d20d492eaa28ff";
const spots = JSON.parse(await readFile("public/data/spots.json", "utf8"));
const merchants = JSON.parse(await readFile("src/data/merchants.json", "utf8"));
const fc = merchants.filter((m) => m.c === "food" || m.c === "cafe");
const seed = JSON.parse(await readFile("public/data/seed-courses.json", "utf8"));
const gen = JSON.parse(await readFile("data/generated-courses.json", "utf8"));

const norm = (x) => String(x).replace(/\s/g, "");
const cache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolve(name) {
  const n = norm(name);
  const sp = spots.find((s) => norm(s.n) === n) || spots.find((s) => norm(s.n).includes(n));
  if (sp) return { placeId: sp.id, name: sp.n, kind: "spot", cat: sp.cat, lat: sp.lat, lng: sp.lng };
  const mm = fc.find((m) => norm(m.n) === n) || fc.find((m) => norm(m.n).includes(n));
  if (mm) return { placeId: mm.id, name: mm.n, kind: mm.c, cat: mm.c, lat: mm.lat, lng: mm.lng };
  if (cache.has(n)) return cache.get(n);
  let res = null;
  for (const q of [`나주 ${name}`, name]) {
    try {
      const r = await fetch("https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodeURIComponent(q), { headers: { Authorization: "KakaoAK " + KKEY } });
      if (r.ok) {
        const j = await r.json();
        const doc = (j.documents || []).find((d) => (d.address_name || "").includes("나주"));
        if (doc) {
          const cat = doc.category_group_code === "CE7" ? "cafe" : doc.category_group_code === "FD6" ? "food" : "기타";
          res = { placeId: null, name, kind: cat, cat, lat: Number(doc.y), lng: Number(doc.x) };
          break;
        }
      }
    } catch {}
    await sleep(110);
  }
  cache.set(n, res);
  return res;
}

const out = [];
let dropped = 0, gapStops = 0, geocoded = 0;
for (const c of gen) {
  const stops = [];
  for (let i = 0; i < c.stops.length; i++) {
    const st = c.stops[i];
    const f = await resolve(st.name);
    if (f) {
      if (!f.placeId) geocoded++;
      stops.push({ order: i + 1, placeId: f.placeId, name: st.label || f.name || st.name, kind: f.kind, cat: f.cat, lat: f.lat, lng: f.lng, stayMin: st.stayMin ?? 40, arriveLabel: st.at || "", note: st.note || "", cost: st.cost ?? 0, costNote: st.costNote || "", gap: false });
    } else {
      gapStops++;
      stops.push({ order: i + 1, placeId: null, name: st.label || st.name, kind: "spot", cat: "기타", lat: null, lng: null, stayMin: st.stayMin ?? 40, arriveLabel: st.at || "", note: st.note || "", cost: st.cost ?? 0, costNote: st.costNote || "", gap: true });
    }
  }
  const gaps = stops.filter((s) => s.gap).length;
  if (stops.length - gaps < 3 || gaps > stops.length / 2) { dropped++; continue; }
  out.push({ id: c.id, title: c.title, theme: c.theme, summary: c.summary, audience: c.audience, days: c.days, durationHours: c.durationHours, party: c.party || [], budgetKrw: stops.reduce((a, s) => a + (s.cost || 0), 0), region: c.region, tags: c.tags || [], stops });
}

const all = [...seed.courses];
const ids = new Set(all.map((c) => c.id));
for (const c of out) { let id = c.id; while (ids.has(id)) id = id + "_x"; c.id = id; ids.add(id); all.push(c); }

await writeFile("public/data/seed-courses.json", JSON.stringify({ version: 1, courses: all }, null, 1));
console.log(`생성 ${gen.length} → 채택 ${out.length} (드롭 ${dropped}) · 카카오 좌표보강 ${geocoded} · 미해결 갭 ${gapStops}`);
console.log(`총 코스 ${all.length}개`);
const th = {}; for (const c of all) th[c.theme] = (th[c.theme] || 0) + 1;
console.log("테마별:", JSON.stringify(th));
