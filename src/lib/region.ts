// 나주 권역(district) — 상권 불균형 해소용 노출 가중치.
// 혁신도시(평상시 붐빔)는 억제, 원도심·영산포·면지역은 끌어올린다.
// 분류는 동/읍/면 문자열 또는 주소 문자열 어느 쪽이든 받는다(둘 다 부분일치).

export type Region = "innovation" | "oldtown" | "yeongsanpo" | "nampyeong" | "myeon";

export const REGION_META: Record<Region, { label: string; weight: number }> = {
  yeongsanpo: { label: "영산포", weight: 1.6 },
  myeon: { label: "면지역", weight: 1.4 },
  oldtown: { label: "원도심", weight: 1.3 },
  nampyeong: { label: "남평", weight: 1.1 },
  innovation: { label: "혁신도시", weight: 0.55 },
};

export const REGION_ORDER: Region[] = [
  "yeongsanpo", "oldtown", "myeon", "nampyeong", "innovation",
];

// 매주 바뀌는 스포트라이트 권역(혁신도시 제외). 같은 주엔 결정적.
const SPOTLIGHT_POOL: Region[] = ["yeongsanpo", "oldtown", "myeon", "nampyeong"];

const YEONGSANPO = ["영산동", "이창동", "삼영동", "영강동", "부덕동"];

/** 동/읍/면 또는 주소 문자열 → 권역. 미분류는 oldtown 폴백(혁신도시로 새지 않게). */
export function regionOf(dongOrAddr: string): Region {
  const s = dongOrAddr || "";
  if (s.includes("빛가람")) return "innovation";
  if (s.includes("남평")) return "nampyeong";
  if (YEONGSANPO.some((d) => s.includes(d))) return "yeongsanpo";
  if (s.includes("면")) return "myeon"; // 'X면'(다시면·반남면 등)
  return "oldtown";
}

export const regionWeight = (dongOrAddr: string) => REGION_META[regionOf(dongOrAddr)].weight;

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function spotlightRegion(d: Date = new Date()): Region {
  return SPOTLIGHT_POOL[isoWeek(d) % SPOTLIGHT_POOL.length];
}

// id+날짜 결정적 지터(같은 날 새로고침해도 순서 고정, 날짜 바뀌면 순환)
function jitter(id: string, dateKey: string): number {
  let h = 2166136261;
  const s = id + dateKey;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000; // 0~1
}

/**
 * 권역 가중 정렬 스코어(클수록 위). base=품질가점(featured/노포 등, 없으면 1).
 * 스포트라이트 권역은 ×1.5, 결정적 지터로 같은 권역 내 매일 순환.
 */
export function regionScore(
  dongOrAddr: string,
  base = 1,
  now: Date = new Date(),
): number {
  const region = regionOf(dongOrAddr);
  let w = REGION_META[region].weight;
  if (region === spotlightRegion(now)) w *= 1.5;
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return base * w + jitter(dongOrAddr, dateKey) * 0.2;
}
