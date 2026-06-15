# LLM Wiki — Agentic Coding & LLM Workflow

> [하네스 + LLM Wiki + 시각화 도구]가 하나로 통합된, clone 후 바로
> 실행 가능한 LLM Wiki 프로토타입입니다.

이 repo를 clone한 뒤 `raw/`에 자기 자료 1건을 넣고 아래 0번 가이드를 따르면, 30분 안에
자신만의 LLM Wiki 첫 페이지를 만들고 화면에서 확인할 수 있습니다. (이미 12개 페이지로
구성된 "Agentic Coding & LLM Workflow" 위키가 즉시 사용 가능한 상태로 포함되어 있습니다.)

핵심 특징: 에이전트의 LLM 호출은 코드에 API Key를 넣지 않습니다. 로컬 CLI
(`claude`/`codex`/`gemini`)를 subprocess로 호출하는 "메시지 인식 Shell 스크립트"
(`harness/hooks/watch-raw.sh`)를 통해서만 이루어지며, CLI가 없는 환경에서는 규칙 기반
폴백(`engine: fallback`)으로 동일한 인터페이스가 동작합니다.

---

## 0. 30분 Quick Start

```bash
# 0) 의존성 설치 + 빌드
cd tools  && npm install && npm run build && cd ..
cd client && npm install && cd ..

# 1) 자기 자료 1개를 raw/에 넣기 (.txt 또는 .md, 첫 줄이 제목으로 사용됨)
cp ~/my-notes/something.txt raw/

# 2) raw/ → wiki/ 변환 (ingest) + 자동 검증  ← Hook 실행 (harness/hooks/watch-raw.sh)
bash harness/hooks/watch-raw.sh
# → wiki/pages/<slug>.md (status: draft) 생성, harness/journal.md에 자동 기록

# 3) MCP 서버(tools) + 웹 뷰어(client) 실행 (각각 별도 터미널)
cd tools  && npm run start:http     # http://localhost:8787
cd client && npm run dev            # http://localhost:5173

# 4) (선택) 에이전트 패널을 쓰려면 워처를 추가로 실행 (별도 터미널, Hook --agent-mode)
bash harness/hooks/watch-raw.sh --agent-mode --loop
```

브라우저에서 `http://localhost:5173` 접속 → 좌측 목록에서 방금 만든 페이지(`draft` 배지) 확인
→ 본문의 `[[id]]` 인터링크 클릭 이동 확인 → 우측 에이전트 패널에 질문 입력 → 답변, 출처
(`[[page_id]]`), `engine`(cli/fallback) 확인.

`demo/mvp_screenshot.png`가 바로 이 과정을 실제로 실행한 화면입니다 (§7 참고).

---

## 1. 프로젝트 구조 (Package)

```
llm-wiki-mcp/
├── harness/                    # ★ 하네스: 운영지침 + RULES + Hook(1개 이상)
│   ├── AGENTS.md               # 공통 운영 지침 (Preference)
│   ├── CLAUDE.md / GEMINI.md   # CLI별 설정
│   ├── RULES.md                # 공통 규칙 (API Key 금지, 큐 처리, draft 정책 등)
│   ├── TASK.md / journal.md    # Contract / append-only 이력
│   └── hooks/                   # ★ 실제 동작하는 Hook 스크립트 2개
│       ├── watch-raw.sh         # raw/ 감시(ingest) + inbox/outbox 감시(에이전트 subprocess)
│       └── post-tool-use-validate.sh  # wiki_create 후 wiki_validate 자동 호출
│
├── raw/                          # ★ LLM Wiki: 사용자가 자기 자료를 넣는 곳
│   └── .processed/               # ingest 완료된 원본 보관
│
├── schema/
│   └── wiki_schema.md            # ★ LLM Wiki: 페이지 스키마
│
├── wiki/                          # ★ LLM Wiki: 페이지 저장소 (즉시 사용 가능한 12개 포함)
│   ├── pages/                     # concept/pattern/tool/case
│   └── people/                    # person
│
├── tools/                          # ★ 시각화 도구 — MCP 서버 (Tool 5종) + Agent 큐
│   ├── src/
│   │   ├── index.ts                # stdio MCP 서버 (Claude Desktop/Code 연동)
│   │   ├── http.ts                  # HTTP 서버 (웹 뷰어 연동)
│   │   ├── wikiStore.ts             # raw/wiki 데이터 접근 계층
│   │   ├── tools/wikiTools.ts       # MCP Tool 5종
│   │   ├── agents/
│   │   │   ├── chatAgent.ts         # 큐 적재 + 폴링 + 규칙 폴백
│   │   │   └── editAgent.ts         # wiki_create(draft) + wiki_validate + journal
│   │   ├── cliIngest.ts             # raw 파일 1개 → wiki_create (watch-raw.sh가 호출)
│   │   ├── cliSearch.ts             # 에이전트 프롬프트용 컨텍스트 생성
│   │   ├── cliChatFallback.ts       # 규칙 기반 응답 (CLI 없을 때)
│   │   └── cliValidate.ts           # 독립 실행형 wiki_validate
│   └── queue/
│       ├── inbox/                   # 뷰어 → 에이전트 요청
│       └── outbox/                  # 에이전트 → 뷰어 응답
│
├── client/                          # ★ 시각화 도구 — 3-pane 웹 뷰어
├── specs/                            # 설계 문서 (DOMAIN/DECISIONS/PRD — Agent SPEC은 PRD §8에 통합)
└── demo/                             # ★ 실제 지식베이스 렌더링 캡처 PNG
```

