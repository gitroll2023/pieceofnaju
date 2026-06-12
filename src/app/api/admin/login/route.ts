import { checkAdminCreds, createAdminSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/telegram";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!checkAdminCreds(b?.id, b?.pw)) {
    void notifyAdmin("🚨 관리자 로그인 실패 시도");
    return Response.json({ ok: false, error: "아이디 또는 비밀번호가 달라요" }, { status: 401 });
  }
  await createAdminSession();
  void notifyAdmin("🔐 관리자 로그인");
  return Response.json({ ok: true });
}
