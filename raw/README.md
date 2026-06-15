# raw/

여기에 자신의 자료(`.txt` 또는 `.md`)를 넣고 다음을 실행하세요:

```bash
bash harness/hooks/watch-raw.sh
```

- 파일의 첫 줄이 Wiki 페이지 제목으로 사용됩니다.
- 변환된 페이지는 `wiki/pages/` (또는 `wiki/people/`)에 `status: draft`로 생성됩니다.
- 처리된 원본은 `raw/.processed/`로 이동합니다.
- 상시 감시하려면 `bash harness/hooks/watch-raw.sh --loop`

자세한 변환 규칙은 [`../schema/wiki_schema.md`](../schema/wiki_schema.md) §6 참고.
