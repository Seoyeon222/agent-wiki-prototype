// tools/src/tools/wikiTools.ts
// PRD.md §4.2 Tool 명세에 대응하는 5개 MCP Tool 정의.
// PRD.md §8의 권한 매트릭스: wiki_chat_agent(읽기전용) / wiki_edit_agent(쓰기 포함)

import { z } from "zod";
import { WikiStore } from "../wikiStore.js";

const categoryEnum = z.enum(["concept", "pattern", "person", "tool", "case", "index"]);

export function buildToolDefinitions(store: WikiStore) {
  return [
    {
      name: "wiki_list",
      description:
        "Wiki 페이지 목록을 카테고리/태그로 필터링하여 조회한다. (읽기 전용, wiki_chat_agent/wiki_edit_agent 모두 사용 가능)",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", enum: categoryEnum.options },
          tag: { type: "string" },
        },
      },
      handler: (args: unknown) => {
        const input = z
          .object({ category: categoryEnum.optional(), tag: z.string().optional() })
          .parse(args ?? {});
        return { pages: store.list(input.category, input.tag) };
      },
    },
    {
      name: "wiki_get",
      description:
        "단일 Wiki 페이지의 frontmatter와 본문 전체를 조회한다. (읽기 전용)",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      handler: (args: unknown) => {
        const input = z.object({ id: z.string() }).parse(args);
        const page = store.get(input.id);
        if (!page) {
          return { error: `page not found: ${input.id}` };
        }
        return { id: page.id, frontmatter: page.frontmatter, body: page.body };
      },
    },
    {
      name: "wiki_search",
      description:
        "키워드로 Wiki 페이지를 검색한다 (제목/태그/본문 가중치 적용). 관련 페이지 ID와 점수, 요약(snippet)을 반환한다. (읽기 전용)",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
      handler: (args: unknown) => {
        const input = z
          .object({ query: z.string(), limit: z.number().int().positive().max(20).optional() })
          .parse(args);
        return { results: store.search(input.query, input.limit ?? 5) };
      },
    },
    {
      name: "wiki_create",
      description:
        "raw 텍스트로 새 Wiki 페이지를 생성(create)하거나, 기존 페이지를 갱신(update)/추가(append)한다. " +
        "새로 생성된 페이지는 status: draft로 저장되며, 사용자 승인 전까지 active로 전환되지 않는다. " +
        "(wiki_edit_agent 전용 — wiki_chat_agent는 호출 불가)",
      inputSchema: {
        type: "object",
        properties: {
          raw: { type: "string" },
          mode: { type: "string", enum: ["create", "update", "append"] },
          target_id: { type: "string" },
          title: { type: "string" },
          category: { type: "string", enum: categoryEnum.options },
        },
        required: ["raw", "mode"],
      },
      handler: (args: unknown) => {
        const input = z
          .object({
            raw: z.string().min(1),
            mode: z.enum(["create", "update", "append"]),
            target_id: z.string().optional(),
            title: z.string().optional(),
            category: categoryEnum.optional(),
          })
          .parse(args);

        const page = store.createOrUpdate(input);
        const validation = store.validate(page.id);
        return {
          id: page.id,
          path: page.path,
          status: page.frontmatter.status,
          validation,
        };
      },
    },
    {
      name: "wiki_validate",
      description:
        "Wiki 전체(또는 단일 페이지)의 인터링크([[id]]) 유효성과 frontmatter 스키마를 검사한다. " +
        "(wiki_edit_agent 전용, PostToolUse Hook으로 wiki_create 직후 자동 호출됨)",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
      },
      handler: (args: unknown) => {
        const input = z.object({ id: z.string().optional() }).parse(args ?? {});
        return store.validate(input.id);
      },
    },
  ] as const;
}

export type WikiToolDefinitions = ReturnType<typeof buildToolDefinitions>;
