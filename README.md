# 나주한조각 (A Piece of Naju) 🧩

전남 **나주**를 한 조각씩 모으는 모바일 로컬 가이드.
인스타그램 [@piece_of_naju](https://instagram.com/piece_of_naju) 연동.

> 더미 데이터 없이 **전부 실데이터**로 만들었습니다.

## 기능

- **가이드(메인)** — KB 사용처 기반 음식점·카페 + 관광·명소 + 🌸 이 계절의 꽃 + "오늘의 한 조각" + **내 위치 추적·거리·길찾기**
- **혜택** — KB 사용처 가맹점 6,001건(고유가·온누리·전통시장) · 동/업종 필터 · 클러스터 지도
- **코스** — 페르소나 6종(처음/미식/가족/커플/사진/역사) 권역 동선
- **내조각** — 가게·장소를 조각으로 수집(localStorage, 비로그인) + 공유

## 스택

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Kakao Map JS SDK(미등록 도메인은 OpenStreetMap 폴백) · framer-motion · 카카오 MarkerClusterer

## 데이터 파이프라인 (`scripts/`)

1. `kb_crawl.mjs` — Playwright로 KB카드 사용처 46개 동 순회 수집(6,001건)
2. `geocode_dongs.mjs` — 동 좌표(OSM Nominatim)
3. `enrich_naver.mjs` — 네이버 지역검색으로 상호명 → 실주소·정좌표 보정
4. `collect_spots.mjs` — 관광지·꽃명소 후보 수집(네이버)
5. `build_merchants.mjs` — `public/data/merchants.json` 생성
6. 관광지 설명·페르소나 코스는 리서치로 `public/data/{spots,flowers,courses}.json` 생성

## 시작

```bash
npm install
npm run dev   # http://localhost:3000
```

### 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_KAKAO_MAP_KEY=   # 카카오 지도 JS 키 (없으면 OSM 폴백)
# 데이터 보정 스크립트용(서버 전용, 선택)
KAKAO_REST_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

카카오 지도는 콘솔의 **JavaScript SDK 도메인**에 사용 도메인을 등록해야 합니다(예: `http://localhost:3000`, 배포 도메인). 위치 기능은 HTTPS(또는 localhost)에서 동작합니다.

---

데이터 출처: KB국민카드 사용처 · 네이버 지역검색 · 공개 자료. 영업정보·좌표는 근사치이며 방문 전 확인을 권합니다.
