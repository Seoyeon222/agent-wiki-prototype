// client/src/components/PageView.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { WikiGetOutput, PageType } from "../shared/types";

interface Props {
  page: WikiGetOutput | null;
  loading: boolean;
  existingIds: Set<string>;
  onNavigate: (id: string) => void;
}

/** [[page_id]] 인터링크를 markdown-it 호환 텍스트로 치환: [[id]] -> [id](#wiki:id) */
function transformWikiLinks(body: string): string {
  return body.replace(/\[\[([^\]]+)\]\]/g, (_m, id) => `[${id}](#wiki:${id})`);
}

export function PageView({ page, loading, existingIds, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="pane-center">
        <div className="empty-state">로딩 중...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="pane-center">
        <div className="empty-state">
          ← 좌측에서 페이지를 선택하세요 (wiki_get 호출 대기)
        </div>
      </div>
    );
  }

  const fm = page.frontmatter;
  const transformed = transformWikiLinks(page.body);

  return (
    <div className="pane-center">
      <div className="page-badges">
        <span className="badge badge-type">{fm.category ?? fm.type}</span>
        <span className={`badge badge-status-${fm.status}`}>{fm.status}</span>
        <span className="badge badge-meta">updated {fm.last_updated?.slice(0, 10)}</span>
        <span className="badge badge-meta">by {fm.author}</span>
      </div>
      <h1 className="page-title">{fm.title}</h1>
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith("#wiki:")) {
                const id = href.slice("#wiki:".length);
                const broken = !existingIds.has(id);
                return (
                  <span
                    className={`wiki-link ${broken ? "broken" : ""}`}
                    onClick={() => !broken && onNavigate(id)}
                    title={broken ? `깨진 링크: ${id}` : `${id} 페이지로 이동`}
                  >
                    {children}
                  </span>
                );
              }
              return (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              );
            },
          }}
        >
          {transformed}
        </ReactMarkdown>
      </div>
      {fm.tags?.length > 0 && (
        <div style={{ marginTop: 32, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {fm.tags.map((t: string) => (
            <span key={t} className="badge badge-meta" style={{ background: "var(--panel-alt)", border: "1px solid var(--border)", borderRadius: 4 }}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export type { PageType };
