---
id: subprocess-calling
title: Subprocess Calling (CLI 에이전트 호출)
type: tool
category: tool
tags: [subprocess, cli, claude-code, codex, gemini-cli]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [agent-pool, mcp, agentic-coding]
---

## 개요
Subprocess Calling은 Claude Code, Codex CLI, Gemini CLI 등의 에이전트 CLI를 **자식 프로세스로
호출**하여, 여러 에이전트를 조합한 시스템을 구축하는 방식이다. [[agent-pool]]의 각 에이전트가
실제로 실행되는 메커니즘이다.

## 상세 설명

### 기본 호출 형태

```bash
claude --print --no-stream --system-prompt "<role prompt>" "<user input>"
codex --dangerously-bypass-approvals-and-sandbox "<prompt>"
gemini --model gemini-2.5-pro --system "<role prompt>" --prompt "<user input>"
```

`--print`/`--no-stream` 옵션은 대화형 UI 없이 결과를 표준출력으로 받아 다음 단계 입력으로
넘기기 위함이다.

### CLI별 권한 모드 (YOLO Mode)

| CLI | 무제한 권한 플래그 |
|-----|------------------|
| Claude | `claude --dangerously-skip-permissions` |
| Gemini | `gemini --yolo` |
| Codex | `codex --dangerously-bypass-approvals-and-sandbox` |

권한 수준이 높으면 사용자가 완전한 제어권을 잃는다 — "멈춰야 할 순간에 멈추지 않는" 문제가
대표적이다. 예를 들어 테스트 검증 과정에서 장시간 복잡한 테스트 코드를 작성·실행한 뒤,
사용자 의도와 무관하게 산출물과 테스트 코드를 복구 불가능하게 삭제하는 사례가 보고되었다.

### Heavy User 패턴: 멀티 CLI 조합

Claude와 Codex를 동시에 사용하는 경우, Claude의 Skill에 "Codex = Implementation 담당"을,
Codex의 Skill에 "Claude = Review 담당"을 등록하는 것으로 CLI 레벨에서 간단한 에이전틱
코딩 체계를 구성할 수 있다.

```
Claude (Reviewer Role)  ←──Review.md──  Codex (Implementer Role)
       │                                        ▲
       └──────────── Plan.md ───────────────────┘
```

### Sandbox 요구사항 (Codex)

Codex CLI 호출 시 프로젝트가 Sandbox로 감싸여 있어야 한다. 작업 디렉토리에서
`git init`을 먼저 수행해야 Codex가 정상 동작한다.

## Subprocess Calling vs MCP

| 항목 | Subprocess Calling | [[mcp]] |
|------|-------------------|---------|
| 통신 방식 | stdin/stdout, 텍스트 | 표준화된 JSON-RPC (`tools/list`, `tools/call`) |
| 발견 가능성 | 호출자가 CLI 사양을 알아야 함 | Tool 스펙을 동적으로 조회 가능 |
| 적합한 용도 | 에이전트 간 협업(Plan↔Review) | 에이전트↔외부 시스템(DB, API, Wiki) |

본 프로젝트의 [[agent-pool]]은 에이전트 간 협업에는 Subprocess Calling을, Wiki 데이터
접근에는 MCP를 사용하는 하이브리드 구조다.

## 관련 개념
- [[agent-pool]] — Subprocess Calling으로 호출되는 에이전트들의 정의 저장소
- [[mcp]] — Subprocess Calling과 보완적으로 사용되는 표준 프로토콜
- [[agentic-coding]] — Subprocess Calling이 구현 메커니즘으로 쓰이는 상위 패러다임
