# Web App

이 디렉토리는 Cloudflare Pages에 배포할 프런트엔드 앱 자리다.

현재 상태:

- 구현 코드는 비워둔 초기 상태
- TypeScript, Vite, Wrangler, Cursor rules는 남겨둔 상태
- 실제 화면과 게임 로직은 아직 없음

남아 있는 파일의 역할:

- `package.json`: 의도한 스택과 스크립트 자리
- `tsconfig.json`: TypeScript 기준 설정
- `vite.config.ts`: 추후 프런트엔드 번들 설정 자리
- `wrangler.jsonc`: Cloudflare Pages 설정 자리
- `.env.example`: 공개 API URL 주입 예시 자리
- `.cursor/rules/*`: 프런트엔드 작업용 Cursor rules

다음 구현 시작점:

1. `src/README.md`를 읽는다.
2. `src/main.tsx`와 `src/App.tsx`를 만든다.
3. 정적 웹 호스팅 기준으로 필요한 자산만 추가한다.
