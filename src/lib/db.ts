import { neon } from "@neondatabase/serverless";

// Neon HTTP 드라이버 — 서버리스(Vercel)에서 커넥션 풀 없이 동작.
// 서버 전용. 절대 클라이언트로 import 금지(DATABASE_URL 노출 방지).
// 사용: const rows = await sql`SELECT ... WHERE id = ${id}`  (파라미터 바인딩으로 SQL 인젝션 방지)
export const sql = neon(process.env.DATABASE_URL!);
