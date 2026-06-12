import "server-only";
import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { clientIp } from "@/lib/ip";

// IP 기반 레이트리밋 — contact_throttle 테이블 재사용(메타만 저장, IP는 해시).
// bucket으로 용도별 네임스페이스를 분리해 카운트가 섞이지 않게 한다(예: 로그인/제출).
export function throttleKey(req: Request, bucket: string): string {
  return createHash("sha256")
    .update(bucket + ":" + clientIp(req) + (process.env.AUTH_SECRET || ""))
    .digest("hex")
    .slice(0, 32);
}

// 최근 windowMinutes 내 시도 횟수가 limit 미만이면 기록 후 true(허용), 아니면 false(차단).
// 스로틀 자체가 실패하면(DB 등) 본 기능은 막지 않고 통과시킨다.
export async function rateLimit(req: Request, bucket: string, limit: number, windowMinutes: number): Promise<boolean> {
  const h = throttleKey(req, bucket);
  try {
    const r = (await sql`SELECT count(*)::int AS n FROM contact_throttle
      WHERE ip_hash = ${h} AND created_at > now() - make_interval(mins => ${windowMinutes})`) as { n: number }[];
    if (r[0].n >= limit) return false;
    await sql`INSERT INTO contact_throttle (ip_hash) VALUES (${h})`;
    return true;
  } catch {
    return true;
  }
}
