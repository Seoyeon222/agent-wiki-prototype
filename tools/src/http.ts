// tools/src/http.ts
// HTTP transport — 3-pane 웹 UI(client/)에서 fetch로 호출하기 위한 REST 래퍼.
// 동일한 wikiTools 핸들러를 재사용하여 stdio 서버와 로직을 공유한다 (Round 2 결정 근거).
//
// 실행: node dist/http.js  (기본 포트 8787)

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WikiStore } from "./wikiStore.js";
import { buildToolDefinitions } from "./tools/wikiTools.js";
import { runChatAgent } from "./agents/chatAgent.js";
import { runEditAgent } from "./agents/editAgent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI_ROOT = path.resolve(__dirname, "..", "..");

const store = new WikiStore(WIKI_ROOT);
const tools = buildToolDefinitions(store);
const toolMap = new Map(tools.map((t) => [t.name, t]));

const app = express();
app.use(cors());
app.use(express.json());

// ── MCP Tool 직접 호출 (디버깅/UI 양쪽 패널용) ──────────────
app.post("/mcp/tools/:name", (req, res) => {
  const toolName = req.params.name as
    | "wiki_list"
    | "wiki_get"
    | "wiki_search"
    | "wiki_create"
    | "wiki_validate";
  const tool = toolMap.get(toolName);
  if (!tool) {
    return res.status(404).json({ error: `Unknown tool: ${req.params.name}` });
  }
  try {
    const result = tool.handler(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/mcp/tools", (_req, res) => {
  res.json({
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
  });
});

// ── Chat Agent (읽기 전용, PRD.md §8) ──────────────────
app.post("/agents/chat", async (req, res) => {
  const { query, history } = req.body as { query: string; history?: import("./agents/chatAgent.js").ChatTurn[] };
  if (!query) return res.status(400).json({ error: "query is required" });
  const result = await runChatAgent(store, WIKI_ROOT, query, history ?? []);
  res.json(result);
});

// ── Edit Agent (쓰기, draft only, PRD.md §8) ───────────
app.post("/agents/edit", async (req, res) => {
  const { raw, mode, target_id, title, category } = req.body;
  if (!raw || !mode) return res.status(400).json({ error: "raw and mode are required" });
  const result = await runEditAgent(store, WIKI_ROOT, { raw, mode, target_id, title, category });
  res.json(result);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(PORT, () => {
  console.log(`[llm-wiki-mcp] HTTP server on http://localhost:${PORT}`);
  console.log(`[llm-wiki-mcp] WIKI_ROOT=${WIKI_ROOT}`);
});
