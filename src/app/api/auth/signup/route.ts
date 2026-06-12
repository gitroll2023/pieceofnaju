import { sql } from "@/lib/db";
import { hashPassword, createSession, validNickname, validPassword, PW_RULE } from "@/lib/auth";
import { notifyAdmin } from "@/lib/telegram";

const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const nickname = body?.nickname;
  const password = body?.password;
  if (!validNickname(nickname)) return bad("닉네임은 2~20자(한글·영문·숫자·_.)로 해주세요");
  if (!validPassword(password)) return bad(`비밀번호는 ${PW_RULE}이어야 해요`);

  const exists = await sql`SELECT 1 FROM users WHERE nickname = ${nickname}`;
  if (exists.length) return bad("이미 사용 중인 닉네임이에요", 409);

  const pw_hash = await hashPassword(password);
  const rows = await sql`INSERT INTO users (nickname, pw_hash) VALUES (${nickname}, ${pw_hash}) RETURNING id`;
  await createSession(Number(rows[0].id), nickname, body?.remember !== false);
  void notifyAdmin(`🙋 새 회원 가입: ${nickname}`);
  return Response.json({ ok: true, user: { nickname } });
}
