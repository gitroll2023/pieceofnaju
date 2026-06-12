"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasKakaoKey, loadKakao, NAJU_CENTER, type Kakao } from "@/lib/kakao";
import { CATEGORY_META, PROGRAM_META, visiblePrograms, type Merchant } from "@/lib/data/merchants";

// 핀 SVG 생성기(색만 다르게)
const pinSvg = (fill: string, inner = "#fffdf9") =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path d="M15 1C7.3 1 1 7.1 1 14.6c0 9.2 12.2 21.4 13.2 22.4a1 1 0 0 0 1.6 0C16.8 36 29 23.8 29 14.6 29 7.1 22.7 1 15 1z" fill="${fill}" stroke="#fffdf9" stroke-width="2"/><circle cx="15" cy="14.5" r="4.6" fill="${inner}"/></svg>`,
  );
// 일반 핀: 영산강 딥블루 / 나주한조각이 다녀온(인스타 연결) 핀: 나주배 골드
const PIN_SRC = pinSvg("#1f4e5f");
const PICK_SRC = pinSvg("#e8a33d", "#3a2a0c");

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
  fitKey,
  onBoundsChange,
  onSelect,
  pickIds,
}: {
  merchants: Merchant[];
  className?: string;
  /** 나주한조각이 다녀온 곳(인스타 연결) — 골드 핀으로 강조 */
  pickIds?: Set<string>;
  /** 이 id의 위치로 지도를 확대 이동 + 카드 열기 */
  focus?: string | null;
  /** 내 위치가 잡히면 좌표 전달(거리 계산용) */
  onLocate?: (loc: { lat: number; lng: number }) => void;
  /** 값이 바뀌면 현재 핀들에 맞춰 지도 화면을 맞춤(권역 선택 시 이동). 빈값이면 나주 전체로 리셋 */
  fitKey?: string | null;
  /** 지도 이동/줌이 멈출 때마다 현재 보이는 영역(bounds) 전달 — "이 화면만" 목록용 */
  onBoundsChange?: (b: { swLat: number; swLng: number; neLat: number; neLng: number }) => void;
  /** 핀(또는 목록)에서 한 곳을 선택했을 때 — 페이지가 바텀시트를 접도록 */
  onSelect?: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Kakao>(null);
  const clustererRef = useRef<Kakao>(null);
  const overlayRef = useRef<Kakao>(null);
  const pinImgRef = useRef<Kakao>(null);
  const pickImgRef = useRef<Kakao>(null);
  const pickRef = useRef<Set<string> | undefined>(pickIds);
  pickRef.current = pickIds;
  const userRef = useRef<Kakao>(null);
  const watchRef = useRef<number | null>(null);
  const merchantsRef = useRef<Merchant[]>(merchants);
  merchantsRef.current = merchants;
  const onBoundsRef = useRef(onBoundsChange);
  onBoundsRef.current = onBoundsChange;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
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
          // 2곳 이상만 묶음(개수 버블), 외딴 1곳은 바로 핀으로 → 여러 번 안 눌러도 됨
          map, averageCenter: true, minLevel: 5, gridSize: 70, disableClickZoom: false,
          // 묶음 개수 동그라미 — 기본 파란색 대신 브랜드 색(영산강 딥블루→나주배 골드)으로
          calculator: [30, 100, 300],
          styles: [
            clusterStyle(36, "rgba(31,78,95,.92)", "12px"),
            clusterStyle(44, "rgba(31,78,95,.94)", "13px"),
            clusterStyle(52, "rgba(201,130,31,.95)", "14px"),
            clusterStyle(62, "rgba(140,58,74,.95)", "15px"),
          ],
        });
        // 단독 핀 — 기본(딥블루) / 다녀온 곳(골드)
        pinImgRef.current = new kakao.maps.MarkerImage(
          PIN_SRC, new kakao.maps.Size(30, 38), { offset: new kakao.maps.Point(15, 37) },
        );
        pickImgRef.current = new kakao.maps.MarkerImage(
          PICK_SRC, new kakao.maps.Size(34, 43), { offset: new kakao.maps.Point(17, 42) },
        );
        overlayRef.current = new kakao.maps.CustomOverlay({ yAnchor: 1.32, zIndex: 7, clickable: true });
        // 빈 곳 클릭 시 카드 닫기
        kakao.maps.event.addListener(map, "click", () => overlayRef.current?.setMap(null));
        // 이동/줌 멈출 때마다 현재 보이는 영역 보고("이 화면만" 목록용)
        kakao.maps.event.addListener(map, "idle", () => {
          const b = map.getBounds();
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          onBoundsRef.current?.({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() });
        });
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
      const isPick = pickRef.current?.has(m.id);
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(m.lat, m.lng),
        image: (isPick ? pickImgRef.current : pinImgRef.current) || undefined,
        zIndex: isPick ? 5 : 1,
      });
      kakao.maps.event.addListener(marker, "click", () => {
        onSelectRef.current?.(); // 바텀시트 접기(페이지)
        const pos = marker.getPosition();
        mapRef.current?.panTo(pos); // 누른 핀을 중앙으로 → 카드 안 잘림
        const el = buildCard(m, () => overlayRef.current?.setMap(null));
        overlayRef.current.setContent(el);
        overlayRef.current.setPosition(pos);
        overlayRef.current.setMap(mapRef.current);
      });
      return marker;
    });
    clusterer.addMarkers(markers);
  }, [merchants, ready, pickIds]);

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

  // 권역 선택 시: 현재 핀들에 맞춰 화면 이동(빈값이면 나주 전체로 리셋)
  useEffect(() => {
    const kakao = window.kakao;
    if (!ready || !mapRef.current || !kakao?.maps) return;
    overlayRef.current?.setMap(null);
    const pts = merchantsRef.current;
    if (!fitKey) {
      mapRef.current.setLevel(9);
      mapRef.current.panTo(new kakao.maps.LatLng(NAJU_CENTER.lat, NAJU_CENTER.lng));
      return;
    }
    if (pts.length === 0) return;
    if (pts.length === 1) {
      mapRef.current.setLevel(5);
      mapRef.current.panTo(new kakao.maps.LatLng(pts[0].lat, pts[0].lng));
      return;
    }
    const bounds = new kakao.maps.LatLngBounds();
    for (const m of pts) bounds.extend(new kakao.maps.LatLng(m.lat, m.lng));
    mapRef.current.setBounds(bounds, 48, 40, 40, 40);
  }, [fitKey, ready]);

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
        className="absolute right-3 top-3 z-[8] grid size-10 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur transition active:scale-90"
        style={{ color: located ? "#2b7fff" : "var(--naju-ink-soft)" }}
      >
        <Crosshair className="size-5" />
      </button>
    </div>
  );
}

/** 클러스터(묶음 개수) 동그라미 스타일 — 브랜드 색 + 흰 테두리 */
function clusterStyle(size: number, bg: string, font: string): Record<string, string> {
  return {
    width: `${size}px`,
    height: `${size}px`,
    lineHeight: `${size}px`,
    textAlign: "center",
    color: "#fff",
    fontSize: font,
    fontWeight: "800",
    borderRadius: "999px",
    background: bg,
    border: "2px solid #fffdf9",
    boxShadow: "0 4px 12px rgba(31,28,24,.32)",
  };
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
  const progs = visiblePrograms(m.p)
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
