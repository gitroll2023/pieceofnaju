// 카카오맵 JS SDK 동적 로더.
// NEXT_PUBLIC_KAKAO_MAP_KEY 가 있을 때만 실지도를 띄우고,
// 없으면 컴포넌트가 일러스트 폴백 지도를 렌더한다.

export const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";
export const hasKakaoKey = KAKAO_KEY.length > 0;

// 카카오 SDK는 별도 타입 패키지를 쓰지 않으므로 느슨한 별칭으로 다룬다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Kakao = any;

declare global {
  interface Window {
    kakao: Kakao;
  }
}

let sdkPromise: Promise<Kakao> | null = null;

export function loadKakao(): Promise<Kakao> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("kakao SDK는 브라우저에서만 로드됩니다."));
  }
  if (!hasKakaoKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 미설정"));
  }
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve(window.kakao);
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services,clusterer`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () =>
      reject(new Error("카카오맵 SDK 로드 실패 (도메인 등록/키 확인)"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

// 나주 중심 좌표 (금성관/혁신도시 중간쯤)
export const NAJU_CENTER = { lat: 35.0205, lng: 126.752 };
