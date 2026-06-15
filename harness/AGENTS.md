# AGENTS.md
> 매 세션 시작 시 이 파일과 `harness/journal.md`를 먼저 읽어라.
> 이 파일이 너의 작업 방식 전부다.

---

## 0. 파일 구조

```
llm-wiki-mcp/
├── harness/                 # 운영 지침 (Preference) + Hook 스크립트
│   ├── AGENTS.md            # 이 파일
│   ├── CLAUDE.md            # Claude 전용 행동 지침
│   ├── GEMINI.md            # Gemini 전용 행동 지침
│   ├── RULES.md             # 공통 규칙 (모든 에이전트가 반드시 따름)
│   ├── TASK.md              # 작업 체크리스트 (Contract)
│   ├── journal.md           # 작업 이력 (append-only, 절대 수정 금지)
│   └── hooks/                # 실제 동작하는 Hook 스크립트
│       ├── post-tool-use-validate.sh   # wiki_create 직후 wiki_validate 자동 호출
│       └── watch-raw.sh                # raw/ 감시 → ingest 트리거 (SessionStart/Loop)
│
├── raw/                      # 사용자가 자기 자료를 넣는 곳 (txt/md)
├── schema/
│   └── wiki_schema.md        # Wiki 페이지 스키마 정의
├── wiki/
│   ├── pages/                # 개별 Wiki 페이지 (.md, frontmatter 포함)
│   └── people/
│
├── tools/                     # MCP 서버 (Tool 5종) + Agent 큐
│   ├── src/
│   │   ├── index.ts          # stdio MCP 서버
│   │   ├── http.ts            # HTTP 서버 (웹 뷰어 연동)
│   │   ├── wikiStore.ts       # raw/wiki 데이터 접근 계층
│   │   ├── tools/wikiTools.ts # MCP Tool 5종
│   │   ├── cli*.ts             # Hook 스크립트가 호출하는 독립 실행형 CLI들
│   │   └── agents/             # Chat/Edit Agent (subprocess 기반)
│   └── queue/
│       ├── inbox/             # 뷰어 → 에이전트 요청 큐
│       └── outbox/            # 에이전트 → 뷰어 응답 큐
│
├── client/                   # 3-pane 웹 뷰어 (페이지 목록 / 본문 / 에이전트 패널)
├── specs/                     # 설계 문서 (DOMAIN/DECISIONS/PRD — Agent SPEC은 PRD §8에 통합)
└── demo/                      # 데모 스크린샷
```

---

## 1. 역할 정의

| 에이전트 | 역할 | 책임 |
|---------|------|------|
| `wiki_chat_agent` | 사용자 질의 응답 (읽기 전용) | `wiki_search`/`wiki_get`으로 근거 기반 답변 |
| `wiki_edit_agent` | raw → Wiki 변환 (쓰기, draft) | `wiki_create`(draft) + `wiki_validate` |
| `agent-watch.sh` (Hook) | inbox/raw 감시 | 새 요청/파일 감지 시 CLI subprocess 호출 |

---

## 2. 에이전트 공통 행동 원칙 (RULES.md 요약)

1. **읽기 우선**: 작업 전 `harness/TASK.md`와 `harness/journal.md`를 읽는다.
2. **스키마 준수**: 모든 Wiki 페이지는 `schema/wiki_schema.md`를 따른다.
3. **기록 의무**: 작업 완료 시 `harness/journal.md`에 append-only로 기록한다.
4. **draft 우선**: `wiki_create`로 생성된 페이지는 항상 `status: draft`. `active` 전환은 사람이 승인.
5. **삭제 금지**: 페이지는 삭제하지 않고 `status: deprecated`로 표시한다.
6. **API Key 직접 사용 금지**: 에이전트 호출은 반드시 로컬에 설치된 CLI(`claude`, `codex`, `gemini`)의
   subprocess 호출을 통해서만 수행한다. 코드에 API Key를 하드코딩하지 않는다.

상세 규칙은 [`RULES.md`](RULES.md) 참고.

---

## 3. Hook (실제 스크립트, harness/hooks/)

| Hook 이벤트 | 스크립트 | 동작 |
|------------|---------|------|
| `PostToolUse` (wiki_create 이후) | `hooks/post-tool-use-validate.sh <page_id>` | `wiki_validate`를 HTTP로 호출해 결과를 `harness/journal.md`에 append |
| `SessionStart` / Loop | `hooks/watch-raw.sh` | `raw/`를 폴링, 새 파일 발견 시 `wiki_create`(mode=create)로 ingest 후 검증 |

두 스크립트 모두 `bash harness/hooks/<script>.sh`로 직접 실행 가능 (수동 트리거)
또는 `watch-raw.sh --loop`로 백그라운드 감시 모드 실행 가능.

---

## 4. 30분 Quick Start 흐름 (README.md §2 참고)

```
1. raw/ 에 자기 자료(.txt/.md) 1개 복사
2. bash harness/hooks/watch-raw.sh        # 또는 --loop로 상시 감시
   → wiki/pages/<slug>.md (status: draft) 생성 + wiki_validate 자동 실행
3. tools(HTTP) + client(Vite) 실행
4. 브라우저에서 새 페이지 확인, draft 배지 확인
5. (선택) 우측 에이전트 패널에 질문 → inbox/outbox 큐를 통해 CLI subprocess 응답 확인
```

---

## 5. 세션 시작 프로토콜

```
1. harness/AGENTS.md 읽기 (이 파일)
2. harness/TASK.md에서 현재 TODO 확인
3. harness/journal.md에서 마지막 작업 상태 확인
4. schema/wiki_schema.md 재확인
5. 작업 시작
```
