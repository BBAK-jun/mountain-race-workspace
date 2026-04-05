# API App

이 디렉토리는 Cloudflare Workers에 배포하는 멀티플레이어 백엔드 앱이다.

현재 상태:

- Hono HTTP 라우트와 Durable Object 기반 방 수명 관리가 연결돼 있다.
- 멀티플레이어 room 흐름, 숨은 효과, 레이스 시뮬레이션 도메인 코드가 들어 있다.
- 자세한 현재 파일 스냅샷은 아래 generated block이 유지한다.

<!-- docs-harness:api-runtime-snapshot:start -->

### Generated Runtime Snapshot

- 패키지: `@mountain-race/api`
- 스크립트: `dev`, `build`, `start`, `typecheck`, `deploy`
- 레이어 파일 수: domain 8 / application 3 / infrastructure 1 / presentation 5
- HTTP surface: `app.ts`, `room/room.handlers.ts`, `room/room.index.ts`, `room/room.routes.ts`, `shared.ts`
- 핵심 런타임: `apps/api/src/infrastructure/durableObject/RaceRoom.ts`, `apps/api/src/presentation/http/app.ts`
<!-- docs-harness:api-runtime-snapshot:end -->

남아 있는 파일의 역할:

- `package.json`: Hono + Wrangler 기반 스크립트와 배포 명령
- `tsconfig.json`: Worker 런타임 기준 TypeScript 설정
- `wrangler.jsonc`: Cloudflare Worker 배포 설정
- `.dev.vars.example`: 로컬 바인딩 값 예시
- `.cursor/rules/*`: 백엔드 작업용 Cursor rules

다음 수정 시작점:

1. `src/README.md`를 읽는다.
2. `src/presentation/http`와 `src/infrastructure/durableObject`를 함께 보고 room 흐름을 이해한다.
3. room 계약과 시뮬레이션 규칙을 바꿀 때는 `@mountain-race/types`, `@mountain-race/game-logic`도 같이 확인한다.
