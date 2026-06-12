import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const links = await sql`SELECT place_id, name, url, to_char(updated_at,'MM-DD HH24:MI') AS at FROM insta_links ORDER BY updated_at DESC`;
  return Response.json({ links });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const placeId = typeof b?.placeId === "string" ? b.placeId : "";
  const name = typeof b?.name === "string" ? b.name.slice(0, 120) : "";
  let url = typeof b?.url === "string" ? b.url.trim().slice(0, 300) : "";
  if (!placeId || !url) return Response.json({ ok: false, error: "필수 값 없음" }, { status: 400 });
  if (!/^https?:\/\//.test(url)) url = "https://" + url;
  await sql`INSERT INTO insta_links (place_id, name, url, updated_at) VALUES (${placeId}, ${name}, ${url}, now())
            ON CONFLICT (place_id) DO UPDATE SET url = EXCLUDED.url, name = EXCLUDED.name, updated_at = now()`;
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const placeId = new URL(req.url).searchParams.get("placeId");
  if (!placeId) return Response.json({ ok: false }, { status: 400 });
  await sql`DELETE FROM insta_links WHERE place_id = ${placeId}`;
  return Response.json({ ok: true });
}
