import { sql } from "@/lib/db";
import { verifyPassword, createSession, validNickname, checkAdminCreds, createAdminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/throttle";

export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  // 브루트포스 방어: IP당 10분에 10회 시도 제한.
  if (!(await rateLimit(req, "login", 10, 10))) {
    return bad("시도가 너무 많아요. 잠시 후 다시 시도해주세요.", 429);
  }
  const body = await req.json().catch(() => null);
  const nickname = body?.nickname;
  const password = body?.password;

  // .env 관리자 계정이면 관리자 세션 부여(일반 회원과 별개) → 클라이언트가 /pieceadmin으로 이동
  if (checkAdminCreds(nickname, password)) {
    await createAdminSession();
    return Response.json({ ok: true, admin: true });
  }

  if (!validNickname(nickname) || typeof password !== "string") return bad("입력을 확인해주세요");

  const rows = await sql`SELECT id, pw_hash FROM users WHERE nickname = ${nickname}`;
  // 닉네임 유무를 구분해 알려주지 않음(계정 열거 방지)
  if (!rows.length || !(await verifyPassword(password, rows[0].pw_hash))) {
    return bad("닉네임 또는 비밀번호가 일치하지 않아요", 401);
  }
  await createSession(Number(rows[0].id), nickname, body?.remember !== false);
  return Response.json({ ok: true, user: { nickname } });
}
