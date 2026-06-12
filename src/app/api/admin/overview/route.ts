import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// 대시보드 전체 데이터 1회 호출(Neon 라운드트립 최소화)
export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const [users, feedbackCount, storePending, creatorPending] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM users`,
    sql`SELECT COUNT(*)::int AS n FROM feedback`,
    sql`SELECT COUNT(*)::int AS n FROM store_requests WHERE status='pending'`,
    sql`SELECT COUNT(*)::int AS n FROM users WHERE creator_status='pending'`,
  ]);

  const [visits14, recentUsers, feedback, stores, creators] = await Promise.all([
    sql`SELECT to_char(day,'MM-DD') AS d, kind, count FROM visits WHERE day >= CURRENT_DATE - INTERVAL '13 days' ORDER BY day`,
    sql`SELECT nickname, creator_status, to_char(created_at,'YYYY-MM-DD') AS at FROM users ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT f.id, f.message, f.contact, to_char(f.created_at,'MM-DD HH24:MI') AS at, u.nickname
        FROM feedback f LEFT JOIN users u ON u.id=f.user_id ORDER BY f.created_at DESC LIMIT 100`,
    sql`SELECT s.id, s.name, s.bucket, s.address, s.summary, s.contact, s.status, to_char(s.created_at,'MM-DD HH24:MI') AS at, u.nickname
        FROM store_requests s LEFT JOIN users u ON u.id=s.user_id ORDER BY (s.status='pending') DESC, s.created_at DESC LIMIT 100`,
    sql`SELECT id, nickname, insta, blog, youtube, creator_status FROM users WHERE creator_status IN ('pending','approved') ORDER BY (creator_status='pending') DESC, id DESC LIMIT 100`,
  ]);

  // 방문 14일 집계(유형별)
  const byDay: Record<string, { guest: number; member: number }> = {};
  for (const r of visits14 as { d: string; kind: string; count: number }[]) {
    byDay[r.d] = byDay[r.d] || { guest: 0, member: 0 };
    if (r.kind === "member") byDay[r.d].member = r.count;
    else byDay[r.d].guest = r.count;
  }
  const visitSeries = Object.entries(byDay).map(([d, v]) => ({ d, ...v }));

  return Response.json({
    ok: true,
    stats: {
      users: users[0].n,
      feedback: feedbackCount[0].n,
      storePending: storePending[0].n,
      creatorPending: creatorPending[0].n,
      visitsToday: visitSeries.length ? visitSeries[visitSeries.length - 1] : { guest: 0, member: 0 },
    },
    visitSeries,
    recentUsers,
    feedback,
    stores,
    creators,
  });
}
