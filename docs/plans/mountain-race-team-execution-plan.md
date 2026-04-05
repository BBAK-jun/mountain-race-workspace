# Mountain Race Team Execution Plan

이 문서는 `Mountain Race` 구현을 특정 사람 기준 분업 문서가 아니라 workstream 기반 실행 계획으로 정리한다.

기준 문서:

- `docs/prd/1-core-race-product-manual.md`
- `docs/prd/2-mvp-race-product-manual.md`
- `docs/prd/3-race-systems-product-manual.md`

---

## 1. 목표

여러 작업이 병렬로 움직여도 foundation 단계의 계약 충돌을 줄이고, route부터 결과 화면까지 한 판이 끊기지 않게 유지한다.

최종 목표:

- 랜딩 → 설정 → 레이스 → 결과까지 별도 route에서 동작
- 2~8명 로컬 플레이
- R3F 기반 트랙, 캐릭터, 카메라
- 이벤트, 대사, HUD, 결과 화면까지 이어지는 플레이어블 MVP

---

## 2. 현재 코드 기준 확인

- `routes/race.tsx`는 `RaceRouteComposition`을 렌더링한다.
- 인게임 오버레이는 `InGameOverlaySlot`에서 `HUD`, `EventAlert`, `EventLog`를 함께 렌더링한다.
- 결과 진입은 `hasResult` 변화 시 `/result` 자동 네비게이션으로 동작한다.
- `ResultScreen`은 별도 `ResultScene` 위에 최종 순위, 포디움, MVP 카드를 오버레이한다.

다음 통합 포인트:

- 2인/8인 기준 레이스 종료 타이밍과 유예시간 체감 검증
- 모바일 viewport에서 HUD, 이벤트 로그, 결과 카드 가독성 회귀 점검
- 결과 화면 통계 확장 범위 정리

---

## 3. Workstream

### Foundation

범위:

- `apps/web/package.json`
- `pnpm-workspace.yaml`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/index.tsx`
- `apps/web/src/routes/setup.tsx`
- `apps/web/src/routes/race.tsx`
- `apps/web/src/routes/result.tsx`
- `apps/web/src/styles.css`

목표:

- route와 layout의 최소 뼈대 고정
- fullscreen 게임 레이아웃 제약 제거
- feature scaffold와 dependency 기준 정리

### Gameplay Core And Overlay

범위:

- `apps/web/src/features/mountain-race/types/index.ts`
- `apps/web/src/features/mountain-race/constants/balance.ts`
- `apps/web/src/features/mountain-race/store/useGameStore.ts`
- `apps/web/src/features/mountain-race/systems/EventSystem.ts`
- `apps/web/src/features/mountain-race/systems/DialogueSystem.ts`
- `apps/web/src/features/mountain-race/data/*`
- `apps/web/src/features/mountain-race/components/InGameOverlaySlot.tsx`
- 후속 HUD 계열 컴포넌트

목표:

- 단일 상태 원본과 이벤트 계약 고정
- 인게임 HUD, 경고, 로그의 표시 기준 정리

### Race Scene And Camera

범위:

- `apps/web/src/features/mountain-race/screens/RaceScreen.tsx`
- `apps/web/src/features/mountain-race/components/Track.tsx`
- `apps/web/src/features/mountain-race/components/Character.tsx`
- `apps/web/src/features/mountain-race/components/Environment.tsx`
- `apps/web/src/features/mountain-race/components/SpeechBubble.tsx`
- `apps/web/src/features/mountain-race/systems/CameraSystem.tsx`

목표:

- 트랙, 캐릭터, 카메라, 씬 연출 고정
- scene 내부 말풍선 렌더링 유지

### Non-Race Screens

범위:

- `LandingScreen`
- `SetupScreen`
- `ResultScreen`

목표:

- 레이스 외 화면 플로우 완성
- setup/result UX와 route 이동 기준 정리

### Integration

범위:

- route redirect
- scene와 overlay 조합
- 결과 진입 흐름
- 모바일 회귀와 종료 타이밍 검증

목표:

- `/ -> /setup -> /race -> /result` 흐름 유지
- scene와 overlay의 책임 경계 보존

---

## 4. 충돌 방지 규칙

- foundation과 gameplay contract가 먼저 고정돼야 나머지 workstream이 안전하게 붙는다.
- gameplay core는 `types`, `store`, `systems`, `data`, overlay까지만 수정한다.
- race scene은 `RaceScreen`과 3D 컴포넌트까지만 수정한다.
- route-level composition은 integration 단계에서만 수정한다.
- 계산 로직은 화면 컴포넌트가 아니라 `systems` 또는 `store`에 둔다.

---

## 5. 인터페이스 계약

공유 상태 키:

- `characters[].id`
- `characters[].name`
- `characters[].color`
- `characters[].faceImage`
- `characters[].progress`
- `characters[].status`
- `rankings`
- `cameraMode`
- `cameraTarget`
- `activeBubble`
- `activeGlobalEvent`
- `finishedIds`

조합 규칙:

- `RaceScreen`은 scene와 scene anchored element만 렌더링한다.
- `InGameOverlaySlot`은 route-level fixed overlay만 렌더링한다.
- `routes/race.tsx`는 `RaceRouteComposition` 기준으로 scene와 overlay를 조합한다.

```tsx
<main className="route-shell">
  <RaceSceneSlot />
  <InGameOverlaySlot />
</main>
```

---

## 6. 실행 순서

1. foundation에서 route, layout, dependency, scaffold를 고정한다.
2. gameplay core에서 `types`, `store`, `systems`, overlay 계약을 고정한다.
3. non-race screens와 race scene workstream이 병렬로 구현된다.
4. integration에서 `routes/race.tsx`, redirect, result flow를 연결한다.
5. 마지막으로 모바일, 2인/8인, 종료 타이밍을 회귀 검증한다.

---

## 7. 완료 기준

- `Landing`, `Setup`, `Race`, `Result` route가 끊기지 않고 이동한다.
- `RaceRouteComposition`에서 scene와 overlay가 함께 렌더링된다.
- HUD, 이벤트 알림, 이벤트 로그가 레이스 흐름과 동기화된다.
- 결과 화면에서 최종 순위와 MVP가 읽힌다.
- 모바일과 다양한 플레이어 수에서 종료 타이밍이 무너지지 않는다.
