# Docs

이 디렉토리는 `Mountain Race` 구현에 필요한 기준 문서를 모아둔다.

## 읽는 순서

1. [prd/README.md](./prd/README.md)
2. [prd/1-core-race-product-manual.md](./prd/1-core-race-product-manual.md)
3. [prd/2-mvp-race-product-manual.md](./prd/2-mvp-race-product-manual.md)
4. [prd/3-race-systems-product-manual.md](./prd/3-race-systems-product-manual.md)
5. [prd/4-online-hidden-effects-product-manual.md](./prd/4-online-hidden-effects-product-manual.md)
6. [plans/README.md](./plans/README.md)
7. [project-harness.md](./project-harness.md)
8. [project-status.md](./project-status.md)
9. [deployment.md](./deployment.md)

## Generated Inventory

<!-- docs-harness:docs-inventory:start -->

- [apps/api/README.md](../apps/api/README.md): 이 디렉토리는 Cloudflare Workers에 배포하는 멀티플레이어 백엔드 앱이다.
- [apps/web/README.md](../apps/web/README.md): 이 디렉토리는 Cloudflare Pages에 배포하는 플레이어 프런트엔드 앱이다.
- [docs/deployment.md](deployment.md): 이 레포는 프런트와 백엔드를 분리 배포하는 전략으로 맞춰져 있다.
- [docs/plans/mountain-race-team-execution-plan.md](plans/mountain-race-team-execution-plan.md): 이 문서는 `Mountain Race` 구현을 특정 사람 기준 분업 문서가 아니라 workstream 기반 실행 계획으로 정리한다.
- [docs/plans/README.md](plans/README.md): 이 디렉토리는 `Mountain Race` 구현을 위한 공유 실행 기준만 담는다.
- [docs/prd/1-core-race-product-manual.md](prd/1-core-race-product-manual.md): 이 문서는 Mountain Race의 코어 레이스 경험과 기본 게임 규칙을 정의한다.
- [docs/prd/2-mvp-race-product-manual.md](prd/2-mvp-race-product-manual.md): 이 문서는 코어 레이스를 현재 레포에서 MVP로 구현하는 제품 기준을 정의한다.
- [docs/prd/3-race-systems-product-manual.md](prd/3-race-systems-product-manual.md): 이 문서는 코어 레이스를 구현하는 화면, 상태, 이벤트 시스템 기준을 정의한다.
- [docs/prd/4-online-hidden-effects-product-manual.md](prd/4-online-hidden-effects-product-manual.md): 이 문서는 온라인 멀티플레이와 숨겨진 효과 확장을 제품 기준으로 정의한다.
- [docs/prd/README.md](prd/README.md): 이 디렉토리는 Mountain Race 기능을 제품설명서 타임라인 순서로 관리한다.
- [docs/project-harness.md](project-harness.md): 이 문서는 Mountain Race Workspace의 문서 자동 갱신 하네스를 설명한다.
- [docs/project-status.md](project-status.md): Project Status 문서
- [README.md](../README.md): Mountain Race 게임을 구현하기 위한 AI-native TypeScript `pnpm workspace` 모노레포다.
<!-- docs-harness:docs-inventory:end -->

## DRI And Freshness

<!-- docs-harness:docs-freshness-summary:start -->

- current 14개 / stale 0개 / generated 1개 / manual 2개
- working tree warning 0개 / in-progress 1개
- DRI는 하네스가 계산하고, review 기준과 manual watch override는 `docs/docs-registry.json`이 관리한다.
- stale 문서 없음
- working tree 경고 없음
<!-- docs-harness:docs-freshness-summary:end -->

## 문서 역할

- `prd/README.md`: 제품설명서를 기능 확장 타임라인 순서로 정리한 입구 문서다.
- `prd/1-core-race-product-manual.md`: 게임의 목적, 사용자 흐름, 제품 범위, 연출 톤을 정의한다.
- `prd/2-mvp-race-product-manual.md`: 현재 레포 구조, `__root.tsx` 처리 방식, 구현 순서, 작업 분배를 정리한 MVP 설명서다.
- `prd/3-race-systems-product-manual.md`: `apps/web` 기준 상태 구조, 시스템 설계, 게임 루프, 화면 구현 방식의 기술 기준이다.
- `prd/4-online-hidden-effects-product-manual.md`: 멀티플레이어 + 히든 이펙트 기능의 제품 요구사항이다.
- `plans/README.md`: 공유 실행 기준과 협업 원칙을 모아둔 입구 문서다.
- `project-harness.md`: 어떤 문서가 자동 갱신 대상인지와 하네스 운영 규칙을 설명한다.
- `project-status.md`: 현재 코드, 문서, 자동화 상태를 요약하는 generated 문서다.
- `deployment.md`: Cloudflare Pages + Cloudflare Workers 배포 기준이다.

## 바로 개발 시작할 때

- 제품 의도와 범위는 `prd/1-core-race-product-manual.md`를 기준으로 본다.
- 현재 코드베이스에서 실제 파일을 어디에 두고 어떤 순서로 개발할지는 `prd/2-mvp-race-product-manual.md`를 따른다.
- 상태, 타입, 이벤트 시스템은 `prd/3-race-systems-product-manual.md`를 기준으로 구현한다.
- 확장 기능 제품설명서는 `prd/4-online-hidden-effects-product-manual.md`처럼 번호를 이어 붙인다.
- 공유 workstream 분리와 병합 순서는 `plans/README.md`를 따른다.
- 현재 코드와 문서가 어디까지 맞물려 있는지는 `project-status.md`를 먼저 확인한다.
- DRI와 auto-detected watch path 결과는 `pnpm docs:audit`로 확인하고, review 기준과 수동 override는 `docs/docs-registry.json`에서 관리한다.

## Workspace Snapshot

<!-- docs-harness:docs-workspace-snapshot:start -->

- 웹 클라이언트: 6개 route 파일, 41개 feature 파일
- API 서버: domain 8개 / application 3개 / infrastructure 1개 / presentation 5개
- 자동화: GitHub workflow 4개, Husky hook `pre-commit` + `pre-push`, root script `docs:sync` / `docs:check` / `docs:audit`
<!-- docs-harness:docs-workspace-snapshot:end -->

## 현재 기준 단일 원칙

- MVP는 웹 프런트엔드 우선이다.
- 라우터는 `landing`, `setup`, `race`, `result`를 별도 route로 둔다.
- `apps/web/src/routes/__root.tsx`는 게임용 최소 레이아웃으로 단순화한다.
- 맵은 `기본 산길` 1종만 구현한다.
- 제품설명서에 없는 새 기능은 별도 합의 없이 추가하지 않는다.
