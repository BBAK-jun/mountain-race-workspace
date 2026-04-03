# Docs

이 디렉토리는 `Mountain Race` 구현에 필요한 기준 문서를 모아둔다.

## 읽는 순서

1. [mountain-race-product-prd.md](./mountain-race-product-prd.md)
2. [mountain-race-mvp-guide.md](./mountain-race-mvp-guide.md)
3. [mountain-race-technical-prd.md](./mountain-race-technical-prd.md)
4. [plans/README.md](./plans/README.md)
5. [deployment.md](./deployment.md)

## 문서 역할

- `mountain-race-product-prd.md`: 게임의 목적, 사용자 흐름, 제품 범위, 연출 톤을 정의한다.
- `mountain-race-mvp-guide.md`: 현재 레포 구조, `__root.tsx` 처리 방식, 구현 순서, 작업 분배를 정리한 개발 시작 가이드다.
- `mountain-race-technical-prd.md`: `apps/web` 기준 상태 구조, 시스템 설계, 게임 루프, 화면 구현 방식의 기술 기준이다.
- `plans/README.md`: 실제 4인 병렬 실행 계획과 개인별 작업 문서 모음이다.
- `deployment.md`: Cloudflare Pages + Cloudflare Workers 배포 기준이다.

## 바로 개발 시작할 때

- 제품 의도와 범위는 `mountain-race-product-prd.md`를 기준으로 본다.
- 현재 코드베이스에서 실제 파일을 어디에 두고 어떤 순서로 개발할지는 `mountain-race-mvp-guide.md`를 따른다.
- 상태, 타입, 이벤트 시스템은 `mountain-race-technical-prd.md`를 기준으로 구현한다.
- 사람별 작업 분배와 병합 순서는 `plans/README.md`를 따른다.

## 현재 기준 단일 원칙

- MVP는 웹 프런트엔드 우선이다.
- 라우터는 `landing`, `setup`, `race`, `result`를 별도 route로 둔다.
- `apps/web/src/routes/__root.tsx`는 게임용 최소 레이아웃으로 단순화한다.
- 맵은 `기본 산길` 1종만 구현한다.
- 제품 PRD와 기술 PRD에 없는 새 기능은 별도 합의 없이 추가하지 않는다.
