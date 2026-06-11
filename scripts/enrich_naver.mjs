// 가맹점 상호 → 네이버 지역검색으로 실주소·정확좌표 보정
// 실행: NAVER_CLIENT_ID=.. NAVER_CLIENT_SECRET=.. node scripts/enrich_naver.mjs [limit]
import { readFileSync, writeFileSync } from "node:fs";

const ID = process.env.NAVER_CLIENT_ID;
const SECRET = process.env.NAVER_CLIENT_SECRET;
if (!ID || !SECRET) { console.error("NAVER_CLIENT_ID/SECRET 없음"); process.exit(1); }

const merchants = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));
const LIMIT = process.argv[2] ? +process.argv[2] : merchants.length;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => String(s || "").replace(/<\/?b>/g, "").trim();

async function naver(query) {
  const url = "https://openapi.naver.com/v1/search/local.json?display=5&query=" + encodeURIComponent(query);
  for (let a = 0; a < 6; a++) {
    let res;
    try {
      res = await fetch(url, { headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET } });
    } catch { await sleep(800); continue; }
    if (res.status === 429) { await sleep(1500 + a * 1000); continue; }
    if (!res.ok) return null;
    const j = await res.json();
    return j.items || [];
  }
  return null;
}

function pick(items, dong) {
  if (!items || !items.length) return null;
  const addr = (d) => (d.address || "") + " " + (d.roadAddress || "");
  return (
    items.find((d) => addr(d).includes(dong)) ||
    items.find((d) => addr(d).includes("나주시")) ||
    null
  );
}

let hit = 0, miss = 0, done = 0;

function saveAll() {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["name", "dong", "address", "lat", "lng", "geo", "theme", "programs", "phone", "merchant_no"];
  const csv = "﻿" + [header.join(",")].concat(merchants.map((r) => header.map((h) => esc(r[h])).join(","))).join("\n");
  writeFileSync("data/naju_merchants.csv", csv, "utf-8");
  writeFileSync("data/naju_merchants.json", JSON.stringify(merchants, null, 1), "utf-8");
}

const target = merchants.slice(0, LIMIT);
for (const m of target) {
  let items = await naver(`나주 ${m.name}`);
  let d = pick(items, m.dong);
  if (!d) { await sleep(110); items = await naver(`${m.name} ${m.dong}`); d = pick(items, m.dong); }
  if (d) {
    m.address = strip(d.roadAddress || d.address);
    m.lng = +(+d.mapx / 1e7).toFixed(6);
    m.lat = +(+d.mapy / 1e7).toFixed(6);
    m.geo = "naver";
    if (!m.phone && d.telephone) m.phone = d.telephone;
    hit++;
  } else {
    m.geo = m.geo === "naver" ? "naver" : "dong"; // 미스는 기존 동좌표 유지
    miss++;
  }
  done++;
  if (done % 100 === 0) { console.log(`...${done}/${LIMIT}  네이버매칭 ${hit} · 폴백 ${miss}`); saveAll(); }
  await sleep(110);
}
saveAll();
console.log(`\n완료: ${done}건 | 네이버 실주소매칭 ${hit} (${(hit / done * 100).toFixed(1)}%) · 동폴백 ${miss}`);
if (LIMIT <= 20) for (const m of target) console.log(`${m.geo === "naver" ? "✓" : "·"} ${m.name} | ${m.address} | ${m.lat},${m.lng}`);
