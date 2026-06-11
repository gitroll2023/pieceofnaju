// 보정 완료된 data/naju_merchants.json → 앱이 import할 src/lib/data/merchants.generated.json
// 업종(159종)을 큰 카테고리로 그룹화, 혜택 키 매핑, 좌표 검증.
// 실행: node scripts/build_merchants.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const rows = JSON.parse(readFileSync("data/naju_merchants.json", "utf-8"));

// 업종 → 카테고리 (키워드 규칙)
const CAT_RULES = [
  ["food", ["한식", "음식점", "분식", "중식", "일식", "양식", "횟집", "갈비", "고기", "치킨", "호프", "주점", "뷔페", "면", "국밥", "백반", "포장마차", "식당", "곱창", "족발", "보쌈", "오리", "장어"]],
  ["cafe", ["커피", "음료", "제과", "베이커리", "빵", "아이스크림", "디저트", "카페", "찻집"]],
  ["grocery", ["농.수.축산", "농수축산", "정육", "청과", "수산", "기타 식품", "식료품", "반찬", "떡", "건강식품", "농산물"]],
  ["mart", ["편의점", "슈퍼", "마트", "잡화", "할인점"]],
  ["beauty", ["미용", "피부", "네일", "이용원", "화장품", "에스테틱", "왁싱", "두피"]],
  ["edu", ["학원", "교습", "어학", "독서실", "교육", "보습", "유치원", "어린이집"]],
  ["medical", ["의원", "치과", "한의원", "약국", "병원", "의료", "안경", "동물병원", "한약"]],
  ["car", ["차량", "주유소", "세차", "카센터", "타이어", "정비", "자동차", "주차"]],
  ["fashion", ["기성복", "신발", "의류", "이불", "가방", "악세", "패션", "양품", "포목", "한복"]],
  ["leisure", ["레저", "찜질", "목욕", "캠핑", "글램핑", "펜션", "모텔", "숙박", "노래", "당구", "스크린", "골프", "헬스", "체육", "PC", "오락"]],
  ["life", ["인쇄", "광고", "수리", "세탁", "철물", "건축자재", "화원", "가구", "가전", "꽃", "사진", "문구", "공구", "전기", "설비", "인테리어", "도장", "표구", "열쇠"]],
];
function categorize(theme) {
  const t = theme || "";
  for (const [key, kws] of CAT_RULES) if (kws.some((k) => t.includes(k))) return key;
  return "etc";
}

const PROG_MAP = { "고유가 피해지원금": "goyuga", "온누리": "onnuri", "전통시장": "market" };
function progKeys(s) {
  return (s || "").split("|").map((x) => PROG_MAP[x.trim()]).filter(Boolean);
}

const out = [];
let dropped = 0;
for (const r of rows) {
  const lat = +r.lat, lng = +r.lng;
  if (!r.name || !isFinite(lat) || !isFinite(lng)) { dropped++; continue; }
  out.push({
    id: r.merchant_no || `${r.name}-${r.dong}`,
    n: r.name,
    d: r.dong || "",
    a: r.address || `전남 나주시 ${r.dong || ""}`.trim(),
    lat: +lat.toFixed(6),
    lng: +lng.toFixed(6),
    t: r.theme || "",
    c: categorize(r.theme),
    p: progKeys(r.programs),
    geo: r.geo || "dong",
    tel: r.phone || "",
  });
}

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/merchants.json", JSON.stringify(out), "utf-8");

// 요약
const byCat = {}, byProg = {}, geoCnt = {};
for (const m of out) {
  byCat[m.c] = (byCat[m.c] || 0) + 1;
  m.p.forEach((p) => (byProg[p] = (byProg[p] || 0) + 1));
  geoCnt[m.geo] = (geoCnt[m.geo] || 0) + 1;
}
console.log(`생성: src/lib/data/merchants.generated.json (${out.length}건, 제외 ${dropped})`);
console.log("카테고리:", byCat);
console.log("혜택:", byProg);
console.log("좌표출처:", geoCnt);
