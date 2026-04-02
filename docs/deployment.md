# Deployment

이 레포는 프런트와 백엔드를 분리 배포하는 전략으로 맞춰져 있다.

현재 상태는 구현 코드가 없는 초기 템플릿이다. 따라서 아래 설정은 바로 실서비스를 위한 완성본이 아니라, 배포 구조를 먼저 고정해둔 템플릿으로 이해하면 된다.

- 클라이언트: Cloudflare Pages 정적 호스팅
- 서버: Render Docker web service

## 1. Cloudflare Pages

클라이언트 설정 파일은 [apps/web/wrangler.jsonc](/Users/sondi/Documents/github/mountain-race-workspace/apps/web/wrangler.jsonc)에 있다.

- 프로젝트 이름: `mountain-race-web`
- 빌드 산출물: `apps/web/dist`
- Node 버전 기준: [.node-version](/Users/sondi/Documents/github/mountain-race-workspace/.node-version)

레포에는 GitHub Actions 배포 워크플로우도 포함되어 있다.

- 워크플로우: [.github/workflows/deploy-web-cloudflare.yml](/Users/sondi/Documents/github/mountain-race-workspace/.github/workflows/deploy-web-cloudflare.yml)
- 기본 배포 대상 프로젝트명: `mountain-race-web`
- 빌드 시 주입되는 API URL: `PUBLIC_API_URL` repository variable, 없으면 `https://mountain-race-api.onrender.com`

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

## 2. Render Docker API

서버 설정은 [render.yaml](/Users/sondi/Documents/github/mountain-race-workspace/render.yaml)과 [apps/api/Dockerfile](/Users/sondi/Documents/github/mountain-race-workspace/apps/api/Dockerfile)에 있다.

현재는 실제 API가 아니라 플레이스홀더 컨테이너가 떠 있도록 만들어져 있다.

핵심 전략:

- Render Blueprint로 서비스 생성
- `runtime: docker`
- `healthCheckPath: /health`
- `autoDeployTrigger: off`
- `PORT=10000`
- 기본 리전: `singapore`

`render.yaml`은 monorepo 기준으로 Dockerfile과 build filter를 이미 포함한다. 실제 API 구현을 추가한 뒤 `autoDeployTrigger`와 환경변수를 다시 검토하면 된다.

필수 환경변수:

- `CORS_ORIGINS`

권장 값 예시:

```text
https://mountain-race-web.pages.dev
```

여러 도메인을 허용하려면 쉼표로 구분한다.

```text
https://mountain-race-web.pages.dev,https://play.example.com
```

아무 origin이나 허용하려면 임시로 `*`를 줄 수 있지만 운영에서는 권장하지 않는다.

공식 문서:

- Render Blueprint spec: [Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- Render web services: [Web Services](https://render.com/docs/web-services)
- Render health checks: [Health Checks](https://render.com/docs/health-checks)

## 3. 실제 연결 흐름

1. Render가 `mountain-race-api` 플레이스홀더 컨테이너를 Docker로 배포한다.
2. Cloudflare Pages가 웹 플레이스홀더 정적 파일을 배포한다.
3. 실제 구현을 추가한 뒤 웹 빌드 시 `VITE_API_URL`을 Render 도메인으로 주입한다.
4. 실제 구현을 추가한 뒤 API는 `CORS_ORIGINS`로 Cloudflare 도메인을 허용한다.

## 4. 첫 배포 체크리스트

1. Render에서 Blueprint로 레포를 연결한다.
2. 실제 API 구현 전에는 `autoDeployTrigger`를 유지하거나 필요 시 수동으로만 배포한다.
3. GitHub에 `CLOUDFLARE_API_TOKEN`과 `CLOUDFLARE_ACCOUNT_ID`를 넣는다.
4. 실제 API가 생기면 GitHub Variable `PUBLIC_API_URL`을 Render API URL로 넣는다.
5. 웹 구현이 생기면 `main`에 push 해서 Cloudflare 배포 워크플로우를 실행한다.
