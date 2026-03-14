---
name: nextjs-init
description: |
  Use this skill whenever the user wants to start a brand-new web project from scratch.
  This covers: "새 nextjs 프로젝트 만들어줘", "프론트엔드 초기화해줘", "새 웹사이트 세팅",
  creating a portfolio/dashboard/landing page/admin panel as a new project,
  or scaffolding a Turborepo monorepo with a Next.js app.
  Trigger even when the user doesn't say "Next.js" explicitly — if they want a new
  React-based web app with TypeScript, Tailwind, or shadcn/ui, this skill applies.

  Do NOT use for: adding to or modifying an existing project, deployment,
  configuring individual packages, mobile apps, or non-Next.js frameworks (Remix, SvelteKit).

  Delivers: pnpm + TypeScript + App Router + Tailwind + shadcn/ui, single app or Turborepo monorepo.
---

# Next.js Init

먼저 두 가지를 확인합니다:
1. **프로젝트 이름** — kebab-case 권장 (예: `my-app`)
2. **구조** — 단일 앱 vs 모노레포 (Turborepo)

---

## 1. 프로젝트 생성

### 단일 앱

```bash
pnpm dlx create-next-app@latest <project-name> \
  --typescript --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --no-git
cd <project-name>
```

### 모노레포

```bash
pnpm dlx create-turbo@latest <project-name> --package-manager pnpm
cd <project-name>
rm -rf apps/docs
```

---

## 2. shadcn/ui 설치

실행 위치: 단일 앱은 프로젝트 루트, 모노레포는 `apps/web/`

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input card badge separator
```

---

## 3. Prettier 설정

### 설치

```bash
# 단일 앱 (루트)
pnpm add -D prettier eslint-config-prettier

# 모노레포 (루트, -w 플래그)
pnpm add -D prettier eslint-config-prettier -w
```

### `.prettierrc` — 단일 앱: 루트 / 모노레포: 루트

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### `.prettierignore`

| 단일 앱 | 모노레포 |
|---------|---------|
| `.next` | `**/.next` |
| `node_modules` | `**/node_modules` |
| `dist` | `**/dist` |
| `public` | `**/public` |

### `eslint.config.mjs` 전체 교체 — 단일 앱: 루트 / 모노레포: `apps/web/`

```js
import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import prettierConfig from "eslint-config-prettier"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettierConfig,
]
```

### `package.json` format 스크립트 추가

```json
// 단일 앱
"format": "prettier --write ."

// 모노레포 (루트)
"format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
```

---

## 4. .env.local 생성

위치: 단일 앱 → 루트 / 모노레포 → `apps/web/`

`.env.local` 및 `.env.local.example` 동일 내용으로 생성:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add your environment variables below
```

`.gitignore`에 `.env.local` 포함 여부 확인.
