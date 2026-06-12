import { checkAdminCreds, createAdminSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/telegram";
import { rateLimit } from "@/lib/throttle";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 브루트포스 방어: IP당 10분에 5회. 초과 시 자격 검사·알림 이전에 차단(텔레그램 알림 도배도 방지).
  if (!(await rateLimit(req, "admin-login", 5, 10))) {
    return Response.json({ ok: false, error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  const b = await req.json().catch(() => null);
  if (!checkAdminCreds(b?.id, b?.pw)) {
    void notifyAdmin("🚨 관리자 로그인 실패 시도");
    return Response.json({ ok: false, error: "아이디 또는 비밀번호가 달라요" }, { status: 401 });
  }
  await createAdminSession();
  void notifyAdmin("🔐 관리자 로그인");
  return Response.json({ ok: true });
}
