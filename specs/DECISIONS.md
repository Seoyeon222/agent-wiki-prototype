# DECISIONS.md — Wiki Tool 설계 의사결정 라운드

> 13주차 `journal.md`의 append-only 원칙을 계승하되, 15주차는 별도 파일로 분리하여
> "MCP 서버 설계"에 특화된 의사결정 과정을 기록한다. 각 라운드는 (질문 → 검토한 대안 →
> 결정 → 근거) 형식을 따른다.

---

## Round 1 — 지식 도메인 선정

**질문**: 어떤 지식 도메인을 Wiki로 구축할 것인가?

**검토한 대안**:

| 대안 | 장점 | 단점 |
|------|------|------|
| A. 본 강의(CSE3308) 자료 그대로 서빙 | 자료 확보 용이 | 가이드상 평가 리스크 ("본 강의 주제로 서빙시 평가 빡빡") |
| B. 13주차 5개 페이지 그대로 확장 | 재사용성 높음 | 페이지 수가 적어 그래프/검색 기능 시연 부족 |
| C. Agentic Coding & LLM Workflow 도메인 재구성 | 실세계 자료(블로그/X/Gist) 기반, 인물(person) 타입 추가로 그래프 다양성 확보 | 1차 자료 조사 필요 |

**결정**: **C 선택**

**근거**:
- 이미지 참조 자료(Andrej Karpathy 페이지)가 "본 위키의 기반 패턴 제안자"를 다루는 person 페이지였고,
  이런 인물-개념-패턴 간 다층 그래프가 MCP `wiki.search`/traverse 기능을 시연하기에 적합하다고 판단.
- 13주차 페이지(mcp, hooks, harness, loop, agent-pool)는 그대로 재사용하고, person/case/pattern
  타입을 추가해 총 12페이지로 확장 → B의 장점도 흡수.
- 강의 슬라이드 자체를 페이지로 만들지 않고, 슬라이드가 다루는 **개념의 실세계 출처**(Karpathy의
  vibe coding 트윗, MCP 공식 스펙 등)를 인용하는 방식으로 평가 리스크 회피.

---

## Round 2 — MCP 서버 구현 스택

**질문**: MCP 서버를 어떤 언어/SDK로 구현할 것인가?

**검토한 대안**:

| 대안 | 장점 | 단점 |
|------|------|------|
| A. Python + FastMCP | 13주차 파이프라인(Python)과 동일 스택, 강의 예시(agentmemo)와 동일 | 웹 UI(3-pane)와 별도 프로세스 필요 |
| B. Node.js + TypeScript SDK (`@modelcontextprotocol/sdk`) | 3-pane 웹 UI(React/Vite)와 동일 런타임 생태계, 타입 안전성 | 13주차 Python 파이프라인과 언어 분리 |

**결정**: **B 선택 (Node.js + TypeScript)**

**근거**:
- 3-pane UI를 웹으로 구현하기로 결정(Round 3)했으므로, 서버-클라이언트를 동일 언어(TS)로
  구성하면 타입 정의(Wiki Page Schema)를 `shared/types.ts`로 공유할 수 있어 일관성이 높음.
- MCP TypeScript SDK는 stdio transport와 HTTP transport를 모두 지원해, Claude Desktop/Code 같은
  Host와의 연결과 웹 UI에서의 호출을 동시에 만족.
- 13주차 Python 파이프라인(`pipeline/ingest.py` 등)은 "오프라인 배치 처리용 보조 도구"로 유지하고,
  MCP 서버는 "실시간 Tool Call 인터페이스"로 역할을 분리 — 둘은 동일한 `wiki/pages/*.md` 파일을
  공유하므로 충돌 없음.

---

## Round 3 — Wiki 시각화 방식

**질문**: Wiki Pages를 어떻게 시각화할 것인가?

**검토한 대안**:

| 대안 | 장점 | 단점 |
|------|------|------|
| A. 3-pane 웹 UI (페이지 목록 + 본문 + AI 챗봇) | 참조 이미지와 동일한 UX, "내가 이 도구를 어떻게 쓸지" 직관적으로 보여줌 | 프론트엔드 구현 비용 ↑ |
| B. 정적 HTML (페이지 목록 + 본문만) | 구현 단순 | AI 챗봇(Tool 활용 시연) 누락 |
| C. CLI 중심 | MCP 서버/도구 자체에 집중 | MVP 이미지 산출물 확보 어려움 |

**결정**: **A 선택 (3-pane 웹 UI)**

**근거**:
- 과제 요구사항에 "MVP GUI를 캡처한 PNG/PDF"가 명시되어 있어, 시각적 결과물이 필요.
- 우측 AI 챗봇 패널이 **MCP Tool ↔ Agent 연동을 실시간으로 시연**하는 핵심 장치 —
  사용자가 질문하면 챗봇이 `wiki.search` → `wiki.get` Tool을 호출하고, 응답에 인용([[page_id]])을
  포함하는 과정을 화면에서 직접 확인 가능.
- 좌측 페이지 리스트는 `wiki.list` Tool 결과를 그대로 렌더링 → "Tool 결과 = UI 데이터"라는
  단순한 아키텍처로 별도 백엔드 상태 관리 불필요.

---

