import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 현재 방문자가 관리자 세션인지 — 드로어에서 관리자 페이지 링크 노출용
export async function GET() {
  return Response.json({ admin: await isAdmin() });
}
