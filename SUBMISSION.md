# 제출 양식 (Final Submission)

> 아래 4개 항목을 본인 정보로 채운 뒤, 이 파일(`SUBMISSION.md`)만 별도로 공지사항/제출란에
> 제출하면 됩니다. (이 파일은 repo에도 포함되어 있지만, 제출은 본문 텍스트만으로도 가능합니다.)

---

<학번>

<이름>

<깃허브 주소>

<공개 여부 : 예 / 아니오>

---

## 작성 가이드 (제출 전 확인)

1. **학번 / 이름**: 본인 정보로 교체하세요.

2. **깃허브 주소**: 이 프로젝트(`llm-wiki-mcp/` 디렉토리 전체)를 GitHub repo로 push한 뒤,
   해당 repo의 URL을 적으세요. 예: `https://github.com/<username>/<repo-name>`
   - **검색 회피 권장**: 공지에 따라 repo 이름/설명에 "CSE3308", "인하대학교", "시스템분석"
     같은 단어를 넣지 않는 것을 권장합니다. (이 프로젝트의 코드/문서에는 위 단어들이
     포함되어 있지 않습니다 — 필요시 repo description만 일반적인 문구로 작성하세요.)
   - repo는 README.md의 §0 Quick Start만으로 clone 후 30분 내 실행 가능해야 합니다.

3. **공개 여부**:
   - **예 (Public)**: 채점 시 약 2점 가점. repo를 Public으로 설정하고, 공지사항에서
     링크가 공개될 수 있음에 동의하는 것입니다. (6월이 지나면 Private로 전환 가능)
   - **아니오 (Private)**: ⚠️ **Private repo는 0점 처리**됩니다 — 반드시 Public으로
     설정하거나, "예"를 선택할 수 없는 경우 강의 안내를 다시 확인하세요.

---

## repo 푸시 체크리스트 (제출 전 1회 점검)

```bash
# 1) 빌드 산출물 제외 확인 (.gitignore에 이미 포함됨)
#    node_modules/, dist/, *.tsbuildinfo, tools/queue/*.json, raw/.processed/*

# 2) 클린 클론으로 재현성 검증
git clone <YOUR_REPO_URL> /tmp/clone-test
cd /tmp/clone-test
cd tools  && npm install && npm run build && cd ..
cd client && npm install && cd ..
cd tools && node dist/cliValidate.js   # { "ok": true, ... } 확인

# 3) README.md §0 Quick Start 순서대로 30분 내 실행되는지 확인
```

---

## 이 repo가 포함하는 것 (공지 Package 체크리스트)

- [x] **하네스**: `harness/AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `RULES.md`, `TASK.md`,
      `journal.md` + Hook 2개 (`harness/hooks/watch-raw.sh`, `post-tool-use-validate.sh`)
- [x] **LLM Wiki**: `raw/`, `wiki/` (12+ 페이지), `schema/wiki_schema.md` + 뷰어(`client/`)
- [x] **시각화 도구**: `tools/`(MCP 서버, Tool 5종) + `client/`(3-pane 뷰어, 에이전트가
      stdio MCP로도 접근 가능)
- [x] **README.md**: 30분 온보딩 가이드, MCP Tool 목록/동작, 자료 투입 방법, 검증 방법,
      환경/의존성
- [x] **demo/**: 실제 동작 화면 캡처 PNG (`mvp_screenshot.png`) + 재현 절차(`demo/README.md`)
