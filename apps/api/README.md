# API App

이 디렉토리는 Cloudflare Workers에 배포할 백엔드 앱 자리다.

현재 상태:

- Hono 기반 최소 Worker 스타터만 들어 있는 초기 상태
- TypeScript 설정, Wrangler 설정, Cloudflare 배포 전략 문서가 잡혀 있는 상태
- 실제 게임 서버 로직과 저장소는 아직 없음

남아 있는 파일의 역할:

- `package.json`: Hono + Wrangler 기반 스크립트 자리
- `tsconfig.json`: Worker 런타임 기준 TypeScript 설정
- `wrangler.jsonc`: Cloudflare Worker 배포 설정
- `.dev.vars.example`: 향후 로컬 바인딩 값 예시 자리
- `.cursor/rules/*`: 백엔드 작업용 Cursor rules

다음 구현 시작점:

1. `src/README.md`를 읽는다.
2. `src/index.ts`의 기본 Hono 엔드포인트를 확장한다.
3. `/health` 다음으로 실제 게임용 API 계약을 추가한다.