## Round 4 — Wiki Tool 기능 범위 (Tool 5종 확정)

**질문**: MCP 서버가 노출할 Tool을 몇 개, 어떤 기능으로 구성할 것인가?

**검토한 대안**:
- 강의(Week 11) 예시는 `memo.create/get/list/update/append` 5종.
- AgentMEMO 패턴을 참고하되, Wiki 도메인 특성(인터링크, 검증)을 반영해야 함.

**결정**: 다음 5개 Tool로 확정

| Tool | 기능 | 강의 매핑 |
|------|------|----------|
| `wiki_list` | 카테고리/태그별 페이지 목록 조회 | memo.list |
| `wiki_get` | 단일 페이지 전체 내용(frontmatter+본문) 조회 | memo.get |
| `wiki_search` | 키워드 기반 페이지 검색 (제목/태그/본문) | memo.list + grep |
| `wiki_create` | raw 텍스트 → 새 페이지 생성 (13주차 ingest 로직 재사용) | memo.create |
| `wiki_validate` | 깨진 링크/스키마 위반 검사 | (신규, harness의 "검증" 단계 반영) |

**근거**:
- `update`/`append`는 `wiki_create`에 `mode: "create"|"update"|"append"` 파라미터로 통합 —
  Tool 수를 줄여 Context Explosion(Week 11에서 언급된 MCP의 단점) 완화.
- `wiki_validate`는 13주차 `maintain.py --check-links`를 MCP Tool로 승격한 것으로,
  "Hook의 PostToolUse/Stop 이벤트에서 자동 호출"되도록 설계(SPEC.md 참고).

---

## Round 5 — 에이전트 역할 분리

**질문**: "Wiki 편집"과 "Wiki 챗봇" 기능을 하나의 에이전트가 담당할지, 분리할지?

**검토한 대안**:

| 대안 | 장점 | 단점 |
|------|------|------|
| A. 단일 에이전트 (모든 Tool 접근) | 구현 단순 | 쓰기 권한 오용 위험, 권한 경계 불명확 |
| B. Edit Agent / Chat Agent 분리 | 권한 최소화(Principle of Least Privilege), Harness의 "Constraint" 원칙과 일치 | 에이전트 풀(.pool) 관리 항목 증가 |

**결정**: **B 선택**

**근거**:
- 13주차 `AGENTS.md`의 원칙("불확실성 보고", "단계적 커밋")을 따르면, 사용자가 챗봇에게
  질문만 했는데 페이지가 멋대로 수정되는 상황은 방지해야 함.
- `Wiki Chat Agent`는 `wiki_list`, `wiki_get`, `wiki_search`만 호출 가능 (읽기 전용).
- `Wiki Edit Agent`는 `wiki_create`, `wiki_validate`까지 호출 가능하되, 실제 파일 쓰기 전
  사용자 확인 단계를 거침 (이미지의 "validate OK" 배지처럼 검증 결과를 먼저 노출).
- 상세 권한 정의는 `specs/PRD.md` §8(Agent SPEC)에 기술.

---

## Round 6 — (개정) 챗봇 구현 방식: API Key 직접 호출 금지 → Subprocess + 메시지 큐

**질문**: Wiki Chat/Edit Agent의 "LLM 연동"을 어떻게 구현할 것인가?

**검토한 대안**:

| 대안 | 장점 | 단점 |
|------|------|------|
| A. 서버 코드에 Anthropic/OpenAI API Key를 직접 넣어 호출 | 구현 단순 | 과제 공지에서 명시적으로 금지 (개인 API Key 노출/과금 위험) |
| B. 로컬 CLI(`claude`/`codex`/`gemini`)를 subprocess로 호출 + 파일 큐(inbox/outbox)로 비동기 처리 | API Key 노출 없음, 사용자가 이미 로그인된 CLI 재사용, Hook/Loop와 동일한 패턴(9주차) | CLI 미설치 환경에서는 폴백 필요 |

**결정**: **B 선택**

**근거**:
- 과제 공지 "Subprocess를 이용하거나 Loop, 메시지 인식 Shell 스크립트를 작성하여 감지하도록"
  요구사항을 직접 충족.
- `harness/hooks/watch-raw.sh --agent-mode`가 `tools/queue/inbox/*.json`을 감시하다가
  `claude --print` subprocess를 실행하고 결과를 `outbox/*.json`에 쓰는 구조 — Week 9(Loop/Hook)
  패턴을 챗봇에도 동일하게 적용한 것.
- CLI가 없는 환경에서는 `wikiStore.search` 기반 규칙 응답으로 자동 폴백하며, 응답에
  `engine: "fallback"`을 명시해 사용자가 차이를 인지할 수 있도록 함.


---

## 요약: Round별 결정 사항

| Round | 결정 |
|-------|------|
| 1 | 도메인 = Agentic Coding & LLM Workflow (12 pages, person 타입 추가) |
| 2 | MCP 서버 = Node.js + TypeScript SDK |
| 3 | 시각화 = 3-pane 웹 UI (목록/본문/챗봇) |
| 4 | Tool 5종 = list/get/search/create/validate |
| 5 | 에이전트 = Chat(읽기전용) / Edit(쓰기, 확인필요) 분리 |
