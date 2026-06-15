# RULES.md
> 모든 에이전트(Claude/Codex/Gemini, Chat/Edit Agent)가 예외 없이 따라야 하는 규칙.
> `AGENTS.md`의 "행동 원칙"을 더 구체적인 체크리스트로 분해한 문서.

---

## R1. API Key / 자격증명 직접 사용 금지

- 서버 코드(`tools/src/**`)에 LLM API Key를 하드코딩하거나 환경변수로 직접 호출하는 코드를
  작성하지 않는다.
- LLM 호출이 필요한 모든 기능(Chat Agent 등)은 **로컬에 설치된 CLI**(`claude`, `codex`, `gemini`)를
  `child_process`로 실행하는 방식만 허용한다.
- CLI가 설치되어 있지 않은 환경에서는, 규칙 기반 폴백(`wikiStore.search` 결과 요약)으로 동작해야
  하며 이 사실을 응답에 명시한다 (`engine: "cli" | "fallback"`).

## R2. 메시지 큐 기반 비동기 처리

- 웹 UI ↔ 에이전트 간 통신은 HTTP 동기 응답이 아니라 **파일 기반 큐**
  (`tools/queue/inbox/*.json` → `tools/queue/outbox/*.json`)를 통해 이루어진다.
- `inbox/`에 새 파일이 생기면 `harness/hooks/watch-raw.sh --agent-mode`(또는 동일 로직의
  워처)가 이를 감지해 CLI subprocess를 실행하고, 결과를 `outbox/`에 동일 ID로 기록한다.
- UI는 `outbox/<id>.json`이 생성될 때까지 짧은 간격으로 폴링한다.

## R3. Wiki 페이지 생성/수정

- 새 페이지는 항상 `status: draft`로 생성한다.
- 생성 직후 `wiki_validate(id)`를 자동 호출한다 (`PostToolUse` Hook).
- `status: active`로의 전환은 **사람이 수동으로 frontmatter를 수정**하거나, UI에서 명시적으로
  승인 동작을 수행해야 한다. 에이전트가 스스로 `active`로 바꾸지 않는다.
- 페이지를 삭제하지 않는다. 더 이상 유효하지 않으면 `status: deprecated`.

## R4. raw/ 디렉토리 처리

- `raw/`에 위치한 파일은 사람이 "이 자료를 Wiki에 통합해줘"라는 의도로 넣은 것으로 간주한다.
- ingest 후에는 원본 파일을 `raw/.processed/`로 이동시켜 중복 처리를 방지한다 (삭제하지 않음).
- 파일명에서 슬러그를 추론할 수 없으면 본문 첫 줄을 제목으로 사용한다 (`wikiStore.ts` 로직).

## R5. 검증과 인터링크

- `wiki_validate`는 `[[id]]` 형식의 인터링크 유효성과 frontmatter 필수 필드를 검사한다.
- 새로 생성된 페이지가 존재하지 않는 페이지를 `[[id]]`로 참조하면, 이를 경고로만 표시하고
  생성을 막지는 않는다(추후 해당 페이지가 생길 수 있으므로). 단, `wiki_validate` 결과의
  `broken_links`에 반드시 노출되어야 한다.

## R6. 기록 (Journal)

- 다음 동작은 반드시 `harness/journal.md`에 한 줄 이상 기록된다 (append-only):
  - `wiki_create` 호출 (생성된 page id, mode, validate 결과)
  - Hook 스크립트 실행 (`post-tool-use-validate.sh`, `watch-raw.sh`)
  - Chat/Edit Agent의 CLI subprocess 호출 성공/실패 여부
