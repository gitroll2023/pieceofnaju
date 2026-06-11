// 정밀 지오코딩(카카오) 전, 전 가맹점에 '동 중심 + 결정적 지터' 좌표 부여.
// (카카오 할당량 리셋 후 enrich_kakao 로 정밀 주소 덧입히기 가능)
import { readFileSync, writeFileSync } from "node:fs";

const merchants = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));
const coords = JSON.parse(readFileSync("data/dong_coords.json", "utf-8"));
const CENTER = { lat: 35.0292, lng: 126.7173 };

// 동별 인덱스로 골고루 흩뿌리기(나선 배치)
const perDong = {};
let n = 0;
for (const m of merchants) {
  if (m.geo === "kakao" && m.lat) continue; // 이미 정밀이면 보존
  const c = coords[m.dong] || CENTER;
  const i = (perDong[m.dong] = (perDong[m.dong] || 0) + 1);
  const a = i * 2.399963; // 황금각 나선
  const r = 0.0007 + Math.sqrt(i) * 0.00022; // 점 많을수록 넓게
  m.lat = +(c.lat + Math.sin(a) * r).toFixed(6);
  m.lng = +(c.lng + Math.cos(a) * r).toFixed(6);
  m.address = m.address && m.address.includes("나주시") && m.geo === "kakao" ? m.address : `전남 나주시 ${m.dong}`;
  m.geo = m.geo === "kakao" ? "kakao" : "dong";
  n++;
}

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const header = ["name", "dong", "address", "lat", "lng", "geo", "theme", "programs", "phone", "merchant_no"];
const csv = "﻿" + [header.join(",")].concat(merchants.map((r) => header.map((h) => esc(r[h])).join(","))).join("\n");
writeFileSync("data/naju_merchants.csv", csv, "utf-8");
writeFileSync("data/naju_merchants.json", JSON.stringify(merchants, null, 1), "utf-8");
console.log(`동 좌표 부여: ${n}건 / 전체 ${merchants.length}건`);
