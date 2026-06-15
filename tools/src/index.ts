// tools/src/index.ts
// stdio transport 기반 MCP 서버 — Claude Desktop/Code 등 MCP Host와 연동하기 위한 엔트리포인트.
//
// 실행: node dist/index.js
// Claude Desktop 설정(claude_desktop_config.json) 예시는 README.md 참고.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WikiStore } from "./wikiStore.js";
import { buildToolDefinitions } from "./tools/wikiTools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// tools/dist/index.js → project root (../../)
const WIKI_ROOT = path.resolve(__dirname, "..", "..");

const store = new WikiStore(WIKI_ROOT);
const tools = buildToolDefinitions(store);

const server = new Server(
  { name: "llm-wiki-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);
  if (!tool) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }
  try {
    const result = tool.handler(request.params.arguments);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`[llm-wiki-mcp] stdio server started. WIKI_ROOT=${WIKI_ROOT}`);
