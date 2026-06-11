import type { Metadata, Viewport } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import "./globals.css";
import TabBar from "@/components/shell/TabBar";
import DragScroll from "@/components/shell/DragScroll";

// 브랜드/섹션 타이틀용 한글 세리프 (에디토리얼 손맛)
const serifKr = Nanum_Myeongjo({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-serif-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "나주한조각 · 나주를 한 조각씩",
  description:
    "전남 나주의 맛집·카페·관광지를 한 조각씩. 나이대별 추천 코스와 지도로 만나는 로컬 큐레이션. @piece_of_naju",
  openGraph: {
    title: "나주한조각",
    description: "나주를 한 조각씩 — 맛집·카페·관광 큐레이션",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={serifKr.variable}>
      <body>
        <div className="app-shell">
          <main className="app-main">{children}</main>
          <TabBar />
        </div>
        <DragScroll />
      </body>
    </html>
  );
}
