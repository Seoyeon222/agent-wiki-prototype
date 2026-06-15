---
id: hooks
title: Hook (에이전트 생애주기 훅)
type: concept
category: concept
tags: [hook, automation, loop, claude, lifecycle]
created: 2025-05-28
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [loop, harness, agent-pool, agentic-coding]
---

## 개요
Hook은 에이전트의 생애주기 동안 특정 시점 또는 조건이 만족될 때마다 자동으로 실행되는 스크립트다. 에이전트의 확률적 판단을 **결정론적 결과물**로 보완하는 것이 주 목적이다.

## 상세 설명

AI 에이전트는 확률적 모델이기 때문에 잘못된 결정을 내릴 수 있다. Hook은 에이전트가 특정 시점에 **반드시** 실행해야 하는 사이드 이펙트를 보장한다. Claude Code에서는 공식적으로 지원되며, Codex/Gemini에서는 OS Scheduler로 대안을 구현한다.

### 이벤트 종류

| 이벤트 | 실행 시점 | 주요 활용 |
|--------|----------|----------|
| `UserPromptSubmit` | 사용자 프롬프트 제출 시 | 관련 Wiki 페이지 존재 여부 사전 확인, 프롬프트 보강 |
| `PreToolUse` | 에이전트가 도구 사용 직전 | 위험한 도구 사용 전 검증 |
| `PostToolUse` | 도구 실행 완료 직후 | 도구 사용 내역 로그 기록 |
| `PermissionRequest` | 권한 요청 발생 시 | 자동 허용/거부 정책 적용 |
| `Stop` | 한 turn이 종료될 때 | TASK.md 체크리스트 업데이트, 다음 에이전트 기동 |
| `SessionStart` | 세션 시작/재개 시 | AGENTS.md와 journal.md 자동 로드 |

## 유의미한 사용 패턴

### 패턴 1: Wiki 사전 확인 (UserPromptSubmit)
```bash
# 사용자 질문 전 관련 Wiki 페이지가 있는지 확인
python pipeline/query.py --check-index --query "$USER_PROMPT"
```

### 패턴 2: 도구 사용 로그 (PostToolUse)
```bash
# 어떤 도구를 사용했는지 journal에 자동 기록
python pipeline/maintain.py --log-tool "$TOOL_NAME"
```

### 패턴 3: 작업 완료 처리 (Stop)
```bash
# 한 turn 종료 시 TASK.md 업데이트 + 검증
python pipeline/maintain.py --update-task
# 다음 에이전트 기동 (필요시)
# python -m subprocess_launcher --next-agent
```

## 주의사항

- **비용**: Hook이 Read/Write를 수반하는 경우 매 실행마다 비용이 발생한다. 고가 요금제가 아니라면 Status Checking 위주로 활용한다.
- **로컬 모델 활용**: 개인 GPU에서 로컬 LLM을 구동한다면, 판단(fire)은 상용 LLM에게, 실행(action)은 로컬 에이전트 API로 비용을 절감할 수 있다.
- **Claude 전용**: Loop 기능은 Claude Code에서 거의 독점적으로 지원된다. Codex/Gemini는 cron 등 OS Scheduler를 사용해야 한다.

## 관련 개념
- [[loop]] — Hook의 Stop 이벤트를 활용한 반복 자동화
- [[harness]] — Hook 설정을 포함한 실행 환경 전체
- [[agent-pool]] — Stop Hook에서 다음 에이전트를 기동하는 패턴
