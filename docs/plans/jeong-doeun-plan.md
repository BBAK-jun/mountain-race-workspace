# 정도은 Plan

역할:

- Gameplay Core And In-Game UI Owner

당신은 인게임의 단일 진실원본과 HUD를 만든다. 이 프로젝트에서 레이스가 실제로 굴러가고, 그 상태가 읽히게 되는 기준은 결국 `types`, `store`, `systems`, `HUD`다.

---

## 1. 당신의 목표

인게임 로직과 오버레이를 완성한다.

핵심 결과물:

- 타입 계약
- 상태 계약
- 레이스 tick
- ranking 계산
- event scheduling
- dialogue selection
- HUD
- EventAlert
- EventLog

---

## 2. 당신만 수정해야 하는 파일

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

---

## 3. Step By Step

## Phase 0. 계약 고정

먼저 아래를 최소 계약으로 작성한다.

- `Character`
- `CharacterStatus`
- `CharacterStats`
- `GameEvent`
- `CameraMode`
- `GameState`

이 단계에서 박준형에게 즉시 전달할 것:

- 필수 action 이름
- `characters`, `rankings`, `events`, `activeBubble` shape
- `setupComplete`, `hasResult` 같은 route guard용 state
- race route에서 overlay를 보여줄 조건
- 윤영서 scene이 읽어야 하는 최소 key 목록

완료 기준:

- 박준형이 route guard와 race route composition을 시작할 수 있다.

## Phase 1. store 뼈대

`useGameStore.ts`에 최소 다음 항목을 넣는다.

- `characters`
- `setupComplete`
- `hasResult`
- `rankings`
- `events`
- `eventLogs`
- `activeBubble`
- `cameraMode`
- `cameraTarget`
- `addCharacter`
- `removeCharacter`
- `updateCharacter`
- `finalizeSetup`
- `startRace`
- `finishRace`
- `resetGame`
- `tick`

주의:

- 이 단계에선 구현이 완전하지 않아도 되지만, shape는 바꾸지 않는 쪽이 중요하다.
- `RaceScreen.tsx`를 직접 수정하지 않는다.

## Phase 2. balance와 data

1. `balance.ts` 작성
2. `dialogues.ts` 작성
3. `eventMessages.ts` 작성

주의:

- 이벤트명과 로그 메시지 키는 나중에 HUD와 result가 그대로 참조하므로 처음부터 일관되게 잡는다.

## Phase 3. EventSystem

구현할 것:

- next timestamp 기반 scheduling
- rank 기반 확률 계산
- 좋은 이벤트 / 나쁜 이벤트 / 피살기 / 전역 이벤트 / 타겟 이벤트 분기
- status 반영
- setback 누적
- stats 누적

반드시 지킬 것:

- 매 프레임 `randomInterval`을 다시 뽑지 않는다.
- 2~8인 순위는 선형 보간 확률을 쓴다.

## Phase 4. DialogueSystem

구현할 것:

- idle / situation / event 우선순위
- activeBubble 단일 슬롯
- event reaction 우선
- overtake, overtaken, comeback, close race, first, last 분기

## Phase 5. In-Game Overlay

구현:

- `HUD`
- `EventAlert`
- `EventLog`

주의:

- overlay는 고정 UI 레이어로만 만든다.
- `routes/race.tsx`에서 붙는다는 가정으로 작성하고 `RaceScreen.tsx`를 직접 수정하지 않는다.
- `SpeechBubble`은 scene anchored element라 윤영서가 소유한다.

## Phase 6. Result용 데이터 제공

구현할 것:

- finish ordering
- MVP 계산
- 첫 골인 후 10초 또는 전원 완주 종료 규칙

---

## 4. 당신이 먼저 넘겨야 하는 것

### 박준형에게

- `GameState` shape
- action 이름
- route guard에 필요한 state
- race route에 필요한 overlay 조건

### 여찬규에게

- `characters`
- `addCharacter`
- `removeCharacter`
- `updateCharacter`
- `finalizeSetup`
- `finishedIds`
- result에 필요한 stats
- `resetGame`

### 윤영서에게

- `Character.progress`
- `Character.status`
- `Character.name`
- `Character.color`
- `Character.faceImage`
- `rankings`
- `cameraMode`
- `cameraTarget`
- `activeBubble`
- `activeGlobalEvent`
- `finishedIds`

---

## 5. Acceptance Criteria

- store 하나만으로 race state가 재구성 가능하다.
- 이벤트 발생 시 progress, status, stats가 일관되게 갱신된다.
- HUD와 event layers가 store state와 즉시 동기화된다.
- setup과 result가 추가 계산 없이 state만 읽어도 그릴 수 있다.

---

## 6. 주의사항

- `LandingScreen.tsx`, `SetupScreen.tsx`, `ResultScreen.tsx`를 직접 수정하지 않는다.
- `RaceScreen.tsx`, `Track.tsx`, `Character.tsx`, `Environment.tsx`, `CameraSystem.tsx`, `SpeechBubble.tsx`를 직접 수정하지 않는다.
- 공용 계약을 한번 넘긴 뒤에는 필요한 경우에만 최소 변경한다.
