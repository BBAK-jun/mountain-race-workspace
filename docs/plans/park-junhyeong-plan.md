# 박준형 Plan

## 진행 현황 (2026-04-04)

- [x] Phase 0-A 완료 (의존성 catalog 연결, feature 폴더 뼈대 고정)
- [x] Phase 0-B 완료 (starter shell 제거, fullscreen route 레이아웃 전환)
- [x] Phase 0-C 완료 (route wiring 초안, `/race`·`/result` guard 적용)
- [x] Phase 0-C 변경 PR 머지 완료
- [x] 정도은 Phase 0-1 머지 확인 및 리뷰 반영 완료
- [x] 정도은 Phase 2(PR #6) 머지 완료
- [x] 윤영서 PR #5 머지 완료 (`Track.tsx`, `r3f-jsx.d.ts`)
- [x] 윤영서 PR #9 머지 완료 (`Character.tsx`)
- [x] 윤영서 PR #10 머지 완료 (`Environment.tsx`, `SpeechBubble.tsx`)

지금부터의 우선순위:

1. Phase 1 통합: `routes/race.tsx`에 `Track` + `Character` + `Environment` + `SpeechBubble` + overlay 실제 컴포넌트 연결
2. store 계약 반영: 임시 route guard 상태 접근을 실제 `useGameStore` selector 기반으로 전환
3. 비인게임 화면 연결: `Landing/Setup/Result` 실제 액션 wiring(`startRace`, `finishRace`, `resetGame`) 반영
4. RaceScreen/CameraSystem/EventSystem 연동 시 route 전환 타이밍 점검
5. 통합 충돌 선제 점검: route entry/import path/styles 충돌 확인

역할:

- Foundation Lead
- App Shell Owner
- Integration Owner

당신은 이 레포의 스캐폴딩을 이미 만든 사람이라, 가장 먼저 기반을 고정하는 역할을 맡는다.

---

## 1. 당신의 목표

나머지 3명이 충돌 없이 병렬 개발을 시작할 수 있는 foundation을 만든다.

핵심 결과물:

- route tree를 게임 플로우에 맞게 재구성
- feature 폴더 구조 생성
- 화면별 route 진입점 연결
- 전역 스타일 제약 제거
- `routes/race.tsx` 조합 기준 확정
- 1차 통합의 기준 브랜치 제공

---

## 2. 당신만 수정해야 하는 파일

- `pnpm-workspace.yaml`
- `apps/web/package.json`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/index.tsx`
- `apps/web/src/routes/setup.tsx`
- `apps/web/src/routes/race.tsx`
- `apps/web/src/routes/result.tsx`
- `apps/web/src/styles.css`

필요 시 생성:

- `apps/web/src/features/mountain-race/` 하위 빈 디렉토리와 re-export 파일

---

## 3. Step By Step

## Phase 0-A. 의존성과 폴더 뼈대

1. `pnpm-workspace.yaml`에 게임용 의존성 catalog 추가

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `zustand`
- `@types/three`

2. `apps/web/package.json`에서 위 의존성을 `catalog:`로 연결

3. 아래 디렉토리 생성

```text
apps/web/src/features/mountain-race/
├── app/
├── components/
├── constants/
├── data/
├── screens/
├── store/
├── systems/
└── types/
```

4. 각 폴더에 빈 파일 또는 최소 placeholder를 만든다.

완료 기준:

- 다른 팀원이 pull/rebase 후 바로 파일 작업 가능

## Phase 0-B. route와 레이아웃 전환

1. `apps/web/src/routes/__root.tsx`에서 starter topbar와 panel shell 제거
2. `<Outlet />` 중심 최소 레이아웃으로 교체
3. `apps/web/src/styles.css`에서 아래 제약 제거 또는 격리

- `max-width`
- `sticky header`
- `page-grid`
- `panel`
- centered shell

4. route 파일을 아래 구조로 만든다.

- `apps/web/src/routes/index.tsx` → `LandingScreen`
- `apps/web/src/routes/setup.tsx` → `SetupScreen`
- `apps/web/src/routes/race.tsx` → scene + in-game overlay 조합
- `apps/web/src/routes/result.tsx` → `ResultScreen`

5. 잘못된 직접 진입을 막는 redirect 규칙을 정도은과 맞춘다.

완료 기준:

- 게임용 풀스크린 레이아웃을 막는 route shell이 남아 있지 않다.

## Phase 0-C. route wiring 초안

1. 각 route가 feature screen 또는 조합 레이어를 import 하도록 연결
2. `index -> setup -> race -> result` 흐름이 성립하도록 navigation 기준을 잡는다
3. 정도은이 만든 state 계약과 route guard를 맞춘다

완료 기준:

- 컴포넌트 뼈대만으로도 route 간 이동 자리와 레이스 자리 구조가 보인다.

---

## 4. 병렬 이후 당신의 역할

## Phase 1. App Flow Integration

- 여찬규가 만든 비인게임 화면 컴포넌트를 각 route에 연결
- `routes/race.tsx`에서 윤영서의 scene와 정도은의 overlay를 합친다
- store action과 route 이동 wiring 담당
- 공통 layout, spacing, fullscreen ownership 유지

실행 체크리스트:

- [ ] `RaceScreen` + `HUD/EventAlert/EventLog` 실컴포넌트 결합
- [ ] `setupComplete`, `hasResult` guard를 store 기반으로 전환
- [ ] setup -> race 진입 시 `startRace` 호출 지점 확정
- [ ] race 종료 -> result 전환 시 `finishRace`/`hasResult` 흐름 확정
- [ ] result -> landing 복귀 시 `resetGame` 흐름 확정

## Phase 2. 1차 통합 오너

병합 순서:

1. 본인 foundation
2. 정도은 gameplay/in-game UI
3. 윤영서 scene
4. 여찬규 non-race screens

당신이 확인해야 할 것:

- import path 충돌
- route entry 충돌
- styles 충돌
- fullscreen layout 깨짐
- race route composition 깨짐

## Phase 3. 마감 전 정리

- dead styles 제거
- placeholder text 제거
- 통합 후 전체 플로우 점검

---

## 5. 당신이 정도은에게 먼저 받아야 하는 것

- `GameState` 최소 shape
- `setupComplete`
- `startRace`
- `finishRace`
- `hasResult`
- `resetGame`
- race route가 읽어야 할 in-game overlay 조건

이 계약이 오면 바로 route guard와 navigation wiring을 붙인다.

현재 상태:

- route guard와 navigation wiring 1차 반영 완료
- gameplay 계약(Phase 2) 머지 반영 완료
- scene PR(#5) 머지 반영 완료
- scene PR(#9) 머지 반영 완료
- scene PR(#10) 머지 반영 완료
- 다음 단계는 store 기반 guard 전환 + race route 실컴포넌트 조합 + 결과 전환 플로우 확정

---

## 6. Acceptance Criteria

- `apps/web`가 더 이상 starter landing shell을 렌더링하지 않는다.
- `/`, `/setup`, `/race`, `/result` route가 화면별로 분리된다.
- `routes/race.tsx`가 scene와 overlay를 동시에 안정적으로 렌더링한다.
- 다른 3명이 feature 파일만 수정해도 통합이 가능하다.

---

## 7. 주의사항

- `types/index.ts`와 `store/useGameStore.ts`는 직접 소유하지 않는다.
- gameplay 계산 로직을 route 파일에 넣지 않는다.
- 임시 타입을 따로 만들지 말고 정도은과 계약을 맞춘다.
