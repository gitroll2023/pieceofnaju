// KB 나주 가맹점 데이터 타입 + 메타 (실데이터: public/data/merchants.json)

export type MerchantCat =
  | "food" | "cafe" | "grocery" | "mart" | "beauty" | "edu"
  | "medical" | "car" | "fashion" | "leisure" | "life" | "etc";

export type ProgramKey = "goyuga" | "onnuri" | "market";

/** public/data/merchants.json 한 건 (압축 키) */
export interface Merchant {
  id: string;
  n: string;   // 상호
  d: string;   // 동/읍/면
  a: string;   // 주소
  lat: number;
  lng: number;
  t: string;   // 업종(원본)
  c: MerchantCat;
  p: ProgramKey[]; // 혜택
  geo: string; // kakao | dong
  tel: string;
}

export const CATEGORY_META: Record<
  MerchantCat,
  { label: string; emoji: string; color: string }
> = {
  food: { label: "음식점", emoji: "🍚", color: "#d9534f" },
  cafe: { label: "카페·디저트", emoji: "☕", color: "#c98a3b" },
  grocery: { label: "농수축산·식품", emoji: "🥬", color: "#5b9c52" },
  mart: { label: "마트·편의", emoji: "🛒", color: "#3f8fbf" },
  beauty: { label: "미용·뷰티", emoji: "💇", color: "#c563a6" },
  edu: { label: "교육·학원", emoji: "📚", color: "#6a6ad0" },
  medical: { label: "의료·약국", emoji: "💊", color: "#3aa6a0" },
  car: { label: "차량·주유", emoji: "🚗", color: "#5a6b7b" },
  fashion: { label: "패션·잡화", emoji: "👕", color: "#b9772e" },
  leisure: { label: "숙박·레저", emoji: "🛏️", color: "#8c6bb1" },
  life: { label: "생활·서비스", emoji: "🔧", color: "#7d8a52" },
  etc: { label: "기타", emoji: "⋯", color: "#9a9088" },
};

export const CATEGORY_ORDER: MerchantCat[] = [
  "food", "cafe", "grocery", "mart", "beauty", "medical",
  "edu", "car", "fashion", "leisure", "life", "etc",
];

export const PROGRAM_META: Record<
  ProgramKey,
  { label: string; short: string; color: string }
> = {
  goyuga: { label: "고유가 피해지원금", short: "고유가", color: "#e8702a" },
  onnuri: { label: "온누리상품권", short: "온누리", color: "#2f7d4f" },
  market: { label: "전통시장", short: "전통시장", color: "#9c5a2f" },
};

export const PROGRAM_ORDER: ProgramKey[] = ["goyuga", "onnuri", "market"];
