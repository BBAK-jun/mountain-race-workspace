# 윤영서 Plan

역할:

- Race Scene And Camera Owner

당신은 이 게임이 “레이스처럼 보이게” 만드는 사람이다. 캐릭터가 트랙을 따라 움직이고, 카메라가 그걸 제대로 잡아줘야 인게임 오버레이 정보도 의미가 생긴다.

---

## 진행 현황 (2026-04-04)

- `Track.tsx` 구현 및 머지 완료 (`feat/scene-track`, PR #5)
- `Character.tsx` 구현 및 머지 완료 (`feat/scene-character`, PR #9)
- `Environment.tsx`, `SpeechBubble.tsx` 구현 및 머지 완료 (`feat/scene-env-bubble`, PR #10)
- `CameraSystem` 모드 전환 구현 및 머지 완료 (PR #11, `40dceb8`)
- `RaceScreen` full scene graph 조합 및 머지 완료 (PR #14, `e2b9e67`)
- `RaceScreen` fullscreen 레이아웃 보정(`100dvh`) 및 머지 완료 (PR #15, `0d3aac4`)
- `LandingScene.tsx` 추가 + `LandingScreen` 3D 배경 전환 머지 완료 (PR #18, `894f26f`)
- `CatmullRomCurve3` 기반 트랙 곡선/샘플링 유틸 반영
- 결승선 앵커 구조 반영
- CI 타입체크 이슈 대응 완료:
  - `r3f-jsx.d.ts` 추가로 R3F JSX 타입 확장 로드 보장
- PR #9 리뷰 반영 완료:
  - `slowed`/`sliding` 상태 애니메이션 강도 스케일링
  - 바운스 상향 편향 제거(대칭 진동)
- PR #10 리뷰 반영 완료:
  - `SpeechBubble` 버블 컨테이너 기준점 보강(`position: relative`)
  - `Environment` 미사용 import 정리

현재 기준 다음 우선순위:

1. scene + overlay 동시 표시 상황에서 카메라 전환과 가독성 회귀 점검
2. 2인/8인 시나리오 기준 모바일 퍼포먼스 튜닝 및 지오메트리 예산 점검
3. route shell/scene slot 구조에서 레이아웃 경계(패딩/뷰포트) 회귀 방지 점검

---

## 1. 당신의 목표

R3F 씬과 카메라를 만들고, store 상태를 3D 표현으로 연결한다.

핵심 결과물:

- `RaceScreen`
- `Track`
- `Character`
- `Environment`
- `SpeechBubble`
- `CameraSystem`

---

## 2. 당신만 수정해야 하는 파일

- `apps/web/src/features/mountain-race/screens/RaceScreen.tsx`
- `apps/web/src/features/mountain-race/components/Track.tsx`
- `apps/web/src/features/mountain-race/components/Character.tsx`
- `apps/web/src/features/mountain-race/components/Environment.tsx`
- `apps/web/src/features/mountain-race/components/SpeechBubble.tsx`
- `apps/web/src/features/mountain-race/systems/CameraSystem.tsx`

---

## 3. Step By Step

## Phase 0. 준비 작업

박준형 foundation이 열리기 전에는 아래만 진행한다.

- `Track`에 필요한 curve 입력값과 helper 구조 설계
- `Character`에 필요한 props 목록 정리
- `CameraSystem`이 필요로 하는 state 목록 정리
- `SpeechBubble`이 읽어야 하는 state 목록 정리
- `RaceScreen`에 필요한 composition 메모 작성

주의:

- `types/*`, `store/*`, `routes/*`, 글로벌 `styles.css`는 이 단계에서 수정하지 않는다.
- 0:10 이후 foundation 기준을 pull/rebase한 뒤 자기 소유 파일 placeholder를 생성한다.

## Phase 1. RaceScreen skeleton

1. Canvas를 띄운다.
2. `Track`, `Environment`, `Character` 목록을 렌더링한다.
3. store에서 `characters`, `rankings`, `cameraMode`, `cameraTarget`만 우선 읽는다.

완료 기준:

- scene이 뜬다.
- 캐릭터 더미라도 트랙 위에 보인다.

## Phase 2. Track

1. `CatmullRomCurve3` 기반 트랙 생성
2. `getPointAt(progress)` 기반 좌표 계산
3. 결승선 위치 기준점 제공

주의:

- curve 인스턴스는 재생성 비용이 크지 않게 고정한다.
- 다른 컴포넌트가 쓸 수 있도록 track util 구조를 정리한다.

## Phase 3. Character

구현:

- 기본 도형 조합 캐릭터
- color preset 반영
- face image 자리 확보
- running bounce
- status에 따른 시각 효과

필수:

- `progress`만으로 위치가 계산돼야 한다.
- `rank`를 몰라도 렌더링 가능해야 한다.

## Phase 4. Environment

구현:

- 지면
- 산
- 나무
- 구름
- 안개 대응

주의:

- 처음부터 과하게 무겁게 만들지 않는다.
- 모바일에서도 버틸 정도의 지오메트리 수만 사용한다.

## Phase 5. SpeechBubble

구현:

- character head anchor 기준
- activeBubble 단일 표시
- camera-facing 또는 billboard 처리

주의:

- 말풍선 내용 계산은 하지 않는다.
- `activeBubble`과 character 식별자만 받아 scene에 붙인다.

## Phase 6. CameraSystem

필수 구현:

- `follow`
- `event_zoom`
- `finish`
- `shake`

선택 구현:

- `slowmo`

주의:

- camera jitter는 감쇠 구조로 만든다.
- scene 컴포넌트 내부에서 임시 camera 조작을 중복하지 않는다.

---

## 4. 먼저 받아야 하는 것

### 정도은에게

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

### 박준형에게

- `RaceScreen`이 들어갈 앱 셸 위치
- `routes/race.tsx`에서 overlay가 별도로 붙는다는 composition 기준
- 풀스크린 layout 보장 여부

---

## 5. Acceptance Criteria

- 캐릭터가 트랙을 따라 자연스럽게 이동한다.
- 2명과 8명 모두 화면 안에서 레이스가 읽힌다.
- 카메라가 leader를 따라가고 이벤트 시 대상에 반응한다.
- 오버레이를 빼도 scene만 보면 race 진행이 이해된다.

---

## 6. 주의사항

- state나 event 계산 로직을 `RaceScreen`에서 직접 만들지 않는다.
- `InGameOverlaySlot.tsx`를 직접 수정하지 않는다.
- overlay를 `RaceScreen.tsx`에 직접 붙이지 않는다.
- `styles.css`와 route 레이아웃은 직접 수정하지 않는다.
