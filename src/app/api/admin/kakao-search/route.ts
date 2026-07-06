import { isAdmin } from "@/lib/auth";
import { NAJU_CENTER } from "@/lib/kakao";
import { CATEGORY_META, type Merchant } from "@/lib/data/merchants";
import merchantsData from "@/data/merchants.json";

type KakaoDoc = {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
};
const ALL = merchantsData as unknown as Merchant[];

export type SearchResult = {
  name: string; address: string; lat: number; lng: number;
  known: boolean; merchantId?: string; cat?: string; catLabel?: string; catEmoji?: string;
};

// 관리자 — 내조각 등록용 주소/가게 검색.
// 1) 사이트에 이미 등록된 가게(merchants.json, 공공데이터 기반)를 먼저 찾아 "등록된 가게"로 표시
// 2) 거기 없는 곳은 카카오 전체 검색으로 보완(주소만 있는 곳도 등록 가능)
export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 1) return Response.json({ results: [] });

  const known: SearchResult[] = ALL.filter((m) => m.n.includes(q))
    .slice(0, 8)
    .map((m) => {
      const meta = CATEGORY_META[m.c];
      return {
        name: m.n, address: m.a, lat: m.lat, lng: m.lng,
        known: true, merchantId: m.id, cat: m.c, catLabel: meta?.label, catEmoji: meta?.emoji,
      };
    });
  const knownNames = new Set(known.map((k) => k.name));

  const key = process.env.KAKAO_REST_KEY;
  let kakaoResults: SearchResult[] = [];
  if (key) {
    try {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&x=${NAJU_CENTER.lng}&y=${NAJU_CENTER.lat}&radius=20000&size=10`;
      const r = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
      if (r.ok) {
        const d = await r.json();
        kakaoResults = ((d.documents || []) as KakaoDoc[])
          .filter((doc) => !knownNames.has(doc.place_name))
          .map((doc) => ({
            name: doc.place_name,
            address: doc.road_address_name || doc.address_name,
            lat: Number(doc.y),
            lng: Number(doc.x),
            known: false,
          }));
      }
    } catch {
      // 카카오 검색 실패해도 사이트 등록 가게 결과는 그대로 반환
    }
  }

  return Response.json({ results: [...known, ...kakaoResults].slice(0, 15) });
}
