# API Source

Cloudflare Worker 위에서 실행되는 Hono API 서버다. 클린 아키텍처를 따른다.

## 레이어 구조

```text
src/
├── domain/          # 엔티티, 값 객체, 도메인 이벤트
│   └── room.ts      # Room, Player 엔티티
├── application/     # 유스케이스, 포트 인터페이스
│   └── race.usecase.ts
├── infrastructure/  # Durable Object, WebSocket, 외부 어댑터
│   └── race-room.do.ts   # RaceRoom Durable Object
└── presentation/    # Hono HTTP 라우트, RPC 핸들러
    └── http/
        └── room/
            ├── room.routes.ts
            └── room.handlers.ts
```

의존 방향: `presentation` → `application` → `domain`. `infrastructure`는 `application`의 포트를 구현한다.

## 핵심 구성 요소

| 구성 요소     | 파일                             | 역할                                |
| ------------- | -------------------------------- | ----------------------------------- |
| Worker 엔트리 | `index.ts`                       | Hono 앱 export + DO re-export       |
| RaceRoom DO   | `infrastructure/race-room.do.ts` | 방 수명 관리, WebSocket Hibernation |
| HTTP 라우트   | `presentation/http/room/`        | 방 생성, 참가, 헬스체크             |
| 공유 타입     | `@mountain-race/types`           | 클라이언트·서버 공유 계약           |
| 공유 로직     | `@mountain-race/game-logic`      | 시뮬레이션 로직                     |

## 로컬 실행

```bash
pnpm dev:api
```

Wrangler dev 서버가 `http://localhost:8787`에 뜬다. Durable Object와 WebSocket 모두 로컬에서 동작한다.

## Durable Object + WebSocket

- `RaceRoom` DO가 방 하나의 전체 수명(생성 → 대기 → 레이스 → 결과)을 관리한다.
- WebSocket Hibernation API를 사용해 유휴 연결의 메모리 비용을 최소화한다.
- Wrangler 바인딩: `RACE_ROOM` → `RaceRoom` 클래스
- 클라이언트는 HTTP로 방 생성/참가 후, `/rooms/:code/ws`로 WebSocket 업그레이드한다.
