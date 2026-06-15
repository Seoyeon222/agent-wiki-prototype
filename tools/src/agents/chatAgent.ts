// tools/src/agents/chatAgent.ts
// PRD.md §8.2 wiki_chat_agent 구현 (RULES.md R1/R2 준수판).
// 권한: wiki_list, wiki_get, wiki_search (읽기 전용). wiki_create/validate 호출 금지.
//
// ── 동작 방식 ──────────────────────────────────────────────────────
// 1. HTTP 서버(/agents/chat)는 LLM을 직접 호출하지 않는다 (API Key 금지, RULES.md R1).
//    대신 질문을 tools/queue/inbox/<id>.json에 적재(enqueueChatRequest)하고,
//    tools/queue/outbox/<id>.json이 생길 때까지 폴링한다(pollChatResponse).
// 2. harness/hooks/watch-raw.sh --agent-mode (별도 프로세스, 메시지 인식 Shell 스크립트)가
//    inbox/를 감시하다가:
//      - wiki_search로 컨텍스트를 만들고
//      - claude/codex/gemini CLI를 subprocess로 호출 (있으면) → engine: "cli"
//      - 없으면 synthesizeAnswer (규칙 기반) → engine: "fallback"
//    결과를 outbox/<id>.json에 기록한다.
// 3. 이 모듈의 synthesizeAnswer는 fallback 엔진(cliChatFallback.ts)에서도 재사용된다.

import fs from "node:fs";
import path from "node:path";
import { WikiStore } from "../wikiStore.js";
import type { WikiSearchResult } from "../shared/types.js";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatToolCallLog {
  tool: string;
  args: Record<string, unknown>;
}

export interface ChatAgentResult {
  answer: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
  tool_calls: ChatToolCallLog[];
  engine: "cli" | "fallback" | "pending";
}

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 20_000;

/**
 * 사용자 질의를 inbox 큐에 적재하고, outbox에 결과가 쓰일 때까지 폴링한다.
 * watch-raw.sh --agent-mode (subprocess 워처)가 inbox를 소비한다 (R2).
 *
 * 타임아웃 시(워처가 실행되지 않은 경우 등) 즉시 wiki_search 기반 폴백을 반환하여,
 * 워처 없이도 데모가 가능하도록 한다.
 */
export async function runChatAgent(
  store: WikiStore,
  root: string,
  query: string,
  _history: ChatTurn[]
): Promise<ChatAgentResult> {
  const tool_calls: ChatToolCallLog[] = [{ tool: "wiki_search", args: { query, limit: 3 } }];
  const searchResults = store.search(query, 3);

  if (searchResults.length === 0) {
    return {
      answer:
        `'${query}'에 대한 Wiki 페이지를 찾지 못했습니다.\n` +
        `raw/ 폴더에 관련 자료를 추가하고 watch-raw.sh를 실행해보세요.`,
      sources: [],
      confidence: "low",
      tool_calls,
      engine: "fallback",
    };
  }
  for (const r of searchResults) tool_calls.push({ tool: "wiki_get", args: { id: r.id } });

  // 1) inbox에 요청 적재 (R2)
  const id = enqueueChatRequest(root, query);

  // 2) outbox 폴링 (watch-raw.sh --agent-mode가 처리)
  const queued = await pollChatResponse(root, id, POLL_TIMEOUT_MS);
  if (queued) {
    const confidence = scoreToConfidence(searchResults[0].score);
    return {
      answer: queued.answer,
      sources: searchResults.map((r) => r.id),
      confidence,
      tool_calls,
      engine: queued.engine,
    };
  }

  // 3) 워처가 응답하지 않음 (미실행) → 즉시 인라인 폴백
  const pages = searchResults.map((r) => store.get(r.id));
  const answer =
    synthesizeAnswer(query, searchResults, pages) +
    "\n\n_(harness/hooks/watch-raw.sh --agent-mode --loop 가 실행 중이 아니어서 즉시 규칙 기반으로 응답했습니다.)_";

  return {
    answer,
    sources: searchResults.map((r) => r.id),
    confidence: scoreToConfidence(searchResults[0].score),
    tool_calls,
    engine: "fallback",
  };
}

function scoreToConfidence(score: number): ChatAgentResult["confidence"] {
  return score >= 5 ? "high" : score >= 2 ? "medium" : "low";
}

// ── 큐 I/O (R2) ────────────────────────────────────────────────────

export function enqueueChatRequest(root: string, query: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inboxDir = path.join(root, "tools", "queue", "inbox");
  fs.mkdirSync(inboxDir, { recursive: true });
  fs.writeFileSync(
    path.join(inboxDir, `${id}.json`),
    JSON.stringify({ id, query, ts: new Date().toISOString() }, null, 2)
  );
  return id;
}

export function pollChatResponse(
  root: string,
  id: string,
  timeoutMs: number
): Promise<{ answer: string; engine: "cli" | "fallback" } | null> {
  const outboxFile = path.join(root, "tools", "queue", "outbox", `${id}.json`);
  const start = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      if (fs.existsSync(outboxFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(outboxFile, "utf-8"));
          fs.unlinkSync(outboxFile);
          resolve({ answer: data.answer, engine: data.engine === "cli" ? "cli" : "fallback" });
          return;
        } catch {
          resolve(null);
          return;
        }
      }
      if (Date.now() - start > timeoutMs) {
        resolve(null);
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
  });
}

// ── 규칙 기반 응답 합성 (fallback 엔진에서도 재사용, cliChatFallback.ts) ──

export function synthesizeAnswer(
  query: string,
  results: WikiSearchResult[],
  pages: (ReturnType<WikiStore["get"]>)[]
): string {
  const parts: string[] = [];

  const top = pages[0];
  if (top) {
    const overview = extractSection(top.body, "개요") ?? extractSection(top.body, "한 줄 정의");
    parts.push(`**${top.frontmatter.title}**`);
    if (overview) parts.push(overview.trim());
  }

  if (pages.length > 1) {
    parts.push("");
    parts.push("관련 페이지:");
    for (const p of pages.slice(1)) {
      if (!p) continue;
      const overview = extractSection(p.body, "개요") ?? extractSection(p.body, "한 줄 정의") ?? "";
      parts.push(`- **${p.frontmatter.title}**: ${overview.slice(0, 120).trim()}`);
    }
  }

  parts.push("");
  parts.push(`📍 출처: ${results.map((r) => `[[${r.id}]]`).join(", ")}`);

  return parts.join("\n");
}

function extractSection(body: string, heading: string): string | null {
  const re = new RegExp(`##\\s*${heading}\\s*\\n([\\s\\S]+?)(?=\\n##|$)`);
  const match = body.match(re);
  return match ? match[1].trim() : null;
}
