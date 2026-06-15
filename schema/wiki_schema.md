# Wiki Page Schema
> 모든 LLM Wiki 페이지(`wiki/pages/*.md`, `wiki/people/*.md`)는 이 스키마를 따른다.
> 이 문서는 `tools/src/wikiStore.ts`의 검증(`validate`) 로직과 1:1로 대응한다.

---

## 1. 페이지 타입 / 카테고리

| type / category | 용도 | 저장 위치 | 예시 |
|------|------|---------|------|
| `concept` | 개념/용어 설명 | `wiki/pages/` | MCP, Hooks, SDLC |
| `pattern` | 재사용 가능한 워크플로우 패턴 | `wiki/pages/` | Agent Pool, Loop |
| `tool` | CLI/SDK/프로토콜 도구 | `wiki/pages/` | MCP, Subprocess Calling |
| `person` | 관련 인물 | `wiki/people/` | Andrej Karpathy |
| `case` | 실패/성공 사례 | `wiki/pages/` | - |
| `index` | 카테고리/전체 인덱스 | `wiki/pages/` | - |

> `type`과 `category`는 보통 동일한 값을 가지지만, `category`는 UI 그룹핑에 사용되고
> `type`은 본문 구조(섹션 템플릿) 결정에 사용된다. 둘 다 위 표의 값 중 하나여야 한다.

---

## 2. 페이지 Frontmatter (YAML, 필수 필드)

```yaml
---
id: <slug>                    # 유일한 식별자 (영문 소문자/숫자/하이픈)
title: <제목>
type: concept|pattern|tool|person|case|index
category: concept|pattern|tool|person|case|index   # type과 동일 권장
tags: [tag1, tag2, ...]       # 검색용 태그 (문자열만, 숫자/연도는 따옴표로: "2024")
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
author: human|llm:<model>
status: active|draft|deprecated
related: [page_id1, page_id2]  # 연관 페이지 id 목록 (없으면 빈 배열 [])
---
```

`wiki_validate`는 위 9개 필드가 모두 존재하는지 검사한다 (`schema_errors`).

---

## 3. 페이지 본문 구조 (타입별 템플릿)

새 페이지는 `wiki_create`(raw → draft) 시 아래 템플릿으로 자동 생성된다
(`tools/src/wikiStore.ts`의 `renderBody`).

### concept
```markdown
## 개요
한 문단으로 핵심 개념 요약

## 상세 설명
개념의 배경, 동작 원리, 의의

## 관련 개념
- [[page_id]] — 한 줄 설명
```

### pattern
```markdown
## 목표
이 패턴이 해결하는 문제

## 절차
단계별 설명

## 관련 개념
- [[page_id]] — 한 줄 설명
```

### tool
```markdown
## 개요
도구/프로토콜 설명

## 상세
사용법, 예시 코드

## 관련 개념
- [[page_id]]
```

### person
```markdown
## 한 줄 정의
## 설명
## 관련
## 출처
```

### case
```markdown
## 상황 설명
## 원인 분석
## 교훈
```

---

## 4. 인터링크 규칙

- 같은 Wiki 내 페이지 참조: `[[page_id]]` — 클라이언트에서 클릭 가능한 링크로 렌더링된다.
- 참조 대상이 존재하지 않으면 `wiki_validate`의 `broken_links`에 기록되고, UI에서 빨간색으로
  표시된다 (생성은 막지 않음 — RULES.md R5).
- 외부 URL: `[표시텍스트](URL)`

---

## 5. 품질 기준 (`wiki_validate` 체크리스트)

- [ ] frontmatter 9개 필드가 모두 존재하는가? (`schema_errors`)
- [ ] 본문이 50 단어 이상인가? (`schema_errors: "too short"`)
- [ ] `[[id]]` 링크가 모두 존재하는 페이지를 가리키는가? (`broken_links`)
- [ ] `status: draft` 페이지는 사람이 검토 후 `active`로 전환했는가? (수동 절차, R3)

---

## 6. raw/ → wiki/ 변환 규칙 (ingest)

`raw/`에 넣은 `.txt`/`.md` 파일은 다음 규칙으로 변환된다 (`wikiStore.createOrUpdate`,
`harness/hooks/watch-raw.sh`):

1. **제목**: 파일의 첫 줄 (마크다운 헤딩 기호 제거)
2. **id (slug)**: 제목을 소문자/하이픈으로 변환. 한글만 있으면 `page-<timestamp>`.
3. **category 추론**: 본문 키워드 기반 (`how to/방법` → pattern, `api/tool` → tool,
   `실패/오류/case` → case, `인물/researcher` → person, 그 외 → concept)
4. **tags 추론**: 사전 정의된 키워드 목록과의 교집합 (최대 5개, 없으면 `general`)
5. **status**: 항상 `draft`로 시작
6. 처리 완료 후 원본은 `raw/.processed/`로 이동 (R4)
