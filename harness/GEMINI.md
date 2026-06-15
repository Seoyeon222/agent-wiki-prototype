# GEMINI.md
> Gemini 에이전트 전용 운영 지침. `AGENTS.md` + `RULES.md`를 먼저 읽은 뒤 적용한다.

---

## Gemini 특화 설정

### CLI 호출 방식 (R1 준수)

Chat Agent의 `tryCliEngine`은 `claude`가 없으면 `gemini` CLI를 시도한다:

```bash
gemini --model gemini-2.5-pro \
  --system "$(cat harness/CLAUDE_SYSTEM_PROMPT.txt)" \
  --prompt "<wiki 컨텍스트 + 사용자 질문>"
```

### Loop 대안: OS Scheduler (cron)

Claude Code의 Loop 기능 대신, `harness/hooks/watch-raw.sh`를 cron으로 등록해 `raw/` 폴더를
주기적으로 감시한다:

```bash
# crontab -e
*/5 * * * * cd /path/to/llm-wiki-mcp && bash harness/hooks/watch-raw.sh >> harness/journal.md 2>&1
```

### Wiki 작성 스타일

- Claude와 동일한 스키마(`schema/wiki_schema.md`) 사용.
- `--yolo` 모드는 읽기 전용 조회(`wiki_list`/`wiki_get`/`wiki_search`)에만 허용.
