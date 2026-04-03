# 🏔️ 등산복 입고 뛰어 — 기술 구현 PRD

> 제품 PRD: `docs/mountain-race-product-prd.md` 참조
>
> 실제 구현 루트: `apps/web/src`

---

## 1. 기술 스택

| 기술               | 용도                                                  |
| ------------------ | ----------------------------------------------------- |
| React + TypeScript | UI 컴포넌트, 화면 전환, 타입 안전성                   |
| React Three Fiber  | Three.js 선언적 래퍼                                  |
| @react-three/drei  | `Html`, `Text`, `Billboard`, `useTexture` 등 유틸리티 |
| Zustand            | 게임 상태 관리                                        |
| Tailwind CSS       | HUD, 오버레이 등 UI 스타일링                          |
| Vite               | 빌드 도구 + HMR 개발 서버                             |

---

## 2. 프로젝트 구조

이 문서의 경로 기준은 워크스페이스 루트다.

- 게임은 독립 앱이 아니라 `apps/web` 안에 구현한다.
- TanStack Router는 유지하되 화면마다 별도 route를 둔다.
- 게임 코드는 `apps/web/src/features/mountain-race/*` 아래에 모은다.
- `apps/web/src/routes/__root.tsx`는 스타터 topbar를 제거하고 풀스크린 게임을 허용하는 최소 레이아웃으로 단순화한다.
- route 흐름은 `/` → `/setup` → `/race` → `/result` 기준으로 잡는다.

```text
apps/web/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── router.tsx
    ├── styles.css
    ├── components/
    │   └── ui/
    ├── routes/
    │   ├── __root.tsx
    │   ├── index.tsx
    │   ├── setup.tsx
    │   ├── race.tsx
    │   └── result.tsx
    └── features/
        └── mountain-race/
            ├── types/
            │   └── index.ts
            ├── constants/
            │   └── balance.ts
            ├── store/
            │   └── useGameStore.ts
            ├── screens/
            │   ├── LandingScreen.tsx
            │   ├── SetupScreen.tsx
            │   ├── RaceScreen.tsx
            │   └── ResultScreen.tsx
            ├── components/
            │   ├── Track.tsx
            │   ├── Character.tsx
            │   ├── Environment.tsx
            │   ├── HUD.tsx
            │   ├── EventAlert.tsx
            │   ├── EventLog.tsx
            │   └── SpeechBubble.tsx
            ├── systems/
            │   ├── EventSystem.ts
            │   ├── DialogueSystem.ts
            │   └── CameraSystem.tsx
            └── data/
                ├── dialogues.ts
                └── eventMessages.ts
```

이 문서에서 언급하는 `RaceScreen.tsx`, `Track.tsx`, `useGameStore.ts` 등은 별도 언급이 없으면 모두 `apps/web/src/features/mountain-race/` 아래 파일을 뜻한다.

---

## 3. 핵심 타입 정의

```ts
interface Character {
  id: string;
  name: string;
  color: ColorPreset;
  faceImage: string | null;
  progress: number;
  speed: number;
  baseSpeed: number;
  status: CharacterStatus;
  stunEndTime: number;
  stats: CharacterStats;
}

type CharacterStatus = "running" | "stunned" | "boosted" | "slowed" | "sliding";

interface CharacterStats {
  hitCount: number;
  setbackTotal: number;
  ultimateUsed: number;
  rankChanges: number;
}

interface ColorPreset {
  jacket: string;
  inner: string;
  pants: string;
  buff: string;
}

type SkillType = "booster" | "ankle_grab" | "trap" | "trip" | "wind_ride";
type UltimateType = "boulder" | "landslide" | "ice" | "helicopter" | "bear";
type GlobalEventType = "rain" | "fog" | "volcanic_ash" | "lightning";
type TargetEventType = "deer" | "rockfall" | "snake" | "pit";

interface GameEvent {
  id: string;
  type: SkillType | UltimateType | GlobalEventType | TargetEventType;
  category: "skill" | "ultimate" | "global" | "target";
  casterId?: string;
  targetIds: string[];
  timestamp: number;
  duration: number;
}

type CameraMode = "follow" | "event_zoom" | "slowmo" | "shake" | "finish";
```

