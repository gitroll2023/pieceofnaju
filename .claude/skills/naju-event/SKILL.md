---
name: naju-event
description: 나주 문화·행사·이벤트를 추천 탭에 추가. 포스터 이미지나 visitnaju/njcf URL을 주면 내용을 추출해 culture_events(DB)에 넣음.
---

# 문화·이벤트 추가

입력: **포스터 이미지**(Read로 읽어 내용 추출) 또는 **URL**(WebFetch).

## 데이터 구조 (src/lib/data/culture.ts · CultureEvent)
`id, title, badge, emoji, color, image?, period, start(YYYY-MM-DD), end, time?, place, audience?, summary, highlights[], schedule?[{day,items[]}], salons?, pickNote?, host?, contact?, link?`

추천별 탭 분류(evCat, badge 기준): `혜택|지원`→benefit · `체험|살롱|커뮤니티`→experience · 그 외→festival. (행사가 앞, 혜택이 뒤)

## 절차
1. 내용 추출 — 날짜·장소·대상·혜택·문의. 관광객 전용이면 `audience`에 "(나주시민 제외)" 명시.
2. `CULTURE_EVENTS`(culture.ts)에 객체 추가 — 폴백/시드 소스.
3. DB 반영: `node scripts/seed_culture.mjs` (id 기준 upsert).
4. 또는 `/pieceadmin` → 문화이벤트 탭에서 직접 추가·발행·삭제.
5. `npm run build`로 검증.

## 원칙
- **실데이터만, 추측 금지.** 날짜/장소 불명확하면 확인 후.
- 손맛 카피(AI티·이모지 남발 금지). **비영리/무광고 단정 문구 쓰지 말 것**(광고 여지).
- 지난 일정은 자동으로 하단 '지난 일정' 탭으로 분류됨(end 기준).
