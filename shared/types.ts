// shared/types.ts
// MCP 서버(server)와 웹 클라이언트(client)가 공유하는 Wiki 데이터 타입.
// PRD.md §4.2 Tool 명세와 1:1로 대응한다.

export type PageType = "concept" | "pattern" | "person" | "tool" | "case" | "index";
export type PageStatus = "active" | "draft" | "deprecated";

export interface WikiFrontmatter {
  id: string;
  title: string;
  type: PageType;
  category?: PageType;
  tags: string[];
  created: string;
  last_updated: string;
  author: string;
  status: PageStatus;
  related: string[];
  [key: string]: unknown;
}

export interface WikiPage {
  id: string;
  frontmatter: WikiFrontmatter;
  body: string; // raw markdown (frontmatter 제외)
  path: string; // 상대 경로 (wiki/pages/xxx.md)
}

export interface WikiListItem {
  id: string;
  title: string;
  type: PageType;
  category?: PageType;
  tags: string[];
  status: PageStatus;
  last_updated: string;
}

// ── Tool I/O ──────────────────────────────────────────────

export interface WikiListInput {
  category?: PageType;
  tag?: string;
}
export interface WikiListOutput {
  pages: WikiListItem[];
}

export interface WikiGetInput {
  id: string;
}
export interface WikiGetOutput {
  id: string;
  frontmatter: WikiFrontmatter;
  body: string;
}

export interface WikiSearchInput {
  query: string;
  limit?: number;
}
export interface WikiSearchResult {
  id: string;
  title: string;
  score: number;
  snippet: string;
}
export interface WikiSearchOutput {
  results: WikiSearchResult[];
}

export type WikiCreateMode = "create" | "update" | "append";

export interface WikiCreateInput {
  raw: string;
  mode: WikiCreateMode;
  target_id?: string;
  title?: string;
  category?: PageType;
}

export interface ValidationResult {
  ok: boolean;
  broken_links: { source: string; target: string }[];
  schema_errors: { id: string; field: string; issue: string }[];
}

export interface WikiCreateOutput {
  id: string;
  path: string;
  status: PageStatus;
  validation: ValidationResult;
}

export interface WikiValidateInput {
  id?: string;
}
export type WikiValidateOutput = ValidationResult;
