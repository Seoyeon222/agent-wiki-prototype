// tools/src/wikiStore.ts
// wiki/pages/*.md, wiki/people/*.md 파일을 읽고 쓰는 데이터 접근 계층.
// 13주차 ingest.py의 파싱/슬러그 로직을 TypeScript로 재구현하여 호환성을 유지한다.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  WikiPage,
  WikiFrontmatter,
  WikiListItem,
  PageType,
  ValidationResult,
  WikiCreateMode,
} from "./shared/types.js";

const WIKI_DIRS = ["wiki/pages", "wiki/people"];

export class WikiStore {
  constructor(private root: string) {}

  /** wiki/pages, wiki/people 하위의 모든 .md 파일을 로드한다. */
  loadAll(): WikiPage[] {
    const pages: WikiPage[] = [];
    for (const dir of WIKI_DIRS) {
      const abs = path.join(this.root, dir);
      if (!fs.existsSync(abs)) continue;
      for (const file of fs.readdirSync(abs)) {
        if (!file.endsWith(".md")) continue;
        const full = path.join(abs, file);
        const raw = fs.readFileSync(full, "utf-8");
        const parsed = matter(raw);
        const fm = parsed.data as WikiFrontmatter;
        if (!fm.id) continue;
        pages.push({
          id: fm.id,
          frontmatter: normalizeFrontmatter(fm),
          body: parsed.content.trim(),
          path: path.relative(this.root, full),
        });
      }
    }
    return pages;
  }

