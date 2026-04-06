# Project Harness

이 문서는 Mountain Race Workspace의 문서 자동 갱신 하네스를 설명한다.

## 존재 이유

- 코드베이스가 바뀔수록 README 계열 문서는 가장 먼저 낡아지기 쉽기 때문이다.
- 파일 목록, route 목록, package surface 같은 기계적으로 계산 가능한 정보는 사람이 반복해서 손으로 적지 않게 하려는 목적이다.
- 문서를 참고용 장식이 아니라 실제 운영 기준으로 유지하려면, 로컬 훅과 CI가 같은 규칙으로 드리프트를 잡아야 하기 때문이다.
- 사람은 제품 의도, 설계 판단, 예외 상황 같은 서술형 맥락에 집중하고, 하네스는 현재 코드 상태를 반영하는 반복 작업을 맡는다.

## 목표

- 현재 코드 상태와 README 계열 문서가 쉽게 어긋나지 않게 유지한다.
- 사람이 매번 파일 목록, route 목록, automation surface를 손으로 정리하지 않게 만든다.
- 로컬 훅과 CI가 같은 기준으로 문서 드리프트를 잡게 한다.

## 자동 갱신 문서

<!-- docs-harness:project-harness-managed-docs:start -->

- `apps/api/README.md`
- `apps/README.md`
- `apps/web/README.md`
- `docs/project-harness.md`
- `docs/project-status.md`
- `docs/README.md`
- `README.md`
<!-- docs-harness:project-harness-managed-docs:end -->

## Freshness Audit 대상 문서

<!-- docs-harness:project-harness-governance-docs:start -->

- `apps/api/README.md`
- `apps/api/src/README.md`
- `apps/README.md`
- `apps/web/README.md`
- `apps/web/src/README.md`
- `docs/deployment.md`
- `docs/plans/mountain-race-team-execution-plan.md`
- `docs/plans/README.md`
- `docs/prd/1-core-race-product-manual.md`
- `docs/prd/2-mvp-race-product-manual.md`
- `docs/prd/3-race-systems-product-manual.md`
- `docs/prd/4-online-hidden-effects-product-manual.md`
- `docs/prd/README.md`
- `docs/project-harness.md`
- `docs/project-status.md`
- `docs/README.md`
- `README.md`
<!-- docs-harness:project-harness-governance-docs:end -->

## 소스 오브 트루스

- generated block 계산 로직은 `scripts/docs-harness/`에 둔다.
- marker가 있는 문서는 하네스가 자동으로 관리 대상으로 발견한다.
- 공개 인벤토리용 문서 집합과 freshness audit용 문서 집합은 분리해서 계산한다.
- 공개 인벤토리는 루트 Markdown, `docs/**/*.md`, `apps/*/README.md`, `packages/*/README.md`를 자동 탐지한다.
- freshness audit는 숨김 디렉토리를 제외한 workspace Markdown을 더 넓게 자동 탐지하고, registry에 없어도 하네스가 인식한다.
- 문서 인벤토리 설명은 각 문서의 첫 설명 문장이나 제목 fallback에서 추출한다.
- generated 문서는 `docs/docs-registry.json`의 `generated`와 optional `generator` 이름으로 연결한다.
- 문서 DRI는 하네스가 계산하고, `docs/docs-registry.json`은 문서 목록 자체가 아니라 kind, review 기준, generated 설정, auto-detect가 못 잡는 override watch path와 필요한 ignore 규칙만 관리한다.
- generated 문서는 `docs/project-status.md` 하나로 두고, 나머지는 사람 설명과 managed block을 혼합한다.

## 동작 방식

1. `pnpm docs:sync`가 `scripts/docs-harness/index.mts`를 실행한다.
2. 스크립트는 실제 파일 시스템과 `package.json`들을 읽는다.
3. marker가 있는 문서를 자동으로 찾아 어떤 섹션을 갱신할지 결정한다.
4. 공개 인벤토리용 문서 집합과 freshness audit용 문서 집합을 각각 자동 탐지한다.
5. 문서 본문의 코드 경로, 설정 경로, repo-relative 링크를 읽고 `docs/docs-registry.json` override와 합쳐 freshness 상태를 계산한다.
6. DRI는 `apps/api` 전용 문서면 `박준형`, 그 외는 `모두`로 계산한다.
7. 관리 블록(`<!-- docs-harness:... -->`) 또는 generated 문서를 갱신한다.
8. `pnpm docs:check`는 같은 계산을 다시 수행하고, 문서가 어긋나 있으면 실패한다.

## Freshness Audit

- `pnpm docs:audit`는 auto-detected watch path와 registry override 기준으로 문서 상태를 점검한다.
- `pnpm docs:audit` 대상은 공개 인벤토리보다 넓을 수 있고, 내부 README도 필요하면 자동 포함된다.
- `lastReviewedAt`은 사람이 해당 문서를 코드 상태와 맞춰 확인한 날짜다.
- 문서 본문에 적힌 코드 경로와 설정 경로는 하네스가 자동으로 watch 대상으로 추출한다.
- `watchPaths`는 auto-detect가 부족한 경우에만 추가 override로 정의한다.
- `ignoreWatchPaths`는 문서 안에 적혀 있지만 freshness 기준으로는 노이즈가 되는 경로를 제외할 때만 쓴다.
- DRI는 문서별 하드코딩 대신 하네스 규칙으로 계산한다.
- committed 변경이 `lastReviewedAt`보다 뒤면 해당 문서는 `stale`로 보고 audit를 실패시킨다.
- working tree에서 watch path가 바뀌었지만 문서 수정이 아직 없으면 `stale-working-tree` 경고를 낸다.
- working tree에서 watch path와 문서가 함께 수정 중이면 `in-progress`로 표시하고 실패시키지 않는다.

## 자동 실행 지점

- `pre-commit`: `pnpm docs:sync` 실행 후 자동 갱신 문서를 다시 stage한다.
- `pnpm check`: `pnpm docs:check`와 `pnpm docs:audit`를 먼저 실행한다.
- `pre-push`: 기존처럼 `pnpm check`를 실행하므로 문서 드리프트도 같이 차단한다.
- GitHub Actions CI: `pnpm check`에 포함돼 있으므로 PR에서도 동일하게 검증된다.
- `pnpm docs:audit`: 단독 실행하면 어떤 문서가 왜 stale인지 요약을 따로 볼 수 있다.

## 확장 방법

- 자동 갱신 대상을 추가하려면 먼저 문서에 marker block을 넣는다.
- 이후 `scripts/docs-harness/` 아래에서 type, repo, references, render, governance 모듈을 나눠 관리한다.
- 사람 설명과 generated block을 섞을 때는, 사람이 써야 하는 문단과 하네스가 관리하는 block을 분리한다.
- 문서 인벤토리 설명을 좋게 보이게 하려면 문서 첫 문단에 짧은 설명 문장을 둔다.
- 기능 단위 제품설명서는 `docs/prd/{번호}-*-product-manual.md` 규칙으로 추가하고, 번호는 기능 확장 타임라인 순서를 따른다.
- 새 문서는 우선 자동 탐지에 맡기고, freshness gate를 붙일 필요가 있을 때만 `docs/docs-registry.json`에 `lastReviewedAt`과 필요한 metadata를 추가한다.

## 비목표

- 제품설명서 본문을 AI가 임의로 다시 쓰게 하지 않는다.
- 코드 해석이 필요한 서술형 설계를 자동 생성의 유일한 소스로 삼지 않는다.
- 배포 비밀값, 운영 절차, 의사결정 히스토리를 임의로 문서화하지 않는다.
