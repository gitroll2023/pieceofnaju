// TourAPI 수집분(data/tourapi_spots.json)을 기존 public/data/spots.json에 병합
// - 기존 큐레이션(summary/highlights/season/flower/tip) 보존
// - 겹치는 곳: 이미지(img)만 보강
// - 순수 신규: cat 매핑해 추가
// 실행: node scripts/merge_tourapi.mjs   (TourAPI 키 불필요 — 로컬 파일만)

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const exPath = path.join(root, "public", "data", "spots.json");
const toPath = path.join(root, "data", "tourapi_spots.json");

const ex = JSON.parse(await readFile(exPath, "utf8"));
const to = JSON.parse(await readFile(toPath, "utf8"));

const norm = (s) => String(s).replace(/\(.*?\)/g, "").replace(/[\s·]/g, "").replace(/나주/g, "");
const hav = (a, b, c, d) => {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dl = r(c - a), dn = r(d - b);
  const x = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// TourAPI cat 코드(_cat = cat1/cat2/cat3) → 우리 SPOT_CAT 매핑
function mapCat(t) {
  const name = t.n || "";
  const [c1, c2, c3] = (t._cat || "").split("/");
  if (name.includes("등대")) return "문화재";          // 영산포 등대=근대문화유산
  if (name.includes("전망")) return "전망";
  if (c3 === "A02010800") return "사찰";                // 사찰
  if (c2 === "A0201") return "문화재";                  // 역사관광지
  if (c2 === "A0202") return "공원";                    // 휴양관광지(공원/수목원)
  if (c2 === "A0203") return "체험";                    // 체험관광지(거리/마을/돛배)
  if (c2 === "A0204") return "박물관미술관";            // 문화시설/공연
  if (c2 === "A0205") return "기타";                    // 산업관광지
  if (c2 === "A0206") return "박물관미술관";            // 박물관/문화원
  if (c1 === "A01") return "자연";                      // 자연관광지
  if (c1 === "A03") return "체험";                      // 레저
  return "기타";
}

let enriched = 0, added = 0;
const before = ex.length;

for (const t of to) {
  if (!t.lat || !t.lng) continue;
  const nT = norm(t.n);
  const match = ex.find(
    (e) => norm(e.n) === nT || (e.lat && hav(e.lat, e.lng, t.lat, t.lng) < 0.18),
  );
  if (match) {
    if (!match.img && t._img) { match.img = t._img; enriched++; }
  } else {
    ex.push({
      id: t.id,
      n: t.n,
      cat: mapCat(t),
      summary: t.summary || "",
      highlights: [],
      season: "",
      flower: "",
      tip: "",
      lat: t.lat,
      lng: t.lng,
      a: t.a || "",
      img: t._img || "",
      src: "tourapi",
    });
    added++;
  }
}

await writeFile(exPath, JSON.stringify(ex, null, 1));

// 리포트
const dist = {};
for (const s of ex) dist[s.cat] = (dist[s.cat] || 0) + 1;
const withImg = ex.filter((s) => s.img).length;
console.log(`병합 완료: ${before} → ${ex.length}건 (신규 ${added}, 이미지보강 ${enriched})`);
console.log(`이미지 보유: ${withImg}/${ex.length}`);
console.log("cat 분포:", JSON.stringify(dist));
