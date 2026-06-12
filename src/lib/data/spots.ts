// 나주 관광지·명소 (실데이터: public/data/spots.json) + 꽃 캘린더(flowers.json)

export interface Spot {
  id: string;
  n: string; // 이름
  cat: string; // 분류(문화재/사찰/박물관미술관/자연/꽃명소/전망카페/체험/축제/공원/전망/기타)
  summary: string;
  highlights: string[];
  season: string;
  flower: string;
  tip: string;
  lat: number;
  lng: number;
  a: string; // 주소
  img?: string; // 대표 이미지(공공누리, TourAPI 출처)
  src?: string; // 출처 태그(tourapi 등)
  insta?: string; // 해당 장소 인스타그램 URL(있으면 카드에 연결)
}

export interface Flower {
  flower: string;
  where: string;
  when: string;
  note: string;
}

export const SPOT_CAT_META: Record<string, { emoji: string; color: string }> = {
  문화재: { emoji: "🏛️", color: "#8c6b3f" },
  박물관미술관: { emoji: "🖼️", color: "#6a6ad0" },
  사찰: { emoji: "⛩️", color: "#b5733a" },
  꽃명소: { emoji: "🌸", color: "#d168a0" },
  자연: { emoji: "⛰️", color: "#5b9c52" },
  전망카페: { emoji: "☕", color: "#c98a3b" },
  양조장: { emoji: "🍺", color: "#b9772e" },
  전망: { emoji: "🔭", color: "#3f8fbf" },
  체험: { emoji: "🧶", color: "#2f9d8f" },
  레저: { emoji: "🎢", color: "#8c6bb1" },
  축제: { emoji: "🎉", color: "#d9534f" },
  공원: { emoji: "🌳", color: "#5b9c52" },
  기타: { emoji: "📍", color: "#9a9088" },
};

export function spotMeta(cat: string) {
  return SPOT_CAT_META[cat] ?? SPOT_CAT_META["기타"];
}

export const SPOT_CAT_ORDER = [
  "전체", "문화재", "박물관미술관", "사찰", "자연", "꽃명소", "전망카페", "체험", "축제",
];

// 월(1~12) → 그 달에 볼 만한 꽃 필터용 (when 문자열에서 월 추출)
export function flowerMonths(when: string): number[] {
  const months: number[] = [];
  const re = /(\d{1,2})\s*월/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(when))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 12) months.push(n);
  }
  return months;
}
