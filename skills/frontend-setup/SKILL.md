---
name: frontend-setup
description: |
  프론트엔드 필수 스킬을 한 번에 설치합니다. "프론트엔드 스킬 설치", "프론트 스킬 셋업",
  "frontend skills 설치해줘", "React/Next.js 스킬 세팅" 같은 요청에 활성화됩니다.
  package.json을 분석해 스택에 맞는 스킬 목록을 추천하고 설치합니다.
---

# Frontend Setup

## When to Use

- "프론트엔드 스킬 설치해줘", "frontend skills setup" 등 프론트엔드 스킬 일괄 설치 요청 시
- 새 프로젝트에서 에이전트 스킬 환경을 처음 구성할 때
- 스킬을 최신 상태로 맞추고 싶을 때

## How It Works

`package.json 분석` → `스택 감지` → `스킬 설치` → `MCP 설정` → `결과 확인`

## Steps

### 1. 스택 감지

현재 디렉터리의 `package.json`을 읽어 다음을 확인합니다:

- **Framework**: `next` 포함 여부 (Next.js vs Vite/React)
- **TypeScript**: `typescript` devDependency 포함 여부

`package.json`이 없으면 사용자에게 스택을 직접 물어봅니다.

### 2. 스킬 설치

아래 순서대로 모든 스킬을 설치합니다.

#### Core (항상 설치)

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -y
npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns -y
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -y
npx skills add vercel/components.build --skill building-components -y
npx skills add vercel-labs/agent-browser -y
npx skills add vercel-labs/skills --skill find-skills -y
npx skills add vercel/turborepo -y
npx skills add https://github.com/figma/mcp-server-guide --skill implement-design -y
```

| 스킬 | 역할 |
|------|------|
| `vercel-react-best-practices` | React/Next.js 성능 최적화 40+ 규칙 |
| `web-design-guidelines` | 접근성 + UX 100+ 가이드라인 |
| `building-components` | 접근 가능하고 컴포저블한 UI 컴포넌트 작성 가이드 |
| `agent-browser` | 브라우저 자동화 — 폼 입력, 클릭, 스크린샷, 데이터 추출 |
| `find-skills` | 필요한 스킬을 검색하고 설치 제안 |
| `turborepo` | Turborepo 모노레포 태스크 파이프라인, 캐시, CI 최적화 |
| `implement-design` | Figma 디자인을 코드로 구현 (Figma MCP 서버 필요) |

#### Next.js 프로젝트일 때 추가 설치

```bash
npx skills add vercel-labs/next-skills --skill next-best-practices -y
npx skills add vercel-labs/next-skills --skill next-cache-components -y
```

| 스킬 | 역할 |
|------|------|
| `next-best-practices` | App Router, RSC, 데이터 패턴, 메타데이터 |
| `next-cache-components` | PPR, `use cache`, cacheLife/cacheTag |

### 3. MCP 설정

#### 프로젝트별 MCP (`.mcp.json`에 저장)

```bash
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
claude mcp add serena uvx -- --from git+https://github.com/oraios/serena serena start-mcp-server
```

| MCP | 역할 |
|-----|------|
| `@playwright/mcp` | 브라우저 테스트, E2E 자동화 |
| `chrome-devtools-mcp` | Chrome DevTools 연동 — 콘솔, 네트워크, DOM 검사 |
| `serena` | 심볼 기반 코드 탐색·편집, 30+ 언어 지원 |

#### 유저 글로벌 MCP (`--scope user`, 모든 프로젝트 공유)

```bash
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

| MCP | 역할 |
|-----|------|
| `figma` | Figma 디자인 레이어 → 코드 변환 (Figma 로그인 필요) |

### 4. 설치 결과 확인

```bash
npx skills list
```

설치된 스킬 목록을 출력하고 완료를 알립니다.

## Notes

- 스킬: `-y` 플래그로 확인 프롬프트를 건너뜁니다
- 스킬은 이미 설치되어 있어도 안전하게 재설치(idempotent)됩니다
- MCP는 프로젝트 루트 `.mcp.json`에 저장해 프로젝트별로 격리합니다
