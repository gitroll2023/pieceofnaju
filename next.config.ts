import type { NextConfig } from "next";

// 사이트 전역 보안 헤더 — 클릭재킹·MIME 스니핑·레퍼러 유출·평문 전송 등 기본 방어.
// CSP는 Kakao 지도 SDK·인라인 테마 스크립트와의 호환 검증이 필요해 여기서는 제외(추후 도입).
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // 클릭재킹 방지(타 사이트 iframe 임베드 차단)
  { key: "X-Content-Type-Options", value: "nosniff" }, // MIME 스니핑 방지
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // 외부로 경로·쿼리 유출 방지
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }, // HTTPS 강제(2년)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" }, // 위치만 자기 출처 허용
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // X-Powered-By 제거(스택 핑거프린팅 표면 축소)
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
