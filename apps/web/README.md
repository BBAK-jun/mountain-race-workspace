# Web App

이 디렉토리는 Cloudflare Pages에 배포할 프런트엔드 앱 자리다.

현재 상태:

- TanStack Router file-based routing 기반 루트 단일 페이지 스타터가 들어 있는 상태
- TypeScript, Vite, Wrangler, Cursor rules는 연결된 상태
- 실제 화면과 게임 로직은 아직 없음

구현 시작 전 권장 문서 순서:

1. `../../docs/mountain-race-product-prd.md`
2. `../../docs/mountain-race-mvp-guide.md`
3. `../../docs/mountain-race-technical-prd.md`

남아 있는 파일의 역할:

- `package.json`: TanStack Router + Vite + Wrangler 스크립트 자리
- `tsconfig.json`: TypeScript 기준 설정
- `vite.config.ts`: React + TanStack Router 플러그인 설정
- `wrangler.jsonc`: Cloudflare Pages 설정 자리
- `.env.example`: 공개 API URL 주입 예시
- `.cursor/rules/*`: 프런트엔드 작업용 Cursor rules

다음 구현 시작점:

1. `src/README.md`를 읽는다.
2. `src/routes/__root.tsx`의 스타터 레이아웃을 게임용 최소 셸로 단순화한다.
3. `src/routes/index.tsx`를 실제 게임 앱 진입점으로 바꾼다.
4. 필요해질 때만 `src/routes` 아래에 새 route 파일을 추가한다.
