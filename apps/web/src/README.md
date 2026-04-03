# Web Source

여기는 TanStack Router file-based routing 기반 프런트엔드 코드가 들어가는 자리다.

현재 구조:

- `main.tsx`: React 진입점
- `router.tsx`: Router 인스턴스 등록
- `routes/__root.tsx`: 공통 레이아웃
- `routes/index.tsx`: 유일한 루트 화면

권장 원칙:

- 당분간은 루트 페이지 하나로 유지한다.
- 새 화면이 정말 필요할 때만 `src/routes`에 route 파일을 추가한다.
- 공통 레이아웃은 `__root.tsx`에서 유지한다.
- 게임 상태는 실제 필요가 생길 때만 별도 feature로 분리한다.
- 정적 호스팅 전제를 유지한다.
