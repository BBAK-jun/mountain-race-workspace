# API Source

여기는 Cloudflare Worker 안에서 실행되는 Hono API 코드가 들어갈 자리다.

지금은 최소 스타터만 들어 있다.

권장 시작 파일:

- `index.ts`
- `routes/`
- `services/`
- `lib/`

권장 원칙:

- 라우트 계약을 짧고 명확하게 유지한다.
- 프런트엔드용 표시 가공은 API가 아니라 클라이언트에서 한다.
- 로컬에서 바로 부팅 가능한 최소 Worker부터 만든다.
