// client/src/api.ts
// HTTP MCP 서버(tools/src/http.ts)와 통신하는 얇은 클라이언트.

import type {
  WikiListOutput,
  WikiGetOutput,
  WikiSearchOutput,
  WikiValidateOutput,
  PageType,
} from "./shared/types";

const BASE = "http://localhost:8787";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  list: (category?: PageType, tag?: string) =>
    postJSON<WikiListOutput>("/mcp/tools/wiki_list", { category, tag }),

  get: (id: string) => postJSON<WikiGetOutput>("/mcp/tools/wiki_get", { id }),

  search: (query: string, limit = 5) =>
    postJSON<WikiSearchOutput>("/mcp/tools/wiki_search", { query, limit }),

  validate: (id?: string) => postJSON<WikiValidateOutput>("/mcp/tools/wiki_validate", { id }),

  chat: (query: string, history: { role: string; content: string }[] = []) =>
    postJSON<{
      answer: string;
      sources: string[];
      confidence: "high" | "medium" | "low";
      tool_calls: { tool: string; args: Record<string, unknown> }[];
      engine: "cli" | "fallback" | "pending";
    }>("/agents/chat", { query, history }),

  edit: (input: {
    raw: string;
    mode: "create" | "update" | "append";
    target_id?: string;
    title?: string;
    category?: PageType;
  }) =>
    postJSON<{
      id: string;
      path: string;
      status: string;
      validation: WikiValidateOutput;
      duplicate_warning?: { id: string; title: string; score: number }[];
      message: string;
    }>("/agents/edit", input),
};
