#!/usr/bin/env bash
# harness/hooks/watch-raw.sh
#
# 두 가지 역할을 한다 (둘 다 "메시지 인식 Shell 스크립트 + Subprocess" 패턴, RULES.md R1/R2):
#
# 1) (기본) raw/ 디렉토리 감시 → 새 파일 발견 시 wiki_create(mode=create)로 ingest
#    후 wiki_validate 자동 실행, 원본은 raw/.processed/로 이동.
#
# 2) (--agent-mode) tools/queue/inbox/*.json 감시 → 각 요청에 대해 로컬 CLI
#    (claude/codex/gemini)를 subprocess로 호출, 결과를 tools/queue/outbox/*.json에 기록.
#    CLI가 없으면 wiki_search 기반 규칙 응답으로 폴백.
#
# Usage:
#   bash harness/hooks/watch-raw.sh                 # raw/ 1회 스캔
#   bash harness/hooks/watch-raw.sh --loop          # raw/ 상시 감시 (5초 간격)
#   bash harness/hooks/watch-raw.sh --agent-mode        # inbox/ 1회 스캔
#   bash harness/hooks/watch-raw.sh --agent-mode --loop # inbox/ 상시 감시 (2초 간격)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
JOURNAL="$ROOT_DIR/harness/journal.md"
RAW_DIR="$ROOT_DIR/raw"
PROCESSED_DIR="$RAW_DIR/.processed"
INBOX_DIR="$ROOT_DIR/tools/queue/inbox"
OUTBOX_DIR="$ROOT_DIR/tools/queue/outbox"

AGENT_MODE=false
LOOP=false
for arg in "$@"; do
  case "$arg" in
    --agent-mode) AGENT_MODE=true ;;
    --loop) LOOP=true ;;
  esac
done

mkdir -p "$PROCESSED_DIR" "$INBOX_DIR" "$OUTBOX_DIR"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

journal() {
  {
    echo ""
    echo "## $(ts) | hook: watch-raw | $1"
    if [ -n "${2:-}" ]; then
      echo '```json'
      echo "$2"
      echo '```'
    fi
  } >> "$JOURNAL"
}

# ── 1) raw/ → wiki 변환 ───────────────────────────────────────────────
ingest_node() {
  local f="$1"
  # 우선 빌드된 dist 사용, 없으면 tsx로 직접 실행
  if [ -f "$ROOT_DIR/tools/dist/cliIngest.js" ]; then
    node "$ROOT_DIR/tools/dist/cliIngest.js" "$f"
  else
    (cd "$ROOT_DIR/tools" && npx -y tsx src/cliIngest.ts "$f")
  fi
}

scan_raw_once() {
  local found=0
  shopt -s nullglob
  for f in "$RAW_DIR"/*.txt "$RAW_DIR"/*.md; do
    [ -e "$f" ] || continue
    # raw/README.md는 안내 문서이므로 ingest 대상에서 제외한다.
    [ "$(basename "$f")" = "README.md" ] && continue
    found=1
    echo "[watch-raw] ingesting: $(basename "$f")"
    if result="$(ingest_node "$f")"; then
      journal "ingest $(basename "$f")" "$result"
      mv "$f" "$PROCESSED_DIR/"
      echo "$result"
    else
      journal "ingest FAILED $(basename "$f")" ""
      echo "[watch-raw] failed: $(basename "$f")" >&2
    fi
  done
  shopt -u nullglob
  return $((1 - found))
}

# ── 2) inbox/ → CLI subprocess → outbox/ ────────────────────────────
build_prompt() {
  # $1: 사용자 질문. wiki_search 결과 상위 페이지 본문을 컨텍스트로 첨부.
  local query="$1"
  local context
  if [ -f "$ROOT_DIR/tools/dist/cliSearch.js" ]; then
    context="$(node "$ROOT_DIR/tools/dist/cliSearch.js" "$query" 2>/dev/null || true)"
  else
    context="$(cd "$ROOT_DIR/tools" && npx -y tsx src/cliSearch.ts "$query" 2>/dev/null || true)"
  fi
  printf '다음은 LLM Wiki에서 검색된 관련 문서입니다.\n\n%s\n\n위 문서를 근거로 한국어로 답변하고, 마지막에 "출처: [[id]]" 형식으로 인용하세요.\n\n질문: %s\n' "$context" "$query"
}

call_cli() {
  # 사용 가능한 CLI를 순서대로 시도. 표준출력만 반환. 실패 시 비어있는 문자열.
  local prompt="$1"
  if command -v claude >/dev/null 2>&1; then
    claude --print --no-stream "$prompt" 2>/dev/null && return 0
  fi
  if command -v codex >/dev/null 2>&1; then
    codex exec --print "$prompt" 2>/dev/null && return 0
  fi
  if command -v gemini >/dev/null 2>&1; then
    gemini --prompt "$prompt" 2>/dev/null && return 0
  fi
  return 1
}

fallback_answer() {
  local query="$1"
  if [ -f "$ROOT_DIR/tools/dist/cliChatFallback.js" ]; then
    node "$ROOT_DIR/tools/dist/cliChatFallback.js" "$query"
  else
    (cd "$ROOT_DIR/tools" && npx -y tsx src/cliChatFallback.ts "$query")
  fi
}

process_inbox_once() {
  local found=0
  shopt -s nullglob
  for f in "$INBOX_DIR"/*.json; do
    [ -e "$f" ] || continue
    found=1
    local id query answer engine outfile
    id="$(basename "$f" .json)"
    query="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$f','utf-8')).query)" 2>/dev/null || true)"
    outfile="$OUTBOX_DIR/$id.json"

    if [ -z "$query" ]; then
      echo "[watch-raw] skip malformed inbox file: $f" >&2
      mv "$f" "$f.bad"
      continue
    fi

    prompt="$(build_prompt "$query")"
    if answer="$(call_cli "$prompt")" && [ -n "$answer" ]; then
      engine="cli"
    else
      answer="$(fallback_answer "$query")"
      engine="fallback"
    fi

    node -e "
      const fs = require('fs');
      const answer = fs.readFileSync(0, 'utf-8');
      fs.writeFileSync('$outfile', JSON.stringify({ id: '$id', engine: '$engine', answer }, null, 2));
    " <<< "$answer"

    journal "agent-reply id=$id engine=$engine" ""
    rm -f "$f"
  done
  shopt -u nullglob
  return $((1 - found))
}

# ── 메인 ──────────────────────────────────────────────────────────
if $AGENT_MODE; then
  if $LOOP; then
    echo "[watch-raw] agent-mode loop started (interval=2s). Ctrl-C to stop."
    while true; do
      process_inbox_once || true
      sleep 2
    done
  else
    process_inbox_once || echo "[watch-raw] inbox empty"
  fi
else
  if $LOOP; then
    echo "[watch-raw] raw/ loop started (interval=5s). Ctrl-C to stop."
    while true; do
      scan_raw_once || true
      sleep 5
    done
  else
    scan_raw_once || echo "[watch-raw] raw/ empty (nothing to ingest)"
  fi
fi
