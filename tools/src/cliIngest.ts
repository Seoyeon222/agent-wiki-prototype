#!/usr/bin/env node
// tools/src/cliIngest.ts
// HTTP 서버 없이 raw 파일 1개를 Wiki 페이지로 변환(wiki_create, mode=create)하고
// 곧바로 wiki_validate까지 실행하는 독립 실행형 스크립트.
// harness/hooks/watch-raw.sh에서 호출한다.
//
// Usage: node cliIngest.ts <raw_file_path>

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WikiStore } from "./wikiStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const filePath = process.argv[2];
if (!filePath) {
  console.error(JSON.stringify({ error: "usage: cliIngest.ts <raw_file_path>" }));
  process.exit(1);
}

const raw = fs.readFileSync(filePath, "utf-8");
const store = new WikiStore(ROOT);

const page = store.createOrUpdate({ raw, mode: "create" });
const validation = store.validate(page.id);

console.log(
  JSON.stringify(
    {
      id: page.id,
      path: page.path,
      status: page.frontmatter.status,
      validation,
      source: path.relative(ROOT, filePath),
    },
    null,
    2
  )
);
