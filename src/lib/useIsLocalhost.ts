"use client";

import { useEffect, useState } from "react";

/** 로컬(개발) 환경에서만 true — 검수용 탭/페이지 노출 게이트 */
export function useIsLocalhost() {
  const [local, setLocal] = useState(false);
  useEffect(() => {
    // 마운트 후 호스트명으로 로컬 여부 판정 (SSR 하이드레이션 불일치 방지 목적의 의도된 패턴)
    const h = window.location.hostname;
    const isLocal =
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.startsWith("192.168.") ||
      h.startsWith("10.") ||
      h.endsWith(".local");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(isLocal);
  }, []);
  return local;
}
