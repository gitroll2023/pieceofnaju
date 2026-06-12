import "server-only";

// 클라이언트 IP 추출 — Vercel은 x-real-ip를 실제 클라이언트 IP로 신뢰성 있게 설정한다.
// x-forwarded-for의 맨 앞 값은 클라이언트가 위조해 끼워넣을 수 있어(레이트리밋 우회) 신뢰하지 않는다.
// 따라서 x-real-ip를 우선하고, 없으면 XFF의 '마지막'(가장 가까운 프록시가 덧붙인) 값으로 폴백한다.
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const parts = (req.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "unknown";
}