---

## 4. Zustand 스토어 설계

```ts
interface GameState {
  characters: Character[];
  addCharacter: () => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, partial: Partial<Character>) => void;

  setupComplete: boolean;
  hasResult: boolean;
  finalizeSetup: () => void;

  isRacing: boolean;
  isPaused: boolean;
  countdown: number;
  elapsedTime: number;
  rankings: string[];
  finishedIds: string[];

  events: GameEvent[];
  activeGlobalEvent: GlobalEventType | null;
  globalEventEndTime: number;
  ultimateCount: number;
  pushEvent: (event: GameEvent) => void;

  eventLogs: EventLog[];
  pushLog: (log: EventLog) => void;

  activeBubble: { characterId: string; text: string; endTime: number } | null;

  cameraMode: CameraMode;
  cameraTarget: string | null;

  startRace: () => void;
  finishRace: () => void;
  resetGame: () => void;
  tick: (deltaTime: number) => void;
}

interface EventLog {
  id: string;
  text: string;
  timestamp: number;
}
```

---

## 5. 게임 루프 구현

`RaceScreen.tsx` 내부의 `useFrame`에서 매 프레임 다음 순서로 실행한다.

```text
1. 각 캐릭터 progress 갱신
2. 순위 재계산 및 순위 변동 감지
3. 일반 스킬 / 피살기 / 전역 이벤트 / 타겟 이벤트 체크
4. 활성 이벤트 효과 적용 및 종료 체크
5. 대사 시스템 틱
6. 카메라 모드 판단
7. 결승선 체크
```

### 이동 규칙

- `stunned` 상태면 이동하지 않음
- `boosted` 상태면 `BOOST_MULTIPLIER`
- `slowed` 상태면 `SLOW_MULTIPLIER`
- `running` 상태면 기본 속도 사용
- 프레임마다 `JITTER_RANGE` 기반 흔들림 적용

### route 전환 규칙

- `/`는 랜딩 화면만 담당한다.
- `/setup`은 캐릭터 구성과 얼굴 업로드를 담당한다.
- `/race`는 `setupComplete === true`일 때만 진입한다.
- `/result`는 `hasResult === true`일 때만 진입한다.
- 잘못된 route 진입은 이전 단계 route로 redirect 한다.

---

## 6. 이벤트 시스템 구현

### 6.1 확률 테이블

```ts
const GOOD_EVENT_CHANCE = [0.1, 0.2, 0.3, 0.4];
const BAD_EVENT_CHANCE = [0.4, 0.3, 0.2, 0.1];
const ULTIMATE_CHANCE = [0.0, 0.027, 0.053, 0.08];
```

### 6.2 이벤트 선택 로직

```text
checkSkillEvent(now):
  지정 간격이 안 지났으면 return
  순위 기반으로 대상 선택
  좋은 이벤트 / 나쁜 이벤트를 확률표로 결정
  일반 스킬 적용

checkUltimateEvent(now):
  피살기 최대 횟수 확인
  지정 간격이 안 지났으면 return
  하위권부터 순회하며 발동 확률 체크
  성공 시 피살기 적용 후 종료

checkGlobalEvent(now):
  이미 활성화된 전역 이벤트가 있으면 return
  지정 간격이 안 지났으면 return
  전역 이벤트 확률 통과 시 활성화
```

### 6.3 효과 적용

```ts
const SKILL_EFFECTS = {
  booster: { status: "boosted", duration: 2000, speedMult: 2.5 },
  ankle_grab: { status: "stunned", duration: 1500, target: "ahead" },
  trap: { status: "stunned", duration: 2000, target: "behind" },
  trip: { status: "stunned", duration: 1200, target: "self" },
  wind_ride: { status: "boosted", duration: 1500, speedMult: 1.8 },
};

const ULTIMATE_EFFECTS = {
  boulder: { status: "stunned", duration: 2500, target: "all_ahead" },
  landslide: { setback: 0.1, target: "nearby_15pct" },
  ice: { status: "sliding", duration: 3000, target: "ahead_20pct" },
  helicopter: { setback: 0.15, stunDuration: 1500, target: "first_place" },
  bear: { setback: 0.12, stunDuration: 2000, target: "random_one" },
};

const GLOBAL_EFFECTS = {
  rain: { duration: 5000, slipChance: 0.3 },
  fog: { duration: 6000, hideRankings: true, fogDensity: 0.8 },
  volcanic_ash: { duration: 4000, speedMult: 0.6 },
  lightning: { duration: 500, stunDuration: 2000, targets: "random_one" },
};

const TARGET_EFFECTS = {
  deer: { stunDuration: 2000 },
  rockfall: { stunDuration: 1500, setback: 0.03 },
  snake: { stunDuration: 2500 },
  pit: { stunDuration: 1000, setback: 0.06 },
};
```

