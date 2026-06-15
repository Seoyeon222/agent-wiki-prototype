---
id: agent-pool
title: Agent Pool 구성 방법
type: pattern
category: pattern
tags: [agent, pool, orchestrator, json, subprocess]
created: 2025-05-28
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [harness, mcp, hooks, subprocess-calling, agentic-coding]
---

## 목표
이 가이드를 완료하면 여러 에이전트를 JSON으로 정의하고 Orchestrator가 유동적으로 호출할 수 있는 **에이전트 풀**을 구성할 수 있다.

## 사전 조건
- Python 3.10 이상
- Claude Code, Gemini CLI, 또는 Codex CLI 중 하나 이상 설치
- `git init`된 프로젝트 디렉토리 (Codex는 Sandbox 필요)

## 단계별 절차

### Step 1: `.pool/` 디렉토리 생성

```bash
mkdir -p .pool
```

### Step 2: 에이전트 JSON 정의

각 에이전트는 `.pool/<id>.json` 파일로 정의한다:

```json
{
  "id": "wiki_writer",
  "role": "raw item을 Wiki 페이지로 변환",
  "system_prompt": "You are a Wiki Writer...",
  "input": {
    "description": "변환할 raw 텍스트",
    "format": "text",
    "source": "user"
  },
  "output": {
    "description": "Wiki 마크다운 페이지",
    "format": "markdown",
    "files": ["wiki/pages/<id>.md"]
  },
  "tools": ["file_read", "file_write"],
  "constraints": {
    "max_attempts": 3,
    "timeout_seconds": 120,
    "sandbox": "read_write_wiki_only"
  }
}
```

### Step 3: Orchestrator 스크립트 작성

```python
import json, subprocess
from pathlib import Path

def call_agent(agent_id: str, user_input: str) -> str:
    """에이전트 풀에서 에이전트를 로드하여 Subprocess로 호출한다."""
    conf = json.loads(Path(f".pool/{agent_id}.json").read_text())
    
    result = subprocess.run(
        ["claude", "--print", "--no-stream",
         "--system-prompt", conf["system_prompt"],
         user_input],
        capture_output=True, text=True,
        timeout=conf["constraints"]["timeout_seconds"]
    )
    return result.stdout.strip()
```

### Step 4: 에이전트 상태 대시보드 (선택)

`.pool/` 디렉토리의 에이전트를 테이블로 시각화한다:

```python
import json
from pathlib import Path

agents = [json.loads(p.read_text()) for p in Path(".pool").glob("*.json")]
for a in agents:
    print(f"{a['id']:<20} {a['role']:<40} idle")
```

### Step 5: 파이프라인에 연결

```bash
# wiki_writer → wiki_reviewer 순차 실행
python pipeline/ingest.py --input raw_note.txt --agent claude
```

## 검증 방법

```bash
# 에이전트 풀 목록 확인
ls .pool/

# 단일 에이전트 호출 테스트
python -c "
import json
from pathlib import Path
agents = list(Path('.pool').glob('*.json'))
for a in agents:
    conf = json.loads(a.read_text())
    print(f\"[OK] {conf['id']}: {conf['role']}\")
"
```

## 트러블슈팅

| 오류 | 원인 | 해결 |
|------|------|------|
| `FileNotFoundError: claude` | CLI 미설치 | `npm install -g @anthropic-ai/claude-code` |
| `TimeoutExpired` | 에이전트 응답 지연 | `timeout_seconds` 값 증가 |
| Codex Sandbox 오류 | `git init` 미실행 | 프로젝트 루트에서 `git init` 실행 |

## 관련 개념
- [[harness]] — 에이전트 풀을 감싸는 실행 환경 구조
- [[mcp]] — 에이전트 풀을 MCP Tool로 노출하는 방법
- [[hooks]] — 에이전트 완료 시 다음 에이전트 자동 기동