---

## 2. MCP Tool 5종 (tools/)

| Tool | 설명 | 권한 |
|------|------|------|
| `wiki_list` | 카테고리/태그별 페이지 목록 조회 | 읽기 전용 |
| `wiki_get` | 단일 페이지 frontmatter + 본문 조회 | 읽기 전용 |
| `wiki_search` | 키워드 검색 (제목>태그>본문 가중치), snippet 반환 | 읽기 전용 |
| `wiki_create` | raw 텍스트 → 페이지 생성(create)/수정(update)/추가(append). 항상 `status: draft` | Edit Agent |
| `wiki_validate` | 전체/단일 페이지의 `[[id]]` 인터링크 및 frontmatter 스키마 검증 | Edit Agent |

타입 정의: [`shared/types.ts`](shared/types.ts) · 설계 근거: [`specs/PRD.md`](specs/PRD.md) §4.2 · 권한 매트릭스: [`specs/PRD.md`](specs/PRD.md) §8

### 동작 확인 (curl)

```bash
curl http://localhost:8787/mcp/tools
curl -X POST http://localhost:8787/mcp/tools/wiki_list -H "Content-Type: application/json" -d '{}'
curl -X POST http://localhost:8787/mcp/tools/wiki_search -H "Content-Type: application/json" -d '{"query":"SDLC"}'
curl -X POST http://localhost:8787/mcp/tools/wiki_validate -H "Content-Type: application/json" -d '{}'
```

### Claude Desktop / Code 연동 (stdio) — "에이전트가 접근 가능"한 경로

```json
{
  "mcpServers": {
    "llm-wiki": {
      "command": "node",
      "args": ["/absolute/path/to/llm-wiki-mcp/tools/dist/index.js"]
    }
  }
}
```

등록 후 Claude Desktop에서 "wiki_search로 SDLC를 찾아줘" 같은 요청을 하면 위 5개 Tool을
직접 호출할 수 있습니다 — MCP 서버가 곧 "에이전트가 접근 가능한 시각화/데이터 도구"입니다.

---

## 3. 자료 투입 → 통합 요청 방법

### 방법 A — raw/ 폴더 + Hook (권장, 30분 Quick Start의 핵심)

1. `.txt` 또는 `.md` 파일을 `raw/`에 복사한다. 첫 줄이 페이지 제목으로 사용된다.
2. `bash harness/hooks/watch-raw.sh` 실행 (1회) 또는 `--loop`로 상시 감시.
3. 결과:
   - `wiki/pages/<slug>.md` 생성 (`status: draft`)
   - `wiki_validate` 자동 실행, 결과가 `harness/journal.md`에 append
   - 원본은 `raw/.processed/`로 이동

### 방법 B — 웹 뷰어의 Edit Agent

1. `http://localhost:5173` 접속, 우측 패널을 **EDIT** 모드로 전환
2. 텍스트 입력 후 전송 → `/agents/edit` → `wiki_create(mode=create)` + `wiki_validate`
3. 중복 경고(`duplicate_warning`)와 검증 결과가 채팅창에 표시됨
4. 좌측 목록에 `draft` 배지로 새 페이지가 나타남

### draft → active 전환 (사람의 승인, RULES.md R3)

에이전트는 `status: active`로 직접 전환하지 않습니다. 검토 후 해당 페이지의 frontmatter에서
`status: draft`를 `status: active`로 직접 수정하세요.

---

## 4. 검증 방법

