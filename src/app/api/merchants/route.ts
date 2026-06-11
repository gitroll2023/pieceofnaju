import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Merchant } from "@/lib/data/merchants";

// public/data/merchants.json 을 읽어 필터링해 제공하는 API
// 예: /api/merchants?geo=naver&cat=food,cafe&program=onnuri&dong=빛가람동&q=곰탕&limit=50

let cache: Merchant[] | null = null;
async function loadAll(): Promise<Merchant[]> {
  if (!cache) {
    const p = path.join(process.cwd(), "public", "data", "merchants.json");
    cache = JSON.parse(await readFile(p, "utf-8")) as Merchant[];
  }
  return cache;
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  let items = await loadAll();

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
