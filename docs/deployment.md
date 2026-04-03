# Deployment

이 레포는 프런트와 백엔드를 분리 배포하는 전략으로 맞춰져 있다.

현재 상태는 웹 TanStack Router 스타터와 최소 Hono Worker 스타터만 있는 초기 템플릿이다. 따라서 아래 설정은 바로 실서비스를 위한 완성본이 아니라, 배포 구조를 먼저 고정해둔 템플릿으로 이해하면 된다.

- 클라이언트: Cloudflare Pages 정적 호스팅
- 서버: Cloudflare Workers

## 1. Cloudflare Pages

클라이언트 설정 파일은 [apps/web/wrangler.jsonc](./apps/web/wrangler.jsonc)에 있다.

- 프로젝트 이름: `mountain-race-workspace`
- 빌드 산출물: `apps/web/dist`
- Node 버전 기준: [`.node-version`](./.node-version) = `24.11.1`

레포에는 GitHub Actions 배포 워크플로우도 포함되어 있다.

- 워크플로우: [.github/workflows/deploy-web-cloudflare.yml](./.github/workflows/deploy-web-cloudflare.yml)
- 기본 배포 대상 프로젝트명: `mountain-race-web`
- 빌드 시 주입되는 API URL: `PUBLIC_API_URL` repository variable

필요한 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

권장 GitHub Variables:

- `CLOUDFLARE_PAGES_PROJECT`
- `PUBLIC_API_URL`

수동 로컬 확인:

```bash
pnpm --filter @mountain-race/web pages:dev
```

공식 문서:

- Cloudflare Pages Wrangler config: [Configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- Cloudflare Pages local dev: [Local development](https://developers.cloudflare.com/pages/functions/local-development/)
- Cloudflare Wrangler GitHub Action: [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)

## 2. Cloudflare Workers API

서버 설정은 [apps/api/wrangler.jsonc](./apps/api/wrangler.jsonc), [apps/api/src/index.ts](./apps/api/src/index.ts), [.github/workflows/deploy-api-cloudflare.yml](./.github/workflows/deploy-api-cloudflare.yml)에 있다.

현재는 실제 API 전체가 아니라 최소 Hono Worker 스타터만 떠 있도록 만들어져 있다.

핵심 전략:

- Hono 앱을 Cloudflare Worker 엔트리로 export
- Wrangler로 로컬 개발과 배포를 일원화
- 기본 엔드포인트 `/`와 `/health` 유지
- GitHub Actions에서 `wrangler deploy` 실행

`wrangler.jsonc`는 monorepo 안의 `apps/api`를 Worker 프로젝트로 정의한다. 실제 API 구현을 추가한 뒤 custom domain, KV, D1, Durable Object 같은 바인딩을 확장하면 된다.

- 필요한 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

권장 GitHub Variables:

- `PUBLIC_API_URL`

공식 문서:

- Hono Cloudflare Workers: [Cloudflare Workers](https://hono.dev/getting-started/cloudflare-workers)
- Cloudflare Workers Wrangler configuration: [Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- Cloudflare Wrangler GitHub Action: [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)

## 3. 실제 연결 흐름

1. Cloudflare Workers가 `mountain-race-api` Hono Worker를 배포한다.
2. Cloudflare Pages가 웹 TanStack Router 정적 빌드를 배포한다.
3. 실제 구현을 추가한 뒤 웹 빌드 시 `VITE_API_URL`을 Worker URL로 주입한다.
4. 실제 구현을 추가한 뒤 Worker 바인딩과 라우트를 확장한다.

## 4. 첫 배포 체크리스트

1. Cloudflare에서 Worker 이름과 account를 준비한다.
2. GitHub에 `CLOUDFLARE_API_TOKEN`과 `CLOUDFLARE_ACCOUNT_ID`를 넣는다.
3. GitHub Variable `PUBLIC_API_URL`을 실제 Worker URL로 넣는다.
4. API는 `main`에 push 해서 Worker 배포 워크플로우를 실행한다.
5. 웹 구현이 생기면 `main`에 push 해서 Pages 배포 워크플로우를 실행한다.
