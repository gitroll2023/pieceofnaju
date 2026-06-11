// 나주 관광지·명소·꽃명소 후보 수집 (네이버 지역검색) → data/naju_spots_raw.json
// 실행: NAVER_CLIENT_ID=.. NAVER_CLIENT_SECRET=.. node scripts/collect_spots.mjs
import { writeFileSync } from "node:fs";

const ID = process.env.NAVER_CLIENT_ID, SECRET = process.env.NAVER_CLIENT_SECRET;
if (!ID || !SECRET) { console.error("NAVER 키 없음"); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => String(s || "").replace(/<\/?b>/g, "").trim();

const QUERIES = [
  "나주 관광지", "나주 가볼만한곳", "나주 명소", "나주 여행", "나주 공원", "나주 호수공원",
  "나주 박물관", "나주 미술관", "나주 전망대", "나주 수목원", "나주 정원", "나주 둘레길",
  "나주 유적지", "나주 고분", "나주 향교", "나주 읍성", "나주 사찰", "나주 절",
  "나주 카페거리", "나주 야경명소", "나주 축제", "나주 체험", "나주 산", "나주 계곡",
  "나주 영산강", "나주 빛가람", "나주 혁신도시 명소", "나주 드라이브",
  // 꽃 명소
  "나주 양귀비", "나주 벚꽃", "나주 배꽃", "나주 코스모스", "나주 유채꽃", "나주 연꽃",
  "나주 꽃구경", "나주 튤립", "나주 장미", "나주 단풍", "나주 메타세콰이어길", "나주 꽃축제",
];

async function naver(query) {
  const url = "https://openapi.naver.com/v1/search/local.json?display=5&query=" + encodeURIComponent(query);
  for (let a = 0; a < 6; a++) {
    let res;
    try { res = await fetch(url, { headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET } }); }
    catch { await sleep(800); continue; }
    if (res.status === 429) { await sleep(1500 + a * 1000); continue; }
    if (!res.ok) return [];
    return (await res.json()).items || [];
  }
  return [];
}

const map = new Map(); // key: 정규화된 상호명
for (const q of QUERIES) {
  const items = await naver(q);
  for (const it of items) {
    const name = strip(it.title);
    const addr = it.roadAddress || it.address || "";
    if (!name) continue;
    if (!/나주/.test(addr)) continue; // 나주 밖 제외
    const key = name.replace(/\s/g, "");
    const rec = {
      name,
      category: it.category || "",
      address: strip(addr),
      jibun: strip(it.address || ""),
      lat: it.mapy ? +(+it.mapy / 1e7).toFixed(6) : null,
      lng: it.mapx ? +(+it.mapx / 1e7).toFixed(6) : null,
      link: it.link || "",
      tel: it.telephone || "",
      foundBy: [q],
    };
    if (map.has(key)) { map.get(key).foundBy.push(q); }
    else map.set(key, rec);
  }
  console.log(`${q}: ${items.length}건 (누적 고유 ${map.size})`);
  await sleep(120);
}

const list = [...map.values()];
writeFileSync("data/naju_spots_raw.json", JSON.stringify(list, null, 1), "utf-8");
console.log(`\n저장: data/naju_spots_raw.json (고유 ${list.length}곳)`);
console.log("=== 카테고리 분포 ===");
const cc = {};
for (const r of list) { const c = r.category.split(">")[0] || "기타"; cc[c] = (cc[c] || 0) + 1; }
for (const [k, v] of Object.entries(cc).sort((a, b) => b[1] - a[1])) console.log(`  ${v}  ${k}`);
