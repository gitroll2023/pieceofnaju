// 나이별 코스를 실데이터+카카오로 정리·좌표보강 → seed-courses.json 병합.
// 취향 카테고리는 public/data/taste-categories.json({categories}) 로 출력.
import { readFile, writeFile } from "node:fs/promises";

const KKEY = "6a565a7a5c71203575d20d492eaa28ff";
const spots = JSON.parse(await readFile("public/data/spots.json", "utf8"));
const merchants = JSON.parse(await readFile("src/data/merchants.json", "utf8"));
const fc = merchants.filter((m) => m.c === "food" || m.c === "cafe");
const seed = JSON.parse(await readFile("public/data/seed-courses.json", "utf8"));
const age = JSON.parse(await readFile("data/age-courses.json", "utf8"));
const taste = JSON.parse(await readFile("data/taste-categories.json", "utf8"));

const norm = (x) => String(x).replace(/\s/g, "");
const cache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isAddr = (s) => /전라남도|전남|나주시/.test(String(s || ""));
const cleanName = (n) => { let s = String(n); if (s.includes("—")) s = s.split("—").pop(); s = s.replace(/\(.*?\)/g, "").trim(); return s || String(n).trim(); };
const catGuess = (n) => (/카페|커피|coffee|도넛|도너츠|베이커리|빵|디저트|티하우스|살롱|book|책방/i.test(n) ? "cafe" : /떡볶|분식|식당|곰탕|국밥|구이|찜|장어|홍어|한식|밥집|치킨|고기|회|노래/i.test(n) ? "food" : "기타");

function internalFind(name) {
  const n = norm(name);
  if (n.length < 2) return null;
  const sp = spots.find((s) => norm(s.n) === n) || spots.find((s) => norm(s.n).includes(n));
  if (sp) return { placeId: sp.id, name: sp.n, kind: "spot", cat: sp.cat, lat: sp.lat, lng: sp.lng };
  const mm = fc.find((m) => norm(m.n) === n) || fc.find((m) => norm(m.n).includes(n));
  if (mm) return { placeId: mm.id, name: mm.n, kind: mm.c, cat: mm.c, lat: mm.lat, lng: mm.lng };
  return null;
}
async function kakao(path, query) {
  const r = await fetch(`https://dapi.kakao.com/v2/local/search/${path}.json?query=` + encodeURIComponent(query), { headers: { Authorization: "KakaoAK " + KKEY } });
  if (!r.ok) return null;
  return (await r.json()).documents || [];
}
async function resolveStop(st) {
  const nm = cleanName(st.name);
  const f0 = internalFind(nm) || internalFind(st.name);
  if (f0) return { ...f0, arrive: isAddr(st.at) ? "" : st.at };
  const key = nm + "|" + (st.at || "");
  if (cache.has(key)) { const c = cache.get(key); return c && { ...c, arrive: isAddr(st.at) ? "" : st.at }; }
  let res = null;
  // 주소가 at에 있으면 주소검색
  if (isAddr(st.at)) {
    const docs = await kakao("address", st.at.replace(/\s*\d+호.*$/, ""));
    if (docs && docs[0]) res = { placeId: null, name: nm, kind: catGuess(nm), cat: catGuess(nm), lat: Number(docs[0].y), lng: Number(docs[0].x) };
    await sleep(110);
  }
  if (!res) {
    for (const q of [`나주 ${nm}`, nm]) {
      const docs = await kakao("keyword", q);
      const d = (docs || []).find((x) => (x.address_name || "").includes("나주"));
      if (d) { const cat = d.category_group_code === "CE7" ? "cafe" : d.category_group_code === "FD6" ? "food" : catGuess(nm); res = { placeId: null, name: nm, kind: cat, cat, lat: Number(d.y), lng: Number(d.x) }; break; }
      await sleep(110);
    }
  }
  cache.set(key, res);
  return res && { ...res, arrive: isAddr(st.at) ? "" : st.at };
}

const merged = [...seed.courses];
const ids = new Set(merged.map((c) => c.id));
let added = 0, geocoded = 0, dropped = 0;
for (const c of age) {
  const stops = [];
  for (let i = 0; i < c.stops.length; i++) {
    const st = c.stops[i];
    const f = await resolveStop(st);
    if (!f) continue;
    if (!f.placeId) geocoded++;
    stops.push({ order: stops.length + 1, placeId: f.placeId, name: st.label || f.name, kind: f.kind, cat: f.cat, lat: f.lat, lng: f.lng, stayMin: st.stayMin ?? 40, arriveLabel: f.arrive || "", note: st.note || "", cost: st.cost ?? 0, costNote: st.costNote || "", gap: false });
  }
  if (stops.length < 3) { dropped++; continue; }
  let id = c.id; while (ids.has(id)) id += "_x"; ids.add(id);
  merged.push({ id, title: c.title, theme: c.theme, summary: c.summary, audience: c.audience, days: c.days, durationHours: c.durationHours, party: c.party || [], budgetKrw: stops.reduce((a, s) => a + (s.cost || 0), 0), region: c.region, tags: c.tags || [], age: c.age, stops });
  added++;
}

await writeFile("public/data/seed-courses.json", JSON.stringify({ version: 1, courses: merged }, null, 1));
await writeFile("public/data/taste-categories.json", JSON.stringify({ categories: taste }, null, 1));
console.log(`나이별 ${age.length} → 병합 ${added}(드롭 ${dropped}) · 좌표보강 ${geocoded}`);
console.log(`총 코스 ${merged.length} · 취향 카테고리 ${taste.length}`);
