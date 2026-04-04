# 여찬규 Plan

역할:

- Non-Race Screen Owner

당신은 인게임 밖의 사용자 경험을 만든다. 이 MVP에서는 `Landing`, `Setup`, `Result`가 전체 흐름의 시작과 끝을 잡아준다.

---

## 1. 당신의 목표

비인게임 화면을 완성해서 게임 플로우를 자연스럽게 만든다.

핵심 결과물:

- `LandingScreen`
- `SetupScreen`
- `ResultScreen`

---

## 2. 당신만 수정해야 하는 파일

- `apps/web/src/features/mountain-race/screens/LandingScreen.tsx`
- `apps/web/src/features/mountain-race/screens/SetupScreen.tsx`
- `apps/web/src/features/mountain-race/screens/ResultScreen.tsx`

필요 시 생성:

- 비인게임 화면 내부 전용 하위 컴포넌트

---

## 3. Step By Step

## Phase 0. 준비 작업

박준형 foundation이 열리기 전에는 아래만 진행한다.

- `Landing`, `Setup`, `Result`에 필요한 state와 action 목록 정리
- 2인/8인 화면 배치 메모 작성
- 긴 닉네임, 얼굴 업로드, 결과 리스트 길이에 대한 UI 기준 정리

주의:

- `routes/*`, 글로벌 `styles.css`, `types/*`, `store/*`는 이 단계에서 수정하지 않는다.
- foundation 기준이 열린 뒤에만 실제 파일 생성과 구현을 시작한다.

## Phase 1. LandingScreen

구현:

- 게임 제목
- 한 줄 설명
- 시작 버튼

완료 기준:

- `/` 진입 시 첫 화면 역할을 한다.

## Phase 2. SetupScreen

구현:

- 기본 4명 목록
- 이름 수정
- 얼굴 업로드
- 캐릭터 추가/삭제
- 시작 버튼 활성/비활성

주의:

- 캐릭터 조작 액션은 store를 호출만 하고 직접 상태 계산하지 않는다.
- `RaceScreen`이나 HUD 구성 요소를 이 화면에 끌어오지 않는다.

## Phase 3. ResultScreen

구현:

- 최종 순위
- MVP 항목
- 다시 하기 / 로비로

주의:

- 최종 순위와 MVP 계산은 store state를 그대로 읽는다.
- 인게임 HUD를 재사용하지 않는다.

---

## 4. 먼저 받아야 하는 것

### 박준형에게

- 각 화면이 들어갈 route 자리
- global layout 제약 제거 완료 여부

### 정도은에게

- `characters`
- `addCharacter`
- `removeCharacter`
- `updateCharacter`
- `finalizeSetup`
- `finishedIds`
- result용 stats
- `resetGame`

---

## 5. Acceptance Criteria

- 랜딩부터 결과까지 모든 비인게임 화면이 클릭 흐름으로 이어진다.
- setup 화면에서 인원과 얼굴 설정이 가능하다.
- result 화면이 최종 순위와 MVP를 명확히 보여준다.
- 인게임 파일을 직접 수정하지 않고도 전체 플로우에 연결 가능하다.

---

## 6. 주의사항

- `types`, `store`, `systems`, `data`는 직접 수정하지 않는다.
- `RaceScreen.tsx`, `HUD.tsx`, `EventAlert.tsx`, `EventLog.tsx`, `SpeechBubble.tsx`를 직접 수정하지 않는다.
- layout 이슈를 해결하려고 route나 styles를 건드리지 않는다.