  list(category?: PageType, tag?: string): WikiListItem[] {
    return this.loadAll()
      .filter((p) => {
        if (category && p.frontmatter.category !== category && p.frontmatter.type !== category) {
          return false;
        }
        if (tag && !p.frontmatter.tags?.includes(tag)) return false;
        return true;
      })
      .map((p) => ({
        id: p.frontmatter.id,
        title: p.frontmatter.title,
        type: p.frontmatter.type,
        category: p.frontmatter.category ?? p.frontmatter.type,
        tags: p.frontmatter.tags ?? [],
        status: p.frontmatter.status ?? "active",
        last_updated: p.frontmatter.last_updated,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }

  get(id: string): WikiPage | null {
    return this.loadAll().find((p) => p.id === id) ?? null;
  }

  /** 키워드 기반 검색: 제목 > 태그 > 본문 순으로 가중치를 부여한다. */
  search(query: string, limit = 5) {
    const q = query.toLowerCase();
    // 1) 공백 기준 분리 2) 한글 조사/구두점 제거 3) 너무 짧은 토큰(1글자 한글 등) 제외
    const rawTerms = q.split(/\s+/).filter(Boolean);
    const terms = rawTerms
      .map((t) => t.replace(/[?!.,'"()]/g, ""))
      .flatMap((t) => {
        // 영문 토큰은 그대로, 한글이 포함된 토큰은 조사 제거 후보를 추가 생성
        const variants = new Set<string>([t]);
        // 흔한 한글 조사 제거
        const stripped = t.replace(/(이란|란|은|는|이|가|을|를|에|의|와|과|로|으로|에서)$/u, "");
        if (stripped && stripped !== t) variants.add(stripped);
        return [...variants];
      })
      .filter((t) => t.length >= 2);

    const pages = this.loadAll();

    const scored = pages.map((p) => {
      let score = 0;
      const title = p.frontmatter.title.toLowerCase();
      const tags = (p.frontmatter.tags ?? []).map((t) => String(t).toLowerCase());
      const body = p.body.toLowerCase();
      const id = p.id.toLowerCase();

      for (const term of terms) {
        if (id.includes(term)) score += 5;
        if (title.includes(term)) score += 4;
        if (tags.some((t) => t.includes(term))) score += 3;
        if (body.includes(term)) score += 1;
      }

      // 개요 섹션에서 snippet 추출
      const overviewMatch = p.body.match(/##\s*개요\s*\n(.+?)(?=\n##|\Z)/s);
      const snippet = (overviewMatch ? overviewMatch[1] : p.body)
        .replace(/[#*\[\]]/g, "")
        .trim()
        .slice(0, 160);

      return {
        id: p.id,
        title: p.frontmatter.title,
        score,
        snippet,
      };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * raw 텍스트로부터 페이지를 생성/수정/추가한다.
   * create  : 새 페이지 (status: draft)
   * update  : target_id 페이지 본문 전체 교체
   * append  : target_id 페이지 본문 끝에 추가
   */
  createOrUpdate(input: {
    raw: string;
    mode: WikiCreateMode;
    target_id?: string;
    title?: string;
    category?: PageType;
  }): WikiPage {
    if (input.mode === "update" || input.mode === "append") {
      if (!input.target_id) throw new Error("target_id is required for update/append");
      const existing = this.get(input.target_id);
      if (!existing) throw new Error(`page not found: ${input.target_id}`);

      const newBody =
        input.mode === "append"
          ? `${existing.body}\n\n${input.raw.trim()}`
          : input.raw.trim();

      const fm: WikiFrontmatter = {
        ...existing.frontmatter,
        last_updated: today(),
      };
      return this.write(fm, newBody, existing.path);
    }

    // create
    const title = input.title ?? deriveTitle(input.raw);
    const id = slugify(title);
    const category = input.category ?? inferCategory(input.raw);
    const tags = extractTags(input.raw);

    const fm: WikiFrontmatter = {
      id,
      title,
      type: category,
      category,
      tags,
      created: today(),
      last_updated: today(),
      author: "llm:claude-sonnet-4",
      status: "draft",
      related: [],
    };

    const body = renderBody(category, title, input.raw);
    const relDir = category === "person" ? "wiki/people" : "wiki/pages";
    const relPath = path.join(relDir, `${id}.md`);
    return this.write(fm, body, relPath);
  }

  private write(fm: WikiFrontmatter, body: string, relPath: string): WikiPage {
    const full = path.join(this.root, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const content = matter.stringify(body, fm as Record<string, unknown>);
    fs.writeFileSync(full, content, "utf-8");
    return { id: fm.id, frontmatter: fm, body, path: relPath };
  }

  /**
   * Wiki 전체(또는 단일 페이지)의 [[id]] 링크 유효성과 frontmatter 스키마를 검사한다.
   * 13주차 maintain.py --check-links 로직을 계승.
   */
  validate(id?: string): ValidationResult {
    const pages = this.loadAll();
    const existingIds = new Set(pages.map((p) => p.id));
    const target = id ? pages.filter((p) => p.id === id) : pages;

    const broken_links: { source: string; target: string }[] = [];
    const schema_errors: { id: string; field: string; issue: string }[] = [];

    const requiredFields: (keyof WikiFrontmatter)[] = [
      "id",
      "title",
      "type",
      "tags",
      "created",
      "last_updated",
      "author",
      "status",
      "related",
    ];

    for (const p of target) {
      // 링크 검사
      const links = [...p.body.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
      for (const link of links) {
        if (!existingIds.has(link)) {
          broken_links.push({ source: p.id, target: link });
        }
      }
      // 스키마 검사
      for (const field of requiredFields) {
        if (p.frontmatter[field] === undefined || p.frontmatter[field] === null) {
          schema_errors.push({ id: p.id, field: String(field), issue: "missing field" });
        }
      }
      const wordCount = p.body.split(/\s+/).filter(Boolean).length;
      if (wordCount < 50) {
        schema_errors.push({ id: p.id, field: "body", issue: `too short (${wordCount} words)` });
      }
    }

    return {
      ok: broken_links.length === 0 && schema_errors.length === 0,
      broken_links,
      schema_errors,
    };
  }
}

// ── 헬퍼 함수 (13주차 ingest.py 로직 계승) ──────────────────

function normalizeFrontmatter(fm: WikiFrontmatter): WikiFrontmatter {
  return {
    ...fm,
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    related: Array.isArray(fm.related) ? fm.related : [],
    status: fm.status ?? "active",
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function deriveTitle(raw: string): string {
  const firstLine = raw.trim().split("\n")[0] ?? "Untitled";
  return firstLine.replace(/^#+\s*/, "").trim().slice(0, 80) || "Untitled";
}

function slugify(title: string): string {
  let slug = title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
  // 한글 제거 후 영문/숫자만 남김 (영문 제목이 없으면 timestamp 기반)
  const asciiOnly = slug.replace(/[가-힣]+/g, "");
  slug = asciiOnly.replace(/^-+|-+$/g, "");
  if (!slug) slug = `page-${Date.now()}`;
  return slug.slice(0, 50);
}

function inferCategory(text: string): PageType {
  const t = text.toLowerCase();
  if (/(how to|방법|단계|설치|구성)/.test(t)) return "pattern";
  if (/(api|parameter|파라미터|반환|return|tool)/.test(t)) return "tool";
  if (/(실패|오류|문제|error|bug|사례|case)/.test(t)) return "case";
  if (/(카파시|karpathy|researcher|연구자|인물)/.test(t)) return "person";
  return "concept";
}

function extractTags(text: string): string[] {
  const keywords = [
    "mcp", "agent", "hook", "loop", "pipeline", "llm", "wiki",
    "harness", "subprocess", "claude", "gemini", "codex",
    "vibe-coding", "agentic-coding", "sdlc", "spec",
  ];
  const lower = text.toLowerCase();
  const found = keywords.filter((k) => lower.includes(k));
  return found.length > 0 ? found.slice(0, 5) : ["general"];
}

function renderBody(category: PageType, title: string, raw: string): string {
  const lines = raw.trim().split("\n");
  const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : raw.trim();

  switch (category) {
    case "pattern":
      return `## 목표\n이 페이지는 ${title}에 대한 패턴을 설명합니다.\n\n## 절차\n${body}\n\n## 관련 개념\n- 관련 페이지를 추가하세요 (예: '[[mcp]]')\n`;
    case "tool":
      return `## 개요\n${title} 도구/프로토콜에 대한 설명입니다.\n\n## 상세\n${body}\n\n## 관련 개념\n- 관련 페이지를 추가하세요 (예: '[[mcp]]')\n`;
    case "case":
      return `## 상황 설명\n${body.slice(0, 200) || "사례 설명"}\n\n## 원인 분석\n${body}\n\n## 교훈\n이 사례에서 배울 수 있는 점을 추가하세요.\n`;
    case "person":
      return `## 한 줄 정의\n${body.slice(0, 200) || title + "에 대한 설명"}\n\n## 설명\n${body}\n\n## 관련\n- 관련 페이지를 추가하세요 (예: '[[mcp]]')\n`;
    default:
      return `## 개요\n${body.slice(0, 200) || title + "에 대한 개념 설명입니다."}\n\n## 상세 설명\n${body}\n\n## 관련 개념\n- 관련 페이지를 추가하세요 (예: '[[mcp]]')\n`;
  }
}
