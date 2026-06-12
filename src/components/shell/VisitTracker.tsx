"use client";

import { useEffect } from "react";

// 세션당 1회만 방문 집계(관리자 통계용). 개인정보·위치 전송 없음.
export default function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("naju.v")) return;
      sessionStorage.setItem("naju.v", "1");
    } catch {}
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
