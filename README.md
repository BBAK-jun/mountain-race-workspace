# Mountain Race Workspace

Mountain Race 게임을 구현하기 위한 AI-native TypeScript `pnpm workspace` 모노레포다.

현재 이 레포는 웹 클라이언트, 멀티플레이어 API, 공유 타입과 게임 로직, 팀 실행 문서, Cursor/Codex 작업 surface를 함께 관리한다.

## Generated Snapshot

<!-- docs-harness:readme-snapshot:start -->

- 앱 상태: `apps/web`는 6개 route 파일과 41개 feature 파일을 가진 플레이어 클라이언트이고, `apps/api`는 20개 TypeScript 파일로 구성된 멀티플레이어 API다.
- 공유 패키지: `@mountain-race/game-logic`, `@mountain-race/types`
- 문서 상태: `14`개 Markdown 문서와 `4`개 GitHub workflow가 정리돼 있다.
- AI surface: Cursor rules 4개 / Cursor skills 16개 / Cursor agents 5개 / Codex skills 16개 / Codex subagents 5개
- 현재 웹 route: `(root layout)`, `/`, `/lobby`, `/race`, `/result`, `/setup`
<!-- docs-harness:readme-snapshot:end -->

## Mountain Race Docs

문서 입구는 [docs/README.md](./docs/README.md)다. 현재 코드와 자동화 상태를 요약한 generated 문서는 [docs/project-status.md](./docs/project-status.md)다.

<!-- docs-harness:readme-docs:start -->

- [apps/api/README.md](apps/api/README.md): 이 디렉토리는 Cloudflare Workers에 배포하는 멀티플레이어 백엔드 앱이다.
- [apps/web/README.md](apps/web/README.md): 이 디렉토리는 Cloudflare Pages에 배포하는 플레이어 프런트엔드 앱이다.
- [docs/deployment.md](docs/deployment.md): 이 레포는 프런트와 백엔드를 분리 배포하는 전략으로 맞춰져 있다.
- [docs/plans/mountain-race-team-execution-plan.md](docs/plans/mountain-race-team-execution-plan.md): 이 문서는 `Mountain Race` 구현을 특정 사람 기준 분업 문서가 아니라 workstream 기반 실행 계획으로 정리한다.
- [docs/plans/README.md](docs/plans/README.md): 이 디렉토리는 `Mountain Race` 구현을 위한 공유 실행 기준만 담는다.
- [docs/prd/1-core-race-product-manual.md](docs/prd/1-core-race-product-manual.md): 이 문서는 Mountain Race의 코어 레이스 경험과 기본 게임 규칙을 정의한다.
- [docs/prd/2-mvp-race-product-manual.md](docs/prd/2-mvp-race-product-manual.md): 이 문서는 코어 레이스를 현재 레포에서 MVP로 구현하는 제품 기준을 정의한다.
- [docs/prd/3-race-systems-product-manual.md](docs/prd/3-race-systems-product-manual.md): 이 문서는 코어 레이스를 구현하는 화면, 상태, 이벤트 시스템 기준을 정의한다.
- [docs/prd/4-online-hidden-effects-product-manual.md](docs/prd/4-online-hidden-effects-product-manual.md): 이 문서는 온라인 멀티플레이와 숨겨진 효과 확장을 제품 기준으로 정의한다.
- [docs/prd/README.md](docs/prd/README.md): 이 디렉토리는 Mountain Race 기능을 제품설명서 타임라인 순서로 관리한다.
- [docs/project-harness.md](docs/project-harness.md): 이 문서는 Mountain Race Workspace의 문서 자동 갱신 하네스를 설명한다.
- [docs/project-status.md](docs/project-status.md): Project Status 문서
- [docs/README.md](docs/README.md): 이 디렉토리는 `Mountain Race` 구현에 필요한 기준 문서를 모아둔다.
<!-- docs-harness:readme-docs:end -->

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
- `.agents/skills` 기반 Codex skills
- `.codex/agents` 기반 Codex subagents
- `.codex/config.toml` 기반 project-scoped Codex 설정
- `.cursorignore` 와 `.cursorindexingignore` 기반 AI 컨텍스트 축소
- 문서 자동 동기화를 위한 docs harness
- GitHub Actions CI
- `apps/web` Cloudflare Pages용 플레이어 웹 앱
- `apps/api` Cloudflare Workers용 멀티플레이어 API 앱

