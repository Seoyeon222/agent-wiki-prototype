---
id: vibe-coding
title: Vibe Coding
type: concept
category: concept
tags: [vibe-coding, llm, prompt, "2024"]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [agentic-coding, andrej-karpathy, plan-mode]
---

## 개요
Vibe Coding은 자연어로 목표와 제약을 전달하면 LLM이 코드를 작성하게 하는 개발 방식을 가리키는
용어로, 2024년 [[andrej-karpathy]]가 명명했다. "일단 만든다 → 결과 확인 → 분석 → 수정"의
비체계적 루프가 특징이다.

## 상세 설명

### 정의와 확산
2024년 4분기~2025년 1분기 사이 AI 코딩 도구(Cursor, Claude Code, Codex CLI 등)의 보급과 함께
빠르게 확산된 트렌드다. 개발자가 정교한 스펙 문서 없이 "이런 느낌으로 만들어줘"라고 요청하면,
LLM이 결과물을 빠르게 생성하고 사용자는 결과를 보면서 점진적으로 요구사항을 다듬는다.

### 동작 패턴 (비체계적 루프)

```
일단 만든다 → 결과 확인 → 분석 → 수정 → (반복)
```

이 루프는 짧은 프로토타입(예: 84초에 만든 Quicksort 시각화 HTML)에는 효과적이지만,
시스템 규모가 커지면 다음 문제가 발생한다:

- **Incremental Requirements**: 요구사항이 점진적으로만 드러나 전체 설계가 누락됨
- **일관성 붕괴**: 여러 파일/모듈에 걸친 변경 시 맥락 유지가 어려움
- **검증 부재**: "잘 동작하는 것처럼 보임"과 "올바르게 동작함"의 차이를 검증할 장치가 없음

### 한계와 전환

Vibe Coding은 *"AI가 만든 변경을 Accept All로 밀어붙이는 데 특화된 방식"*으로 평가되며,
코드 규모가 커질수록 일관성·검증·운영 면에서 기술 부채가 누적된다. 이 한계가
[[agentic-coding]]으로의 패러다임 전환 배경이 되었다.

## 비교: Vibe Coding vs Agentic Coding

| 항목 | Vibe Coding | Agentic Coding |
|------|------------|----------------|
| 계획 | 없음 (즉흥) | [[plan-mode]]로 사전 계획 |
| 검증 | 사용자 눈으로만 | 자동 테스트/리뷰 에이전트 |
| 산출물 관리 | 없음 | TASK.md, journal.md 등 |
| 적합한 규모 | 프로토타입, 단발성 스크립트 | 시스템 단위 개발 |

## 관련 개념
- [[agentic-coding]] — Vibe Coding의 한계를 보완한 체계적 후속 패러다임
- [[andrej-karpathy]] — Vibe Coding 용어의 명명자
- [[plan-mode]] — Vibe Coding에는 없는 "계획" 단계를 도입한 모드
