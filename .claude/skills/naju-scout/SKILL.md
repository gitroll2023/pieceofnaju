---
name: naju-scout
description: 나주 새 정보(행사·혜택·관광지·핫플)를 visitnaju·나주문화재단·웹에서 병렬 스크래핑해, 우리에 없는 것 중 추가 후보를 추려옴.
---

# 나주 정보 스카우트

Workflow로 병렬 수집 후 종합한다.

## 수집(병렬)
- A: `https://www.naju.go.kr/visitnaju` 메인 + 하위(관광·코스·먹거리·혜택)
- B: 축제/이벤트 페이지
- C: `https://www.njcf.or.kr` 행사/공연/전시 캘린더 (신규 idx 위주)
- D: WebSearch "나주 2026 축제 일정 / 가볼만한곳 / 핫플 카페"

## 종합
현재 데이터(`culture_events`, `public/data/spots.json`, `insta` 가게)와 대조 → **중복 제외**, 출처·날짜 확실한 것만, 각 후보에 **넣을 위치**(추천별 이벤트 / 발견 관광지 / 가게) 제안. 표로 출력.

## 원칙
- 추측·미확인은 '확인필요' 표기. 1차 출처(나주시·재단) 우선, 블로그는 교차확인.
- **우주드림은 운영중 → 유지**(옛 페이지 종료표기 무시).
- 재스크랩 권장: 월1회 njcf 캘린더 · 시즌전환기(2·4·8·10·11월) naju festival/visitnaju.
- 이벤트형은 [[naju-event]]로, 장소형은 좌표 지오코딩 후 spots.json에 추가.
