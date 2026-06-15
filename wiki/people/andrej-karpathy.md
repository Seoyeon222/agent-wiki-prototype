---
id: andrej-karpathy
title: Andrej Karpathy
type: person
category: person
tags: [person, vibe-coding, openai, tesla]
created: 2026-06-14
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [vibe-coding, spec-driven-development]
---

## 한 줄 정의
전 OpenAI 공동창업자, 전 Tesla AI 디렉터. [[vibe-coding]] 용어의 명명자이자, 딥러닝/LLM
교육 콘텐츠(Neural Networks: Zero to Hero 등)로 널리 알려진 연구자.

## 설명

### 배경
Andrej Karpathy는 OpenAI 창립 멤버이자 전 Tesla AI 디렉터로, 컴퓨터 비전과 딥러닝
분야에서 다수의 교육 자료를 공개해왔다. "Neural Networks: Zero to Hero" 강의 시리즈와
`micrograd`, `nanoGPT` 같은 미니멀 구현체를 통해 LLM 내부 동작을 가르치는 것으로
유명하다.

### Vibe Coding 명명 (2025)

2025년 2월 2일, Karpathy는 "vibe coding"이라는 새로운 코딩 방식을 소개하며, LLM(예: Cursor Composer with Sonnet)의 성능이 충분히 좋아져 코드 자체를 신경 쓰지 않고 흐름에 맡기는 방식이 가능해졌다고 설명했다.
이 게시물은 450만 회 이상의 조회수를 기록하며 AI 보조 코딩에 대한 전세계적 논의를 촉발했고,
2025년 Collins Dictionary의 올해의 단어로 선정되었다.

> 인용(원문 의역): "AI가 생성한 코드를 거의 그대로 받아들이고(diff를 세밀히 검토하지 않고),
> 오류 메시지를 그대로 AI에게 다시 전달해 해결하며, 코드베이스가 자신의 완전한 이해 범위를
> 넘어 유기적으로 자라도록 두는" 접근.

### Vibe Coding의 한계와 후속 논의

Vibe Coding은 AI 보조 개발로의 전환을 가속화했지만, AI 출력에만 의존하는 것의 한계 또한
드러냈다 — 이는 더 강력한 코드 리뷰 도구, 머지 전 검사, 계획 단계에 대한 수요를 만들어냈다.

이러한 한계 지적은 본 위키의 [[vibe-coding]] 페이지에서 다루는 "Agentic Coding으로의
전환" 배경과 직접 연결된다. 즉, Karpathy 본인이 명명한 개념이 1년 사이 업계에서
[[spec-driven-development]] 같은 더 체계적인 워크플로우로 보완되는 과정을 거쳤다.

## 주요 기여 (이 위키와 관련된 것)

1. **Vibe Coding 명명 (2025.2)** — 자연어로 목표·제약을 전달하고 LLM이 코드를 작성하게
   하는 방식을 "Vibe Coding"으로 명명. 2025년 1~2분기의 주요 트렌드를 이끔.
2. **한계 지적 → Agentic Coding으로의 전환 배경 제공** — Vibe Coding이 코드 규모가
   커지면 일관성·검증·운영 면에서 기술 부채가 누적된다는 한계가 알려지며,
   [[agentic-coding]]/[[spec-driven-development]] 패러다임 전환의 계기가 됨.

## 관련
- [[vibe-coding]]
- [[spec-driven-development]]

## 출처
- Karpathy, A. (2025-02-02). X(Twitter) post. https://x.com/karpathy/status/1886192184808149383
- Collins Dictionary, "Vibe Coding — Word of the Year 2025"
- CodeRabbit Blog, "A semantic history of vibe coding: Tweet, meme and workflow"
