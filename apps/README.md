# Apps

이 디렉토리는 실제 애플리케이션과 공유 패키지 소비 지점을 담는다.

## Generated Inventory

<!-- docs-harness:apps-inventory:start -->

- `@mountain-race/web`: Vite + TanStack Router + React Three Fiber 클라이언트, route `(root layout)`, `/`, `/lobby`, `/race`, `/result`, `/setup`
- `@mountain-race/api`: Hono + Cloudflare Durable Object 기반 멀티플레이어 API
- `@mountain-race/game-logic`: 게임 밸런스, 이벤트, 대사 스케줄러 공유 로직
- `@mountain-race/types`: 클라이언트와 서버가 함께 쓰는 타입 계약
<!-- docs-harness:apps-inventory:end -->

실제 기능을 수정할 때는 각 앱의 `README.md`를 먼저 읽고, generated inventory가 현재 코드 상태와 맞는지 함께 본다.
