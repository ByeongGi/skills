---
name: commit
description: |
  Git 커밋을 생성할 때 사용합니다. "커밋해줘", "변경사항 커밋", "commit"
  같은 요청에 활성화됩니다. 변경사항을 분석해 이모지 + Conventional Commits
  형식의 메시지를 작성하고, 논리적으로 분리 가능하면 여러 커밋으로 나눕니다.
---

# Commit

## When to Use

- 사용자가 "커밋해줘", "commit", "변경사항 저장해줘" 등을 요청할 때
- 작업이 완료되어 변경사항을 히스토리에 남겨야 할 때

## How It Works

`pre-commit 확인` → `스테이징` → `diff 분석` → `분할 여부 판단` → `커밋 메시지 생성` → `커밋` 순서로 진행합니다.

커밋 메시지는 **이모지 + Conventional Commits** 형식을 따릅니다.

## Steps

### 1. Pre-commit 확인 (`--no-verify` 없을 때)

```bash
pnpm lint      # 코드 품질 확인
pnpm build     # 빌드 성공 여부 확인
```

확인이 실패하면 어쨌든 커밋을 진행할지, 아니면 먼저 문제를 해결할지 사용자에게 묻습니다.

### 2. 스테이징 상태 확인

```bash
git status
git diff --staged
```

- 스테이징된 파일이 **있으면** 해당 파일만 커밋합니다.
- 스테이징된 파일이 **없으면** 수정·신규 파일을 자동으로 스테이징합니다.
  - `.env`, 시크릿, 대용량 바이너리 파일은 스테이징 전 사용자에게 경고합니다.

```bash
git add <file>  # 민감 파일 제외하고 선택적으로 추가
```

### 3. Diff 분석 및 커밋 분할 판단

```bash
git diff --staged
```

아래 기준으로 **여러 커밋**으로 분할할지 사용자에게 제안합니다.

| 기준 | 예시 |
|------|------|
| 서로 다른 관심사 | 기능 코드 + 문서 |
| 변경사항 유형 혼합 | feat + fix + refactor |
| 파일 패턴 차이 | 소스 코드 vs 설정 파일 |
| 크기가 매우 큰 변경 | 분할하면 리뷰가 쉬운 경우 |

### 4. 커밋 메시지 작성

형식: `<이모지> <type>(<scope>): <subject>`

**주요 타입 & 이모지**

| 이모지 | type | 용도 |
|--------|------|------|
| ✨ | `feat` | 새로운 기능 |
| 🐛 | `fix` | 버그 수정 |
| 🚑️ | `fix` | 중대한 핫픽스 |
| 🔒️ | `fix` | 보안 문제 수정 |
| 🩹 | `fix` | 중요하지 않은 간단한 수정 |
| 🚨 | `fix` | 린터/컴파일러 경고 수정 |
| ♻️ | `refactor` | 리팩터링 |
| 🏗️ | `refactor` | 아키텍처 변경 |
| 🚚 | `refactor` | 파일/리소스 이동·이름 변경 |
| ⰰ️ | `refactor` | 미사용 코드 제거 |
| 📝 | `docs` | 문서 변경 |
| 💡 | `docs` | 소스 코드 주석 추가·업데이트 |
| 🎨 | `style` | 코드 구조·포맷 개선 |
| 💄 | `style` | UI/스타일 변경 |
| ✅ | `test` | 테스트 추가·수정 |
| 🧪 | `test` | 실패하는 테스트 추가 |
| 📸 | `test` | 스냅샷 추가·업데이트 |
| 🔧 | `chore` | 빌드·도구·구성 변경 |
| 🙈 | `chore` | .gitignore 추가·업데이트 |
| ➕ | `chore` | 의존성 추가 |
| ➖ | `chore` | 의존성 제거 |
| 📌 | `chore` | 특정 버전으로 의존성 고정 |
| 📦️ | `chore` | 패키지·컴파일 파일 추가·업데이트 |
| 🔖 | `chore` | 릴리스·버전 태그 |
| 🎉 | `chore` | 프로젝트 시작 |
| 👷 | `ci` | CI 빌드 시스템 추가·업데이트 |
| 🚀 | `ci` | CI/CD 개선 |
| 💚 | `fix` | CI 빌드 수정 |
| ⏪️ | `revert` | 변경사항 되돌리기 |
| ⚡️ | `perf` | 성능 개선 |
| 🏷️ | `feat` | 타입 추가·업데이트 |
| 🦺 | `feat` | 검증 로직 추가·업데이트 |
| 📈 | `feat` | 분석·추적 코드 추가 |
| 🌐 | `feat` | 국제화·현지화 |
| ♿️ | `feat` | 접근성 개선 |
| 💥 | `feat` | Breaking change 도입 |
| 🚧 | `wip` | 작업 중 |

### 5. 커밋 실행

```bash
git commit -m "$(cat <<'EOF'
✨ feat(auth): Google OAuth 로그인 추가

기존 이메일 로그인과 병행 지원. 세션 만료 시 자동 재인증.
EOF
)"
```

### 6. 결과 확인

```bash
git log --oneline -5
```

## Examples

```
✨ feat(auth): add Google OAuth login
🐛 fix(api): resolve null pointer in user fetch
📝 docs: update README with new install steps
♻️ refactor(parser): simplify error handling logic
🚨 fix(lint): resolve ESLint warnings in components
🔒️ fix(auth): strengthen password validation rules
💥 feat(api)!: migrate to v2 endpoint — breaking change
```

**커밋 분할 예시** (하나의 PR에서 여러 커밋)

```
1. ✨ feat: add type definitions for new API endpoints
2. 🔧 chore: update package.json dependencies
3. ✅ test: add unit tests for new endpoint types
4. 📝 docs: document new API endpoint usage
5. 🚨 fix: resolve linting issues in new code
```

## Rules

- `--no-verify`는 사용자가 명시적으로 요청한 경우에만 사용
- 기존 published 커밋은 `--amend` 금지 — 항상 새 커밋 생성
- 빈 커밋(`--allow-empty`) 생성 금지
- `.env`, 시크릿, 대용량 바이너리는 커밋 전 경고
- 원격 push는 사용자가 별도 요청한 경우에만 실행
- pre-commit 훅 실패 시 `--no-verify` 우회 대신 원인 해결 우선

## Options

| 옵션 | 설명 |
|------|------|
| `--no-verify` | lint, build 등 pre-commit 확인 건너뜀 |
