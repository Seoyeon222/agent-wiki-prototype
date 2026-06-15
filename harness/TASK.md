# TASK.md — 현재 작업 체크리스트
> Contract: append-only. 완료 항목은 삭제하지 않고 [x]로 표시한다.

---

## 15주차 (과제2, 공지 요구사항 반영판)

- [x] harness/ 구조 통합 (AGENTS/CLAUDE/GEMINI/RULES + hooks/)
- [x] raw/ 디렉토리 + ingest 경로 (`wiki_create`)
- [x] schema/wiki_schema.md
- [x] hooks/post-tool-use-validate.sh (wiki_create → wiki_validate)
- [x] hooks/watch-raw.sh (raw/ 감시 → ingest, --loop 지원)
- [x] Chat Agent: subprocess(CLI) 우선 + 큐(inbox/outbox) 기반 + 규칙 폴백
- [x] Edit Agent: wiki_create(draft) + wiki_validate, journal 기록
- [x] 3-pane 웹 뷰어 (페이지 목록 / 본문 / 에이전트 패널, 큐 폴링)
- [x] README.md: 30분 Quick Start (raw → wiki → 화면 확인)
- [x] demo/ 스크린샷 (실제 서버+클라이언트 동작 화면, raw→draft→agent 질의까지 캡처 완료)

---

## 16주차 (최종 통합)
- [x] server/ → tools/ 디렉토리 재구성 (공지 표현과 일치, 전체 참조 업데이트 + 재빌드 검증)
- [x] harness/hooks/post-tool-use-validate.sh 오타 수정 및 재테스트
- [x] README.md 16주차 최종본 재작성 (harness/LLM Wiki/시각화 도구/demo 구조 명시)
- [x] GitHub public repo 구조로 패키징 (node_modules/dist 제외, clone 후 즉시 빌드 가능)
- [x] 제출 양식(SUBMISSION.md) 작성 (학번/이름/깃허브 주소/공개 여부 — placeholder)
