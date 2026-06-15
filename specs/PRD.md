# PRD.md — Product Requirements Document
## LLM Wiki Tool (MCP 기반)

> Version: 1.0 (Week 15 제출)
> Status: MVP 구현 완료

---

## 1. 배경 (Background)

13주차(과제1)에서 Markdown 기반 LLM Wiki의 스키마와 ingest 파이프라인을 구축했다.
15주차(과제2)의 목표는 이 Wiki를 **MCP(Model Context Protocol) 서버**로 노출하여,
AI 에이전트(Claude 등)와 사람이 동일한 Tool 인터페이스로 Wiki를 읽고 쓸 수 있게 하는 것이다.

---

## 2. 목표 (Goals)

| ID | 목표 | 성공 기준 |
|----|------|----------|
| G1 | Wiki 데이터를 MCP Tool로 노출 | `wiki_list/get/search/create/validate` 5종 Tool이 정상 응답 |
| G2 | 3-pane UI로 Wiki 탐색 가능 | 페이지 목록 클릭 → 본문 렌더링 → 인터링크 클릭 이동 |
| G3 | AI 에이전트 패널이 Tool을 호출해 근거 기반 답변, **API Key 미사용** | 응답에 `[[page_id]]` citation + `engine: cli\|fallback` 포함, 서버 코드에 API Key 없음 |
| G4 | 13주차 자산과의 호환성 유지 | 동일 `wiki/pages/*.md` 스키마 (`schema/wiki_schema.md`) |
| G5 | 검증 자동화 | `wiki_validate` 호출 시 깨진 링크 목록 반환, Hook으로 자동 트리거 |
| G6 | raw/ → wiki/ 30분 온보딩 | `raw/`에 파일 1개 → `watch-raw.sh` → draft 페이지 → UI 확인까지 30분 이내 |

### Non-Goals (이번 라운드에서 제외)
- 사용자 인증/권한 시스템 (단일 사용자 가정)
- 페이지 버전 관리(Git 연동)는 16주차로 이연
- 멀티 워크스페이스 지원

---

## 3. 사용자 시나리오 (User Stories)

### US-1: 페이지 탐색
> "사용자로서, 좌측 카테고리별 목록에서 'MCP' 페이지를 클릭하면 중앙에 본문이 보이고,
> 본문 내 `[[hooks]]` 같은 링크를 클릭하면 해당 페이지로 이동하고 싶다."

**Acceptance Criteria**:
- [ ] 좌측 목록은 `wiki_list` Tool 결과로 렌더링됨
- [ ] 본문 내 `[[id]]` 패턴이 클릭 가능한 링크로 변환됨
- [ ] 링크 클릭 시 중앙 패널이 해당 페이지로 갱신됨

### US-2: 자연어 질의
> "사용자로서, 우측 챗봇에 'SDLC란 무엇인가요?'라고 물으면, 챗봇이 관련 Wiki 페이지를
> 찾아 요약하고 출처를 표시해주길 원한다."

**Acceptance Criteria**:
- [ ] 챗봇이 `wiki_search` → `wiki_get` 순으로 Tool을 호출함
- [ ] 응답 끝에 "출처: [[page_id]]" 형식의 citation이 포함됨
- [ ] 관련 페이지가 없으면 "Wiki에 없음"을 명시하고 `wiki_create` 제안

### US-3: 새 페이지 생성
> "에이전트로서, 사용자가 제공한 raw 텍스트를 분석해 적절한 카테고리의 Wiki 페이지를
> 생성하고, 생성 전 검증 결과를 보여주고 싶다."

**Acceptance Criteria**:
- [ ] `wiki_create(mode="create")` 호출 시 frontmatter 자동 생성
- [ ] 생성 직후 `wiki_validate` 자동 실행 (Hook: PostToolUse)
- [ ] UI에 "draft" 상태 배지로 표시 (이미지의 person/draft 배지 참고)

### US-4: 무결성 검증
> "사용자로서, 전체 Wiki에서 깨진 링크나 스키마 오류가 있는 페이지를 한눈에 확인하고 싶다."

**Acceptance Criteria**:
- [ ] `wiki_validate` 호출 시 `{ broken_links: [...], schema_errors: [...] }` 반환
- [ ] UI 상단에 "validate OK" 또는 "N issues found" 배지 표시

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 MCP Server (`tools/`)

| 항목 | 명세 |
|------|------|
| Transport | stdio (Claude Desktop/Code 연동용) + HTTP (웹 UI 연동용) |
| Tool 등록 | `wiki_list`, `wiki_get`, `wiki_search`, `wiki_create`, `wiki_validate` |
| 데이터 소스 | `wiki/pages/*.md` (frontmatter + body), `wiki/people/*.md` |
| 응답 형식 | JSON (Tool result), 페이지 본문은 raw markdown string |

