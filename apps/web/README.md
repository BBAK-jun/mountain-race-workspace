# Web App

이 디렉토리는 Cloudflare Pages에 배포하는 플레이어 프런트엔드 앱이다.

현재 상태:

- TanStack Router 기반 화면 라우팅이 이미 구성돼 있다.
- `features/mountain-race` 아래에 화면, HUD, 씬, 스토어, 시스템이 구현돼 있다.
- 자세한 현재 파일 스냅샷은 아래 generated block이 유지한다.

<!-- docs-harness:web-runtime-snapshot:start -->

### Generated Runtime Snapshot

- 패키지: `@mountain-race/web`
- 스크립트: `dev`, `build`, `preview`, `pages:dev`, `typecheck`
- route 파일: `(root layout)`, `/`, `/lobby`, `/race`, `/result`, `/setup`
- feature 파일 수: 41
- 핵심 feature 디렉토리: `app`, `components`, `screens`, `store`, `systems`
<!-- docs-harness:web-runtime-snapshot:end -->

구현 시작 전 권장 문서 순서:

1. `../../docs/prd/README.md`
2. `../../docs/prd/1-core-race-product-manual.md`
3. `../../docs/prd/2-mvp-race-product-manual.md`
4. `../../docs/prd/3-race-systems-product-manual.md`
5. `../../docs/prd/4-online-hidden-effects-product-manual.md`
6. `../../docs/project-status.md`

남아 있는 파일의 역할:

- `package.json`: TanStack Router + Vite + Wrangler 스크립트
- `tsconfig.json`: TypeScript 기준 설정
- `vite.config.ts`: React + TanStack Router 플러그인 설정
- `wrangler.jsonc`: Cloudflare Pages 설정
- `.env.example`: 공개 API URL 주입 예시
- `.cursor/rules/*`: 프런트엔드 작업용 Cursor rules

다음 수정 시작점:

1. `src/README.md`를 읽는다.
2. route를 추가하거나 바꾸면 generated snapshot의 route 목록도 같이 갱신되는지 확인한다.
3. 게임 상태나 연출을 바꾸면 `@mountain-race/types`, `@mountain-race/game-logic` 계약도 같이 본다.
