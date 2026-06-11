// 가맹점 상호 → 카카오 장소검색으로 실주소·정확좌표 보정
// 실행: KAKAO_REST_KEY=... node scripts/enrich_kakao.mjs [limit]
import { readFileSync, writeFileSync } from "node:fs";

const REST = process.env.KAKAO_REST_KEY;
if (!REST) { console.error("KAKAO_REST_KEY 없음"); process.exit(1); }

const merchants = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));
const coords = JSON.parse(readFileSync("data/dong_coords.json", "utf-8"));
const CENTER = { lat: 35.0292, lng: 126.7173 };
const LIMIT = process.argv[2] ? +process.argv[2] : merchants.length;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function kakao(query) {
  const url = "https://dapi.kakao.com/v2/local/search/keyword.json?size=5&query=" + encodeURIComponent(query);
  for (let a = 0; a < 9; a++) {
    let res;
    try { res = await fetch(url, { headers: { Authorization: "KakaoAK " + REST } }); }
    catch { await sleep(800); continue; }
    if (res.status === 429) { await sleep(1500 + a * 1000); continue; } // 강한 백오프
    if (!res.ok) return null;
    const j = await res.json();
    return j.documents || [];
  }
  return null; // 9회 모두 throttle → 폴백
}

function pick(docs, dong) {
  if (!docs || !docs.length) return null;
  const addr = (d) => (d.address_name || "") + " " + (d.road_address_name || "");
  return (
    docs.find((d) => addr(d).includes(dong)) ||
    docs.find((d) => addr(d).includes("나주시")) ||
    null
  );
}

// 폴백용 동중심 + 결정적 지터(겹침 방지)
function jittered(dong, i) {
  const c = coords[dong] || CENTER;
  const a = (i * 2.399963) % (Math.PI * 2);
  const r = 0.0008 + ((i * 37) % 100) / 100 * 0.0016;
  return { lat: +(c.lat + Math.sin(a) * r).toFixed(6), lng: +(c.lng + Math.cos(a) * r).toFixed(6) };
}

let kHit = 0, fb = 0, done = 0;
const CONC = 1; // 순차 (카카오 초당제한 회피)

async function worker(slice, baseIdx) {
  for (let j = 0; j < slice.length; j++) {
    const m = slice[j];
    const i = baseIdx + j;
    let docs = await kakao(`나주 ${m.name}`);
    let d = pick(docs, m.dong);
    if (!d) { docs = await kakao(`${m.name} ${m.dong}`); d = pick(docs, m.dong); }
    if (d) {
      m.address = d.road_address_name || d.address_name;
      m.lat = +(+d.y).toFixed(6); m.lng = +(+d.x).toFixed(6);
      m.geo = "kakao";
      kHit++;
    } else {
      const p = jittered(m.dong, i);
      m.address = `전남 나주시 ${m.dong}`;
      m.lat = p.lat; m.lng = p.lng; m.geo = "dong";
      fb++;
    }
    done++;
    if (done % 100 === 0) { console.log(`...${done}/${LIMIT}  카카오매칭 ${kHit} · 폴백 ${fb}`); saveAll(); }
    await sleep(120);
  }
}

function saveAll() {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["name", "dong", "address", "lat", "lng", "geo", "theme", "programs", "phone", "merchant_no"];
  const csv = "﻿" + [header.join(",")]
    .concat(merchants.map((r) => header.map((h) => esc(r[h])).join(","))).join("\n");
  writeFileSync("data/naju_merchants.csv", csv, "utf-8");
  writeFileSync("data/naju_merchants.json", JSON.stringify(merchants, null, 1), "utf-8");
}

const target = merchants.slice(0, LIMIT);
const chunk = Math.ceil(target.length / CONC);
await Promise.all(
  Array.from({ length: CONC }, (_, w) => worker(target.slice(w * chunk, (w + 1) * chunk), w * chunk))
);
saveAll();
console.log(`\n완료: ${done}건 | 카카오 실주소매칭 ${kHit} (${(kHit / done * 100).toFixed(1)}%) · 동폴백 ${fb}`);
if (LIMIT <= 12) {
  console.log("\n=== 샘플 ===");
  for (const m of target) console.log(`${m.geo === "kakao" ? "✓" : "·"} ${m.name} | ${m.address} | ${m.lat},${m.lng}`);
}
