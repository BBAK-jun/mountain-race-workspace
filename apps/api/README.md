# API App

이 디렉토리는 Render Docker web service에 배포할 백엔드 앱 자리다.

현재 상태:

- 구현 코드는 비워둔 초기 상태
- TypeScript 설정, Dockerfile, Render 배포 전략 문서만 남겨둔 상태
- 실제 라우트, 저장소, 게임 서버 로직은 아직 없음

남아 있는 파일의 역할:

- `package.json`: 의도한 스택과 스크립트 자리
- `tsconfig.json`: TypeScript 기준 설정
- `Dockerfile`: Render Docker 배포 템플릿
- `.env.example`: 향후 환경변수 자리
- `.cursor/rules/*`: 백엔드 작업용 Cursor rules

다음 구현 시작점:

1. `src/README.md`를 읽는다.
2. `src/index.ts`를 만든다.
3. `/health` 같은 최소 엔드포인트부터 추가한다.
