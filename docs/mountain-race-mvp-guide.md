# Mountain Race MVP Development Guide

이 문서는 제품 PRD와 기술 PRD를 현재 레포 구조에 맞춰 바로 구현 가능한 작업 지침으로 변환한 가이드다.

---

## 1. 목표

현재 워크스페이스에서 팀원이 바로 개발을 시작할 수 있도록 다음을 고정한다.

- 제품 의도는 유지한다.
- MVP 범위를 줄여 구현 리스크를 통제한다.
- 현재 `apps/web`의 단일 route 구조를 깨지 않는다.
- 작업 충돌을 줄이기 위해 파일 책임 범위를 선명하게 나눈다.

---

## 2. 문서 우선순위

문서가 충돌하면 다음 순서를 따른다.

1. 이 문서의 `MVP 고정 결정`
2. `docs/mountain-race-product-prd.md`
3. `docs/mountain-race-technical-prd.md`

제품 아이디어를 바꾸는 결정은 제품 PRD 기준으로 합의하고, 현재 레포에 어떻게 얹을지는 이 문서를 우선한다.

---

## 3. MVP 고정 결정

### 3.1 화면 구조

- 앱은 당분간 `apps/web/src/routes/index.tsx` 단일 route에서 동작한다.
- 화면 전환은 라우팅이 아니라 `screen` 상태값으로 처리한다.
- 화면 순서는 `landing → setup → betting → race → result`다.
- `apps/web/src/routes/__root.tsx`는 스타터용 topbar, status chip, centered panel shell을 제거하고 게임용 최소 레이아웃으로 바꾼다.
- 풀스크린 Canvas와 HUD 기준 레이아웃은 `index.tsx` 또는 `MountainRaceApp.tsx`가 소유한다.

### 3.2 맵 범위

- 맵은 `기본 산길` 1종만 구현한다.
- 설정 화면의 맵 선택 UI는 보여주되, 실제 선택지는 1개만 제공한다.

### 3.3 베팅 범위

- 베팅은 한 기기에서 한 번 고르는 단일 로컬 선택이다.
- 멀티 유저별 베팅이나 서버 저장은 MVP 범위 밖이다.

### 3.4 레이스 종료 규칙

- 레이스는 `전원 완주` 또는 `첫 골인 후 10초 경과` 중 먼저 만족한 시점에 종료한다.
- 이 규칙으로 1등 골인 직후 화면이 너무 빨리 끊기는 문제를 막는다.

### 3.5 순위 기반 확률 매핑

- 제품 PRD의 4단계 확률표는 `2~8명` 전체 인원에 대해 선형 보간으로 적용한다.
- 즉, 현재 순위를 `0~1` 구간으로 정규화한 뒤 `좋은 이벤트`, `나쁜 이벤트`, `피살기` 확률을 계산한다.

예시 구현:

```ts
function getRankPressure(rankIndex: number, total: number) {
  if (total <= 1) return 0;
  return rankIndex / (total - 1);
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

function getRankChances(rankIndex: number, total: number) {
  const t = getRankPressure(rankIndex, total);

  return {
    goodEventChance: lerp(0.1, 0.4, t),
    badEventChance: lerp(0.4, 0.1, t),
    ultimateChance: lerp(0, 0.08, t),
  };
}
```

### 3.6 이벤트 스케줄링

- 매 프레임마다 `randomInterval`을 새로 비교하지 않는다.
- 각 시스템은 `nextSkillAt`, `nextUltimateAt`, `nextGlobalAt`, `nextDialogueAt` 값을 저장한다.
- 이벤트가 발동되거나 체크가 끝날 때마다 다음 시각을 다시 계산한다.

### 3.7 대사 우선순위

- 동시에 보이는 말풍선은 1개로 제한한다.
- 다만 `피살기/전역 이벤트 반응`은 `평시 대사`를 덮어쓸 수 있어야 한다.
- 구현은 `idle`, `situation`, `event` 우선순위 큐로 처리한다.

### 3.8 연출 범위

- MVP에서 구현할 카메라 모드는 `follow`, `event_zoom`, `finish`, `shake`만 필수다.
- `slowmo`는 여유가 있으면 넣고, Phase 2 카메라 시점 전환은 제외한다.
- 결과 화면의 포디엄은 새 연출 시스템을 만들기보다 기존 `Character` 메쉬를 재사용한다.

### 3.9 제외 범위

다음은 MVP 범위 밖이다.