---

## 7. 3D 씬 구현

### 7.1 트랙

```ts
const TRACK_POINTS = [
  new Vector3(0, 0, 0),
  new Vector3(10, 5, -20),
  new Vector3(-5, 15, -50),
  new Vector3(8, 25, -80),
  new Vector3(-3, 35, -110),
  new Vector3(0, 40, -130),
];
```

- `CatmullRomCurve3`를 사용해 산악 코스를 생성
- `TubeGeometry`로 시각화
- 결승선은 `progress=0.98` 위치에 링 메쉬 배치

### 7.2 캐릭터 모델

| 파츠      | 지오메트리                            |
| --------- | ------------------------------------- |
| 머리      | `SphereGeometry`                      |
| 등산 모자 | `CylinderGeometry` + `SphereGeometry` |
| 버프      | `CylinderGeometry`                    |
| 바람막이  | `BoxGeometry`                         |
| 똥배      | `SphereGeometry`                      |
| 팔        | `CylinderGeometry` 2개                |
| 바지      | `BoxGeometry`                         |
| 등산화    | `BoxGeometry` 2개                     |
| 배낭      | `BoxGeometry`                         |
| 트레킹 폴 | `CylinderGeometry` 2개                |

- 얼굴 이미지는 `TextureLoader`로 로드
- 닉네임은 `Html` 또는 `Billboard + Text`로 표시
- `useFrame`에서 바운스와 팔/다리 흔들림 애니메이션 적용

### 7.3 환경

| 오브젝트 | 구현                       |
| -------- | -------------------------- |
| 지면     | `PlaneGeometry`            |
| 산       | `ConeGeometry` 여러 개     |
| 나무     | 줄기 + 잎 조합             |
| 구름     | 반투명 구체 클러스터       |
| 안개     | R3F `<fog>`                |
| 하늘     | `Sky` 또는 배경 그라디언트 |

---

## 8. 카메라 시스템 구현

```ts
function updateCamera(state, delta) {
  const { cameraMode, cameraTarget, rankings, characters } = useGameStore();
  const leader = characters.find((c) => c.id === rankings[0]);

  switch (cameraMode) {
    case "follow":
      break;
    case "event_zoom":
      break;
    case "slowmo":
      break;
    case "shake":
      break;
    case "finish":
      break;
  }
}
```

### 모드 전환 조건

```text
1등 골인 직전 → finish
피살기/전역 이벤트 직후 → event_zoom
1·2등 격차 < 2% && progress > 70% → slowmo
셰이크 이벤트 발생 시 → shake
그 외 → follow
```

---

## 9. 대사 시스템 구현

```ts
interface DialogueContext {
  characterId: string;
  rank: number;
  prevRank: number;
  isFirst: boolean;
  isLast: boolean;
  isCloseRace: boolean;
  activeEvent?: GameEvent;
}

function pickDialogue(ctx: DialogueContext): string | null {
  if (ctx.activeEvent) {
    const specific = getEventDialogue(ctx.activeEvent, ctx.characterId);
    if (specific) return specific;
    if (ctx.activeEvent.category === "ultimate") return pickRandom(ULTIMATE_FALLBACK);
  }

  if (ctx.rank < ctx.prevRank) return pickRandom(OVERTAKE_DIALOGUES);
  if (ctx.rank > ctx.prevRank) return pickRandom(OVERTAKEN_DIALOGUES);
  if (ctx.prevRank >= 3 && ctx.rank === 0) return pickRandom(COMEBACK_DIALOGUES);
  if (ctx.isCloseRace) return pickRandom(CLOSE_RACE_DIALOGUES);
  if (ctx.isFirst) return pickRandom(FIRST_PLACE_DIALOGUES);
  if (ctx.isLast) return pickRandom(LAST_PLACE_DIALOGUES);

  return pickRandom(IDLE_DIALOGUES);
}
```

