// client/src/App.tsx
import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import { PageList } from "./components/PageList";
import { PageView } from "./components/PageView";
import { ChatPanel } from "./components/ChatPanel";
import type { WikiListItem, WikiGetOutput, ValidationResult } from "./shared/types";

export default function App() {
  const [pages, setPages] = useState<WikiListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageData, setPageData] = useState<WikiGetOutput | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  const refreshList = useCallback(async () => {
    try {
      const [listRes, validateRes] = await Promise.all([api.list(), api.validate()]);
      setPages(listRes.pages);
      setValidation(validateRes);
      setServerOk(true);
    } catch {
      setServerOk(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId) return;
    setPageLoading(true);
    api
      .get(selectedId)
      .then(setPageData)
      .finally(() => setPageLoading(false));
  }, [selectedId]);

  // 초기 진입 시 첫 페이지 자동 선택
  useEffect(() => {
    if (pages.length > 0 && !selectedId) {
      setSelectedId(pages[0].id);
    }
  }, [pages, selectedId]);

  const existingIds = new Set(pages.map((p) => p.id));

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-title">
          <span className="logo-dot" />
          LLM Wiki — Agentic Coding &amp; LLM Workflow
        </div>
        <div className="topbar-status">
          <span>{pages.length} pages</span>
          {serverOk === null ? (
            <span>checking server…</span>
          ) : serverOk ? (
            validation?.ok ? (
              <span className="status-ok">● validate OK</span>
            ) : (
              <span className="status-bad">
                ●{" "}
                {validation
                  ? validation.broken_links.length + validation.schema_errors.length
                  : "?"}{" "}
                issues
              </span>
            )
          ) : (
            <span className="status-bad">● MCP server unreachable (localhost:8787)</span>
          )}
          <span>agent: wiki_chat_agent / wiki_edit_agent</span>
        </div>
      </div>

      <div className="layout">
        <PageList pages={pages} selectedId={selectedId} onSelect={setSelectedId} />
        <PageView
          page={pageData}
          loading={pageLoading}
          existingIds={existingIds}
          onNavigate={setSelectedId}
        />
        <ChatPanel onWikiChanged={refreshList} />
      </div>
    </div>
  );
}
