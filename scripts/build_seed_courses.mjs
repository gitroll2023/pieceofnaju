// 시드 코스를 우리 실데이터(spots.json + merchants.json)의 좌표/id로 조립 + 장소별 실제 비용 포함.
// 코스 총비용(budgetKrw) = 장소 비용 합. 실행: node scripts/build_seed_courses.mjs
import { readFile, writeFile } from "node:fs/promises";

const spots = JSON.parse(await readFile("public/data/spots.json", "utf8"));
const merchants = JSON.parse(await readFile("src/data/merchants.json", "utf8"));

function find(name) {
  const norm = (x) => x.replace(/\s/g, "");
  const n = norm(name);
  const sp = spots.find((s) => norm(s.n) === n) || spots.find((s) => norm(s.n).includes(n));
  if (sp) return { placeId: sp.id, name: sp.n, kind: "spot", cat: sp.cat, lat: sp.lat, lng: sp.lng };
  const fc = merchants.filter((m) => m.c === "food" || m.c === "cafe");
  const mm = fc.find((m) => norm(m.n) === n) || fc.find((m) => norm(m.n).includes(n));
  if (mm) return { placeId: mm.id, name: mm.n, kind: mm.c, cat: mm.c, lat: mm.lat, lng: mm.lng };
  return { placeId: null, name, kind: "spot", cat: "기타", lat: null, lng: null, gap: true };
}

// cost = 1인 예상 비용(원). 0=무료. costNote=비용 설명
function stops(arr) {
  return arr.map((x, i) => {
    const f = find(x.q);
    return {
      order: i + 1, placeId: f.placeId, name: x.label || f.name, kind: f.kind, cat: f.cat,
      lat: f.lat, lng: f.lng, stayMin: x.stay ?? 40, arriveLabel: x.at || "", note: x.note || "",
      cost: x.cost ?? 0, costNote: x.costNote || "", gap: f.gap || false,
    };
  });
}

