# Web Source

여기는 TanStack Router file-based routing 기반 프런트엔드 코드가 들어가는 자리다.

현재 구조:

- `main.tsx`: React 진입점
- `router.tsx`: Router 인스턴스 등록
- `routes/__root.tsx`: 공통 레이아웃
- `routes/index.tsx`: 랜딩 route
- `routes/setup.tsx`: 설정 route
- `routes/race.tsx`: 레이스 route
- `routes/result.tsx`: 결과 route

권장 원칙:

- 게임 플로우는 route 단위로 분리한다.
- MVP 기준 route는 `/`, `/setup`, `/race`, `/result`까지 둔다.
- `__root.tsx`는 필요 최소한의 앱 셸만 두고, 풀스크린 게임 레이아웃을 막는 고정 UI는 넣지 않는다.
- Mountain Race 구현은 `src/features/mountain-race/*` 아래로 분리한다.
- 게임 상태는 feature 내부 `store`로 분리한다.
- 정적 호스팅 전제를 유지한다.
