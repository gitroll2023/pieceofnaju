"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Marker as LMarker } from "leaflet";
import { cn } from "@/lib/utils";
import { CATEGORY_META, type Place } from "@/lib/data/types";
import { NAJU_CENTER } from "@/lib/kakao";
import type { MapProps } from "./mapTypes";
import IllustratedMap from "./IllustratedMap";

/**
 * OpenStreetMap(CARTO Positron) 기반 실지도 — 키/심사 불필요.
 * 우리 큐레이션 좌표로 핀을 직접 찍는다. 핀 디자인은 .naju-pin 공용 스타일 재사용.
 */
export default function LeafletMap({
  places,
  selectedId,
  onSelect,
  className,
}: MapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<Map<string, LMarker>>(new Map());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;

    import("leaflet")
      .then((mod) => {
        const L = mod.default ?? mod;
        if (cancelled || !boxRef.current || mapRef.current) return;

        const map = L.map(boxRef.current, {
          center: [NAJU_CENTER.lat, NAJU_CENTER.lng],
          zoom: 12,
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: true,
        });
        mapRef.current = map;

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
          },
        ).addTo(map);

        places.forEach((place) => {
          const icon = L.divIcon({
            className: "naju-leaflet-pin",
            html: pinHtml(place),
            iconSize: [120, 54],
            iconAnchor: [60, 32],
          });
          const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
          marker.on("click", () => onSelect?.(place.id));
          markers.set(place.id, marker);
        });

        if (places.length === 1) {
          map.setView([places[0].lat, places[0].lng], 15);
        } else if (places.length > 1) {
          const bounds = L.latLngBounds(
            places.map((p) => [p.lat, p.lng] as [number, number]),
          );
          map.fitBounds(bounds, { padding: [44, 44] });
        }

        // 컨테이너가 늦게 사이즈를 잡는 경우 보정
        requestAnimationFrame(() => map.invalidateSize());
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [places, onSelect]);

  // 선택된 핀 강조 + 중심 이동
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const pin = marker.getElement()?.querySelector(".naju-pin");
      pin?.classList.toggle("is-active", id === selectedId);
    });
    if (selectedId && mapRef.current) {
      const p = places.find((x) => x.id === selectedId);
      if (p) mapRef.current.panTo([p.lat, p.lng]);
    }
  }, [selectedId, places]);

  if (failed) {
    // OSM 타일까지 실패하면 일러스트 폴백으로
    return (
      <IllustratedMap
        places={places}
        selectedId={selectedId}
        onSelect={onSelect}
        className={className}
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={boxRef} className="h-full w-full" />
      <span className="pointer-events-none absolute right-2 top-2 z-[500] rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-spot shadow-sm backdrop-blur">
        지도 · OSM
      </span>
    </div>
  );
}

function pinHtml(place: Place): string {
  const meta = CATEGORY_META[place.category];
  return `<div class="naju-pin" style="--pin:${meta.colorVar}">
    <span class="naju-pin-bubble">${meta.emoji}</span>
    <span class="naju-pin-label">${escapeHtml(place.name)}</span>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
