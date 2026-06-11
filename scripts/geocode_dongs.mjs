// 나주 동·읍·면 좌표 지오코딩 (OSM Nominatim, 무료/키없음)
// 실행: node scripts/geocode_dongs.mjs  → data/dong_coords.json
import { readFileSync, writeFileSync } from "node:fs";

const NAJU_CENTER = { lat: 35.0292, lng: 126.7173 };
const merchants = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));
const dongs = [...new Set(merchants.map((m) => m.dong).filter(Boolean))].sort();
console.log("동 수:", dongs.length);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};

for (const dong of dongs) {
  const q = encodeURIComponent(`전라남도 나주시 ${dong}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=kr`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "najuhanjogak-geocoder/1.0 (local guide project)" },
    });
    const arr = await res.json();
    if (arr && arr[0]) {
      out[dong] = { lat: +(+arr[0].lat).toFixed(6), lng: +(+arr[0].lon).toFixed(6), src: "osm" };
      console.log(`✓ ${dong} -> ${out[dong].lat}, ${out[dong].lng}`);
    } else {
      out[dong] = { ...NAJU_CENTER, src: "fallback" };
      console.log(`× ${dong} -> fallback(center)`);
    }
  } catch (e) {
    out[dong] = { ...NAJU_CENTER, src: "error" };
    console.log(`! ${dong} -> error ${e.message}`);
  }
  await sleep(1100); // Nominatim 정책: 1req/sec
}

writeFileSync("data/dong_coords.json", JSON.stringify(out, null, 1), "utf-8");
const ok = Object.values(out).filter((v) => v.src === "osm").length;
console.log(`\n저장: data/dong_coords.json (성공 ${ok}/${dongs.length})`);