```bash
# 전체 Wiki 검증 (인터링크 + 스키마)
curl -X POST http://localhost:8787/mcp/tools/wiki_validate -H "Content-Type: application/json" -d '{}'

# 또는 서버 없이 직접 실행
cd tools && node dist/cliValidate.js
```

웹 뷰어 상단 바에 `validate OK` 또는 `N issues` 배지로도 동일한 정보가 표시됩니다.

---

## 5. 에이전트 아키텍처 (API Key 미사용, RULES.md R1/R2)

```
[웹 뷰어: 우측 에이전트 패널]
    │  POST /agents/chat { query }
    ▼
[tools/http: /agents/chat]
    │  enqueue → tools/queue/inbox/<id>.json
    │  poll    ← tools/queue/outbox/<id>.json (최대 20초)
    │
    │  (20초 안에 응답 없으면 즉시 규칙 기반 폴백 반환)
    ▼
[harness/hooks/watch-raw.sh --agent-mode --loop]  ← 별도 프로세스 (메시지 인식 Shell 스크립트)
    │  inbox/*.json 감시
    │  wiki_search로 컨텍스트 생성 (cliSearch.ts)
    │  claude --print / codex exec / gemini --prompt 중 설치된 것을 subprocess로 호출
    │     없으면 cliChatFallback.ts (규칙 기반)
    ▼
    outbox/<id>.json 작성 { engine: "cli"|"fallback", answer }
```

- **Chat Agent** (`wiki_chat_agent`, 읽기 전용): `wiki_search`/`wiki_get`만 사용.
- **Edit Agent** (`wiki_edit_agent`): `wiki_create`(draft)+`wiki_validate`, 모든 호출을
  `harness/journal.md`에 기록.

상세 권한/시스템 프롬프트/Hook 매핑: [`specs/PRD.md`](specs/PRD.md) §8 (Agent SPEC)

---

## 6. 환경 / 의존성

- Node.js 20+ (TypeScript 5.5, ES2022 / NodeNext)
- bash, curl (hooks 스크립트)
- (선택) `claude`, `codex`, 또는 `gemini` CLI — 설치되어 있으면 Chat Agent가 자동으로 사용
  (없어도 전체 기능이 규칙 기반 폴백으로 동작)

---

## 7. demo/ — 실제 동작 화면

`demo/mvp_screenshot.png`는 정적 목업이 아니라, 위 0번 Quick Start를 실제로 실행한
화면입니다:

1. `raw/context-engineering.txt`를 `watch-raw.sh`로 ingest → `wiki/pages/context-engineering.md`
   (status: draft) 생성, `wiki_validate: ok=true`
2. 웹 뷰어 좌측 CASES 카테고리에 `Context Engineering [DRAFT]`가 나타남
3. 본문의 `[[harness]]`, `[[mcp]]` 인터링크가 클릭 가능한 링크로 렌더링됨
4. 우측 에이전트 패널에 "MCP는 왜 필요한가요?" 질문 → `wiki_search`/`wiki_get` Tool 호출 로그 →
   답변 + `출처: [[mcp]], [[context-engineering]], [[agent-pool]]` + `CONFIDENCE: HIGH` /
   `ENGINE: FALLBACK`

자세한 재현 절차는 [`demo/README.md`](demo/README.md) 참고.

---

## 8. 설계 배경 (13주차 → 16주차)

- `wiki/pages/*.md`의 frontmatter는 13주차 스키마(`id`/`title`/`type`/`tags`/`created`/
  `last_updated`/`author`/`status`/`related`)에 `category` 필드를 추가한 것입니다.
  자세한 내용은 [`schema/wiki_schema.md`](schema/wiki_schema.md).
- `tools/src/wikiStore.ts`의 슬러그 생성/카테고리 추론/검증 로직은 13주차
  `pipeline/ingest.py` / `pipeline/maintain.py`를 TypeScript로 재구현한 것입니다.
- 의사결정 과정(도메인 선정, 기술 스택, Tool 범위, 에이전트 권한, **subprocess 기반
  에이전트로의 전환**)은 [`specs/DECISIONS.md`](specs/DECISIONS.md)에 기록되어 있습니다.
- 지식 도메인 정의는 [`specs/DOMAIN.md`](specs/DOMAIN.md), 요구사항/Agent SPEC은
  [`specs/PRD.md`](specs/PRD.md) 참고.

---

## 9. 향후 계획

- Git 연동을 통한 페이지 버전 관리
- `status: draft → active` 승인 플로우의 UI 통합
- 멀티 워크스페이스(다른 지식 도메인) 지원
