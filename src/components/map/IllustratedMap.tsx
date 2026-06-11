"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, type Place } from "@/lib/data/types";
import type { MapProps } from "./mapTypes";

/**
 * 일러스트(폴백) 지도 — 카카오 키도 없고 OSM 타일도 못 불러올 때 최후 표시.
 * 영산강 줄기 + 종이질감 위에 우리 좌표를 정규화해 핀을 배치한다.
 */
export default function IllustratedMap({
  places,
  selectedId,
  onSelect,
  className,
}: MapProps) {
  const bounds = useMemo(() => {
    const lats = places.map((p) => p.lat);
    const lngs = places.map((p) => p.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [places]);

  const project = (p: Place) => {
    const padX = (bounds.maxLng - bounds.minLng || 1) * 0.12;
    const padY = (bounds.maxLat - bounds.minLat || 1) * 0.14;
    const x =
      ((p.lng - bounds.minLng + padX) /
        (bounds.maxLng - bounds.minLng + padX * 2)) *
      100;
    const y =
      ((bounds.maxLat - p.lat + padY) /
        (bounds.maxLat - bounds.minLat + padY * 2)) *
      100;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background:
          "radial-gradient(120% 90% at 70% 10%, #eef3f0 0%, #f3ede2 55%, #ece2cf 100%)",
      }}
    >
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M-20 120 C 80 150, 120 90, 200 140 S 340 210, 430 180"
          fill="none"
          stroke="var(--naju-river-soft)"
          strokeOpacity="0.35"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M60 -10 C 90 120, 40 220, 120 300 S 220 420, 200 430"
          fill="none"
          stroke="var(--naju-river-soft)"
          strokeOpacity="0.18"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <div className="paper-grain absolute inset-0" />

      <span className="absolute left-3 top-3 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-ink-soft backdrop-blur">
        🗺️ 나주 일러스트 지도 · 핀을 눌러보세요
      </span>

      {places.map((p) => {
        const pos = project(p);
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect?.(p.id)}
            className="naju-pin"
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -100%)",
              ["--pin" as string]: CATEGORY_META[p.category].colorVar,
            }}
            data-active={active}
            aria-label={p.name}
          >
            <span className={`naju-pin-bubble ${active ? "is-active" : ""}`}>
              {CATEGORY_META[p.category].emoji}
            </span>
            <span className="naju-pin-label">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
