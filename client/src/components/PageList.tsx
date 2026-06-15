// client/src/components/PageList.tsx
import { useMemo, useState } from "react";
import type { WikiListItem, PageType } from "../shared/types";

interface Props {
  pages: WikiListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CATEGORY_LABEL: Record<PageType, string> = {
  concept: "Concepts",
  pattern: "Patterns",
  person: "People",
  tool: "Tools",
  case: "Cases",
  index: "Index",
};

const CATEGORY_ORDER: PageType[] = ["concept", "pattern", "tool", "person", "case", "index"];

export function PageList({ pages, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return pages;
    const q = query.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [pages, query]);

  const grouped = useMemo(() => {
    const map = new Map<PageType, WikiListItem[]>();
    for (const p of filtered) {
      const cat = (p.category ?? p.type) as PageType;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [filtered]);

  return (
    <div className="pane-left">
      <div className="search-box">
        <input
          type="text"
          placeholder="검색 (제목/태그/슬러그)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="page-list">
        {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => (
          <div key={cat}>
            <div className="category-header">
              {CATEGORY_LABEL[cat]} ({grouped.get(cat)!.length})
            </div>
            {grouped.get(cat)!.map((p) => (
              <div
                key={p.id}
                className={`page-item ${p.id === selectedId ? "active" : ""}`}
                onClick={() => onSelect(p.id)}
              >
                <span className={`page-dot dot-${cat}`} />
                <span>{p.title}</span>
                {p.status === "draft" && (
                  <span className="page-item-status badge-draft">draft</span>
                )}
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="category-header" style={{ paddingTop: 24 }}>
            검색 결과 없음
          </div>
        )}
      </div>
    </div>
  );
}
