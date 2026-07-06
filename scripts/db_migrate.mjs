// 추가 마이그레이션(관리자/제보/통계) — IF NOT EXISTS로 안전 반복.
// 실행: node scripts/db_migrate.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)[1].trim();
const sql = neon(url);

const stmts = [
  // 조각 나만보기 메모(100자)
  `ALTER TABLE pieces ADD COLUMN IF NOT EXISTS memo TEXT NOT NULL DEFAULT ''`,
  // AI 코스 추천 일일 사용량 (비회원=ip해시 / 회원=uid)
  `CREATE TABLE IF NOT EXISTS ai_usage (
    ukey TEXT NOT NULL,
    day DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (ukey, day)
  )`,
  // 회원의 저장 코스(담은/AI/받은) — 기기 바뀌어도 유지
  `CREATE TABLE IF NOT EXISTS courses (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT 'local',
    origin TEXT NOT NULL DEFAULT 'mine',
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id)
  )`,
  // 크리에이터(SNS) 승인 상태: none | pending | approved | rejected
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_status TEXT NOT NULL DEFAULT 'none'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_note TEXT NOT NULL DEFAULT ''`,
  // 가게/장소 등록 신청 (API에 없는 곳 — 예: 사매기 박물관)
  `CREATE TABLE IF NOT EXISTS store_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bucket TEXT NOT NULL DEFAULT 'see',
    cat TEXT NOT NULL DEFAULT '',
    dong TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    summary TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
  )`,
  // 방문 통계(일자×유형 집계) — 비회원/회원
  `CREATE TABLE IF NOT EXISTS visits (
    day DATE NOT NULL,
    kind TEXT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, kind)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_store_status ON store_requests(status, created_at DESC)`,
  // 가게/장소 id → 인스타 URL (관리자가 가게명 검색으로 연결)
  `CREATE TABLE IF NOT EXISTS insta_links (
    place_id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // 가게/장소 id → 나주한조각 큐레이션 꿀팁 (pick=직접 다녀온 곳)
  `CREATE TABLE IF NOT EXISTS curation_tips (
    place_id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    tip TEXT NOT NULL DEFAULT '',
    pick BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // 비회원 제보 악용 방지용 레이트리밋 — 내용은 저장하지 않고 해시된 IP+시각만(2시간 후 자동삭제)
  `CREATE TABLE IF NOT EXISTS contact_throttle (
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_throttle ON contact_throttle(ip_hash, created_at)`,
  // 관리자가 직접 다니며 남기는 사진 기록(주소 검색 + 사진 또는 인스타 릴스 링크)
  `CREATE TABLE IF NOT EXISTS journal_pieces (
    id BIGSERIAL PRIMARY KEY,
    place_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    photo_url TEXT NOT NULL DEFAULT '',
    insta_url TEXT NOT NULL DEFAULT '',
    memo TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_pieces(created_at DESC)`,
  // 조각당 사진 여러 장(1~5장) — 단일 photo_url에서 배열로 전환
  `ALTER TABLE journal_pieces ADD COLUMN IF NOT EXISTS photo_urls JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE journal_pieces DROP COLUMN IF EXISTS photo_url`,
  // 검색 시 고른 곳이 이미 사이트에 등록된 가게였다면 그 id를 남김(merchants.json 참조, FK 아님)
  `ALTER TABLE journal_pieces ADD COLUMN IF NOT EXISTS merchant_id TEXT`,
  // 문화·이벤트 (관리자가 추가/승인/삭제) — 추천 탭 '추천별'
  `CREATE TABLE IF NOT EXISTS culture_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    badge TEXT NOT NULL DEFAULT '',
    emoji TEXT NOT NULL DEFAULT '🎉',
    color TEXT NOT NULL DEFAULT '#c9821f',
    image TEXT NOT NULL DEFAULT '',
    period TEXT NOT NULL DEFAULT '',
    start_date DATE,
    end_date DATE,
    ev_time TEXT NOT NULL DEFAULT '',
    place TEXT NOT NULL DEFAULT '',
    audience TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    highlights JSONB NOT NULL DEFAULT '[]',
    schedule JSONB NOT NULL DEFAULT '[]',
    salons JSONB NOT NULL DEFAULT '[]',
    pick_note TEXT NOT NULL DEFAULT '',
    host TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '',
    published BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

for (const s of stmts) {
  await sql.query(s);
  console.log("✓", s.split("\n")[0].slice(0, 60));
}
console.log("마이그레이션 완료.");
