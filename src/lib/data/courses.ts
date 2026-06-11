import type { Course } from "./types";

/*
  나이대별 코스 — 페르소나 기반 큐레이션.
  각 stop의 placeId는 places.ts와 연결됨.
*/
export const courses: Course[] = [
  {
    id: "course-20",
    age: "20",
    title: "퇴근 후, 빛가람 감성 한 바퀴",
    summary:
      "혁신도시에서 일하는 27살 지우의 코스. 노을 지는 호수 산책으로 시작해 감성 카페와 야경 전망대로 마무리하는 데이트 동선.",
    duration: "약 4시간 · 도보+차량 5분 내",
    stops: [
      {
        placeId: "lake-park",
        time: "17:30 노을",
        why: "퇴근 후 호수 한 바퀴로 하루를 비우고 시작",
      },
      {
        placeId: "5block",
        time: "18:30 저녁·디저트",
        why: "혁신도시 젊은 거리에서 분위기 있는 한 끼와 디저트",
      },
      {
        placeId: "pear-dessert",
        time: "20:00 한 잔 더",
        why: "나주배로 만든 시그니처 디저트로 달콤한 마무리",
      },
      {
        placeId: "lake-tower",
        time: "21:00 야경",
        why: "전망대에서 금빛으로 물든 나주 야경을 내려다보기",
      },
    ],
  },
  {
    id: "course-30",
    age: "30",
    title: "아이와 함께, 배우고 채우는 가족 나들이",
    summary:
      "34살 하늘 부부의 주말 코스. 부담 없는 곰탕 한 그릇으로 시작해 무료 박물관과 호수공원까지, 아이도 어른도 만족하는 동선.",
    duration: "약 5시간 · 차량 이동",
    stops: [
      {
        placeId: "hayanjip",
        time: "11:30 점심",
        why: "아이도 잘 먹는 맑은 나주곰탕으로 든든하게",
      },
      {
        placeId: "geumseonggwan",
        time: "13:00 산책",
        why: "곰탕거리 옆 옛 관아에서 가볍게 소화 산책",
      },
      {
        placeId: "naju-museum",
        time: "14:30 관람",
        why: "무료에 시원한 실내, 고분군 이야기로 아이의 호기심 채우기",
      },
      {
        placeId: "lake-park",
        time: "16:30 마무리",
        why: "분수와 너른 잔디에서 아이와 뛰어놀며 하루 정리",
      },
    ],
  },
  {
    id: "course-40",
    age: "40",
    title: "짧게 들렀어도, 나주의 진짜 맛만",
    summary:
      "출장차 들른 45살 정현의 압축 코스. 시간은 없지만 나주의 핵심 향토맛 곰탕과 홍어는 놓치지 않는 효율 동선.",
    duration: "약 3시간 · 핵심만",
    stops: [
      {
        placeId: "hayanjip",
        time: "12:00 점심",
        why: "나주에 왔다면 반드시, 110년 곰탕 한 그릇",
      },
      {
        placeId: "geumseonggwan",
        time: "13:30 짧은 산책",
        why: "식후 10분 거리, 나주목의 위엄을 빠르게 눈에 담기",
      },
      {
        placeId: "deungdae-hongeo",
        time: "18:00 저녁",
        why: "출장의 끝은 영산포 홍어삼합과 한 잔으로 제대로",
      },
    ],
  },
  {
    id: "course-50",
    age: "50",
    title: "옛 정취를 따라, 영산포 향수 여행",
    summary:
      "추억을 찾아온 53살 영자님의 코스. 내륙 등대와 홍어거리, 고즈넉한 향교까지 천천히 걷는 느린 나주.",
    duration: "약 5시간 · 여유롭게",
    stops: [
      {
        placeId: "yeongsanpo-deungdae",
        time: "11:00 강변",
        why: "뱃길의 추억이 남은 영산포 등대와 강바람으로 시작",
      },
      {
        placeId: "hongeo-ilbeonji",
        time: "12:30 점심",
        why: "2대째 이어온 정통 홍어 코스로 깊은 맛 음미",
      },
      {
        placeId: "yeongsan-roaster",
        time: "14:30 쉼표",
        why: "옛 쌀창고를 고친 로스터리에서 강을 보며 한 박자 쉬어가기",
      },
      {
        placeId: "hyanggyo",
        time: "16:00 산책",
        why: "붉은 흙담 따라 걷는 나주향교에서 고요한 마무리",
      },
    ],
  },
];

export function courseByAge(age: Course["age"]): Course | undefined {
  return courses.find((c) => c.age === age);
}
