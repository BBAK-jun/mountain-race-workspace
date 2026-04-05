# Deployment

이 레포는 프런트와 백엔드를 분리 배포하는 전략으로 맞춰져 있다.

- 클라이언트: Cloudflare Pages 정적 호스팅
- 서버: Cloudflare Workers (Durable Objects + WebSocket)

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

핵심 전략:

- Hono 앱을 Cloudflare Worker 엔트리로 export
- RaceRoom Durable Object로 방별 게임 상태를 관리
- WebSocket Hibernation API로 실시간 통신 처리
- Hono RPC로 타입 안전한 HTTP 라우트 제공
- Wrangler로 로컬 개발과 배포를 일원화
- GitHub Actions에서 `wrangler deploy` 실행

### Durable Objects 바인딩

`wrangler.jsonc`에서 `RACE_ROOM` 바인딩으로 RaceRoom Durable Object를 연결한다. 새 DO 클래스를 추가하거나 변경할 때는 migration 설정이 필요하다.

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "RACE_ROOM", "class_name": "RaceRoom" }],
  },
  "migrations": [{ "tag": "v1", "new_classes": ["RaceRoom"] }],
}
```

### Staging 배포

- 스테이징 워크플로우: [.github/workflows/deploy-api-staging.yml](./.github/workflows/deploy-api-staging.yml)
- 스테이징 환경은 별도 Worker 이름(`mountain-race-api-staging`)으로 배포된다.
- PR 브랜치 push 시 자동 실행되거나 수동 트리거할 수 있다.

필요한 GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

권장 GitHub Variables:

- `PUBLIC_API_URL`

공식 문서:

- Hono Cloudflare Workers: [Cloudflare Workers](https://hono.dev/getting-started/cloudflare-workers)
- Cloudflare Workers Wrangler configuration: [Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- Cloudflare Durable Objects: [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- Cloudflare Wrangler GitHub Action: [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)

## 3. 실제 연결 흐름

1. Cloudflare Workers가 `mountain-race-api` Hono Worker + RaceRoom Durable Object를 배포한다.
2. Cloudflare Pages가 웹 TanStack Router 정적 빌드를 배포한다.
3. 웹 빌드 시 `VITE_API_URL`을 Worker URL로 주입한다 (Pages Preview 환경에서도 동일).
4. 클라이언트가 HTTP로 방 생성/참가 → WebSocket으로 실시간 게임 상태를 수신한다.
5. Worker가 HTTP 요청을 받으면 Hono 라우트를 처리하고, WebSocket 업그레이드 요청은 Durable Object로 전달한다.

## 4. 첫 배포 체크리스트

1. Cloudflare에서 Worker 이름과 account를 준비한다.
2. GitHub에 `CLOUDFLARE_API_TOKEN`과 `CLOUDFLARE_ACCOUNT_ID`를 넣는다.
3. GitHub Variable `PUBLIC_API_URL`을 실제 Worker URL로 넣는다.
4. `wrangler.jsonc`에 Durable Object migration이 설정되어 있는지 확인한다.
5. API를 `main`에 push 해서 Worker 배포 워크플로우를 실행한다 (첫 배포 시 DO migration이 자동 적용된다).
6. Pages Preview 환경에서 `VITE_API_URL`이 스테이징 Worker URL을 가리키는지 확인한다.
7. 웹을 `main`에 push 해서 Pages 배포 워크플로우를 실행한다.