### 4.2 Tool 명세

```typescript
// wiki_list
interface WikiListInput {
  category?: "concept" | "pattern" | "person" | "tool" | "case" | "index";
  tag?: string;
}
interface WikiListOutput {
  pages: { id: string; title: string; type: string; tags: string[]; status: string }[];
}

// wiki_get
interface WikiGetInput { id: string; }
interface WikiGetOutput {
  id: string; frontmatter: Record<string, any>; body: string; // raw markdown
}

// wiki_search
interface WikiSearchInput { query: string; limit?: number; }
interface WikiSearchOutput {
  results: { id: string; title: string; score: number; snippet: string }[];
}

// wiki_create
interface WikiCreateInput {
  raw: string;
  mode: "create" | "update" | "append";
  target_id?: string; // update/append 시 필수
}
interface WikiCreateOutput {
  id: string; path: string; status: "draft" | "active"; validation: ValidationResult;
}

// wiki_validate
interface WikiValidateInput { id?: string; } // 없으면 전체 검사
interface WikiValidateOutput {
  ok: boolean;
  broken_links: { source: string; target: string }[];
  schema_errors: { id: string; field: string; issue: string }[];
}
```

### 4.3 Client (3-pane UI, `client/`)

| 패널 | 데이터 소스 | 주요 기능 |
|------|-----------|----------|
| 좌측: 페이지 리스트 | `wiki_list` | 카테고리별 그룹핑, 검색창(`wiki_search`) |
| 중앙: 본문 뷰어 | `wiki_get` | Markdown 렌더링, `[[id]]` → 링크 변환, frontmatter 배지(type/status/updated) |
| 우측: AI 챗봇 | `wiki_search`+`wiki_get` (Chat Agent) | 대화 히스토리, Tool 호출 로그 표시, citation 렌더링 |

---

## 5. 비기능 요구사항 (Non-Functional)

- **호환성**: 13주차 `wiki/pages/*.md` 파일을 그대로 읽을 수 있어야 함 (frontmatter 필드 동일)
- **성능**: `wiki_search`는 12페이지 규모에서 100ms 이내 응답 (인메모리 인덱스)
- **확장성**: 페이지 추가 시 서버 재시작 없이 반영 (파일 변경 감지 또는 매 요청 시 재로드)

---

## 6. 마일스톤

| 단계 | 내용 | 상태 |
|------|------|------|
| M1 | DOMAIN.md, DECISIONS.md, PRD.md 작성 | ✅ |
| M2 | Wiki 페이지 12종 작성 (기존 5 + 신규 7) | ✅ |
| M3 | MCP 서버 (Tool 5종) 구현 | ✅ |
| M4 | 3-pane UI 구현 | ✅ |
| M5 | README.md + MVP 스크린샷 | ✅ |
| M6 (16주차) | Git 연동, 권한 시스템, 멀티워크스페이스 | ⬜ |

---

## 7. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| MCP 서버-클라이언트 실시간 연결 복잡도 | HTTP 폴링 기반 단순 구현으로 MVP 우선 확보, stdio는 별도 entry point 제공 |
| 챗봇의 Tool 호출 신뢰성 (LLM 미연결 환경) | Tool 호출 로직을 규칙 기반 폴백으로 구현 (13주차 `_builtin_*` 패턴 계승) |
| 12페이지로 그래프 시연 부족 | person/case/pattern 타입을 추가해 다양한 관계 유형 확보 |

---

## 8. Agent SPEC — 역할/권한/허용 기능

> Round 5 결정에 따라 에이전트를 Chat Agent / Edit Agent로 분리한다.
> 본 절은 13주차 `.pool/*.json` 형식을 계승하여 각 에이전트의 역할, 권한, 허용 Tool을 정의한다.
> (이 절은 별도 `AGENT_SPEC.md`로도 분리되어 있었으나, 제출 파일 수 제한(.md 4종)에 맞춰
> PRD.md에 통합했다.)

### 8.1 에이전트 목록

| ID | 역할 | 권한 수준 | 허용 Tool |
|----|------|----------|----------|
| `wiki_chat_agent` | 사용자 질의에 Wiki 기반으로 답변 | Read-Only | `wiki_list`, `wiki_get`, `wiki_search` |
| `wiki_edit_agent` | raw 입력을 Wiki 페이지로 변환/수정 | Read-Write (확인 필요) | `wiki_list`, `wiki_get`, `wiki_search`, `wiki_create`, `wiki_validate` |

### 8.2 wiki_chat_agent

