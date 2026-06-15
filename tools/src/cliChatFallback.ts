#!/usr/bin/env node
// tools/src/cliChatFallback.ts
// 로컬에 claude/codex/gemini CLI가 없을 때, harness/hooks/watch-raw.sh(--agent-mode)가
// 호출하는 규칙 기반 폴백 응답 생성기. tools/src/agents/chatAgent.ts의 builtin 로직과
// 동일한 synthesizeAnswer를 재사용한다.
//
// Usage: node cliChatFallback.ts "<query>"

import path from "node:path";
import { fileURLToPath } from "node:url";
import { WikiStore } from "./wikiStore.js";
import { synthesizeAnswer } from "./agents/chatAgent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const query = process.argv.slice(2).join(" ");
const store = new WikiStore(ROOT);

const results = store.search(query, 3);
if (results.length === 0) {
  console.log(
    `'${query}'에 대한 Wiki 페이지를 찾지 못했습니다.\n` +
      `raw/ 폴더에 관련 자료를 추가하고 watch-raw.sh를 실행해보세요.`
  );
  process.exit(0);
}

const pages = results.map((r) => store.get(r.id));
console.log(synthesizeAnswer(query, results, pages));
