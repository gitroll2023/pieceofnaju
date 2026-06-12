---
name: design-audit
description: 나주한조각 UI 일관성 감사 — 폰트크기·여백·z-index·하드코딩 색상이 제각각인 곳을 찾아 디자인 토큰 기준으로 정리. "규격이 흔들린다"거나 화면 간 톤이 안 맞을 때 사용.
---

# 디자인 일관성 감사

목표: **토스풍 미니멀 + 나주 손맛**의 일관성 유지. 비-AI 에디토리얼 느낌.

## 점검 항목
- **z-index 사다리**(이 값만 사용): 바텀시트 `z-30` · 탭바 `z-40` · 사이드드로어 backdrop `z-60`/패널 `z-70` · ContactSheet `z-80` · AuthSheet `z-1200` · pieceadmin `z-3000`. 새 오버레이는 이 사다리 안에서.
- **색상**: 하드코딩 hex 지양. `globals.css` 토큰만 — `text-ink/ink-soft`, `border-line`, `bg-card/background/muted`, `text-river/pear-deep/hongeo`, `color-mix(in oklab, var(--naju-*) NN%, ...)`. 다크는 `.dark` 토큰 자동 추종(하드코딩 색은 다크에서 깨짐).
- **타이포**: 본문 `text-[12~14px]`, 타이틀 `brand-serif`. 한글 줄바꿈 `break-keep` / `wordBreak:"keep-all"`. 잘림은 `line-clamp-N`.
- **여백/모서리**: 카드 `rounded-2xl`, 컨테이너 `px-4/px-5`, gap 1.5~3.
- **레이아웃 안정**: 세로 스크롤 페이지는 `scrollbar-gutter: stable`(globals.css) 유지 → 탭 전환 시 폭 불변.

## 진행
1. Grep으로 위반 패턴 수집: 인라인 `z-\[\d+\]`, `style={{...#하드코딩hex...}}`, 산발적 `text-\[\d+px\]`.
2. 위반 목록 + 토큰 치환안 제시 → 사용자 확인.
3. 광범위하면 Workflow로 파일별 병렬 점검 후 합성.