```json
{
  "id": "wiki_chat_agent",
  "role": "사용자의 자연어 질의에 대해 Wiki를 검색하고 출처 기반으로 답변",
  "permissions": {
    "tools": ["wiki_list", "wiki_get", "wiki_search"],
    "file_write": false,
    "file_delete": false
  },
  "system_prompt": "You are the Wiki Chat Agent.\n\nWorkflow:\n1. Receive user query.\n2. Call wiki_search(query) to find candidate pages.\n3. Call wiki_get(id) on top candidates (max 3).\n4. Synthesize an answer in Korean.\n5. Append sources as [[page_id]] citations.\n6. If confidence is low or no pages found, say so explicitly and suggest the user ask the Edit Agent to create a page.\n\nConstraints:\n- NEVER call wiki_create or wiki_validate.\n- NEVER fabricate information not present in retrieved pages.\n- Always cite at least one source if pages were retrieved.",
  "constraints": {
    "max_tool_calls_per_turn": 5,
    "timeout_seconds": 60
  }
}
```

**동작 예시**:
```
User: SDLC란 무엇인가요?
  → wiki_search("SDLC")
  → wiki_get("sdlc-pipeline")
  → 답변: "SDLC(Software Development Life Cycle)는 ... 4단계 생애주기입니다.
           | 단계 | 중심 질문 | 산출물 | ... |
           📍 출처: [[sdlc-pipeline]]"
```

### 8.3 wiki_edit_agent

```json
{
  "id": "wiki_edit_agent",
  "role": "raw 텍스트를 분석해 Wiki 스키마에 맞는 페이지를 생성/수정하고 검증",
  "permissions": {
    "tools": ["wiki_list", "wiki_get", "wiki_search", "wiki_create", "wiki_validate"],
    "file_write": true,
    "file_delete": false
  },
  "system_prompt": "You are the Wiki Edit Agent.\n\nWorkflow:\n1. Receive raw input (text, note, or document excerpt) and target mode (create/update/append).\n2. Call wiki_search to check for existing related pages (avoid duplicates).\n3. Classify the content into a category (concept|pattern|person|tool|case|index).\n4. Draft the page following schema/wiki_schema.md (frontmatter + body structure).\n5. Call wiki_create(raw, mode, target_id?) — this writes status: draft.\n6. Call wiki_validate(id) to check for broken links / schema issues.\n7. Report validation result to the user. Page remains 'draft' until user confirms promotion to 'active'.\n\nConstraints:\n- NEVER delete pages (status: deprecated instead, per harness/AGENTS.md).\n- NEVER set status to 'active' directly — only 'draft'. Promotion requires explicit user approval.\n- If wiki_validate reports broken_links, list them and suggest fixes before finishing.\n- NEVER call any LLM API directly with an API key. All LLM calls go through local CLI subprocess (see harness/RULES.md R1).",
  "constraints": {
    "max_tool_calls_per_turn": 8,
    "timeout_seconds": 120,
    "requires_user_confirmation_for": ["status: active promotion"]
  }
}
```

**동작 예시**:
```
User: "Spec-Driven Development에 대한 메모를 Wiki 페이지로 만들어줘: <raw text>"
  → wiki_search("Spec-Driven Development")  // 중복 확인
  → (없음 확인)
  → wiki_create(raw=..., mode="create")
       → status: draft, id: spec-driven-development
  → wiki_validate(id="spec-driven-development")
       → { ok: true, broken_links: [], schema_errors: [] }
  → 응답: "spec-driven-development.md (draft) 생성 완료, 검증 통과.
           'active'로 전환하려면 승인해주세요."
```

### 8.4 Hook 연동 (13주차 AGENTS.md 계승)

| Hook 이벤트 | 동작 | 담당 |
|------------|------|------|
| `PostToolUse` (after `wiki_create`) | 자동으로 `wiki_validate(id)` 호출 | wiki_edit_agent / `harness/hooks/post-tool-use-validate.sh` |
| `UserPromptSubmit` / agent-mode | `wiki_search`로 기존 페이지 존재 여부 사전 확인 후 컨텍스트 구성 | wiki_chat_agent / `harness/hooks/watch-raw.sh --agent-mode` |
| `SessionStart` / Loop | `raw/` 폴더 감시 → ingest | `harness/hooks/watch-raw.sh --loop` |
| `Stop` | `harness/journal.md`에 작업 요약 append | 양 에이전트 공통 |

### 8.5 권한 매트릭스

| Tool | wiki_chat_agent | wiki_edit_agent |
|------|:---:|:---:|
| `wiki_list` | ✅ | ✅ |
| `wiki_get` | ✅ | ✅ |
| `wiki_search` | ✅ | ✅ |
| `wiki_create` | ❌ | ✅ (draft only) |
| `wiki_validate` | ❌ | ✅ |
| 파일 삭제 | ❌ | ❌ (deprecated 처리만) |
| `status: active` 전환 | ❌ | ❌ (사용자 승인 필요) |
| LLM API Key 직접 호출 | ❌ | ❌ (RULES.md R1, subprocess만 허용) |

