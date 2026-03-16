---
name: youtube-transcript
description: |
  YouTube 영상의 자막을 추출하고 번역·요약·저장할 때 사용합니다.
  "유튜브 자막", "이 영상 내용 알려줘", "transcript", "자막 추출", "영상 요약",
  "유튜브 번역", YouTube URL 또는 영상 ID가 포함된 요청에 활성화됩니다.
compatibility:
  runtime: node>=18
---

# YouTube Transcript

YouTube 영상에서 자막을 추출하고 번역·요약·저장합니다.

## Available scripts

- **`scripts/fetch-transcript.mjs`** — YouTube 자막을 추출해 JSON으로 출력

## 1. 입력 확인

시작 전에 아래 항목을 확인합니다. 없는 항목은 사용자에게 묻습니다.

| 항목 | 기본값 | 설명 |
|------|--------|------|
| `url` 또는 `videoId` | — | **필수** |
| `lang` | `ko` | 자막 언어 코드 (`ko`, `en`, `ja` 등) |
| `actions` | `summarize` | 원문 저장 후 수행할 작업: `translate` / `summarize` |
| `translateTo` | — | 번역 대상 언어 (예: `한국어`, `영어`). `translate` 액션 시 필수 |
| `outputDir` | `./transcripts` | 파일 저장 경로 |

---

## 2. 트랜스크립트 추출 및 원문 저장

`--help`로 스크립트 인터페이스를 확인합니다:

```bash
node scripts/fetch-transcript.mjs --help
```

추출:

```bash
node scripts/fetch-transcript.mjs --video <videoId|url> --lang <lang> [--auto]
```

**출력 (stdout, JSON):**

```json
{
  "videoId": "dQw4w9WgXcQ",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "lang": "ko",
  "isAuto": false,
  "charCount": 4821,
  "text": "자막 전체 내용..."
}
```

**진단 메시지는 stderr로 출력**되므로 stdout JSON만 파싱합니다.

**Exit codes:**

| 코드 | 의미 |
|------|------|
| 0 | 성공 |
| 1 | 해당 영상에 자막 없음 |
| 2 | 잘못된 인수 |
| 3 | 네트워크 오류 |

추출 즉시 원문을 파일로 저장합니다:

```bash
mkdir -p <outputDir>
```

파일명: `<outputDir>/<videoId>_transcript.md`

파일 형식:

```markdown
# YouTube Transcript — <videoId>

- **URL**: https://www.youtube.com/watch?v=<videoId>
- **언어**: <lang> (<자동생성> 또는 <수동>)
- **추출일**: <YYYY-MM-DD>

---

<text>
```

파일이 이미 존재하면 덮어쓰기 전 사용자에게 확인합니다.

---

## 3. 분석 (원문 파일 기반)

원문 파일 저장 후, 저장된 파일을 읽어 분석합니다. 메모리의 JSON이 아닌 **저장된 파일의 텍스트를 소스**로 사용합니다.

### 번역 (`translate` 액션)

```
다음은 YouTube 영상(ID: <videoId>)의 자막입니다.
<translateTo>로 자연스럽게 번역해주세요. 구어체를 유지하고 원문 의미를 보존하세요.

---
<파일에서 읽은 text>
```

결과를 `<outputDir>/<videoId>_translated.md`로 저장합니다.

### 요약 (`summarize` 액션)

번역본 파일이 있으면 번역본을, 없으면 원문 파일을 읽어 사용합니다:

```
다음은 YouTube 영상(ID: <videoId>)의 자막입니다. 아래 형식으로 요약해주세요.

## 핵심 주제
(1~2문장)

## 주요 내용
- (최대 7개 항목)

## 결론 / 인사이트
(2~3문장)

---
<파일에서 읽은 text>
```

결과를 `<outputDir>/<videoId>_summary.md`로 저장합니다.

---

## 4. 완료 안내

```
✅ 완료

📄 원문:   <outputDir>/<videoId>_transcript.md
🌐 번역본: <outputDir>/<videoId>_translated.md   ← translate 액션 시
📝 요약본: <outputDir>/<videoId>_summary.md      ← summarize 액션 시
```

---

## Rules

- 실행 전 `node --version`으로 Node.js 18+ 여부 확인
- 원문 파일 저장은 분석 전에 반드시 완료합니다
- 분석은 항상 저장된 파일을 읽어서 수행합니다 (메모리의 JSON text 직접 사용 금지)
- 스크립트 exit code 1이면 "해당 영상에 자막이 없습니다"를 사용자에게 안내
- 스크립트 exit code 3이면 네트워크 상태를 확인하도록 안내
- 번역·요약은 외부 API 없이 Claude가 직접 수행
