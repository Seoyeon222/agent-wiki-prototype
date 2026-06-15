---
id: mcp
title: Model Context Protocol (MCP)
type: tool
category: tool
tags: [mcp, protocol, agent, tool]
created: 2025-05-28
last_updated: 2026-06-14
author: llm:claude-sonnet-4
status: active
related: [agent-pool, harness, hooks, subprocess-calling]
---

## 개요
MCP(Model Context Protocol)는 AI 에이전트가 다양한 외부 시스템과 표준화된 방식으로 연결될 수 있도록 Anthropic이 설계하고 OpenAI, Google 등이 참여한 개방형 프로토콜이다. "AI용 USB 인터페이스"로 비유된다.

## 상세 설명

### 왜 MCP가 필요한가?

기존 방식에서는 AI 에이전트가 DB, 외부 API, 시스템과 연동하려면 매번 복잡한 커넥터 코드를 작성하거나, 에이전트 스스로 API 문서를 분석해 호출 코드를 생성해야 했다. 이 과정은 비용이 높고, 에이전트 성능이 낮을수록 오류가 빈번했다.

MCP는 이 문제를 **표준화된 프로토콜 계층**으로 해결한다. 각 시스템이 MCP를 구현하면, 에이전트는 동일한 방식으로 모든 시스템과 통신할 수 있다.

### 객체지향 관점에서의 MCP

MCP는 OOP 원칙을 적용한다:
- **캡슐화**: Tool Calling 내부 구현을 에이전트가 몰라도 됨
- **추상화**: 모든 외부 시스템을 동일한 Tool 인터페이스로 접근
- **다형성**: 다양한 시스템(Slack, DB, API)이 같은 MCP 인터페이스를 구현

### Tradeoff

MCP의 단점도 존재한다. 많은 Tool이 등록될수록 에이전트가 "어떤 Tool을 쓸지" 추론하는 데 드는 **Context 비용이 폭증**한다. 맥가이버 칼 안에서 특정 도구를 찾듯, Tool 수가 많아질수록 선택 비용이 증가한다.

## 구성 요소

| 구성요소 | 설명 |
|---------|------|
| MCP Server | 외부 시스템 앞단에 배치, Tool 정의를 노출 |
| MCP Client | 에이전트 측, Tool을 호출 |
| Tool | 에이전트가 호출할 수 있는 기능 단위 |
| `/mcp POST` | 표준 HTTP 엔드포인트 |

## 예시 (FastMCP)

```python
from fastmcp import FastMCP

mcp = FastMCP("wiki-server")

@mcp.tool()
def wiki_get(page_id: str) -> str:
    """Wiki 페이지를 읽어온다."""
    path = f"wiki/pages/{page_id}.md"
    return open(path).read()

@mcp.tool()
def wiki_create(id: str, title: str, content: str) -> str:
    """새 Wiki 페이지를 생성한다."""
    # ingest 파이프라인 호출
    ...
```

## 관련 개념
- [[agent-pool]] — MCP Tool을 에이전트 풀에 등록하는 패턴
- [[harness]] — MCP 서버를 실행 환경으로 감싸는 구조
- [[hooks]] — MCP 서버 호출 시점을 Hook으로 제어
