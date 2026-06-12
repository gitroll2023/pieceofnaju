---
name: a11y-check
description: 접근성·모바일 사용성 점검 — 드로어/바텀시트 포커스·aria, 터치영역, 대비, 키보드(Esc), 다크모드 색상 누락 등.
---

# 접근성·사용성 점검

## 점검 항목
- **오버레이**(사이드드로어/바텀시트/AuthSheet/ContactSheet): `role="dialog"` + `aria-modal` + `aria-label`, **Esc 닫기**, 열림 중 `body` 스크롤 잠금, 배경 탭 닫기, 닫기 버튼 존재.
- **터치 영역**: 주요 버튼 최소 ~40px(`size-9`~`size-10`), 간격 충분(가로 스크롤 칩 포함).
- **대비**: 라이트/다크 **둘 다** 본문 `text-ink-soft` 대비 확인. 하드코딩 색은 다크에서 깨지므로 토큰화.
- **이미지**: `alt` 필수. `no-img-element` disable은 의도된 경우만.
- **폼**: `label` 연결, 에러 메시지 텍스트 노출, `disabled`/busy 상태 표시.
- **포커스 가시성**: `focus:border-*`/`focus:ring-*` 유지.

## 진행
컴포넌트별로 위 항목 점검 → 위반 목록 + 수정안. 다크모드 토큰 누락은 [[design-audit]]와 함께 처리.