const courses = [
  {
    id: "seed_oldtown_half", title: "처음 왔다면, 원도심 반나절", theme: "core",
    summary: "금성관·향교·곰탕거리까지 나주 원도심의 핵심만 걸어서.",
    audience: { kids: false, drink: false, visitor: true, resident: false },
    days: 1, durationHours: 4, party: ["solo", "couple", "friends"], region: "oldtown",
    tags: ["원도심", "도보", "곰탕", "역사"],
    stops: stops([
      { q: "금성관", at: "10:30", stay: 30, note: "조선시대 나주목 객사, 보물", cost: 0, costNote: "무료" },
      { q: "정수루", at: "11:10", stay: 15, cost: 0, costNote: "무료" },
      { q: "나주향교", at: "11:35", stay: 25, note: "전국 최대급 향교", cost: 0, costNote: "무료" },
      { q: "나주곰탕사매기", label: "나주곰탕 사매기", at: "12:20", stay: 50, note: "점심은 나주곰탕", cost: 10000, costNote: "곰탕 1그릇" },
      { q: "사매기 째깐한 박물관", at: "13:30", stay: 40, note: "손때 묻은 생활유물", cost: 2000, costNote: "입장(현장 확인)" },
      { q: "남고문", at: "14:20", stay: 20, note: "복원된 나주읍성 남문", cost: 0, costNote: "무료" },
    ]),
  },
  {
    id: "seed_yeongsanpo_drink", title: "영산포 근대 골목과 홍어 한 점", theme: "retro_drink",
    summary: "내륙 유일 등대와 황포돛배, 삭힌 홍어에 막걸리까지.",
    audience: { kids: false, drink: true, visitor: true, resident: true },
    days: 1, durationHours: 6, party: ["couple", "friends"], region: "yeongsanpo",
    tags: ["영산포", "근대", "홍어", "술"],
    stops: stops([
      { q: "영산포 등대", at: "11:00", stay: 25, note: "1915년, 국내 유일 내륙등대", cost: 0, costNote: "무료" },
      { q: "영산강 황포돛배", at: "11:40", stay: 40, note: "영산강 옛 뱃길 체험", cost: 6000, costNote: "승선료(현장 확인)" },
      { q: "천연염색", label: "천연염색문화관", at: "13:00", stay: 50, note: "쪽빛 천연염색", cost: 3000, costNote: "관람·체험 별도" },
      { q: "홍어1번지", label: "홍어 한 상(영산포)", at: "14:30", stay: 70, note: "삭힌 홍어삼합에 막걸리", cost: 28000, costNote: "홍어삼합 1인" },
      { q: "아트스페이스영산포", at: "16:00", stay: 40, cost: 0, costNote: "무료" },
    ]),
  },
  {
    id: "seed_family_kids", title: "아이와 함께, 실내+야외 하루", theme: "family",
    summary: "박물관에서 배우고 호수공원에서 뛰놀고.",
    audience: { kids: true, drink: false, visitor: true, resident: true },
    days: 1, durationHours: 5, party: ["family"], region: "myeon",
    tags: ["아이", "박물관", "호수공원", "가족"],
    stops: stops([
      { q: "국립나주박물관", at: "10:30", stay: 70, note: "어린이박물관·마한 고분", cost: 0, costNote: "무료" },
      { q: "나주 반남 고분군", at: "12:00", stay: 30, cost: 0, costNote: "무료" },
      { q: "나주곰탕사매기", label: "점심(나주곰탕)", at: "12:50", stay: 50, cost: 10000, costNote: "곰탕 1그릇" },
      { q: "빛가람 호수공원", at: "14:10", stay: 60, note: "분수·산책·자전거", cost: 0, costNote: "무료" },
      { q: "빛가람전망대 모노레일", at: "15:20", stay: 40, note: "모노레일로 전망대까지", cost: 4000, costNote: "모노레일 왕복(현장 확인)" },
      { q: "티롤도너츠", label: "티롤도너츠(디저트)", at: "16:20", stay: 30, cost: 6000, costNote: "음료·디저트" },
    ]),
  },
  {
    id: "seed_couple_sunset", title: "호수 노을과 감성 카페", theme: "couple",
    summary: "이화림에서 커피 한 잔, 호수공원 노을, 전망대 야경.",
    audience: { kids: false, drink: false, visitor: true, resident: true },
    days: 1, durationHours: 4, party: ["couple"], region: "innovation",
    tags: ["연인", "카페", "노을", "호수"],
    stops: stops([
      { q: "이화림", label: "이화림(감성 카페)", at: "15:00", stay: 50, cost: 7000, costNote: "음료" },
      { q: "빛가람 호수공원", at: "16:10", stay: 60, note: "노을 산책", cost: 0, costNote: "무료" },
      { q: "빛가람전망대", at: "17:30", stay: 40, note: "혁신도시 야경", cost: 0, costNote: "무료(모노레일 별도)" },
    ]),
  },
  {
    id: "seed_history_deep", title: "나주 역사 답사, 천천히", theme: "history",
    summary: "목사고을의 객사·향교·읍성과 마한 고분까지.",
    audience: { kids: false, drink: false, visitor: true, resident: true },
    days: 1, durationHours: 5, party: ["solo", "couple", "friends"], region: "oldtown",
    tags: ["역사", "문화재", "고분", "답사"],
    stops: stops([
      { q: "금성관", at: "10:00", stay: 35, cost: 0, costNote: "무료" },
      { q: "나주향교", at: "11:00", stay: 30, cost: 0, costNote: "무료" },
      { q: "남고문", at: "11:45", stay: 20, cost: 0, costNote: "무료" },
      { q: "나주곰탕사매기", label: "점심(나주곰탕)", at: "12:30", stay: 50, cost: 10000, costNote: "곰탕 1그릇" },
      { q: "국립나주박물관", at: "14:00", stay: 70, cost: 0, costNote: "무료" },
      { q: "나주 반남 고분군", at: "15:30", stay: 40, cost: 0, costNote: "무료" },
    ]),
  },
  {
    id: "seed_experience_day", title: "만들고 따고, 사이엔 곰탕·커피 한 잔", theme: "experience",
    summary: "딸기 따고 도자기 빚는 사이, 나주곰탕으로 점심·감성카페로 쉬어가는 하루.",
    audience: { kids: true, drink: false, visitor: true, resident: true },
    days: 1, durationHours: 6, party: ["family", "friends", "couple"], region: "myeon",
    tags: ["체험", "공방", "따기", "미식"],
    stops: stops([
      { q: "머시머시농장", at: "10:30", stay: 70, note: "제철 딸기 따기(겨울~봄)", cost: 18000, costNote: "딸기 체험(현장 확인)" },
      { q: "나주곰탕사매기", label: "나주곰탕 사매기(점심)", at: "12:30", stay: 50, note: "든든하게 나주곰탕", cost: 10000, costNote: "곰탕 1그릇" },
      { q: "온도예", at: "14:00", stay: 90, note: "나만의 그릇 빚기", cost: 28000, costNote: "도자기 원데이(현장 확인)" },
      { q: "이화림", label: "이화림(감성 카페)", at: "16:00", stay: 50, note: "여운은 커피 한 잔", cost: 7000, costNote: "음료" },
    ]),
  },
  {
    id: "seed_nature_2day", title: "자연·힐링 1박 2일", theme: "nature",
    summary: "수목원·산사에서 쉬고, 둘째 날은 호수와 강.",
    audience: { kids: false, drink: false, visitor: true, resident: true },
    days: 2, durationHours: 12, party: ["couple", "family", "friends"], region: "myeon",
    tags: ["자연", "힐링", "1박2일", "산사"],
    stops: stops([
      { q: "나주은행나무수목원", at: "Day1 11:00", stay: 60, cost: 0, costNote: "무료(주차 별도)" },
      { q: "불회사", at: "Day1 13:30", stay: 50, note: "천년 고찰", cost: 0, costNote: "무료" },
      { q: "도래", label: "도래전통한옥마을(숙박)", at: "Day1 16:00", stay: 120, note: "한옥 숙박", cost: 55000, costNote: "한옥 1박(2인1실 1인 기준)" },
      { q: "우주드림", at: "Day2 10:00", stay: 60, note: "나주호 우주 전시관", cost: 5000, costNote: "입장(현장 확인)" },
      { q: "빛가람 호수공원", at: "Day2 14:00", stay: 60, cost: 0, costNote: "무료" },
    ]),
  },
];

// 총비용 = 장소 비용 합(실제 비용)
for (const c of courses) c.budgetKrw = c.stops.reduce((a, s) => a + (s.cost || 0), 0);

let gaps = 0;
for (const c of courses) for (const s of c.stops) if (s.gap) gaps++;
await writeFile("public/data/seed-courses.json", JSON.stringify({ version: 1, courses }, null, 1));
console.log(`시드 코스 ${courses.length}종 → public/data/seed-courses.json`);
console.log(`stop ${courses.reduce((a, c) => a + c.stops.length, 0)} / 갭 ${gaps}`);
for (const c of courses) console.log(` - ${c.title}: 1인 합계 ${c.budgetKrw.toLocaleString()}원`);
