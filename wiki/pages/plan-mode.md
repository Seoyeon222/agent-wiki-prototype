---
id: plan-mode
title: Plan Mode
type: concept
category: concept
tags: [plan-mode, read-only, agentic-coding, claude]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [agentic-coding, vibe-coding, agent-pool, harness]
---

## 개요
Plan Mode는 Agent CLI에서 **계획만 세우고 코드는 건드리지 않는 모드**다. 진입 시 read-only
도구만 활성화되며, 산출물은 마크다운 파일로 저장된다. 사용자가 계획을 검토·승인하면
구현 모드로 전환한다.

## 상세 설명

### 동작 방식

| 항목 | Plan Mode | Implementation Mode |
|------|-----------|---------------------|
| 파일 읽기/검색/웹 조회 | ✅ 가능 | ✅ 가능 |
| 파일 수정/생성/삭제 | ❌ 차단 | ✅ 가능 |
| 명령 실행 | ❌ 차단 | ✅ 가능 (권한 설정에 따라) |
| 산출물 | 마크다운 (Plan, TODO) | 실제 코드/파일 변경 |

Plan Mode의 산출물은 "Memory space"에 저장되어, 이후 [[agent-pool]]의 다른 에이전트나
Implementation Mode 에이전트의 입력으로 재사용된다.

### Plan Mode의 함정: 과도한 토큰 사용

이상적인 Plan Mode는 상세한 계획을 시각적으로 보여주려 하지만, 이를 위해 토큰을 과도하게
소비해 비효율적일 수 있다. 예를 들어 Python 기반 프로토타입을 요청하면 Tkinter로 구현을
시도하는 경향이 있는데(추가 라이브러리 불필요, Fault 확률 낮음, 단 성능 이슈), 이런 "안전한
선택"을 보여주기 위한 부가 설명이 길어질 수 있다.

### Plan Mode 파이프라인 설계 패턴

1. **Task 1**: AI와 논의해 Plan Mode 구조와 산출물 파악, Excalidraw 등으로 파이프라인 구조를
   러프하게 정의
2. **Task 2**: 파이프라인 구조 이미지 + API 문서를 CLI에 전달 → "재사용 가능한 구조화 문서"를
   마크다운으로 저장
3. **Task 3**: 각 Round/Agent마다 작업 내용을 기록하는 Handoff 파일 저장 구조로 개선
   (예: `workspace/00_planning.md`, `01_review.md`, ...)

이 패턴은 본 프로젝트의 `specs/DECISIONS.md`(Round별 의사결정 기록)에도 동일하게 적용되었다.

## Plan Mode와 SDLC

Plan Mode는 [[sdlc-pipeline]]의 **Planning + Analysis** 단계에 대응한다. Plan Mode의 산출물
(Plan.md, TODO.md)이 [[spec-driven-development]]의 "명세(Spec)" 입력이 되고, 사용자 승인 후
Implementation Mode로 전환되는 흐름이 "합의(Agreement) → 생성(Generation)"에 해당한다.

## 관련 개념
- [[agentic-coding]] — Plan Mode를 포함하는 상위 워크플로우
- [[agent-pool]] — Plan Mode 산출물을 활용하는 Planner/Reviewer 에이전트
- [[harness]] — Plan Mode의 산출물이 저장되는 "Journal/Procedure" 구조
