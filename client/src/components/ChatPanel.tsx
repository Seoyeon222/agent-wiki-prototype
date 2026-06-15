// client/src/components/ChatPanel.tsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../api";

type Mode = "chat" | "edit";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool_calls?: { tool: string; args: Record<string, unknown> }[];
  confidence?: "high" | "medium" | "low";
  engine?: "cli" | "fallback" | "pending";
}

interface Props {
  onWikiChanged: () => void;
}

const EXAMPLE_QUERIES = [
  "SDLC란 무엇인가요?",
  "Vibe Coding과 Agentic Coding의 차이는?",
  "MCP는 왜 필요한가요?",
];

export function ChatPanel({ onWikiChanged }: Props) {
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "안녕하세요! 저는 **Wiki Chat Agent**입니다.\n\n" +
        "`wiki_search` → `wiki_get` Tool을 호출해 위키 내용을 근거로 답변합니다 (읽기 전용).\n\n" +
        "질문은 `tools/queue/inbox/`에 적재되고, `harness/hooks/watch-raw.sh --agent-mode`가 " +
        "이를 감지해 로컬 CLI(claude/codex/gemini)를 subprocess로 호출합니다. " +
        "CLI가 없으면 규칙 기반(`engine: fallback`)으로 즉시 응답합니다.\n\n" +
        "우측 상단에서 **Edit** 모드로 전환하면 `wiki_create` Tool로 새 페이지를 생성할 수 있어요 (Wiki Edit Agent, draft 생성).",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: query }]);
    setLoading(true);

    try {
      if (mode === "chat") {
        const result = await api.chat(query);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: result.answer,
            tool_calls: result.tool_calls,
            confidence: result.confidence,
            engine: result.engine,
          },
        ]);
      } else {
        const result = await api.edit({ raw: query, mode: "create" });
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: result.message,
            tool_calls: [
              { tool: "wiki_create", args: { mode: "create" } },
              { tool: "wiki_validate", args: { id: result.id } },
            ],
          },
        ]);
        onWikiChanged();
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `오류: ${(err as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pane-right">
      <div className="chat-header">
        <div className="chat-header-title">
          🤖 Wiki Agent
        </div>
        <div className="chat-mode-toggle">
          <button
            className={`chat-mode-btn ${mode === "chat" ? "active" : ""}`}
            onClick={() => setMode("chat")}
          >
            CHAT
          </button>
          <button
            className={`chat-mode-btn ${mode === "edit" ? "active" : ""}`}
            onClick={() => setMode("edit")}
          >
            EDIT
          </button>
        </div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === "user" ? "chat-msg-user" : "chat-msg-assistant"}`}>
            {m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0 && (
              <div className="chat-tool-log">
                {m.tool_calls.map((tc, j) => (
                  <span key={j} className="tool-call">
                    → <span className="tool-name">{tc.tool}</span>
                    {tc.args && Object.keys(tc.args).length > 0
                      ? `(${Object.entries(tc.args)
                          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                          .join(", ")})`
                      : "()"}
                  </span>
                ))}
              </div>
            )}
            {m.role === "assistant" ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
            {(m.confidence || m.engine) && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {m.confidence && (
                  <div className={`chat-confidence confidence-${m.confidence}`}>
                    confidence: {m.confidence}
                  </div>
                )}
                {m.engine && (
                  <div className="chat-confidence" style={{ color: "var(--text-faint)", background: "var(--panel-alt)" }}>
                    engine: {m.engine}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-loading">⋯ Tool 호출 중...</div>}
        {messages.length === 1 && mode === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                style={{
                  textAlign: "left",
                  background: "var(--panel-alt)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "var(--text-dim)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                }}
              >
                "{q}"
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <textarea
          placeholder={
            mode === "chat"
              ? "질문을 입력하세요 (예: SDLC란 무엇인가요?)"
              : "새 페이지로 만들 raw 텍스트를 입력하세요 (mode: create)"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="chat-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
          전송
        </button>
      </div>
    </div>
  );
}
