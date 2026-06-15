#!/usr/bin/env node
// tools/src/cliValidate.ts
// HTTP 서버가 떠있지 않을 때, harness/hooks/post-tool-use-validate.sh에서 호출하는
// 독립 실행형 검증 스크립트. wikiStore.validate(id?)를 직접 호출해 JSON으로 출력한다.
//
// Usage: node cliValidate.ts [page_id]
//        (빌드 후) node dist/cliValidate.js [page_id]

import path from "node:path";
import { fileURLToPath } from "node:url";
import { WikiStore } from "./wikiStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/cliValidate.js -> project root (../..)
// src/cliValidate.ts (tsx 실행 시) -> project root (../..)
const ROOT = path.resolve(__dirname, "..", "..");

const id = process.argv[2] || undefined;
const store = new WikiStore(ROOT);
const result = store.validate(id);

console.log(JSON.stringify(result, null, 2));
