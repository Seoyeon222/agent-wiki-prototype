---
id: loop
title: Loop (자동화 루프)
type: concept
category: pattern
tags: [loop, automation, hook, claude, scheduler]
created: 2025-05-28
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [hooks, harness, agent-pool]
---

## 개요
Loop는 에이전트가 일정 조건 또는 시간마다 반복적으로 작업을 수행하도록 하는 자동화 메커니즘이다. Claude Code에서 공식 지원되며, Codex/Gemini에서는 OS Scheduler로 대체 구현한다.

## 상세 설명

Loop는 [[hooks]]의 `Stop` 이벤트와 연계되어 동작하는 경우가 많다. 한 turn이 끝날 때 다음 작업을 자동으로 기동하거나, 주기적으로 상태를 확인한다.

### Claude Code에서의 Loop

```json
{
  "loop": {
    "enabled": true,
    "interval": "session_end",
    "action": "pipeline/maintain.py --sync-index",
    "max_iterations": 50,
    "stop_condition": "TASK.md의 모든 항목이 [x]로 체크됨"
  }
}
```

**주의사항**: Loop가 Read/Write를 수반하면 매 실행마다 비용이 발생한다. 고가 요금제가 아니라면 **Status Checking** 위주로 활용을 권장한다.

### Codex/Gemini 대안: OS Scheduler (cron)

```bash
# 매 시간 Wiki 인덱스 동기화 (crontab -e)
0 * * * * cd /path/to/llm-wiki && python pipeline/maintain.py --sync-index

# 매일 자정 링크 검사
0 0 * * * cd /path/to/llm-wiki && python pipeline/maintain.py --check-links >> logs/daily.log
```

### 비용 절감 전략

로컬 GPU에서 LLM을 구동할 수 있다면:
- **판단(fire)**: 상용 LLM (Claude, GPT-4)
- **실행(action)**: 로컬 LLM API (Qwen, Llama via vllm/Ollama)

```python
# 예시: 상용 LLM으로 판단, 로컬로 실행
decision = call_commercial_llm(prompt)   # Claude API
if decision == "execute":
    result = call_local_llm(action_prompt)  # localhost:11434 (Ollama)
```

## Loop vs Hook 비교

| 항목 | Loop | Hook |
|------|------|------|
| 트리거 | 시간/반복 조건 | 에이전트 생애주기 이벤트 |
| 지원 도구 | Claude Code (공식), cron (대안) | Claude Code (공식) |
| 주요 용도 | 주기적 유지보수 | 이벤트 기반 사이드 이펙트 |
| 비용 위험 | 높음 (반복 실행) | 중간 (이벤트마다 실행) |

## 관련 개념
- [[hooks]] — Loop를 구성하는 핵심 트리거 메커니즘
- [[harness]] — Loop와 Hook을 포함하는 실행 환경 전체
- [[agent-pool]] — Loop에서 에이전트를 순차적으로 기동하는 패턴
