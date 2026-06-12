import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => null);
  const userId = Number(b?.userId);
  if (!userId || !["approve", "reject"].includes(b?.action)) return Response.json({ ok: false }, { status: 400 });
  const status = b.action === "approve" ? "approved" : "rejected";
  await sql`UPDATE users SET creator_status = ${status} WHERE id = ${userId}`;
  return Response.json({ ok: true });
}
