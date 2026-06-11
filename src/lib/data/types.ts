// 나주한조각 — 도메인 타입

export type Category = "food" | "cafe" | "spot";

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string; colorVar: string }
> = {
  food: { label: "맛집", emoji: "🍲", colorVar: "var(--cat-food)" },
  cafe: { label: "카페", emoji: "☕", colorVar: "var(--cat-cafe)" },
  spot: { label: "관광", emoji: "📷", colorVar: "var(--cat-spot)" },
};

// 나주 권역(동·읍·면) — 가이드 지도 그룹핑 기준
export type RegionKey =
  | "wondosim"
  | "yeongsanpo"
  | "innovation"
  | "bannam"
  | "dasi";

export const REGION_ORDER: RegionKey[] = [
  "wondosim",
  "yeongsanpo",
  "innovation",
  "bannam",
  "dasi",
];

export const REGION_META: Record<
  RegionKey,
  { label: string; admin: string; note: string }
> = {
  wondosim: { label: "원도심", admin: "금성·송월동", note: "곰탕거리·금성관" },
  yeongsanpo: { label: "영산포", admin: "영산·이창동", note: "홍어거리·등대" },
  innovation: { label: "혁신도시", admin: "빛가람동", note: "호수공원·카페" },
  bannam: { label: "반남면", admin: "반남면", note: "고분군·박물관" },
  dasi: { label: "다시면", admin: "다시·구진포", note: "영산강·장어" },
};

export type AgeGroup = "20" | "30" | "40" | "50";

export const AGE_META: Record<
  AgeGroup,
  { label: string; persona: string; vibe: string }
> = {
  "20": { label: "20대", persona: "혁신도시 직장인", vibe: "퇴근 후 감성·데이트" },
  "30": { label: "30대", persona: "주말 나들이 가족", vibe: "아이와 함께 여유" },
  "40": { label: "40대", persona: "짧게 들른 방문자", vibe: "핵심 향토맛 압축" },
  "50": { label: "50대", persona: "향수를 찾는 여행", vibe: "옛 정취·전통시장" },
};

export interface Place {
  id: string;
  name: string;
  category: Category;
  /** 짧은 한 줄 소개 (큐레이션 카피) */
  tagline: string;
  /** 에디터 코멘트 — 향토색 있는 문장 */
  editorNote: string;
  address: string;
  /** 영업/이용 안내 */
  hours?: string;
  /** 대표 메뉴/포인트 태그 */
  tags: string[];
  /** 대표 메뉴 (가격은 공개자료 기반 근사·변동 가능) */
  menu?: { name: string; price?: string; signature?: boolean }[];
  /** 별점(공개자료 기반 근사) */
  rating: number;
  lat: number;
  lng: number;
  /** 카드 배경에 쓰는 대표 색(브랜드 톤) */
  accent: string;
  /** 동네/권역 표시명 */
  area: string;
  /** 동·읍·면 권역 키 (가이드 지도 그룹핑) */
  region: RegionKey;
}

export interface CourseStop {
  placeId: string;
  /** 추천 방문 시간대 라벨 */
  time: string;
  /** 이 코스에서 이 장소를 추천하는 이유 */
  why: string;
}

export interface Course {
  id: string;
  age: AgeGroup;
  title: string;
  summary: string;
  /** 소요 시간/이동 안내 */
  duration: string;
  stops: CourseStop[];
}