## 시작하기

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

웹 클라이언트는 `http://localhost:4173`에서 랜딩, 로비, 셋업, 레이스, 결과 플로우를 띄울 수 있다. API는 `http://localhost:8787`에서 room HTTP 라우트와 Durable Object 기반 멀티플레이어 런타임을 띄울 수 있다.

## 주요 스크립트

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:all
pnpm lint
pnpm typecheck
pnpm docs:sync
pnpm docs:check
pnpm docs:audit
pnpm format
pnpm build
pnpm check
```

## TypeScript And Catalog

버전은 루트 [pnpm-workspace.yaml](./pnpm-workspace.yaml)에 catalog로 모아두고, 각 앱의 `package.json`에서는 `catalog:` 프로토콜로 참조한다. `pnpm` 공식 문서 기준으로 catalog는 재사용 가능한 버전 상수이며 publish 시 실제 semver로 치환된다.

- pnpm catalogs: [Catalogs](https://pnpm.io/catalogs)
- pnpm workspace settings: [pnpm-workspace.yaml](https://pnpm.io/pnpm-workspace_yaml)

## Deployment

배포 전략은 현재 코드 상태를 기준으로 정리되어 있다.

- 클라이언트: Cloudflare Pages 정적 호스팅
- 서버: Cloudflare Workers

핵심 파일:

- [apps/web/wrangler.jsonc](./apps/web/wrangler.jsonc)
- [.github/workflows/deploy-web-cloudflare.yml](./.github/workflows/deploy-web-cloudflare.yml)
- [apps/api/wrangler.jsonc](./apps/api/wrangler.jsonc)
- [apps/api/src/index.ts](./apps/api/src/index.ts)
- [.github/workflows/deploy-api-cloudflare.yml](./.github/workflows/deploy-api-cloudflare.yml)
- [docs/deployment.md](./docs/deployment.md)

현재 기준으로:

- Cloudflare Pages는 실제 플레이어 클라이언트 빌드를 배포할 수 있다.
- Cloudflare Workers는 room API와 Durable Object 기반 멀티플레이어 서버를 배포할 수 있다.
- 세부 제품 동작과 문서 일치 여부는 `pnpm docs:sync`, `pnpm docs:audit`, `docs/project-status.md`로 같이 점검한다.

## AI Surfaces

Cursor와 Codex가 각자 읽는 surface를 함께 유지한다.

<!-- docs-harness:readme-ai-surface:start -->

- Cursor rules: `00-workspace-core.mdc`, `01-cursor-context-map.mdc`, `20-cursor-config-surface.mdc`, `90-release-checklist.mdc`
- Cursor skills: `mountain-race-api-surface`, `mountain-race-gameplay-loop`, `mountain-race-release-check`, `mountain-race-ui-flow`, `pr-create`, `web-r3f-animation`, `web-r3f-fundamentals`, `web-r3f-geometry`, `web-r3f-interaction`, `web-r3f-lighting`, `web-r3f-loaders`, `web-r3f-materials`, `web-r3f-physics`, `web-r3f-postprocessing`, `web-r3f-shaders`, `web-r3f-textures`
- Codex skills: `mountain-race-api-surface`, `mountain-race-gameplay-loop`, `mountain-race-release-check`, `mountain-race-ui-flow`, `pr-create`, `web-r3f-animation`, `web-r3f-fundamentals`, `web-r3f-geometry`, `web-r3f-interaction`, `web-r3f-lighting`, `web-r3f-loaders`, `web-r3f-materials`, `web-r3f-physics`, `web-r3f-postprocessing`, `web-r3f-shaders`, `web-r3f-textures`
- Codex subagents: `api-builder`, `gameplay-architect`, `release-auditor`, `scene-optimizer`, `ui-builder`
<!-- docs-harness:readme-ai-surface:end -->

문서 자동 갱신 하네스 설명은 [docs/project-harness.md](./docs/project-harness.md)를 본다.

## 구조

```text
.
├── apps/
│   ├── api/
│   │   └── .cursor/rules/
│   └── web/
│       └── .cursor/rules/
├── docs/
├── .agents/skills/
├── .codex/agents/
├── .codex/config.toml
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
