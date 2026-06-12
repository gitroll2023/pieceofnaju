"use client";

import { useEffect, useState } from "react";

// 나주 현재 날씨(기상청). 세션당 1회 호출 후 캐시.
export default function WeatherChip() {
  const [w, setW] = useState<{ temp: number; icon: string; desc: string } | null>(null);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem("naju.weather");
      if (c) { setW(JSON.parse(c)); return; }
    } catch {}
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          const v = { temp: d.temp, icon: d.icon, desc: d.desc };
          setW(v);
          try { sessionStorage.setItem("naju.weather", JSON.stringify(v)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  if (!w) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2 py-1 text-[11.5px] font-bold text-ink-soft" title={`나주 ${w.desc}`}>
      {w.icon} {Math.round(w.temp)}°
    </span>
  );
}