- 다중 맵 실제 구현
- 실시간 멀티플레이
- 리플레이 시스템
- 스크린샷 공유
- URL 프리셋 공유
- 포인트 보상 베팅
- 복수 말풍선 동시 노출
- 별도 API 연동

---

## 4. 현재 레포에 맞는 구현 위치

현재 `apps/web`는 TanStack Router 기반 단일 route 스타터다. MVP는 이 구조를 유지한 채 게임 내부 구조만 확장한다.

권장 파일 구조:

```text
apps/web/src/
├── routes/
│   ├── __root.tsx
│   └── index.tsx
├── features/
│   └── mountain-race/
│       ├── app/
│       │   └── MountainRaceApp.tsx
│       ├── components/
│       │   ├── Character.tsx
│       │   ├── Environment.tsx
│       │   ├── EventAlert.tsx
│       │   ├── EventLog.tsx
│       │   ├── HUD.tsx
│       │   ├── SpeechBubble.tsx
│       │   └── Track.tsx
│       ├── constants/
│       │   └── balance.ts
│       ├── data/
│       │   ├── dialogues.ts
│       │   └── eventMessages.ts
│       ├── screens/
│       │   ├── BettingScreen.tsx
│       │   ├── LandingScreen.tsx
│       │   ├── RaceScreen.tsx
│       │   ├── ResultScreen.tsx
│       │   └── SetupScreen.tsx
│       ├── store/
│       │   └── useGameStore.ts
│       ├── systems/
│       │   ├── CameraSystem.tsx
│       │   ├── DialogueSystem.ts
│       │   └── EventSystem.ts
│       └── types/
│           └── index.ts
```

적용 방식:

- `apps/web/src/routes/index.tsx`는 `MountainRaceApp`만 렌더링한다.
- `apps/web/src/routes/__root.tsx`는 `<Outlet />` 중심의 최소 셸만 남기고 게임 화면 폭/높이를 제한하지 않는다.
- 현재 `app-shell`, `topbar`, `page-shell`, `page-grid`, `panel` 중심 스타터 구조에는 게임 UI를 얹지 않는다.
- PRD의 `src/*` 구조는 실제로는 `apps/web/src/features/mountain-race/*` 아래에 배치한다.
- 공용 UI 컴포넌트는 기존 `apps/web/src/components/ui/*`를 그대로 사용한다.

---

## 5. 구현 시작 전 체크리스트

### 5.1 의존성 추가

다음 패키지는 아직 워크스페이스 catalog에 없다. 구현 시작 전에 루트 `pnpm-workspace.yaml`에 버전을 추가하고 `apps/web/package.json`에서 `catalog:`로 참조한다.

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `zustand`
- `@types/three`

### 5.2 유지해야 할 기준

- 새 의존성은 `apps/web` 범위로만 추가한다.
- 정적 호스팅 전제를 유지한다.
- 첫 구현은 목업이 아니라 실제 흐름이 연결된 플레이어블 상태를 목표로 한다.
- 스타터용 글로벌 CSS는 필요한 것만 남기고, 게임 레이아웃을 가로막는 `max-width`, `sticky header`, `panel grid` 제약은 제거하거나 격리한다.

### 5.3 초기 성공 기준

다음이 되면 `MVP 뼈대 완료`로 본다.

- 랜딩에서 설정 화면으로 이동 가능
- 최소 2명 설정 후 레이스 시작 가능
- 캐릭터가 트랙 위를 자동으로 이동
- 일반 스킬 또는 전역 이벤트가 최소 1개 이상 발동
- 순위 리스트와 진행률 바가 동기화
- 결과 화면에서 최종 순위와 베팅 결과 표시

---

## 6. 구현 순서

### Phase 0. 부트스트랩

- R3F, Zustand 의존성 추가
- `apps/web/src/routes/__root.tsx`를 게임용 최소 레이아웃으로 교체
- `apps/web/src/styles.css`에서 스타터 셸 제약을 제거하거나 게임 전용 스타일로 교체
- `features/mountain-race` 디렉토리 생성
- `types`, `balance`, `useGameStore` 뼈대 추가
- `index.tsx`를 `MountainRaceApp` 렌더링 형태로 교체

### Phase 1. 화면 껍데기

- `LandingScreen`
- `SetupScreen`
- `BettingScreen`
- `ResultScreen`
- `screen` 상태 전환

완료 기준:

- 5개 화면이 상태 전환으로 오간다.
- 캐릭터 추가/삭제/이름 수정/얼굴 업로드가 store에 반영된다.

### Phase 2. 레이스 씬 뼈대

