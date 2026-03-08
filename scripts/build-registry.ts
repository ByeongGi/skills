#!/usr/bin/env tsx
/**
 * 빌드 타임 스크립트: skills/ → public/registry.json + public/downloads/ 생성
 * 사용: pnpm --filter @byeonggi/skills-site exec tsx ../../scripts/build-registry.ts
 */

import fs from "fs";
import path from "path";
import { buildRegistry } from "../apps/site/src/lib/registry";

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  console.log("[build-registry] 스킬 수집 시작:", repoRoot);

  const registry = await buildRegistry(repoRoot);
  console.log(`[build-registry] ${registry.skills.length}개 스킬 수집 완료`);

  // public/registry.json 저장
  const publicDir = path.join(repoRoot, "apps", "site", "public");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(
    path.join(publicDir, "registry.json"),
    JSON.stringify(registry, null, 2),
    "utf-8"
  );
  console.log("[build-registry] public/registry.json 생성 완료");

  // public/downloads/{slug}/SKILL.md 복사
  const downloadsDir = path.join(publicDir, "downloads");
  for (const skill of registry.skills) {
    const destDir = path.join(downloadsDir, skill.slug);
    fs.mkdirSync(destDir, { recursive: true });

    const skillMdPath = path.join(repoRoot, "skills", skill.name, "SKILL.md");
    if (fs.existsSync(skillMdPath)) {
      fs.copyFileSync(skillMdPath, path.join(destDir, "SKILL.md"));
    }
  }
  console.log("[build-registry] public/downloads/ 복사 완료");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
