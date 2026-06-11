"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasKakaoKey, loadKakao, NAJU_CENTER, type Kakao } from "@/lib/kakao";
import { CATEGORY_META, PROGRAM_META, type Merchant } from "@/lib/data/merchants";

/**
 * 가맹점 지도 — 수천 개 핀을 카카오 MarkerClusterer로 묶어 표시.
 * 핀 클릭 시 InfoWindow 대신 CustomOverlay(직접 만든 카드)를 띄워
 * 주소 줄바꿈 시 박스가 잘리는 문제를 없앤다.
 */
export default function MerchantsMap({
  merchants,
  className,
  focus,
  onLocate,
}: {
  merchants: Merchant[];
  className?: string;
  /** 이 id의 위치로 지도를 확대 이동 + 카드 열기 */
  focus?: string | null;
  /** 내 위치가 잡히면 좌표 전달(거리 계산용) */
  onLocate?: (loc: { lat: number; lng: number }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Kakao>(null);
  const clustererRef = useRef<Kakao>(null);
  const overlayRef = useRef<Kakao>(null);
  const userRef = useRef<Kakao>(null);
  const watchRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [located, setLocated] = useState(false);

  // 지도 1회 생성
  useEffect(() => {
    if (!hasKakaoKey) return;
    let cancelled = false;
    loadKakao()
      .then((kakao) => {
        if (cancelled || !boxRef.current || mapRef.current) return;
        const map = new kakao.maps.Map(boxRef.current, {
          center: new kakao.maps.LatLng(NAJU_CENTER.lat, NAJU_CENTER.lng),
          level: 9,
        });
        mapRef.current = map;
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map, averageCenter: true, minLevel: 5, gridSize: 70, disableClickZoom: false,
        });
        overlayRef.current = new kakao.maps.CustomOverlay({ yAnchor: 1.32, zIndex: 7, clickable: true });
        // 빈 곳 클릭 시 카드 닫기
        kakao.maps.event.addListener(map, "click", () => overlayRef.current?.setMap(null));
        setReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // merchants 바뀌면 마커 다시 그림
  useEffect(() => {
    const kakao = window.kakao;
    if (!ready || !kakao?.maps || !clustererRef.current) return;
    const clusterer = clustererRef.current;
    overlayRef.current?.setMap(null);
    clusterer.clear();

    const markers = merchants.map((m) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(m.lat, m.lng),
      });
      kakao.maps.event.addListener(marker, "click", () => {
        const el = buildCard(m, () => overlayRef.current?.setMap(null));
        overlayRef.current.setContent(el);
        overlayRef.current.setPosition(marker.getPosition());
        overlayRef.current.setMap(mapRef.current);
      });
      return marker;
    });
    clusterer.addMarkers(markers);
  }, [merchants, ready]);

  // 목록에서 선택 시: 해당 위치로 확대 이동 + 카드 열기
  useEffect(() => {
    const kakao = window.kakao;
    if (!ready || !focus || !mapRef.current || !kakao?.maps) return;
    const m = merchants.find((x) => x.id === focus);
    if (!m) return;
    const pos = new kakao.maps.LatLng(m.lat, m.lng);
    mapRef.current.setLevel(3);
    mapRef.current.panTo(pos);
    if (overlayRef.current) {
      const el = buildCard(m, () => overlayRef.current?.setMap(null));
      overlayRef.current.setContent(el);
      overlayRef.current.setPosition(pos);
      overlayRef.current.setMap(mapRef.current);
    }
  }, [focus, ready, merchants]);

  // 내 위치 표시 + 이동 추적(watchPosition)
  function locate() {
    const kakao = window.kakao;
    if (!navigator.geolocation || !mapRef.current || !kakao?.maps) return;
    setLocated(true);
    let first = true;
    const show = (pos: GeolocationPosition) => {
      onLocate?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      const ll = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      if (!userRef.current) {
        const el = document.createElement("div");
        el.className = "me-dot";
        userRef.current = new kakao.maps.CustomOverlay({ position: ll, content: el, yAnchor: 0.5, xAnchor: 0.5, zIndex: 9 });
        userRef.current.setMap(mapRef.current);
      } else {
        userRef.current.setPosition(ll);
      }
      if (first) { first = false; mapRef.current.setLevel(4); mapRef.current.panTo(ll); }
    };
    navigator.geolocation.getCurrentPosition(show, () => setLocated(false), { enableHighAccuracy: true, timeout: 8000 });
    if (watchRef.current == null) {
      watchRef.current = navigator.geolocation.watchPosition(show, () => {}, { enableHighAccuracy: true, maximumAge: 4000 });
    }
  }

  useEffect(
    () => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); },
    [],
  );

  if (!hasKakaoKey) {
    return (
      <div className={cn("grid place-items-center bg-muted text-center", className)}>
        <p className="px-6 text-[13px] text-ink-soft">
          가맹점 지도는 카카오 지도 키가 필요해요.
          <br />
          아래 목록으로 확인하실 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={boxRef} className="h-full w-full" />
      <button
        type="button"
        onClick={locate}
        aria-label="내 위치"
        className="absolute bottom-3 right-3 z-[6] grid size-10 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur transition active:scale-90"
        style={{ color: located ? "#2b7fff" : "var(--naju-ink-soft)" }}
      >
        <Crosshair className="size-5" />
      </button>
    </div>
  );
}

/** CustomOverlay용 카드 DOM 생성 (직접 제어 → 줄바꿈 잘림 없음) */
function buildCard(m: Merchant, onClose: () => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.innerHTML = cardHtml(m);
  const close = wrap.querySelector<HTMLButtonElement>(".merchant-pop__close");
  close?.addEventListener("click", (e) => {
    e.stopPropagation();
    onClose();
  });
  return wrap;
}

function cardHtml(m: Merchant): string {
  const cat = CATEGORY_META[m.c];
  const progs = m.p
    .map((k) => `<span style="display:inline-block;background:${PROGRAM_META[k].color};color:#fff;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;line-height:1.25">${PROGRAM_META[k].short}</span>`)
    .join("");
  const base = "white-space:normal;word-break:break-word;overflow-wrap:anywhere";
  return `<div style="position:relative;width:220px;max-width:220px;box-sizing:border-box;background:#fffdf9;border:1px solid #e7ded0;border-radius:14px;box-shadow:0 12px 28px -10px rgba(31,28,24,.5);padding:12px 13px 13px;font-family:Pretendard,system-ui,sans-serif;line-height:1.5;text-align:left;${base}">
    <button class="merchant-pop__close" type="button" aria-label="닫기" style="position:absolute;top:7px;right:7px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:rgba(31,28,24,.06);color:#6b6258;font-size:12px;line-height:1;cursor:pointer">✕</button>
    <div style="font-weight:800;font-size:14px;color:#1f1c18;padding-right:22px;${base}">${esc(m.n)}</div>
    <div style="font-size:11.5px;color:#6b6258;margin-top:3px;${base}">${cat.emoji} ${esc(m.t || cat.label)}</div>
    <div style="font-size:11.5px;color:#6b6258;margin-top:3px;${base}">${esc(m.a)}</div>
    ${progs ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${progs}</div>` : ""}
    ${m.tel ? `<div style="font-size:11.5px;color:#1f4e5f;margin-top:8px;font-weight:600;${base}">☎ ${esc(m.tel)}</div>` : ""}
  </div>`;
}

function esc(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
