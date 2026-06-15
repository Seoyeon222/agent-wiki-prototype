# CLAUDE.md
> Claude 에이전트 전용 운영 지침. `AGENTS.md` + `RULES.md`를 먼저 읽은 뒤 적용한다.

---

## Claude 특화 설정

### CLI 호출 방식 (R1 준수)

Chat Agent는 다음과 같이 `claude` CLI를 subprocess로 호출한다
(`tools/src/agents/chatAgent.ts`의 `tryCliEngine` 참고):

```bash
claude --print --no-stream \
  --append-system-prompt "$(cat harness/CLAUDE_SYSTEM_PROMPT.txt)" \
  "<wiki 컨텍스트 + 사용자 질문>"
```

- `--print --no-stream`: 비대화형으로 결과만 표준출력에 받는다.
- CLI가 설치되어 있지 않거나 타임아웃되면, `wikiStore.search` 기반 규칙 폴백으로 전환한다.

### Plan Mode

- 새 페이지의 frontmatter/구조를 변경하는 작업은 먼저 Plan(어떤 페이지를 어떻게 바꿀지)을
  `harness/journal.md`에 기록한 뒤 진행한다.
- `--dangerously-skip-permissions`는 사용하지 않는다.

### Hook 등록 예시 (`.claude/settings.json` 또는 동급 설정)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "wiki_create",
        "hooks": [{ "type": "command", "command": "bash harness/hooks/post-tool-use-validate.sh" }]
      }
    ],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "bash harness/hooks/watch-raw.sh" }] }
    ]
  }
}
```

### Wiki 작성 스타일

- 한국어 설명 + 영어 기술 용어 혼용.
- 페이지 본문 250~800 단어.
- `[[id]]` 인터링크는 실제 존재하는(또는 향후 생성 예정인) id만 사용.
