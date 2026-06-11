// 동단위 폴백(geo!=='naver')만 네이버로 재시도 — 상호명 정리 + 질의 변형으로 추가 매칭
// 실행: NAVER_CLIENT_ID=.. NAVER_CLIENT_SECRET=.. node scripts/enrich_naver_retry.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ID = process.env.NAVER_CLIENT_ID, SECRET = process.env.NAVER_CLIENT_SECRET;
if (!ID || !SECRET) { console.error("NAVER 키 없음"); process.exit(1); }

const merchants = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => String(s || "").replace(/<\/?b>/g, "").trim();
const clean = (name) => name.replace(/\([^)]*\)/g, "").replace(/（[^）]*）/g, "").replace(/\s+/g, " ").trim();

async function naver(query) {
  const url = "https://openapi.naver.com/v1/search/local.json?display=5&query=" + encodeURIComponent(query);
  for (let a = 0; a < 6; a++) {
    let res;
    try { res = await fetch(url, { headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET } }); }
    catch { await sleep(800); continue; }
    if (res.status === 429) { await sleep(1500 + a * 1000); continue; }
    if (!res.ok) return null;
    return (await res.json()).items || [];
  }
  return null;
}
function pick(items, dong) {
  if (!items || !items.length) return null;
  const addr = (d) => (d.address || "") + " " + (d.roadAddress || "");
  return items.find((d) => addr(d).includes(dong)) || items.find((d) => addr(d).includes("나주시")) || null;
}
function saveAll() {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["name", "dong", "address", "lat", "lng", "geo", "theme", "programs", "phone", "merchant_no"];
  const csv = "﻿" + [header.join(",")].concat(merchants.map((r) => header.map((h) => esc(r[h])).join(","))).join("\n");
  writeFileSync("data/naju_merchants.csv", csv, "utf-8");
  writeFileSync("data/naju_merchants.json", JSON.stringify(merchants, null, 1), "utf-8");
}

const targets = merchants.filter((m) => m.geo !== "naver");
console.log(`재시도 대상(동단위): ${targets.length}건`);
let recovered = 0, done = 0;

for (const m of targets) {
  const cn = clean(m.name);
  const variants = [];
  if (cn && cn !== m.name) variants.push(`나주 ${cn}`);
  variants.push(`${m.name} ${m.dong}`);
  if (cn && cn !== m.name) variants.push(`${cn} ${m.dong}`);
  variants.push(`나주시 ${m.name}`);

  let d = null;
  for (const v of variants) {
    const items = await naver(v);
    d = pick(items, m.dong);
    await sleep(110);
    if (d) break;
  }
  if (d) {
    m.address = strip(d.roadAddress || d.address);
    m.lng = +(+d.mapx / 1e7).toFixed(6);
    m.lat = +(+d.mapy / 1e7).toFixed(6);
    m.geo = "naver";
    if (!m.phone && d.telephone) m.phone = d.telephone;
    recovered++;
  }
  done++;
  if (done % 100 === 0) { console.log(`...${done}/${targets.length}  추가매칭 ${recovered}`); saveAll(); }
}
saveAll();
const naverTotal = merchants.filter((m) => m.geo === "naver").length;
console.log(`\n완료: 재시도 ${done}건 중 추가매칭 ${recovered}건 | 전체 정밀좌표 ${naverTotal}/${merchants.length} (${(naverTotal / merchants.length * 100).toFixed(1)}%)`);