- `RaceScreen`에 Canvas 추가
- `Track`, `Character`, `Environment` 기본 버전 구현
- 트랙 곡선과 캐릭터 배치 연결
- follow 카메라 구현

완료 기준:

- 캐릭터가 트랙을 따라 움직인다.
- 닉네임과 컬러가 3D 씬에 반영된다.

### Phase 3. 게임 루프와 시스템

- `tick` 구현
- 순위 갱신
- 스킬/피살기/전역 이벤트 스케줄링
- 이벤트 로그 추가
- 대사 시스템 추가

완료 기준:

- 레이스 도중 순위가 바뀐다.
- 이벤트에 따라 상태, 속도, 후퇴량이 반영된다.
- HUD와 말풍선이 상태와 일치한다.

### Phase 4. 결과와 연출

- 중앙 이벤트 알림
- 결과 화면 MVP 통계
- 베팅 적중 판정
- 포디엄 간소 연출
- 카메라 줌인/셰이크 보강

완료 기준:

- 레이스 시작부터 결과까지 한 판이 끊기지 않고 완주된다.
- `다시 하기`로 재시작 가능하다.

---

## 7. 팀 작업 분배

4인 기준 권장 분배다.

### A. 씬/카메라 담당

책임 파일:

- `features/mountain-race/components/Track.tsx`
- `features/mountain-race/components/Character.tsx`
- `features/mountain-race/components/Environment.tsx`
- `features/mountain-race/systems/CameraSystem.tsx`
- `features/mountain-race/screens/RaceScreen.tsx`

목표:

- 레이스 씬이 60fps에 가깝게 동작하는 기본 렌더링 확보

### B. 플로우/UI 담당

책임 파일:

- `features/mountain-race/app/MountainRaceApp.tsx`
- `features/mountain-race/screens/LandingScreen.tsx`
- `features/mountain-race/screens/SetupScreen.tsx`
- `features/mountain-race/screens/BettingScreen.tsx`
- `features/mountain-race/screens/ResultScreen.tsx`

목표:

- 모든 사용자 플로우 연결
- 입력 UI와 결과 UI 완성

### C. 상태/게임플레이 담당

책임 파일:

- `features/mountain-race/store/useGameStore.ts`
- `features/mountain-race/systems/EventSystem.ts`
- `features/mountain-race/systems/DialogueSystem.ts`
- `features/mountain-race/constants/balance.ts`
- `features/mountain-race/types/index.ts`
- `features/mountain-race/data/*`

목표:

- 승패, 확률, 이벤트, 대사 우선순위의 일관성 확보

### D. HUD/연출/통합 담당

책임 파일:

- `features/mountain-race/components/HUD.tsx`
- `features/mountain-race/components/EventAlert.tsx`
- `features/mountain-race/components/EventLog.tsx`
- `features/mountain-race/components/SpeechBubble.tsx`

목표:

- 관전 정보 가독성 확보
- 이벤트가 터졌을 때 즉시 웃긴 상황을 이해할 수 있게 만들기

---

## 8. 충돌 방지 규칙

- `store`, `systems`, `types`, `data`는 한 명이 우선 소유한다.
- `routes/__root.tsx`와 글로벌 `styles.css`는 한 명이 같이 소유해서 레이아웃 충돌을 막는다.
- `RaceScreen.tsx`는 씬 구조만 담당하고, 게임 룰 로직은 `systems`에 둔다.
- 화면 컴포넌트에서 확률 계산이나 이벤트 처리 로직을 직접 작성하지 않는다.
- UI 텍스트 원문은 되도록 `data`에 모아두고 컴포넌트에서는 참조만 한다.

---

## 9. QA 체크리스트

- 2명일 때도 레이스가 정상 종료된다.
- 8명일 때 HUD와 진행률 바가 깨지지 않는다.
- 얼굴 이미지를 업로드하지 않아도 기본 캐릭터가 보인다.
- 첫 골인 직후 바로 결과로 튀지 않는다.
- 안개 이벤트 중 순위표가 의도대로 가려진다.
- `다시 하기` 시 이전 이벤트 로그와 베팅 결과가 초기화된다.
- 모바일 뷰포트에서 주요 버튼과 HUD가 화면 밖으로 나가지 않는다.

---

## 10. 개발 중 자주 참고할 파일

- 제품 기준: `docs/mountain-race-product-prd.md`
- 시스템 기준: `docs/mountain-race-technical-prd.md`
- 웹 앱 시작점: `apps/web/src/routes/index.tsx`
- 웹 앱 현재 설명: `apps/web/README.md`

이 문서까지 읽으면 팀원은 바로 구현을 시작해도 된다.
