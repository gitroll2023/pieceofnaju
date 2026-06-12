import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { clientIp } from "@/lib/ip";
import { regionOf, regionScore, REGION_META, type Region } from "@/lib/region";
import { isFranchise } from "@/lib/data/franchise";
import type { Merchant } from "@/lib/data/merchants";
import merchantsData from "@/data/merchants.json";

export const dynamic = "force-dynamic";

const merchants = merchantsData as unknown as Merchant[];

type Spot = { id: string; n: string; cat: string; a: string; lat: number; lng: number; summary?: string };
type Cand = { id: string; n: string; cat: string; region: string; lat: number; lng: number; c: string; t: string };

const SEE_BY_VIBE: Record<string, string[]> = {
  nature: ["자연", "꽃명소", "전망", "공원"],
  history: ["문화재", "박물관미술관", "사찰"],
  experience: ["체험"],
  cafe: ["전망카페", "양조장"],
  food: [],
  mixed: ["문화재", "박물관미술관", "자연", "공원", "전망", "사찰", "체험"],
};
const VIBE_LABEL: Record<string, string> = { food: "미식", cafe: "카페·디저트", nature: "자연·힐링", history: "역사·문화", experience: "체험", mixed: "두루두루" };

function ipHash(req: Request) {
  return "ip:" + createHash("sha256").update(clientIp(req) + (process.env.AUTH_SECRET || "")).digest("hex").slice(0, 24);
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ ok: false, error: "AI가 아직 준비 중이에요." }, { status: 503 });

  const b = await req.json().catch(() => ({}));
  const region = (typeof b?.region === "string" && b.region) as Region | "";
  const vibe = typeof b?.vibe === "string" && SEE_BY_VIBE[b.vibe] !== undefined ? b.vibe : "mixed";
  const kids = !!b?.kids;
  const drink = !!b?.drink;
  const duration = ["day", "overnight", "twonight"].includes(b?.duration) ? b.duration : "half";
  const DUR: Record<string, { days: number; count: string; label: string }> = {
    half: { days: 1, count: "3~4곳", label: "반나절" },
    day: { days: 1, count: "4~5곳", label: "하루" },
    overnight: { days: 2, count: "7~9곳", label: "1박 2일" },
    twonight: { days: 3, count: "10~12곳", label: "2박 3일" },
  };
  const dur = DUR[duration] || DUR.half;
  const wish = (typeof b?.wish === "string" ? b.wish : "").trim().slice(0, 200);
  // 자유 입력에 술자리/안주 의도가 있으면 해당 업종을 후보 상단으로
  const DRINK_HINT = /술|한잔|맥주|소주|포차|호프|안주|치킨|곱창|회|고기|이자카야|펍|주점|꼬치/;
  const wantDrink = drink || DRINK_HINT.test(wish);
  // 위시에 등장하는 음식 키워드(이름/업종 매칭용)
  const FOOD_WORDS = ["곰탕", "장어", "홍어", "한우", "치킨", "통닭", "닭", "피자", "파스타", "국밥", "칼국수", "돈까스", "초밥", "회", "고기", "삼겹", "곱창", "족발", "보쌈", "떡볶이", "분식", "빵", "베이커리", "브런치", "커피", "디저트", "막걸리", "맥주", "와인", "칵테일", "포차", "호프", "주점"];
  const wishWords = FOOD_WORDS.filter((w) => wish.includes(w));

  // 사용량 제한: 회원 3 / 비회원 1 (일)
  const s = await readSession();
  const ukey = s ? `u:${s.uid}` : ipHash(req);
  const limit = s ? 3 : 1;
  const rows = (await sql`SELECT count FROM ai_usage WHERE ukey = ${ukey} AND day = current_date`) as { count: number }[];
  const used = rows[0]?.count || 0;
  if (used >= limit) {
    return Response.json({ ok: false, limited: true, isMember: !!s, limit, error: s ? "오늘 추천을 다 썼어요. 내일 또 만나요!" : "비회원은 하루 1번이에요. 로그인하면 하루 3번!" }, { status: 429 });
  }

  // 후보 풀(우리 실데이터) 구성 — region/분위기로 거르고 권역 가중치 정렬
  const inReg = (rstr: string) => !region || regionOf(rstr) === (region as Region);
  const buildCand = (useRegion: boolean): Cand[] => {
    const rf = (rstr: string) => (useRegion ? inReg(rstr) : true);
    // 이름+업종을 함께 보고: 위시 음식어 등장 / 술자리 의도면 주점·치킨류 가중
    const fscore = (m: Merchant) => {
      const hay = `${m.t || ""} ${m.n || ""}`;
      let sc = 0;
      if (wishWords.some((w) => hay.includes(w))) sc += 12;
      if (wantDrink && /주점|호프|포차|술집|이자카야|맥주|치킨|통닭|곱창|회집|생선회|고기|안주|꼬치|닭|포장마차/.test(hay)) sc += 8;
      return sc;
    };
    const foods = merchants.filter((m) => m.c === "food" && !isFranchise(m.n) && rf(m.d))
      .sort((a, b) => (fscore(b) - fscore(a)) || (regionScore(b.d) - regionScore(a.d))).slice(0, 24);
    const cafes = merchants.filter((m) => m.c === "cafe" && !isFranchise(m.n) && rf(m.d)).sort((a, b) => regionScore(b.d) - regionScore(a.d)).slice(0, 10);
    let spots: Spot[] = [];
    try {
      spots = (globalThis as { __spots?: Spot[] }).__spots || [];
    } catch { spots = []; }
    const seeCats = new Set(SEE_BY_VIBE[vibe]?.length ? SEE_BY_VIBE[vibe] : SEE_BY_VIBE.mixed);
    const sights = spots.filter((sp) => seeCats.has(sp.cat) && rf(sp.a)).slice(0, 16);
    return [
      ...foods.map((m) => ({ id: String(m.id), n: m.n, cat: m.t ? `먹거리·${m.t}` : "먹거리", region: REGION_META[regionOf(m.d)]?.label || "", lat: m.lat, lng: m.lng, c: "food", t: m.t || "" })),
      ...cafes.map((m) => ({ id: String(m.id), n: m.n, cat: m.t ? `마실거리·${m.t}` : "마실거리", region: REGION_META[regionOf(m.d)]?.label || "", lat: m.lat, lng: m.lng, c: "cafe", t: m.t || "" })),
      ...sights.map((sp) => ({ id: String(sp.id), n: sp.n, cat: sp.cat, region: REGION_META[regionOf(sp.a)]?.label || "", lat: sp.lat, lng: sp.lng, c: "spot", t: sp.cat })),
    ];
  };

  // 스팟 로드(정적 파일) — 한 번만
  if (!(globalThis as { __spots?: Spot[] }).__spots) {
    try {
      const r = await fetch(new URL("/data/spots.json", req.url));
      (globalThis as { __spots?: Spot[] }).__spots = (await r.json()) as Spot[];
    } catch { (globalThis as { __spots?: Spot[] }).__spots = []; }
  }

  let cand = buildCand(true);
  if (cand.length < 6) cand = buildCand(false); // 후보가 적으면 권역 제한 해제

  const condText = `지역: ${region ? REGION_META[region as Region]?.label : "나주 전체"}, 분위기: ${VIBE_LABEL[vibe]}, ${kids ? "아이 동반" : "성인 위주"}, ${drink ? "술 한잔 포함" : "술 없음"}, 일정: ${dur.label}(${dur.count})`;
  const list = cand.map((c) => `${c.id} | ${c.n} | ${c.cat} | ${c.region}`).join("\n");
  const multi = dur.days > 1;
  const prompt = `너는 전남 나주 여행 코스를 짜는 로컬 큐레이터야. 아래 '후보 목록(id | 이름·업종 | 동네)' 안에서만 골라 동선이 자연스러운 코스를 짜줘.
조건: ${condText}${wish ? `\n★ 사용자 요청(가장 중요, 무조건 우선): "${wish}"` : ""}
규칙:
- 반드시 후보 목록의 id만 사용(새로 지어내지 말 것). 업종 라벨(치킨·호프·한식·곰탕 등)을 보고 요청에 맞는 곳을 고를 것.
- 사용자 요청이 있으면 기본 분위기·조건보다 요청을 우선한다. (예: "술만/치킨"이면 술·안주 위주로, 카페로 억지로 채우지 말 것.)
- 곳 수는 보통 ${dur.count}이되, 요청 성격상 조절해도 좋다.
- 식사 시간대엔 먹거리, 식후 가볍게는 카페. ${drink ? "술 한잔 할 곳 포함." : ""} ${kids ? "아이와 가기 좋은 곳 우선." : ""}
- 같은 곳 중복 금지.${multi ? `\n- ${dur.label}(${dur.days}일) 일정이야. 각 stop에 "day":1~${dur.days} 을 표기해 하루씩 균형 있게 나눠줘(하루에 먹거리·카페·볼거리를 골고루). 숙박업소는 넣지 말고 장소만.` : ""}
출력은 오직 JSON 하나. 형식:
{"title":"코스 제목(한국어, 짧고 매력적, 요청 반영)","summary":"한 줄 요약(한국어)","stops":[{"id":"후보id","note":"이곳을 고른 이유 한 줄(한국어)"${multi ? `,"day":1` : ""}}]}
후보 목록:
${list}`;

  type Parsed = { title?: string; summary?: string; stops?: { id: string; note?: string; day?: number }[] };
  // lite(비-사고형, 무료 한도 넉넉) 우선 → 실패 시 flash로 폴백. flash는 사고모드 꺼 JSON 잘림 방지.
  const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  let parsed: Parsed | null = null;
  for (const model of MODELS) {
    try {
      const gc: Record<string, unknown> = { temperature: 0.7, responseMimeType: "application/json", maxOutputTokens: dur.days > 1 ? 4096 : 2048 };
      if (model === "gemini-2.5-flash") gc.thinkingConfig = { thinkingBudget: 0 };
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: gc }),
      });
      const d = await r.json();
      if (d?.error) continue; // 한도/오류 → 다음 모델
      const text = (d?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
      const clean = String(text).replace(/```json|```/g, "").trim();
      const m = clean.match(/\{[\s\S]*\}/); // 혹시 앞뒤 잡소리 있어도 JSON만 추출
      parsed = JSON.parse(m ? m[0] : clean);
      if (parsed?.stops?.length) break;
    } catch {
      // 다음 모델 시도
    }
  }
  if (!parsed) return Response.json({ ok: false, error: "AI가 잠시 붐벼요. 잠시 후 다시 시도해주세요." }, { status: 502 });

  const map = new Map(cand.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const stops = (parsed?.stops || [])
    .map((st) => ({ c: map.get(String(st.id)), note: String(st.note || ""), day: Math.min(dur.days, Math.max(1, Number(st.day) || 1)) }))
    .filter((x): x is { c: Cand; note: string; day: number } => !!x.c && !seen.has(x.c.id) && (seen.add(x.c.id), true))
    .map(({ c, note, day }) => ({ placeId: c.id, n: c.n, c: c.c, lat: c.lat, lng: c.lng, t: c.t, note, day }));

  if (stops.length < 2) return Response.json({ ok: false, error: "조건에 맞는 코스를 못 찾았어요. 조건을 바꿔보세요." }, { status: 422 });

  // 성공 시에만 사용량 +1
  await sql`INSERT INTO ai_usage (ukey, day, count) VALUES (${ukey}, current_date, 1)
            ON CONFLICT (ukey, day) DO UPDATE SET count = ai_usage.count + 1`;

  return Response.json({
    ok: true,
    course: { title: String(parsed?.title || "나주 AI 코스").slice(0, 60), summary: String(parsed?.summary || "").slice(0, 120), theme: "local", days: dur.days, stops },
    used: used + 1, limit, isMember: !!s,
  });
}
