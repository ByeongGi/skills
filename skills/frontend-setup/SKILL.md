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

MCP는 **프로젝트별**로 구성합니다. 프로젝트 루트의 `.mcp.json`을 생성하거나 업데이트합니다.

> **주의**: `.mcp.json`은 `.gitignore`에 추가하거나, API 키는 반드시 환경변수로 관리하세요.

#### Core MCP (항상 추가)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "comment": "브라우저 테스트 및 자동화"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "comment": "PR/이슈 관리, 코드 리뷰"
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "${FIGMA_API_KEY}"
      },
      "comment": "Figma 디자인 → 코드 변환"
    }
  }
}
```

#### Next.js 프로젝트일 때 추가

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"],
      "comment": "런타임 에러, 라우트, 로그 — Next.js dev 서버 자동 연결"
    }
  }
}
```

| MCP | 역할 | 필요 환경변수 |
|-----|------|--------------|
| `@playwright/mcp` | 브라우저 테스트, E2E 자동화 | 없음 |
| `@modelcontextprotocol/server-github` | PR/이슈 관리, 코드 검색 | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| `figma-developer-mcp` | Figma 디자인 레이어 → 코드 | `FIGMA_API_KEY` |
| `next-devtools-mcp` | Next.js 런타임 진단 (Next.js 전용) | 없음 |

환경변수가 필요한 MCP는 사용자에게 값을 입력받아 `.env.local`에 추가하도록 안내합니다.

### 4. 설치 결과 확인

```bash
npx skills list
```

설치된 스킬 목록을 출력하고 완료를 알립니다.

## Notes

- 스킬: `-y` 플래그로 확인 프롬프트를 건너뜁니다
- 스킬은 이미 설치되어 있어도 안전하게 재설치(idempotent)됩니다
- MCP는 프로젝트 루트 `.mcp.json`에 저장해 프로젝트별로 격리합니다
- API 키는 `.env.local`에 보관하고 `.gitignore`에 추가합니다
