---
id: agentic-coding
title: Agentic Coding
type: concept
category: concept
tags: [agentic-coding, agent, sdlc, pipeline]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [vibe-coding, spec-driven-development, agent-pool, plan-mode, hooks]
---

## 개요
Agentic Coding은 [[vibe-coding]]의 "비체계적 개발" 한계를 극복하기 위해 등장한 패러다임으로,
단일 AI 도구가 아닌 **여러 에이전트가 역할을 나누어 협업하는 시스템**으로 개발 프로세스를
재구성한다.

## 상세 설명

### 핵심 전환: 단일 도구 → 하나의 시스템

기존 바이브 코딩은 "하나의 채팅창에 모든 요청을 던지는" 구조였다. Agentic Coding은 이를
파이프라인으로 분해한다:

```
Input Prompt → [Agent 1: Analysis/Decomposition/Planning]
             → [Agent 2: Review]
             → [Agent 1: Plan Rewrite]
             → TODO / Outputs
```

각 단계의 산출물은 마크다운 파일(`Plan.md`, `Review.md` 등)로 저장되어, 다음 에이전트의
입력이 된다. 이는 [[harness]]의 "Procedure"와 "Journal" 개념과 직결된다.

### 권한(Permission)과 모드의 두 축

Agentic Coding Interface는 두 축으로 설명된다:

1. **Agent의 권한 수준**: `--dangerously-skip-permissions`(YOLO) ~ 매 명령 승인
2. **Plan vs Implementation 모드**: [[plan-mode]]에서는 읽기 전용, 승인 후 구현 모드로 전환

권한이 높을수록 속도는 빠르지만, 사용자가 멈춰야 할 순간에 멈추지 않는 위험이 있다
(예: 테스트 산출물과 테스트 코드가 사용자 의도와 무관하게 삭제되는 사례).

### 시스템 요청 분해 예시 (레스토랑 비유)

```
Project Sponsor (You)
  → Business Need
  → Business Requirements
  → Business Value
  → Special Issues or Constraints
```

이 분해 과정 자체를 에이전트가 마크다운으로 기록하도록 요청하는 것이
Agentic Coding의 전형적인 워크플로우다.

## Agentic Coding의 구성 요소

| 구성 요소 | 역할 | 관련 페이지 |
|----------|------|-----------|
| Plan Mode | 계획만 수립, 파일 미변경 | [[plan-mode]] |
| Agent Pool | 역할별 에이전트를 JSON으로 관리 | [[agent-pool]] |
| Hooks | 생애주기 이벤트에 자동화 연결 | [[hooks]] |
| Spec-Driven Development | 명세 → 합의 → 생성 → 검증 루프 | [[spec-driven-development]] |
| Subprocess Calling | 여러 CLI 에이전트를 자식 프로세스로 호출 | [[subprocess-calling]] |

## 관련 개념
- [[vibe-coding]] — Agentic Coding이 보완하고자 하는 이전 패러다임
- [[spec-driven-development]] — Agentic Coding을 더 형식화한 방법론
- [[agent-pool]] — Agentic Coding의 멀티 에이전트 관리 패턴
- [[plan-mode]] — Agentic Coding의 계획 단계
- [[hooks]] — Agentic Coding 파이프라인의 자동화 트리거
