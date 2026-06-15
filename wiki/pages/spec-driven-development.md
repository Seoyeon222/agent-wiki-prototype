---
id: spec-driven-development
title: Spec-Driven Development (SDD)
type: concept
category: concept
tags: [sdd, spec, agentic-coding, validation]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [agentic-coding, vibe-coding, sdlc-pipeline, andrej-karpathy]
---

## 개요
Spec-Driven Development(SDD)는 [[vibe-coding]]의 "일단 만든다 → 결과 확인 → 분석 → 수정" 루프를
**"명세 → 합의 → 생성 → 검증"** 루프로 대체하는 개발 방법론이다. [[agentic-coding]]을 더
형식화한 접근으로 볼 수 있다.

## 상세 설명

### 두 루프의 비교

| 단계 | Vibe Coding 루프 | SDD 루프 |
|------|-----------------|---------|
| 1 | 일단 만든다 | **명세(Spec)** 작성 |
| 2 | 결과 확인 | **합의(Agreement)** — 사용자/에이전트 간 명세 검토 |
| 3 | 분석 | **생성(Generation)** — 명세 기반 코드 생성 |
| 4 | 수정 | **검증(Validation)** — 명세 대비 결과물 검증 |

핵심 차이는 "코드를 먼저 만들고 사후에 이해하는" 방식에서
"먼저 합의된 명세를 만들고 그에 따라 생성·검증하는" 방식으로의 전환이다.

### 명세(Spec)의 형태

SDD에서 명세는 보통 `specs/` 디렉토리에 마크다운으로 저장된다:

```
specs/
├── DOMAIN.md      ← 무엇을 만들 것인가 (범위)
├── PRD.md         ← 왜 만드는가, 사용자 스토리
└── PRD.md (§8 Agent SPEC)  ← 누가(어떤 에이전트가) 만드는가, 권한
```

이는 [[harness]]에서 정의한 "Contract" 책임에 해당하며, `TASK.md`(체크리스트)와 함께
에이전트의 작업 종료 조건을 명확히 한다.

### 검증(Validation) 단계의 자동화

SDD의 마지막 단계인 "검증"은 [[hooks]]의 `PostToolUse`/`Stop` 이벤트와 결합해 자동화할 수 있다.
예를 들어 코드 생성 직후 자동으로 테스트를 실행하거나, Wiki 페이지 생성 직후 `wiki_validate`를
호출하는 것이 이에 해당한다.

## 왜 SDD가 중요한가

이해관계자 간 논의와 체계적인 요구사항 없이는 사용자가 원하는 결과를 만들 수 없다.
이는 단순한 도구부터 복잡한 정보 시스템(예: 대규모 등록 시스템)까지 모두 동일하게 적용되는
원칙이다. SDLC의 4단계([[sdlc-pipeline]]) 중 "Analysis"와 "Design" 단계를 LLM 워크플로우
안으로 끌어들인 것이 SDD의 본질이다.

## 관련 개념
- [[agentic-coding]] — SDD가 형식화하는 상위 패러다임
- [[vibe-coding]] — SDD가 대체하고자 하는 이전 루프
- [[sdlc-pipeline]] — SDD의 4단계가 매핑되는 전통적 생애주기 모델
- [[andrej-karpathy]] — SDD/LLM Wiki 패턴의 제안과 연관된 인물
