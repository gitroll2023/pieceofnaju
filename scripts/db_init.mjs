// Neon Postgres 스키마 초기화 (IF NOT EXISTS — 안전하게 반복 실행 가능)
// 실행: node scripts/db_init.mjs   (.env.local의 DATABASE_URL 자동 사용)
//
// 개인정보 최소화: 생년월일·실명·이메일 미수집. 닉네임 + 해시 비번만.

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

// .env.local에서 DATABASE_URL 읽기(시크릿을 코드/로그에 노출하지 않음)
function envFromLocal(key) {
  const txt = readFileSync(".env.local", "utf8");
  const m = txt.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim() : process.env[key];
}

const url = envFromLocal("DATABASE_URL");
if (!url) { console.error("DATABASE_URL 없음"); process.exit(1); }

const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    insta TEXT NOT NULL DEFAULT '',
    blog TEXT NOT NULL DEFAULT '',
    youtube TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // 회원이 저장한 조각(비회원은 localStorage). visited=활성(다녀옴)/비활성
  `CREATE TABLE IF NOT EXISTS pieces (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    piece_id TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'spot',
    name TEXT NOT NULL,
    cat TEXT NOT NULL DEFAULT '',
    dong TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    label TEXT NOT NULL DEFAULT '',
    visited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, piece_id)
  )`,
  // 나의 관광코스 / 여행스케줄 (items에 순번·날짜·시간)
  `CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '나의 나주 코스',
    kind TEXT NOT NULL DEFAULT 'course',
    items JSONB NOT NULL DEFAULT '[]',
    start_date DATE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // 커뮤니티 공유(내조각/코스 + 프로필 링크 스냅샷)
  `CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // 건의/피드백 (비회원 가능 → user_id NULL 허용)
  `CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    ua TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pieces_user ON pieces(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`,
];

for (const s of statements) {
  await sql.query(s);
  console.log("✓", s.split("\n")[0].replace(/CREATE (TABLE|INDEX) IF NOT EXISTS /, "").slice(0, 48));
}

const tables = await sql.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
);
console.log("\n현재 테이블:", tables.map((t) => t.table_name).join(", "));
console.log("스키마 초기화 완료.");
