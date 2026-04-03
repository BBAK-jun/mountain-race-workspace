# Web App

이 디렉토리는 Cloudflare Pages에 배포할 프런트엔드 앱 자리다.

현재 상태:

- TanStack Router file-based routing 기반 루트 단일 페이지 스타터가 들어 있는 상태
- TypeScript, Vite, Wrangler, Cursor rules는 연결된 상태
- 실제 화면과 게임 로직은 아직 없음

남아 있는 파일의 역할:

- `package.json`: TanStack Router + Vite + Wrangler 스크립트 자리
- `tsconfig.json`: TypeScript 기준 설정
- `vite.config.ts`: React + TanStack Router 플러그인 설정
- `wrangler.jsonc`: Cloudflare Pages 설정 자리
- `.env.example`: 공개 API URL 주입 예시
- `.cursor/rules/*`: 프런트엔드 작업용 Cursor rules

다음 구현 시작점:

1. `src/README.md`를 읽는다.
2. 현재 루트 페이지를 원하는 첫 화면으로 바꾼다.
3. 필요해질 때만 `src/routes` 아래에 새 route 파일을 추가한다.
