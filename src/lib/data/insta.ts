// 장소(가게/관광지) id → 인스타그램 URL 매핑.
// merchants.json/spots.json을 건드리지 않고 여기에 한 줄씩 추가하면 카드에 인스타가 연결됨.
export const INSTA_LINKS: Record<string, string> = {
  "사매기째깐한박물관": "https://www.instagram.com/samaegj/", // 자봉아재
  "115174656": "https://www.instagram.com/cafe_ehwalim.naju/", // 나주 이화림 카페
  "101986961": "https://www.instagram.com/tirol.donuts/", // 티롤도너츠
  "121536309": "https://www.instagram.com/nampyeong507/", // 남평507
  "87262275": "https://www.instagram.com/mamasron/", // 마마스롱
  "110318077": "https://www.instagram.com/mimi_monkfish/", // 미미아구찜
  "102095507": "https://www.instagram.com/cunjanesogeumgui_naju/", // 춘자네소금구이 나주혁신점
  "111449792": "https://www.instagram.com/cafe173_/", // 카페173-47 (컵빙수)
  "97371845": "https://www.instagram.com/cafe_b.ster/", // 비스터 (오이샌드위치·크림치즈바게트·딸기타르트)
};

// 관리자 페이지에서 추가한 인스타 링크(DB)를 런타임에 덮어씀. instaOf가 DB 우선 참조.
let runtime: Record<string, string> = {};
export function setInstaRuntime(map: Record<string, string>) {
  runtime = map || {};
}
export const instaOf = (id: string): string | undefined => runtime[id] || INSTA_LINKS[id];
