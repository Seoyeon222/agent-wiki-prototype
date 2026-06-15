// tools/src/agents/editAgent.ts
// PRD.md §8.3 wiki_edit_agent 구현.
// 권한: wiki_list/get/search/create/validate.
// 정책: wiki_create는 항상 status: draft로 생성하고, PostToolUse Hook으로 wiki_validate를
//        자동 호출한다. status: active로의 전환은 사용자 승인이 필요하다 (본 함수는 수행하지 않음).
// RULES.md R6: wiki_create 결과를 harness/journal.md에 append-only로 기록한다.

import fs from "node:fs";
import path from "node:path";
import { WikiStore } from "../wikiStore.js";
import type {
  PageType,
  ValidationResult,
  WikiCreateMode,
} from "../shared/types.js";

export interface EditAgentInput {
  raw: string;
  mode: WikiCreateMode;
  target_id?: string;
  title?: string;
  category?: PageType;
}

export interface EditAgentResult {
  id: string;
  path: string;
  status: string;
  validation: ValidationResult;
  duplicate_warning?: { id: string; title: string; score: number }[];
  message: string;
}

export async function runEditAgent(
  store: WikiStore,
  root: string,
  input: EditAgentInput
): Promise<EditAgentResult> {
  // Step 1: 중복 확인 (wiki_search) — create 모드에서만
  let duplicate_warning: EditAgentResult["duplicate_warning"];
  if (input.mode === "create") {
    const candidates = store.search(input.raw.split("\n")[0] ?? input.raw, 3);
    const strong = candidates.filter((c) => c.score >= 4);
    if (strong.length > 0) {
      duplicate_warning = strong.map((c) => ({ id: c.id, title: c.title, score: c.score }));
    }
  }

  // Step 2: wiki_create
  const page = store.createOrUpdate(input);

  // Step 3: PostToolUse Hook → wiki_validate (자동)
  const validation = store.validate(page.id);

  // Step 4: 메시지 작성
  const messageParts: string[] = [];
  messageParts.push(
    `'${page.frontmatter.title}' 페이지를 ${modeLabel(input.mode)}했습니다. (id: ${page.id}, status: ${page.frontmatter.status})`
  );
  if (duplicate_warning?.length) {
    messageParts.push(
      `⚠️ 유사한 페이지가 이미 존재합니다: ${duplicate_warning.map((d) => `[[${d.id}]]`).join(", ")} — 중복 생성이 아닌지 확인해주세요.`
    );
  }
  if (validation.ok) {
    messageParts.push(`✅ 검증 통과 (broken links: 0, schema errors: 0)`);
  } else {
    messageParts.push(
      `⚠️ 검증 이슈 발견: broken links ${validation.broken_links.length}건, schema errors ${validation.schema_errors.length}건`
    );
  }
  if (page.frontmatter.status === "draft") {
    messageParts.push(`이 페이지는 'draft' 상태입니다. 'active'로 전환하려면 승인해주세요.`);
  }

  const message = messageParts.join("\n");

  appendJournal(root, {
    id: page.id,
    mode: input.mode,
    status: page.frontmatter.status,
    validation,
    duplicate_warning,
  });

  return {
    id: page.id,
    path: page.path,
    status: page.frontmatter.status,
    validation,
    duplicate_warning,
    message,
  };
}

function appendJournal(
  root: string,
  entry: {
    id: string;
    mode: WikiCreateMode;
    status: string;
    validation: ValidationResult;
    duplicate_warning?: EditAgentResult["duplicate_warning"];
  }
) {
  const journalPath = path.join(root, "harness", "journal.md");
  const ts = new Date().toISOString();
  const lines: string[] = [
    "",
    `## ${ts} | wiki_edit_agent | wiki_create mode=${entry.mode} id=${entry.id}`,
    `- status: ${entry.status}`,
    `- validate: ok=${entry.validation.ok}, broken_links=${entry.validation.broken_links.length}, schema_errors=${entry.validation.schema_errors.length}`,
  ];
  if (entry.duplicate_warning?.length) {
    lines.push(`- duplicate_warning: ${entry.duplicate_warning.map((d) => d.id).join(", ")}`);
  }
  fs.appendFileSync(journalPath, lines.join("\n") + "\n");
}

function modeLabel(mode: WikiCreateMode): string {
  switch (mode) {
    case "create":
      return "생성";
    case "update":
      return "수정";
    case "append":
      return "추가 작성";
  }
}
