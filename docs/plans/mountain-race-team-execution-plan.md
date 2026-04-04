# Mountain Race Team Execution Plan

이 문서는 `Mountain Race` MVP를 `박준형`, `여찬규`, `정도은`, `윤영서`가 4인 병렬로 구현하기 위한 실행 계획이다.

기준 문서:

- `docs/mountain-race-product-prd.md`
- `docs/mountain-race-mvp-guide.md`
- `docs/mountain-race-technical-prd.md`

---

## 1. 목표

4명이 동시에 움직이되, foundation 단계에서의 계약 충돌을 최소화하고 1차 통합까지 끊기지 않게 진행한다.

최종 목표:

- 랜딩 → 설정 → 레이스 → 결과까지 별도 route에서 동작
- 2~8명 로컬 플레이
- R3F 기반 트랙, 캐릭터, 카메라
- 이벤트/대사/HUD/결과까지 한 판이 끝까지 이어지는 플레이어블 MVP

---

## 현재 진행 상태 (2026-04-04)

- 머지 완료: `codex/gameplay-race-ui` (정도은, Phase 0-1, Phase 2)
- 머지 완료: `feat/scene-track` (윤영서, Phase 1-track)
- 반영 범위:
  - `types/index.ts`, `store/useGameStore.ts`
  - `constants/balance.ts`, `constants/index.ts`
  - `data/dialogues.ts`, `data/eventMessages.ts`, `data/index.ts`
  - `components/Track.tsx`, `r3f-jsx.d.ts`
- 리뷰 반영 완료:
  - `tick` 자동 종료 연결
  - `stunned` 복구 분기
  - `startRace` 라운드 초기화
  - store 하드코딩 상수의 `balance` 기반 참조 통일
- 다음 통합 포인트: `routes/race.tsx`에서 scene/overlay 조합, route guard store 전환, setup/result 액션 wiring, EventSystem 연결

---

## 2. 역할 분배

### 박준형

역할:

- Foundation Lead
- App Shell Owner
- Integration Owner

이유:

- 현재 레포 스캐폴딩 담당자이므로 `apps/web` 구조, route 트리, 스타일 셸, package/catalog 수정 흐름을 가장 빠르게 정리할 수 있다.

소유 파일:

