# demo/

`mvp_screenshot.png`는 **실제로 동작 중인** MCP 서버(`tools: npm run start:http`)와 웹 뷰어
(`client: npm run dev`)를 헤드리스 브라우저로 캡처한 화면입니다 (정적 목업이 아닙니다).

캡처 시점까지의 실제 동작 순서:

1. `raw/context-engineering.txt`(Context Engineering 관련 메모)를 `raw/`에 두고
   `bash harness/hooks/watch-raw.sh` 실행
   → `wiki/pages/context-engineering.md`가 `status: draft`로 생성되고 `wiki_validate`까지
   자동 실행됨 (`harness/journal.md`에 기록).
2. 좌측 **CASES** 카테고리에 `Context Engineering` (DRAFT 배지)이 새로 나타남.
3. 해당 페이지를 열어 중앙 패널에서 본문과 `[[harness]]`, `[[mcp]]` 인터링크(클릭 가능)를 확인.
4. `bash harness/hooks/watch-raw.sh --agent-mode --loop`(별도 프로세스, subprocess 워처)를
   실행한 상태에서 우측 Wiki Agent 패널에 "MCP는 왜 필요한가요?"를 입력.
5. 질문이 `tools/queue/inbox/`에 적재 → 워처가 `wiki_search`/`wiki_get`로 컨텍스트를 만들고
   로컬 CLI(claude/codex/gemini)를 시도 → 이 환경에는 CLI가 없어 규칙 기반
   (`engine: fallback`)으로 응답 → `tools/queue/outbox/`에 기록 → UI가 폴링해 표시.

화면 상단의 `13 pages`, `validate OK`, 좌측 `CASES (1) Context Engineering [DRAFT]`,
우측 `wiki_search → wiki_get` Tool 호출 로그, `출처: [[mcp]], [[context-engineering]],
[[agent-pool]]`, `CONFIDENCE: HIGH` / `ENGINE: FALLBACK` 배지가 모두 이 과정의 실제 결과입니다.

> 이 자료를 자신의 지식베이스로 교체하려면: `raw/`의 `context-engineering.txt`를 지우고
> 자신의 `.txt`/`.md` 파일을 넣은 뒤 위 1~5 과정을 동일하게 반복하면 됩니다
> (`README.md` §0 Quick Start 참고).
