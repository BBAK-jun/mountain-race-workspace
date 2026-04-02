# GitHub

이 디렉토리는 CI와 배포 자동화를 담는다.

현재 포함:

- `workflows/ci.yml`: 포맷, 린트, 타입체크, 빌드 확인
- `workflows/deploy-web-cloudflare.yml`: Cloudflare Pages 배포 워크플로우 템플릿
- `workflows/deploy-api-cloudflare.yml`: Cloudflare Workers 배포 워크플로우 템플릿

웹 구현은 비워두고 API는 최소 Worker 스타터만 둔 상태지만, 워크플로우와 배포 구조는 앞으로 바로 쓸 수 있게 남겨둔 상태다.
