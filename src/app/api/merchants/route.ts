import type { Merchant } from "@/lib/data/merchants";
import merchantsData from "@/data/merchants.json";

// 데이터는 src/data/merchants.json(= public 밖, 정적 URL로 직접 다운로드 불가)에 두고
// 이 API에서만 필터링해 제공한다. import 방식이라 Vercel 서버리스 번들에 안전히 포함됨.
// 예: /api/merchants?geo=naver&cat=food,cafe&program=onnuri&dong=빛가람동&q=곰탕&limit=50
const all = merchantsData as unknown as Merchant[];

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  let items = all;

  const geo = sp.get("geo");
  if (geo) items = items.filter((m) => m.geo === geo);

  const cat = sp.get("cat");
  if (cat) {
    const set = new Set(cat.split(","));
    items = items.filter((m) => set.has(m.c));
  }

  const program = sp.get("program");
  if (program) {
    const set = new Set(program.split(","));
    items = items.filter((m) => m.p.some((p) => set.has(p)));
  }

  const dong = sp.get("dong");
  if (dong) items = items.filter((m) => m.d === dong);

  const q = sp.get("q")?.trim();
  if (q) items = items.filter((m) => m.n.includes(q));

  const total = items.length;
  const offset = Number(sp.get("offset") || 0);
  const limit = sp.get("limit");
  if (limit) items = items.slice(offset, offset + Number(limit));

  return Response.json(
    { total, count: items.length, items },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