### 큐 관리

```text
1. 현재 말풍선이 끝났으면 제거
2. 다른 말풍선이 있으면 대기
3. 다음 발동 시각 전이면 대기
4. 랜덤 캐릭터 또는 이벤트 우선 캐릭터를 선택
5. 대사를 결정해 activeBubble에 저장
```

---

## 10. UI 컴포넌트 구현

### 10.1 순위 리스트

- 우측 상단 고정 오버레이
- `rankings` 순서대로 순위 번호 + 컬러 아이콘 + 이름 표시
- 안개 이벤트 시 2등 이하 이름을 `???`로 치환

### 10.2 진행률 바

- 하단 고정 오버레이
- 어두운 바 배경 위에 캐릭터별 원형 아이콘 이동
- 우측 끝에 `🏔️ 정상` 라벨 고정

### 10.3 중앙 알림

- 피살기와 전역 이벤트 발동 시 중앙 대형 텍스트 표시
- 2초 표시
- `scale` 애니메이션과 반투명 오버레이 사용

### 10.4 SpeechBubble

- `Billboard + Html` 조합
- 캐릭터 머리 위 오프셋
- `fade-in / fade-out` 트랜지션

---

## 11. 밸런스 상수

```ts
export const BALANCE = {
  GAME_SPEED: 0.0015,
  JITTER_RANGE: 0.2,

  SKILL_INTERVAL_MIN: 1.5,
  SKILL_INTERVAL_MAX: 3.5,
  ULTIMATE_INTERVAL_MIN: 6,
  ULTIMATE_INTERVAL_MAX: 10,
  GLOBAL_EVENT_INTERVAL_MIN: 8,
  GLOBAL_EVENT_INTERVAL_MAX: 13,
  GLOBAL_EVENT_CHANCE: 0.15,

  STUN_DURATION: 1.5,
  SLOW_MULTIPLIER: 0.7,
  BOOST_MULTIPLIER: 2.5,
  SETBACK_AMOUNT: 0.05,

  ULTIMATE_MAX: 2,

  SLOWMO_THRESHOLD: 0.02,
  SLOWMO_PROGRESS_MIN: 0.7,
  SLOWMO_TIMESCALE: 0.3,
  FINISH_LINE: 0.98,

  DIALOGUE_INTERVAL_MIN: 3,
  DIALOGUE_INTERVAL_MAX: 6,
  DIALOGUE_DISPLAY_TIME: 2,
} as const;
```

---

## 12. 비기능 요구사항

| 항목      | 목표                             | 구현 방안                                 |
| --------- | -------------------------------- | ----------------------------------------- |
| 성능      | 60fps                            | pixelRatio 제한, 지오메트리 인스턴싱, LOD |
| 로딩      | 2초 이내 첫 화면                 | 코드 스플리팅, 3D 자산 지연 로드          |
| 호환성    | Chrome/Safari/Firefox 최신 2버전 | WebGL2 fallback, drei 호환성 확인         |
| 번들 크기 | 1.2MB 이하                       | tree-shaking, 필요한 모듈만 import        |
| 설치      | 불필요                           | 정적 호스팅                               |

---

## 13. 개발 타임라인

```text
0:00 ~ 0:30   프로젝트 셋업
0:30 ~ 2:00   병렬 개발
2:00 ~ 3:00   1차 통합
3:00 ~ 4:00   연출 보강 + 버그 수정
4:00 ~ 4:30   데모 준비
```

### 병렬 개발 권장 분배

- A: `route wiring + LandingScreen + SetupScreen`
- B: `RaceScreen + Track + Character + CameraSystem`
- C: `EventSystem + 확률 테이블 + 게임 루프`
- D: `HUD + EventLog + ResultScreen + SpeechBubble`
