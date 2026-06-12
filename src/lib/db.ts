import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Neon HTTP 드라이버 — 서버리스(Vercel)에서 커넥션 풀 없이 동작.
// 서버 전용. 절대 클라이언트로 import 금지(DATABASE_URL 노출 방지).
// 사용: const rows = await sql`SELECT ... WHERE id = ${id}`  (파라미터 바인딩으로 SQL 인젝션 방지)
// 빌드 타임엔 DATABASE_URL이 없으므로 Proxy로 지연 초기화 — 실제 쿼리 시점에만 연결
let _sql: NeonQueryFunction<false, false> | null = null;
const getSql = () => { if (!_sql) _sql = neon(process.env.DATABASE_URL!); return _sql; };

export const sql = new Proxy(
  function () {} as unknown as NeonQueryFunction<false, false>,
  { apply(_t, _this, args) { return (getSql() as unknown as (...a: unknown[]) => unknown)(...args); } },
) as NeonQueryFunction<false, false>;
