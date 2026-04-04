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
- [x] 윤영서 PR #11 머지 완료 (`CameraSystem`, `40dceb8`)
- [x] 윤영서 PR #14 머지 완료 (`RaceScreen` scene graph 조합, `e2b9e67`)
- [x] 윤영서 PR #15 머지 완료 (`RaceScreen` fullscreen `100dvh`, `0d3aac4`)
- [x] 윤영서 PR #18 머지 완료 (`LandingScene`, `LandingScreen` 3D 배경, `894f26f`)
- [x] 여찬규 PR #12 머지 완료 (`7554d56`)
- [x] 정도은 PR #13 머지 완료 (`EventSystem`, `1725c40`)
- [x] 정도은 PR #17 머지 완료 (`DialogueSystem`, `abb4ba2`)
  - `4673da4`: `SetupScreen`/`ResultScreen`/`LandingScreen`의 `useGameStore` 액션 wiring 반영
  - `8a2281f`: route guard(sessionStorage) 동기화 복구(`markSetupComplete`, `resetRouteGuardSnapshot`)
  - `.gitignore`에 `.omc/` 무시 규칙 추가

지금부터의 우선순위 (코드 기준 재정렬):

1. race 종료/결과 전환 자동화: `hasResult` 상태와 `/result` 이동을 수동 링크 없이 연결
2. 통합 회귀 점검: 2인/8인에서 `RaceSceneSlot + InGameOverlaySlot` 동시 렌더와 가독성 확인
3. 결과 화면 데이터 확장(통계/MVP) 범위 확정 및 연계 작업 분배
4. 통합 충돌 선제 점검: route entry/import path/styles 충돌 확인

블로커 상태 메모:

- 기존 guard source 이원화 블로커는 `8a2281f`에서 동기화 복구로 해소
- 현재는 머지 블로커보다 통합 안정화(레이스/결과 타이밍, overlay 조합) 중심으로 전환

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

- [x] `RaceScreen` + `InGameOverlaySlot` route 조합 결합
- [ ] `InGameOverlaySlot`을 HUD/이벤트 실UI로 치환
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
- scene PR(#11) 머지 반영 완료
- scene PR(#14) 머지 반영 완료
- scene PR(#15) 머지 반영 완료 (`100dvh` fullscreen 보정)
- gameplay PR(#13) 머지 반영 완료
- non-race PR(#12) 머지 반영 완료 및 guard 동기화 복구 확인
- 다음 단계는 결과 전환 플로우 자동화 + EventSystem/DialogueSystem/overlay 일관성 안정화 + 결과 데이터 확장

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
