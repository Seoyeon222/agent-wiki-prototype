---
id: sdlc-pipeline
title: SDLC (Software Development Life Cycle)
type: concept
category: concept
tags: [sdlc, requirements, design, planning]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [spec-driven-development, agentic-coding, vibe-coding]
---

## 개요
SDLC(Software Development Life Cycle)는 소프트웨어를 만드는 표준 **4단계 생애주기**다.
AI 코딩 시대에도 이 4단계는 사라지지 않으며, [[spec-driven-development]]의 "명세-합의-생성-검증"
루프가 SDLC의 각 단계를 LLM 워크플로우 안으로 구조화한 것으로 볼 수 있다.

## 상세 설명

### SDLC 4단계

| 단계 | 중심 질문 | 산출물 |
|------|----------|--------|
| **Planning** | 무엇을 왜 만드는가 | 시스템 요청, 타당성 분석 |
| **Analysis** | 무엇이 필요한가 | 요구사항 수집 & 분석 모델 (Use Case, ERD, DFD) |
| **Design** | 어떻게 만드는가 | 아키텍처, 인터페이스, DB 설계 |
| **Implementation** | 실제로 만든다 | 코딩, 테스트, 배포 |

### 왜 중요한가

이해관계자의 논의와 체계적 요구사항 없이는 사용자가 원하는 결과를 만들 수 없다.
단순 도구부터 복잡한 정보 시스템(예: 지하철 스크린도어 제어 시스템)까지 모두 마찬가지다.

AI-Assisted Coding 시대에 [[vibe-coding]]이 보여준 문제는 결국 **Analysis와 Design 단계를
생략한 채 Implementation으로 직행**한 데서 비롯된다. [[agentic-coding]]/[[spec-driven-development]]는
이 두 단계를 다시 LLM 워크플로우 안에 복원하려는 시도다.

### LLM 워크플로우와 SDLC 단계 매핑

```
Planning        → 사용자와의 초기 대화, "Jobs To Be Done"
Analysis        → specs/DOMAIN.md, PRD.md (User Story, Acceptance Criteria)
Design          → specs/PRD.md §8 (Agent SPEC), Tool/API 설계
Implementation  → 에이전트가 코드/Wiki 페이지 생성 + 검증(wiki_validate)
```

### System Analysis의 역할

시스템 분석가는 다음을 수행한다:
- 사용자/운영/비즈니스가 원하는 목표 도출
- 시스템의 범위(안/밖), 제약(시간/비용/규정/성능) 명확화
- 요구사항을 모델/명세로 변환해 검증 가능하게 만듦
- 제약 내에서의 선택(우선순위/리스크/대안) 설계

이 역할은 AI 에이전트 시대에도 사라지지 않으며, 오히려 **에이전트에게 명세를 제공하는
역할(Project Sponsor/시스템 설계자)**로 사람의 책임이 이동한다.

## 관련 개념
- [[spec-driven-development]] — SDLC의 Analysis/Design 단계를 명세 기반으로 재구성한 방법론
- [[agentic-coding]] — SDLC 각 단계를 에이전트 파이프라인으로 매핑하는 패러다임
- [[vibe-coding]] — Analysis/Design 단계가 생략된 비체계적 개발의 예시