- `apps/web/package.json`
- `pnpm-workspace.yaml`
- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/index.tsx`
- `apps/web/src/routes/setup.tsx`
- `apps/web/src/routes/race.tsx`
- `apps/web/src/routes/result.tsx`
- `apps/web/src/styles.css`
- 통합 시점의 충돌 조정 전반

### 여찬규

역할:

- Non-Race Screen Owner

소유 파일:

- `apps/web/src/features/mountain-race/screens/LandingScreen.tsx`
- `apps/web/src/features/mountain-race/screens/SetupScreen.tsx`
- `apps/web/src/features/mountain-race/screens/ResultScreen.tsx`

### 정도은

역할:

- Gameplay Core And In-Game UI Owner

소유 파일:

- `apps/web/src/features/mountain-race/types/index.ts`
- `apps/web/src/features/mountain-race/constants/balance.ts`
- `apps/web/src/features/mountain-race/store/useGameStore.ts`
- `apps/web/src/features/mountain-race/systems/EventSystem.ts`
- `apps/web/src/features/mountain-race/systems/DialogueSystem.ts`
- `apps/web/src/features/mountain-race/data/dialogues.ts`
- `apps/web/src/features/mountain-race/data/eventMessages.ts`
- `apps/web/src/features/mountain-race/components/HUD.tsx`
- `apps/web/src/features/mountain-race/components/EventAlert.tsx`
- `apps/web/src/features/mountain-race/components/EventLog.tsx`

### 윤영서

역할:

- Race Scene And Camera Owner

소유 파일:

- `apps/web/src/features/mountain-race/screens/RaceScreen.tsx`
- `apps/web/src/features/mountain-race/components/Track.tsx`
- `apps/web/src/features/mountain-race/components/Character.tsx`
- `apps/web/src/features/mountain-race/components/Environment.tsx`
- `apps/web/src/features/mountain-race/components/SpeechBubble.tsx`
- `apps/web/src/features/mountain-race/systems/CameraSystem.tsx`

---

## 3. 병렬 작업 원칙

### 원칙 1. Foundation은 박준형이 먼저 잡는다

- 첫 20~30분 동안 박준형이 route, layout, styles, dependency, feature scaffold의 기준을 만든다.
- 나머지 3명은 그 계약을 기준으로 자신의 영역에서 작업을 시작한다.

### 원칙 2. 비인게임 화면과 인게임을 분리한다

- 여찬규는 `Landing`, `Setup`, `Result`만 담당한다.
- 인게임은 정도은과 윤영서가 맡되, 한 명은 `state/system/HUD`, 다른 한 명은 `scene/camera`만 맡는다.

### 원칙 3. 인게임 두 사람은 같은 파일을 수정하지 않는다

- 정도은은 `types`, `store`, `systems`, `data`, `HUD` 계열만 수정한다.
- 윤영서는 `RaceScreen.tsx`와 3D 컴포넌트, `SpeechBubble.tsx`만 수정한다.
- `routes/race.tsx`에서 둘을 합치는 일은 박준형만 한다.

### 원칙 4. 계산 로직은 화면 컴포넌트에 두지 않는다

- 이벤트 계산, 승패 계산, 확률 계산은 `systems` 또는 `store`에서만 처리한다.
- 화면 컴포넌트는 상태를 읽고 표현만 한다.

### 원칙 5. 정도은과 윤영서는 store 계약으로만 소통한다

- 정도은이 제공하는 인터페이스는 `types/index.ts`와 `useGameStore.ts`다.
- 윤영서는 그 상태를 읽어 scene와 `SpeechBubble`에 반영하지만, store shape를 직접 바꾸지 않는다.
- 정도은이 윤영서의 `RaceScreen.tsx` 안으로 직접 들어가 통합하지 않는다.
- 최종 통합은 박준형이 `routes/race.tsx`에서 한다.

---

## 4. 실행 순서

## Phase 0. Foundation

목표:

- 레포 구조를 실제 구현 가능한 상태로 바꾸고, 나머지 3명이 즉시 이어받을 수 있는 뼈대를 만든다.

담당:

- 주담당: 박준형
- 계약 협조: 정도은

### Phase 0 안의 부분 병렬 원칙

Phase 0 전체를 박준형 혼자 하는 것은 아니다. 다만 foundation 기준 파일은 박준형이 잡고, gameplay 계약은 정도은이 잡고, 나머지는 충돌 없는 준비 작업만 병렬로 진행한다.

0:00 ~ 0:10

- 박준형: 의존성/route/layout 변경 범위 확정
- 정도은: `GameState`, action 이름, 인게임 HUD가 읽을 state 초안 작성
- 여찬규: `Landing`, `Setup`, `Result`에 필요한 props/state 목록 정리
- 윤영서: `Track`, `Character`, `CameraSystem` 구현 메모와 필요한 state 목록 정리

0:10 ~ 0:30

- 박준형: `__root.tsx`, `index.tsx`, `styles.css`, feature scaffold 수정
- 박준형: `setup.tsx`, `race.tsx`, `result.tsx` route 뼈대 생성
- 정도은: `types/index.ts`, `balance.ts`, `useGameStore.ts` 최소 계약 작성
- 여찬규: foundation pull/rebase 후 `LandingScreen.tsx`, `SetupScreen.tsx`, `ResultScreen.tsx` 빈 뼈대 생성 시작
- 윤영서: foundation pull/rebase 후 `RaceScreen.tsx`, `Track.tsx` 빈 뼈대 생성 시작

중요:

- 여찬규와 윤영서는 0:10 이전에 `routes/*`, 글로벌 `styles.css`, `types/*`, `store/*`를 수정하지 않는다.
- 정도은은 0:10 이전에는 계약 초안만 잡고, 다른 사람 소유 파일은 수정하지 않는다.
- `routes/race.tsx`는 끝까지 박준형만 수정한다.

세부 순서:

1. 박준형이 `pnpm-workspace.yaml`과 `apps/web/package.json`에 필요한 의존성 초안을 반영한다.
2. 박준형이 `apps/web/src/routes/__root.tsx`를 게임용 최소 레이아웃으로 교체한다.
3. 박준형이 `apps/web/src/styles.css`의 starter shell 제약을 제거하거나 격리한다.
4. 박준형이 `apps/web/src/features/mountain-race/*` 폴더와 빈 파일 구조를 만든다.
5. 박준형이 `apps/web/src/routes/index.tsx`, `setup.tsx`, `race.tsx`, `result.tsx`를 화면별 route 진입점으로 만든다.
6. 정도은이 `types/index.ts`, `balance.ts`, `useGameStore.ts` 최소 계약 초안을 작성한다.
7. 박준형과 정도은이 store shape와 route 진입/redirect 계약을 10분 내로 맞춘다.

완료 기준:

- `Landing`, `Setup`, `Race`, `Result` route 파일이 생성된다.
- feature 폴더 구조가 고정된다.
- `Character`, `GameState` 최소 인터페이스가 존재한다.
- 다른 3명이 자신의 파일에서 바로 작업 가능하다.

## 정도은 ↔ 윤영서 인터페이스 계약

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

계약 규칙:

1. 정도은은 위 상태를 `store/types`에서 정의하고 유지한다.
2. 윤영서는 위 상태를 읽어서 `RaceScreen`과 `SpeechBubble`에 반영한다.
3. 윤영서가 추가 필드가 필요하면 `types/store`를 직접 고치지 말고 정도은에게 요청한다.
4. 정도은은 `RaceScreen.tsx`를 직접 수정하지 않는다.
5. 박준형이 `routes/race.tsx`에서 아래 구조로 조합한다.

```tsx
<div className="race-route">
  <RaceScreen />
  <HUD />
  <EventAlert />
  <EventLog />
</div>
```

설명:

- `SpeechBubble`은 scene anchored element라 `RaceScreen` 내부에서 렌더링한다.
- `HUD`, `EventAlert`, `EventLog`는 fixed overlay라 route 레벨에서 렌더링한다.

## Phase 1. 병렬 구현

목표:

- 4명이 각 영역을 독립적으로 개발하되, foundation 계약을 깨지 않는다.

### 박준형

- route 이동과 redirect 연결
- 전역 스타일과 앱 셸 안정화
- `routes/race.tsx`에서 scene와 overlay 조합

### 여찬규

- Landing 화면
- Setup 화면
- Result 화면

### 정도은

- 타입 계약
- store
- event scheduling
- dialogue selection
- HUD
- EventAlert
- EventLog

### 윤영서

- R3F Canvas
- Track curve
- Character mesh
- Environment
- SpeechBubble
- follow / event zoom / finish camera

완료 기준:

- 각자 자신의 영역을 로컬에서 독립 확인 가능
- 다른 사람의 소유 파일을 건드리지 않아도 기본 연결이 가능

## Phase 2. 1차 통합

병합 순서:

1. 박준형 foundation 브랜치
2. 정도은 gameplay core and in-game UI
3. 윤영서 race scene and camera
4. 여찬규 non-race screens

이 순서를 쓰는 이유:

- foundation 위에 gameplay contract가 먼저 올라가야 setup/result와 race scene이 같은 상태를 본다.
- race scene과 in-game fixed HUD는 박준형의 `routes/race.tsx`에서만 합친다.
- `SpeechBubble`은 scene anchored element라 scene 브랜치와 같이 붙는다.
- 비인게임 화면은 마지막에 붙여도 인게임 충돌에 영향을 주지 않는다.

통합 체크:

- `pnpm typecheck`
- `pnpm build:web`
- 화면 전환
- 2인 레이스
- 8인 레이스
- 결과 진입

## Phase 3. 연출 보강과 버그 수정

우선순위:

1. race loop 끊김 수정
2. HUD 오표시 수정
3. 카메라 튐 수정
4. 말풍선 우선순위 수정
5. 결과 화면 정렬 및 MVP 계산 확인

## Phase 4. 데모 마감

목표:

- 가장 웃긴 한 판이 안정적으로 재현되는 상태

최종 확인:

- 얼굴 업로드 없이도 플레이 가능
- 1등 골인 직후 바로 결과로 튀지 않음
- 이벤트가 최소 1번 이상 발생
- 결과 화면에 순위와 MVP 정보가 모두 보임

---

## 5. 브랜치 전략

권장 브랜치:

- `codex/foundation-shell` — 박준형
- `codex/non-race-screens` — 여찬규
- `codex/gameplay-race-ui` — 정도은
- `codex/race-scene-camera` — 윤영서

규칙:

- foundation 브랜치가 먼저 열린다.
- 나머지 3개 브랜치는 foundation merge 또는 rebase 후 시작한다.
- `types`와 `store` 계약이 바뀌면 정도은이 먼저 공지한다.

---

## 6. 공통 커뮤니케이션 규칙

### 30분마다 공유할 것

- 지금 작업 중인 파일
- 막힌 포인트 1개
- store 계약 변경 여부
- 통합 필요 여부

### 즉시 공유해야 하는 것

- `types/index.ts` 변경
- `useGameStore.ts` 변경
- `routes/__root.tsx` 또는 `styles.css` 변경
- `routes/race.tsx` 조합 방식 변경
- `RaceScreen.tsx`가 읽는 store key 변경

---

## 7. 공통 Acceptance Criteria

- `/`, `/setup`, `/race`, `/result` route에서 게임 흐름이 동작한다.
- 2명과 8명 모두 UI가 깨지지 않는다.
- race 진행 중 rank, HUD, event log가 서로 일치한다.
- result 화면에서 MVP 정보와 최종 순위가 보인다.
- 빌드와 타입체크를 통과한다.

---

## 8. 리스크와 대응

### 리스크 1. store 계약이 계속 바뀜

대응:

- 정도은만 store와 타입을 수정
- 박준형이 integration 시점에만 접점 변경 수용

### 리스크 2. starter shell이 fullscreen을 막음

대응:

- 박준형이 Phase 0에서 `__root.tsx`와 `styles.css`를 먼저 정리

### 리스크 3. 인게임 둘이 같은 파일을 만짐

대응:

- `RaceScreen.tsx`, `Track.tsx`, `Character.tsx`, `Environment.tsx`, `CameraSystem.tsx`, `SpeechBubble.tsx`는 윤영서만 수정
- `HUD`, `EventAlert`, `EventLog`, `types`, `store`, `systems`, `data`는 정도은만 수정
- `routes/race.tsx`는 박준형만 수정
