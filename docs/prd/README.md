# Product Manuals

이 디렉토리는 Mountain Race 기능을 제품설명서 타임라인 순서로 관리한다.

## 읽는 순서

1. [1-core-race-product-manual.md](./1-core-race-product-manual.md)
2. [2-mvp-race-product-manual.md](./2-mvp-race-product-manual.md)
3. [3-race-systems-product-manual.md](./3-race-systems-product-manual.md)
4. [4-online-hidden-effects-product-manual.md](./4-online-hidden-effects-product-manual.md)

## 규칙

- 새 기능을 추가하면 `docs/prd/{다음 번호}-{기능명}-product-manual.md` 형식으로 문서를 만든다.
- 번호는 구현이 확장된 타임라인 순서를 따른다.
- 기존 기능을 보강할 때는 가장 가까운 제품설명서를 갱신하고, 범위를 넘으면 새 번호를 만든다.
- 문서를 만든 뒤 `pnpm docs:sync`와 `pnpm docs:audit`로 하네스 반영 상태를 확인한다.
