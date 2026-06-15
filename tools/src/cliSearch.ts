#!/usr/bin/env node
// tools/src/cliSearch.ts
// harness/hooks/watch-raw.sh(--agent-mode)에서 호출.
// 질문(query)으로 wiki_search → 상위 결과의 wiki_get 본문을 이어붙여
// CLI subprocess에 전달할 "컨텍스트 텍스트"를 표준출력으로 생성한다.
//
// Usage: node cliSearch.ts "<query>"

import path from "node:path";
import { fileURLToPath } from "node:url";
import { WikiStore } from "./wikiStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const query = process.argv.slice(2).join(" ");
const store = new WikiStore(ROOT);

const results = store.search(query, 3);
if (results.length === 0) {
  console.log("(관련 Wiki 페이지를 찾지 못했습니다. 일반적인 지식으로 답변하세요.)");
  process.exit(0);
}

for (const r of results) {
  const page = store.get(r.id);
  if (!page) continue;
  console.log(`### [[${page.id}]] ${page.frontmatter.title}`);
  console.log(page.body.slice(0, 1200));
  console.log("");
}
