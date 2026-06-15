# DOMAIN.md — Wiki 지식 도메인 정의

> 본 문서는 LLM Wiki Tool(과제2)이 다루는 지식 도메인의 범위와 구조를 정의한다.

---

## 1. 도메인 선정 배경

13주차(과제1)에서 구축한 LLM Wiki Prototype은 "에이전틱 코딩 강의 자료(Agentic Coding Basics)"의
핵심 개념(MCP, Hook, Harness, Loop, Agent Pool)을 다뤘다.

15주차(과제2)에서는 이 범위를 확장하여, **"Agentic Coding & LLM Workflow"** 라는 하나의
지식 도메인으로 통합한다. 이는 강의 자체를 그대로 서빙하는 것이 아니라,
**강의에서 다루는 실세계 개념·용어·인물·사례**를 독립적인 지식 베이스로 재구성한 것이다.

> 참고: 강의 슬라이드를 그대로 위키 페이지화하면 "본 강의 주제로 Wiki Pages를 서빙"하는 것이
> 되어 평가가 빡빡해질 수 있다는 가이드에 따라, **2024~2026년 AI 업계에서 실제로 통용되는
> 개념/용어/인물**을 1차 자료(블로그, 논문, 강연)에 기반해 재정리하는 방향으로 설계했다.

---

## 2. 도메인 범위: Agentic Coding & LLM Workflow

AI 코딩 에이전트(Claude Code, Codex CLI, Gemini CLI 등)를 활용한 소프트웨어 개발 방법론과
그 진화 과정을 다루는 지식 베이스.

### 2.1 페이지 카테고리 (Category)

| 카테고리 | 설명 | 페이지 타입 |
|---------|------|-----------|
| **Concepts** | 핵심 개념/용어 | `concept` |
| **Patterns** | 재사용 가능한 워크플로우 패턴 | `pattern` |
| **People** | 관련 인물 (제안자/연구자) | `person` |
| **Tools** | CLI/SDK/프로토콜 도구 | `tool` |
| **Cases** | 실패/성공 사례 | `case` |
| **Index** | 카테고리/전체 인덱스 | `index` |

### 2.2 페이지 목록 (1차 구축 — 12 pages)

| ID | 제목 | 카테고리 | 비고 |
|----|------|---------|------|
| `vibe-coding` | Vibe Coding | concept | 2024년 등장 용어 |
| `agentic-coding` | Agentic Coding | concept | Vibe Coding의 후속 패러다임 |
| `spec-driven-development` | Spec-Driven Development (SDD) | concept | 명세 기반 개발 |
| `sdlc-pipeline` | SDLC (Software Development Life Cycle) | concept | 4단계 생애주기 |
| `mcp` | Model Context Protocol | tool | "AI용 USB" |
| `hooks` | Hooks (Agent Lifecycle Hooks) | concept | 자동화 트리거 |
| `loop` | Loop (Automation Loop) | pattern | 반복 자동화 |
| `harness-engineering` | Harness Engineering | concept | Contract/Procedure/Journal/Preference |
| `agent-pool` | Agent Pool & Orchestrator | pattern | 멀티 에이전트 관리 |
| `plan-mode` | Plan Mode | concept | 읽기 전용 계획 모드 |
| `subprocess-calling` | Subprocess Calling (CLI 에이전트 호출) | tool | Claude/Codex/Gemini CLI |
| `andrej-karpathy` | Andrej Karpathy | person | Vibe Coding 명명자 |

### 2.3 인터링크 그래프 (요약)

```
vibe-coding ──evolved_into──> agentic-coding ──formalized_by──> spec-driven-development
     │                              │
     │                              ├──uses──> agent-pool ──relies_on──> subprocess-calling
     │                              ├──uses──> plan-mode
     │                              └──automated_by──> hooks ──enables──> loop
     │
     └──coined_by──> andrej-karpathy

spec-driven-development ──structures──> sdlc-pipeline
mcp ──connects──> agent-pool (Tool Layer)
harness-engineering ──governs──> agent-pool, hooks, loop
```

---

## 3. Wiki Tool이 제공해야 하는 기능 (요구사항 도출)

이 도메인을 실제로 활용하려면 다음 기능이 필요하다고 판단했다:

1. **조회(Read)**: 페이지 ID/제목/태그로 검색, 카테고리별 목록
2. **생성/수정(Write)**: raw 텍스트를 넣으면 페이지 생성, 기존 페이지 갱신
3. **관계 탐색(Traverse)**: 페이지 간 `related` 링크를 따라 그래프 탐색
4. **검증(Validate)**: 깨진 링크, 스키마 위반 페이지 점검
5. **대화형 질의(Chat)**: 자연어 질문 → 관련 페이지 검색 → 근거 기반 답변 + 출처(citation)

이 5개 기능이 MCP Tool 5종(`wiki.list`, `wiki.get`, `wiki.search`, `wiki.create`, `wiki.validate`)과
1:1로 매핑되며, 5번째 기능은 Wiki Chat Agent가 위 Tool들을 조합해 수행한다.

---

## 4. 13주차 → 15주차 변경 사항

| 항목 | 13주차 | 15주차 |
|------|--------|--------|
| 저장소 형태 | 파일 시스템 (.md) | 파일 시스템 (.md) + SQLite 인덱스 캐시 |
| 접근 방식 | Python CLI 스크립트 | MCP 서버 (Node.js/TS) + Tool Call |
| 시각화 | 없음 (텍스트 출력) | 3-pane 웹 UI |
| 페이지 수 | 5개 (강의 개념만) | 12개 (개념+인물+사례) |
| 에이전트 역할 | wiki_writer / reviewer / query | Wiki Edit Agent / Wiki Chat Agent |
