"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, type Place } from "@/lib/data/types";
import { hasKakaoKey, loadKakao, NAJU_CENTER, type Kakao } from "@/lib/kakao";
import type { MapProps } from "./mapTypes";
import LeafletMap from "./LeafletMap";

export type { MapProps };

/**
 * 지도 디스패처 — 우선순위:
 *  1) 카카오 JS 키 있으면 → 카카오 실지도
 *  2) 없으면 → Leaflet + OpenStreetMap 실지도 (키/심사 불필요)
 *  3) 위 둘이 로드 실패하면 → 일러스트 폴백 지도
 * 어느 경로든 핀 탭 → onSelect(id) 동일 동작.
 */
export default function KakaoMap(props: MapProps) {
  if (hasKakaoKey) return <LiveKakaoMap {...props} />;
  return <LeafletMap {...props} />;
}

/* ───────────────────────── 카카오 실지도 ───────────────────────── */
function LiveKakaoMap({ places, selectedId, onSelect, className, clusterPoints }: MapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Kakao>(null);
  const overlaysRef = useRef<Map<string, { overlay: Kakao; el: HTMLDivElement }>>(
    new Map(),
  );
  const clustererRef = useRef<Kakao>(null);
  const infoRef = useRef<Kakao>(null);
  const [failed, setFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const overlays = overlaysRef.current;
    loadKakao()
      .then((kakao) => {
        if (cancelled || !boxRef.current) return;
        const map = new kakao.maps.Map(boxRef.current, {
          center: new kakao.maps.LatLng(NAJU_CENTER.lat, NAJU_CENTER.lng),
          level: 7,
        });
        mapRef.current = map;
        setMapReady(true);

        const bounds = new kakao.maps.LatLngBounds();
        places.forEach((place) => {
          const pos = new kakao.maps.LatLng(place.lat, place.lng);
          bounds.extend(pos);

          const el = document.createElement("div");
          el.className = "naju-pin";
          el.dataset.id = place.id;
          el.innerHTML = pinMarkup(place);
          el.addEventListener("click", () => onSelect?.(place.id));

          const overlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: el,
            yAnchor: 1,
            zIndex: 3,
          });
          overlay.setMap(map);
          overlays.set(place.id, { overlay, el });
        });

        if (places.length > 1) map.setBounds(bounds, 36, 36, 36, 36);

        // 컨테이너가 늦게 크기를 잡으면 회색으로 비므로 relayout 후 재배치
        requestAnimationFrame(() => {
          map.relayout();
          if (places.length > 1) map.setBounds(bounds, 36, 36, 36, 36);
          else map.setCenter(new kakao.maps.LatLng(NAJU_CENTER.lat, NAJU_CENTER.lng));
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      overlays.forEach(({ overlay }) => overlay.setMap(null));
      overlays.clear();
    };
  }, [places, onSelect]);

  // 선택된 핀 강조 + 지도 중심 이동
  useEffect(() => {
    overlaysRef.current.forEach(({ el }, id) => {
      el.classList.toggle("is-active", id === selectedId);
    });
    const kakao = window.kakao;
    if (selectedId && mapRef.current && kakao?.maps) {
      const p = places.find((x) => x.id === selectedId);
      if (p) mapRef.current.panTo(new kakao.maps.LatLng(p.lat, p.lng));
    }
  }, [selectedId, places]);

  // 먹거리 등 대량 가맹점 클러스터 레이어 (선택적)
  useEffect(() => {
    const kakao = window.kakao;
    if (!mapReady || !mapRef.current || !kakao?.maps?.MarkerClusterer) return;
    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map: mapRef.current, averageCenter: true, minLevel: 6, gridSize: 60,
      });
      infoRef.current = new kakao.maps.InfoWindow({ removable: true, zIndex: 5 });
    }
    const clusterer = clustererRef.current;
    clusterer.clear();
    const pts = clusterPoints || [];
    if (!pts.length) return;
    const markers = pts.map((pt) => {
      const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(pt.lat, pt.lng) });
      kakao.maps.event.addListener(marker, "click", () => {
        infoRef.current.setContent(
          `<div style="padding:7px 9px;font-size:12px;font-family:Pretendard,sans-serif;line-height:1.4"><b>${escHtml(pt.name)}</b>${pt.sub ? `<br><span style="color:#6b6258">${escHtml(pt.sub)}</span>` : ""}</div>`,
        );
        infoRef.current.open(mapRef.current, marker);
      });
      return marker;
    });
    clusterer.addMarkers(markers);
  }, [clusterPoints, mapReady]);

  // 카카오 로드 실패(키 오류/도메인 미등록 등) → OSM 실지도로 폴백
  if (failed)
    return (
      <LeafletMap
        places={places}
        selectedId={selectedId}
        onSelect={onSelect}
        className={className}
      />
    );

  return (
    <div className={cn("relative", className)}>
      <div ref={boxRef} className="h-full w-full" />
      <span className="pointer-events-none absolute right-2 top-2 z-[5] rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-river shadow-sm backdrop-blur">
        카카오맵
      </span>
    </div>
  );
}

function pinMarkup(place: Place): string {
  const meta = CATEGORY_META[place.category];
  return `
    <button type="button" style="--pin:${meta.colorVar}" aria-label="${place.name}">
      <span class="naju-pin-bubble">${meta.emoji}</span>
      <span class="naju-pin-label">${place.name}</span>
    </button>`;
}

function escHtml(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
