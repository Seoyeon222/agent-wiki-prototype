---
id: harness
title: Harness Engineering (하네스 엔지니어링)
type: concept
category: concept
tags: [harness, agent, contract, procedure, journal]
created: 2025-05-28
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [hooks, agent-pool, mcp, plan-mode, spec-driven-development]
---

## 개요
하네스 엔지니어링은 AI 에이전트가 복잡한 작업을 안전하고 효율적으로 완수하도록, 프롬프트나 모델을 넘어선 **외부 실행 환경**(도구, 데이터, 검증 파이프라인, 안전장치)을 구조적으로 설계하고 통제하는 기술이다.

## 상세 설명

단순히 프롬프트를 잘 작성하는 것과 달리, 하네스 엔지니어링은 작업의 목표·절차·기록·선호를 **분리하여 관리**한다.

### 4가지 책임 분리

| 책임 | 핵심 질문 | 파일 예시 |
|------|---------|----------|
| **Contract** | 무엇이 끝났는가? | `TASK.md` |
| **Procedure** | 어떻게 진행하는가? | `Skill (파이프라인 스크립트)` |
| **Journal** | 지금까지 무엇을 했는가? | `journal.md` 또는 MCP |
| **Preference** | 어떤 방식으로 일하는가? | `AGENTS.md`, `CLAUDE.md` |

> **핵심 원칙**: Contract가 없는 Procedure는 무한 루프이고, Procedure가 없는 Contract는 죽은 문서다.

### Ralph 루프 (랄프 루프)

하네스의 대표적인 자동화 패턴:

```
Phase 1: Jobs To Be Done
  → AI와 사람이 대화하며 /spec 폴더에 명세서 작성

Phase 2: AI가 기존 구현체와 명세서를 비교해 Plan 수립

while not done:
  Phase 3: AI가 Plan 체크리스트 항목 1개에 대해
    → 작업 → 검증 → 계획 업데이트 → 커밋 → 종료
    (한 작업 완료 시 새 에이전트가 다음 항목 처리)
```

달성 조건과 최대 작업 상한이 명시적으로 설정되어야 한다.

### AGENTS.md 구조 예시

```markdown
# AGENTS.md
> 매 세션 시작 시 이 파일과 journal.md를 먼저 읽어라.

## 0. 파일 구조
- specs/   — 요구사항 명세
- TASK.md  — 작업 체크리스트
- journal.md — append-only 이력

## 1. 세션 시작 프로토콜
1. AGENTS.md 읽기
2. TASK.md에서 TODO 확인
3. journal.md에서 마지막 상태 확인
...
```

## 하네스 vs 단순 프롬프팅

| 항목 | 단순 프롬프팅 | 하네스 엔지니어링 |
|------|-------------|----------------|
| 종료 조건 | 불명확 | TASK.md로 명확화 |
| 이력 관리 | 없음 | journal.md |
| 세션 간 기억 | 없음 | 파일 기반 상태 유지 |
| 재사용성 | 낮음 | Skill로 구조화 |

## 관련 개념
- [[hooks]] — 하네스의 자동화 트리거 메커니즘
- [[agent-pool]] — 여러 에이전트를 하네스로 관리하는 패턴
- [[mcp]] — 하네스의 외부 시스템 연결 표준
