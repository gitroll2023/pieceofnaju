// 장소별 '나주한조각 큐레이션' 꿀팁 — 코스/발견에서 그 장소가 나올 때 같이 뜬다(이름 부분일치).
// pick: true = 나주한조각이 '직접 다녀온 곳'(발견 '조각Pick' 필터·골드 핀에 포함). 정보용 꿀팁은 pick 없음.
export const PLACE_CURATION: { match: string; tip: string; pick?: boolean }[] = [
  {
    match: "이화림",
    tip: "정원이 있어 특히 40대 이상이 여유롭게 즐기기 좋아요. 6월 한 달 매주 화요일 오전 10시엔 ‘나주에 산다’를 주제로 로컬 크리에이터 모임 ‘취향살롱’(나주문화재단 문화사업)이 열려요 — 나주에서 SNS·블로그를 하거나 해보고 싶은 분이면 초보·서포터즈 상관없이, 소통에 관심 있는 누구나 환영! 6/16·23·30엔 나주한조각의 AI 맛보기 특강도 있어요.",
  },
  {
    match: "남평507",
    tip: "사장님이 2026년 조선대 ‘한 해 3명’만 뽑는 시상에서 이이남·김남기 작가와 함께 수상한 화가예요. 7월엔 조선대 본관에서 2~3개월간 작품 전시(점심시간 제외)도 열려요. 미술·전시를 좋아한다면 꼭.",
  },
  {
    match: "티롤도너츠",
    tip: "커피도 팔지만 메인은 직접 만든 빵·도너츠예요. 타지에서도 일부러 찾아오는 남평의 로컬 찐맛집! 사장님 텐션이 워낙 좋아서 가면 누구나 친구가 될 것 같은 분 — 재미있고 서비스도 진짜 좋아요. (인스타 @tirol.donuts)",
  },
  {
    match: "온도예",
    tip: "물레·핸드빌딩으로 나만의 그릇을 빚는 도자기 공방. 손으로 차분히 무언가 만드는 시간을 좋아한다면 딱.",
  },
  {
    match: "사매기 째깐한",
    tip: "원도심 골목 안 작은 사립 박물관. 깨진 고무신·반짇고리·곰탕 끓이던 놋솥까지, 나주 사람들의 손때 묻은 생활을 들여다볼 수 있어요. (인스타 @samaegj)",
  },
  {
    match: "173-47",
    tip: "나주한조각이 직접 다녀온 곳! 컵빙수가 양이 어마어마하게 많고 진짜 맛있어요. 그래서 늘 인기. 가성비 빙수 찾는다면 여기.",
    pick: true,
  },
  {
    match: "리버트리",
    tip: "나주한조각이 다녀온 곳! 강변 노을뷰가 진짜 미쳤어요. 해질녘에 맞춰 가면 최고예요.",
    pick: true,
  },
  {
    match: "마마스롱",
    tip: "나주한조각이 다녀온 곳! 마카롱 찐맛집이에요. 마카롱 좋아한다면 무조건 들러요.",
    pick: true,
  },
  {
    match: "B.ster",
    tip: "나주한조각이 다녀온 곳! 오이샌드위치·크림치즈바게트·딸기타르트·딸기케이크가 도파민 터지는 맛이에요. 혁신도시 빵 좋아하면 필수.",
    pick: true,
  },
  {
    match: "am)167",
    tip: "나주한조각이 다녀온 곳! 김밥·떡볶이가 찐찐맛집이에요. 가격이 조금 있어도 진짜 맛있음.",
    pick: true,
  },
  {
    match: "람바다하우스 3호점",
    tip: "나주한조각이 자주 가는 곳! 깔끔하고 가격도 무난한데 음식이 다 맛있어요. (한전점)",
    pick: true,
  },
];

export function curationFor(name: string): string | undefined {
  return PLACE_CURATION.find((c) => name.includes(c.match))?.tip;
}
// '직접 다녀온 곳'인지(인스타 연결과 별개로 Pick 표시). 정보용 꿀팁은 false.
export function curationPick(name: string): boolean {
  return PLACE_CURATION.some((c) => name.includes(c.match) && c.pick === true);
}

// 관리자 페이지에서 추가한 큐레이션(DB)을 런타임에 덮어씀(place_id 우선).
let runtime: Record<string, { tip: string; pick: boolean }> = {};
export function setCurationRuntime(map: Record<string, { tip: string; pick: boolean }>) {
  runtime = map || {};
}
// id(우선) 또는 이름으로 큐레이션 꿀팁 조회
export function curationOf(id: string, name: string): string | undefined {
  return runtime[id]?.tip || curationFor(name);
}
// id(우선) 또는 이름으로 '다녀온 곳(Pick)' 여부
export function curationPickOf(id: string, name: string): boolean {
  if (runtime[id]) return !!runtime[id].pick;
  return curationPick(name);
}
