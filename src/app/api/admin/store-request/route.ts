import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!id || !["approve", "reject"].includes(b?.action)) return Response.json({ ok: false }, { status: 400 });
  const status = b.action === "approve" ? "approved" : "rejected";
  await sql`UPDATE store_requests SET status = ${status}, reviewed_at = now() WHERE id = ${id}`;
  return Response.json({ ok: true });
}
