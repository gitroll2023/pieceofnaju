import { isAdmin } from "@/lib/auth";
import { NAJU_CENTER } from "@/lib/kakao";

type KakaoDoc = {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
};

// 관리자 — 내조각 등록용 주소/가게 검색(merchants.json 제한 없이 카카오 전체 검색, 나주 반경 우선)
export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 1) return Response.json({ results: [] });

  const key = process.env.KAKAO_REST_KEY;
  if (!key) return Response.json({ ok: false, error: "KAKAO_REST_KEY 미설정" }, { status: 500 });

  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&x=${NAJU_CENTER.lng}&y=${NAJU_CENTER.lat}&radius=20000&size=10`;
    const r = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
    if (!r.ok) return Response.json({ ok: false, error: "카카오 검색 실패" }, { status: 502 });
    const d = await r.json();
    const results = ((d.documents || []) as KakaoDoc[]).map((doc) => ({
      name: doc.place_name,
      address: doc.road_address_name || doc.address_name,
      lat: Number(doc.y),
      lng: Number(doc.x),
    }));
    return Response.json({ results });
  } catch {
    return Response.json({ ok: false, error: "검색 중 오류" }, { status: 500 });
  }
}
