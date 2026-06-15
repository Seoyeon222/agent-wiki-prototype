# journal.md
> append-only: 절대 수정 금지. 새 항목은 맨 아래에 추가한다.

---

## 2026-06-14 | Session 02 | author: llm:claude-sonnet-4

### 작업 내용 (15주차 수정판 — 공지 요구사항 반영)
- harness/ 디렉토리로 AGENTS.md, CLAUDE.md, GEMINI.md, RULES.md, TASK.md 통합 및 갱신
- raw/, schema/ 디렉토리 신설 (13주차 specs/wiki_schema.md → schema/wiki_schema.md 이동)
- harness/hooks/post-tool-use-validate.sh 작성 (wiki_create 직후 wiki_validate 자동 호출, journal append)
- harness/hooks/watch-raw.sh 작성 (raw/ 폴링 → wiki_create(mode=create) → validate, --loop 지원)
- server/src/agents/chatAgent.ts: subprocess(claude/codex/gemini CLI) 우선 호출 경로 추가,
  CLI 부재 시 기존 규칙 기반 폴백으로 자동 전환 (engine: "cli" | "fallback" 명시)
- server/queue/{inbox,outbox}/ 도입 — UI ↔ Agent 비동기 통신을 파일 큐로 전환 (R2)
- client: 에이전트 패널이 inbox에 요청을 쓰고 outbox를 폴링하도록 수정

### 블로킹 이슈
- 없음. CLI(claude/codex/gemini) 미설치 환경에서는 폴백 엔진으로 동작 (README에 명시)

### 다음 세션 TODO
- [x] demo/ 스크린샷: raw/ → watch-raw.sh → draft 페이지 → 에이전트 패널 질의까지 실제 실행하여 캡처 완료
- 16주차: GitHub repo 패키징

---

## 2026-06-14T11:32:01Z | hook: watch-raw | ingest context-engineering.txt
```json
{
  "id": "context-engineering",
  "path": "wiki/pages/context-engineering.md",
  "status": "draft",
  "validation": {
    "ok": true,
    "broken_links": [],
    "schema_errors": []
  },
  "source": "raw/context-engineering.txt"
}
```

## 2026-06-14T11:32:54Z | hook: watch-raw | agent-reply id=1781436772932-6l2g2j engine=fallback


---

## 2026-06-14 | Session 03 | author: llm:claude-sonnet-4

### 작업 내용 (16주차 — 최종 통합)
- `server/` 디렉토리를 `tools/`로 변경 (공지의 "Tools and agent: tools/ MCP 서버 + 뷰어" 표현과 일치)
  - import 경로, package.json name, hook 스크립트 내 경로, README/specs/schema/harness 문서의
    모든 `server/` 참조를 `tools/`로 일괄 업데이트 (npm 패키지 경로 `@modelcontextprotocol/sdk/server/*`는 보존)
  - `tools/queue/{inbox,outbox}/`로 큐 디렉토리 이동
  - 재빌드(`cd tools && npm install && npm run build`) 및 `node dist/cliValidate.js` 통과 확인
- `harness/hooks/post-tool-use-validate.sh`의 `cli-validate.js`(오타) → `cliValidate.js` 수정,
  실제 실행하여 journal 기록 및 검증 통과 확인
- `harness/hooks/watch-raw.sh` raw/ 스캔 동작 재확인 (README.md 제외 로직 정상)
- README.md를 16주차 최종본으로 전면 재작성: harness/LLM Wiki/시각화 도구(tools+client)/demo
  구조를 공지 표현에 맞춰 명시, "Quick Start"를 0번 섹션으로 유지
- specs/AGENT_SPEC.md는 15주차에서 이미 PRD.md §8로 통합됨 (.md 4종 제출 제약)

### 블로킹 이슈
- 없음

### 다음 세션 TODO
- SUBMISSION.md (제출 양식: 학번/이름/깃허브 주소/공개 여부) 작성 — 개인정보는 placeholder
- 최종 zip 패키징

## 2026-06-14T14:19:49Z | hook: watch-raw | agent-reply id=1781446787479-a9e1h9 engine=fallback
