# Plans

이 디렉토리는 `Mountain Race` 구현을 위한 공유 실행 기준만 담는다.

개인별 할당 문서나 특정 이름을 전제로 한 작업 지시문은 유지하지 않는다. 이 프로젝트의 계획 문서는 역할보다 공통 workstream, 병합 순서, 충돌 방지 규칙을 설명하는 데 집중한다.

## 읽는 순서

1. [mountain-race-team-execution-plan.md](./mountain-race-team-execution-plan.md)

## 문서 역할

- `mountain-race-team-execution-plan.md`: 공통 workstream 분리, 병합 순서, 통합 체크포인트를 정리한 공유 실행 계획

## 현재 코드 동기화 상태

- `RaceRouteComposition` 기준으로 `RaceSceneSlot + InGameOverlaySlot` 조합이 고정되어 있다.
- 인게임 오버레이는 `HUD`, `EventAlert`, `EventLog` 실컴포넌트까지 반영되어 있다.
- 결과 진입은 `hasResult` 감지 시 `/result` 자동 이동으로 연결되어 있다.
- `finishTime` 기반 완주 순서와 first finisher 기준 grace period 종료 규칙이 반영되어 있다.
- `ResultScreen`은 `ResultScene` 위에 순위, 포디움, MVP 오버레이를 올리는 구조다.

## 단일 원칙

- 계획 문서는 특정 사람의 소유권보다 workstream 경계를 우선한다.
- 같은 시점에 같은 파일을 여러 workstream이 함께 수정하지 않는다.
- route-level 조합과 integration 규칙은 공유 문서에서만 관리한다.
- 제품 의도와 기술 계약은 상위 제품설명서를 기준으로 맞춘다.
