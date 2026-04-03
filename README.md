# Mountain Race Workspace

Cursor와 VS Code에서 바로 열어 작업할 수 있도록 정리한 AI-native TypeScript `pnpm workspace` 초기 템플릿이다.

현재 이 레포는 웹은 비워두고, API는 최소 Worker 스타터만 남겨둔 시작 상태다. 워크스페이스 구조, 배포 전략, CI, 에디터 설정, Cursor 설정, 앱 디렉토리 문서는 먼저 고정해두고 있다.

## Mountain Race Docs

팀이 바로 구현을 시작할 수 있도록 게임 문서를 `docs/` 아래에 정리해두었다.

- [docs/mountain-race-product-prd.md](./docs/mountain-race-product-prd.md)
- [docs/mountain-race-technical-prd.md](./docs/mountain-race-technical-prd.md)
- [docs/mountain-race-mvp-guide.md](./docs/mountain-race-mvp-guide.md)
- [docs/README.md](./docs/README.md)

## 포함된 기본값

- `pnpm workspace` 기반 루트 스크립트
- Node.js 24 기준 런타임
- `pnpm catalog` 기반 공용 버전 관리
- 루트 `tsconfig.base.json` 기반 TypeScript 표준화
- `Biome` 기반 린트와 import 정리
- `Prettier` 기반 포맷팅
- `.vscode` 공유 설정과 추천 확장
- `.cursor/rules` 기반 Cursor rules
- `.cursor/skills` 기반 Cursor skills
- `.cursor/agents` 기반 Cursor subagents
- `.cursor/hooks.json` 기반 Cursor hooks
- `.cursor/mcp.json` 기반 project MCP 설정 자리
- `.cursorignore` 와 `.cursorindexingignore` 기반 AI 컨텍스트 축소
- GitHub Actions CI
- `apps/web` Cloudflare Pages용 TanStack Router 파일 기반 웹 앱 스타터
- `apps/api` Cloudflare Workers용 Hono API 스타터

## 시작하기

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

웹은 빈 플레이스홀더 페이지를 `http://localhost:4173`에서 띄울 수 있다. API는 `http://localhost:8787`에서 최소 Hono Worker 엔드포인트를 띄울 수 있다.

## 주요 스크립트

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:all
pnpm lint
pnpm typecheck
pnpm format
pnpm build
pnpm check
```

## TypeScript And Catalog

버전은 루트 [pnpm-workspace.yaml](./pnpm-workspace.yaml)에 catalog로 모아두고, 각 앱의 `package.json`에서는 `catalog:` 프로토콜로 참조한다. `pnpm` 공식 문서 기준으로 catalog는 재사용 가능한 버전 상수이며 publish 시 실제 semver로 치환된다.

- pnpm catalogs: [Catalogs](https://pnpm.io/catalogs)
- pnpm workspace settings: [pnpm-workspace.yaml](https://pnpm.io/pnpm-workspace_yaml)

## Deployment

배포 전략도 같이 넣어뒀지만, 현재는 웹 TanStack Router 스타터와 최소 API 스타터를 기준으로 템플릿을 준비해둔 것이다.

- 클라이언트: Cloudflare Pages 정적 호스팅
- 서버: Cloudflare Workers

핵심 파일:

- [apps/web/wrangler.jsonc](./apps/web/wrangler.jsonc)
- [.github/workflows/deploy-web-cloudflare.yml](./.github/workflows/deploy-web-cloudflare.yml)
- [apps/api/wrangler.jsonc](./apps/api/wrangler.jsonc)
- [apps/api/src/index.ts](./apps/api/src/index.ts)
- [.github/workflows/deploy-api-cloudflare.yml](./.github/workflows/deploy-api-cloudflare.yml)
- [docs/deployment.md](./docs/deployment.md)

앱 구현이 거의 없으므로:

- Cloudflare Pages는 빈 플레이스홀더 정적 페이지를 배포할 수 있다.
- Cloudflare Workers는 최소 Hono API 스타터를 배포할 수 있다.
- 실제 서비스 배포 전에 각 앱 구현을 먼저 채워야 한다.

## Cursor Layout

Cursor 문서의 구분에 맞춰 컨텍스트를 계층화했다.

- `AGENTS.md`: 레포 전체에 항상 적용되는 기본 운영 규칙
- `.cursor/rules`: 프로젝트 전반 또는 특정 디렉토리에 자동 적용되는 규칙
- `.cursor/skills`: 길고 전문화된 작업 절차를 필요할 때만 로드하는 스킬
- `.cursor/agents`: 병렬 위임에 쓰는 전문 서브에이전트
- `.cursor/hooks.json`: 세션 또는 작업 이벤트에 반응하는 훅
- `.cursor/mcp.json`: 프로젝트 전용 MCP 서버 연결 지점
- `.cursorignore`, `.cursorindexingignore`: Cursor가 굳이 읽지 않아도 되는 파일 제외

## Cursor Skills

포함된 스킬:

- `mountain-race-ui-flow`: 로비, HUD, 결과 화면, 반응형 UI 작업
- `mountain-race-gameplay-loop`: 레이스 상태 전이, 순위 계산, 밸런싱 작업
- `mountain-race-api-surface`: 백엔드 라우트, 계약, 서버 연결 작업
- `mountain-race-release-check`: 머지 전 검증과 릴리즈 점검
- `web-r3f-fundamentals`: Canvas, hooks, JSX scene graph, 기본 R3F 구조 작업
- `web-r3f-animation`: `useFrame`, clip, spring 기반 애니메이션 작업
- `web-r3f-interaction`: 포인터 이벤트, raycasting, controls, 선택 상호작용 작업
- `web-r3f-loaders`: 모델, 텍스처, Suspense, preload 자산 로딩 작업
- `web-r3f-textures`: PBR 텍스처 세트, env map, 필터링, 색공간 작업
- `web-r3f-lighting`: 라이팅 리그, 그림자, 환경광 작업
- `web-r3f-materials`: 재질 선택, PBR 튜닝, 시각 스타일링 작업
- `web-r3f-geometry`: 기하 생성, BufferGeometry, 인스턴싱 작업
- `web-r3f-postprocessing`: bloom, DOF, screen-space 효과 작업
- `web-r3f-shaders`: GLSL, uniforms, `shaderMaterial` 작업
- `web-r3f-physics`: `@react-three/rapier` 기반 물리 작업

## Cursor Subagents

- `ui-builder`: React UI와 CSS 작업 전담
- `api-builder`: Hono 라우트와 계약 작업 전담
- `gameplay-architect`: 게임 규칙과 상태 설계 전담
- `scene-optimizer`: React Three Fiber 렌더링과 성능 점검 전담
- `release-auditor`: 출고 전 검증과 위험 정리 전담

## 구조

```text
.
├── apps/
│   ├── api/
│   │   └── .cursor/rules/
│   └── web/
│       └── .cursor/rules/
├── docs/
├── .cursor/rules/
├── .cursor/skills/
├── .cursor/agents/
├── .cursor/hooks.json
├── .cursor/mcp.json
├── .github/workflows/
├── .vscode/
├── AGENTS.md
├── biome.json
├── package.json
├── tsconfig.base.json
└── pnpm-workspace.yaml
```
