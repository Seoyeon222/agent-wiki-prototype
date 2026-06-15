#!/usr/bin/env bash
# harness/hooks/post-tool-use-validate.sh
#
# PostToolUse Hook: wiki_create 호출 직후 실행되어 wiki_validate를 호출하고
# 결과를 harness/journal.md에 append-only로 기록한다.
#
# Usage:
#   bash harness/hooks/post-tool-use-validate.sh <page_id>
#   bash harness/hooks/post-tool-use-validate.sh           # 전체 검사
#
# 동작 방식:
#   - MCP HTTP 서버(기본 http://localhost:8787)의 /mcp/tools/wiki_validate를 호출한다.
#   - 서버가 떠있지 않으면, 같은 로직을 Node 스크립트로 직접 실행한다 (fallback).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
JOURNAL="$ROOT_DIR/harness/journal.md"
PAGE_ID="${1:-}"
HTTP_BASE="${WIKI_HTTP_BASE:-http://localhost:8787}"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

run_via_http() {
  local body
  if [ -n "$PAGE_ID" ]; then
    body="{\"id\":\"$PAGE_ID\"}"
  else
    body="{}"
  fi
  curl -s -X POST "$HTTP_BASE/mcp/tools/wiki_validate" \
    -H "Content-Type: application/json" \
    -d "$body"
}

run_via_node_fallback() {
  node "$ROOT_DIR/tools/dist/cliValidate.js" "$PAGE_ID" 2>/dev/null || \
  node --experimental-strip-types "$ROOT_DIR/tools/src/cliValidate.ts" "$PAGE_ID" 2>/dev/null || \
  echo '{"ok":false,"error":"validate runner not available (run: cd tools && npm install && npm run build)"}'
}

RESULT="$(run_via_http || true)"
if [ -z "$RESULT" ] || echo "$RESULT" | grep -q "Couldn't connect\|curl:"; then
  RESULT="$(run_via_node_fallback)"
fi

{
  echo ""
  echo "## $(ts) | hook: post-tool-use-validate | page_id=${PAGE_ID:-<all>}"
  echo '```json'
  echo "$RESULT"
  echo '```'
} >> "$JOURNAL"

echo "$RESULT"
