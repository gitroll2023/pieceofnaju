import type { Metadata } from "next";

// 이 페이지만 홈 화면에 앱처럼 설치 가능(manifest scope를 /pieceadmin/journal로 한정 — 본 사이트엔 영향 없음)
export const metadata: Metadata = {
  title: "내 조각 등록",
  manifest: "/journal.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "내조각 등록",
  },
  icons: {
    apple: "/journal-icons/icon-192.png",
  },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
