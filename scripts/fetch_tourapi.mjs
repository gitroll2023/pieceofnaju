// 한국관광공사 TourAPI (KorService2) — 나주 관광지·문화시설·레저·축제 수집
//
// 사용법 (키는 파일에 박지 않고 환경변수로):
//   TOUR_API_KEY=발급키 node scripts/fetch_tourapi.mjs
//
// 산출물 (data/ — git 비추적 권장):
//   data/tourapi_naju_raw.json   : 원본(목록+개요+이미지)
//   data/tourapi_spots.json      : 우리 Spot 스키마 근사 변환(검수 후 spots.json 병합)
//   data/tourapi_festivals.json  : 축제(이벤트) 목록
//
// 제약: 개발계정 일 1,000회/오퍼레이션. 목록 페이징 + 항목별 개요는 수십 건이라 한도 내.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const KEY = process.env.TOUR_API_KEY;
if (!KEY) {
  console.error("TOUR_API_KEY 환경변수가 필요합니다. 예) TOUR_API_KEY=xxxx node scripts/fetch_tourapi.mjs");
  process.exit(1);
}

const BASE = "https://apis.data.go.kr/B551011/KorService2";
const AREA_JEONNAM = "38"; // 전라남도
const COMMON = `serviceKey=${KEY}&MobileOS=ETC&MobileApp=najuhanjogak&_type=json`;

// contentTypeId: 12 관광지 · 14 문화시설 · 28 레저스포츠 · 15 축제공연행사 · 25 여행코스 · 38 쇼핑 · 39 음식
const CONTENT_TYPES = [
  { id: "12", label: "관광지" },
  { id: "14", label: "문화시설" },
  { id: "28", label: "레저스포츠" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(op, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/${op}?${COMMON}&${qs}`;
  const r = await fetch(url);
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`${op} HTTP ${r.status}: ${body.slice(0, 120)}`);
  }
  const j = await r.json();
  const header = j?.response?.header;
  if (header && header.resultCode !== "0000") {
    throw new Error(`${op} API ${header.resultCode}: ${header.resultMsg}`);
  }
  const body = j?.response?.body ?? {};
  const items = body?.items?.item ?? [];
  return { items: Array.isArray(items) ? items : [items], total: Number(body.totalCount || 0) };
}

// 나주 시군구코드 탐색 (전남 안에서 '나주' 매칭). 실패 시 페이지 전수로 폴백.
async function findNajuSigungu() {
  try {
    const { items } = await api("areaCode2", { areaCode: AREA_JEONNAM, numOfRows: "50", pageNo: "1" });
    const naju = items.find((x) => String(x.name).includes("나주"));
    if (naju) {
      console.log(`나주 시군구코드 = ${naju.code} (${naju.name})`);
      return naju.code;
    }
  } catch (e) {
    console.warn("areaCode2 실패, 주소 필터 폴백:", e.message);
  }
  return null; // null이면 areaCode만으로 받고 주소에 '나주' 포함으로 거른다
}

async function listType(typeId, sigunguCode) {
  const out = [];
  for (let page = 1; page < 30; page++) {
    const params = {
      areaCode: AREA_JEONNAM,
      contentTypeId: typeId,
      arrange: "C", // 수정일순
      numOfRows: "100",
      pageNo: String(page),
    };
    if (sigunguCode) params.sigunguCode = sigunguCode;
    const { items, total } = await api("areaBasedList2", params);
    for (const it of items) {
      if (!sigunguCode && !String(it.addr1 || "").includes("나주")) continue;
      out.push(it);
    }
    await sleep(120);
    if (page * 100 >= total) break;
  }
  return out;
}

async function overview(contentId, contentTypeId) {
  try {
    const { items } = await api("detailCommon2", {
      contentId,
      // KorService2 detailCommon2는 overview/주소/좌표 기본 포함
      numOfRows: "1",
      pageNo: "1",
    });
    return items[0] || null;
  } catch {
    return null;
  }
}

async function festivals(sigunguCode) {
  // 올해 1년치 행사
  const out = [];
  for (let page = 1; page < 20; page++) {
    const params = {
      areaCode: AREA_JEONNAM,
      eventStartDate: "20260101",
      arrange: "A",
      numOfRows: "100",
      pageNo: String(page),
    };
    if (sigunguCode) params.sigunguCode = sigunguCode;
    const { items, total } = await api("searchFestival2", params);
    for (const it of items) {
      if (!sigunguCode && !String(it.addr1 || "").includes("나주")) continue;
      out.push(it);
    }
    await sleep(120);
    if (page * 100 >= total) break;
  }
  return out;
}

// TourAPI → 우리 Spot 스키마 근사. cat은 검수 후 보정 전제(일단 contentType 기준).
const TYPE_TO_CAT = { "12": "기타", "14": "박물관미술관", "28": "체험", "15": "축제" };

function toSpot(it, typeId, ov) {
  const lng = Number(it.mapx);
  const lat = Number(it.mapy);
  return {
    id: `tour_${it.contentid}`,
    n: it.title,
    cat: TYPE_TO_CAT[typeId] || "기타",
    summary: (ov?.overview || "").replace(/<[^>]+>/g, "").trim().slice(0, 400),
    highlights: [],
    season: "",
    flower: "",
    tip: "",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    a: it.addr1 || "",
    _img: (it.firstimage || "").replace(/^http:/, "https:"),
    _cat: [it.cat1, it.cat2, it.cat3].filter(Boolean).join("/"),
    _src: "tourapi",
  };
}

async function main() {
  console.log("TourAPI 나주 수집 시작…");
  const sigungu = await findNajuSigungu();

  const raw = { spots: {}, festivals: [] };
  const spots = [];

  for (const t of CONTENT_TYPES) {
    const list = await listType(t.id, sigungu);
    console.log(`[${t.label}] ${list.length}건`);
    raw.spots[t.label] = list;
    // 개요는 좌표 있는 것만(노이즈 제거), 최대 60건/타입으로 한도 보호
    let enriched = 0;
    for (const it of list) {
      const ov = enriched < 60 ? await overview(it.contentid, t.id) : null;
      if (ov) { enriched++; await sleep(100); }
      spots.push(toSpot(it, t.id, ov));
    }
  }

  const fests = await festivals(sigungu);
  console.log(`[축제] ${fests.length}건`);
  raw.festivals = fests;
  const festivalsOut = fests.map((it) => ({
    id: `fest_${it.contentid}`,
    n: it.title,
    start: it.eventstartdate,
    end: it.eventenddate,
    a: it.addr1 || "",
    lat: Number(it.mapy) || null,
    lng: Number(it.mapx) || null,
    img: it.firstimage || "",
  }));

  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "tourapi_naju_raw.json"), JSON.stringify(raw, null, 1));
  await writeFile(path.join(dir, "tourapi_spots.json"), JSON.stringify(spots, null, 1));
  await writeFile(path.join(dir, "tourapi_festivals.json"), JSON.stringify(festivalsOut, null, 1));

  console.log(`\n완료: 관광 ${spots.length}건 / 축제 ${festivalsOut.length}건 → data/tourapi_*.json`);
  const withGeo = spots.filter((s) => s.lat && s.lng).length;
  console.log(`좌표 보유 ${withGeo}/${spots.length}`);
}

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
