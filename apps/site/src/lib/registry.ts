import fs from "fs";
import path from "path";
import type { Registry, Skill, SkillSource } from "@/types/skill";
import { parseSkillMd, slugify } from "./skills";

// ──────────────────────────────────────────────
// 환경변수 파싱
// ──────────────────────────────────────────────

interface SourceConfig {
  provider: SkillSource["provider"];
  owner: string;
  repo: string;
}

function parseSkillSources(): SourceConfig[] {
  const raw = process.env.SKILL_SOURCES ?? "";
  if (!raw) return [];

  return raw.split(",").map((s) => {
    const [providerPart, ownerRepo] = s.trim().split(":");
    if (!providerPart || !ownerRepo) {
      throw new Error(`잘못된 SKILL_SOURCES 항목: "${s}"`);
    }
    const [owner, repo] = ownerRepo.split("/");
    if (!owner || !repo) {
      throw new Error(`잘못된 SKILL_SOURCES 항목 (owner/repo): "${s}"`);
    }
    return {
      provider: providerPart as SkillSource["provider"],
      owner,
      repo,
    };
  });
}

// ──────────────────────────────────────────────
// 로컬 skills/ 디렉토리에서 수집 (로컬 전용)
// ──────────────────────────────────────────────

function collectLocalSkills(skillsDir: string): Skill[] {
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills: Skill[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) continue;

    const raw = fs.readFileSync(skillMdPath, "utf-8");
    let parsed;
    try {
      parsed = parseSkillMd(raw);
    } catch {
      console.warn(`[registry] ${entry.name}/SKILL.md 파싱 실패, 건너뜀`);
      continue;
    }

    const skillDir = path.join(skillsDir, entry.name);
    const hasScripts = fs.existsSync(path.join(skillDir, "scripts"));
    const hasReferences = fs.existsSync(path.join(skillDir, "references"));
    const hasAssets = fs.existsSync(path.join(skillDir, "assets"));

    const stat = fs.statSync(skillMdPath);
    const slug = slugify(parsed.frontmatter.name) || slugify(entry.name);

    skills.push({
      slug,
      name: parsed.frontmatter.name,
      description: parsed.frontmatter.description,
      source: {
        provider: "github",
        owner: process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "byeonggi",
        repo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "skills",
        url: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "byeonggi"}/${process.env.NEXT_PUBLIC_GITHUB_REPO ?? "skills"}/tree/main/skills/${entry.name}`,
      },
      hasScripts,
      hasReferences,
      hasAssets,
      updatedAt: stat.mtime.toISOString(),
      content: parsed.content,
    });
  }

  return skills;
}

// ──────────────────────────────────────────────
// 원격 레포 API 수집
// ──────────────────────────────────────────────

async function fetchGitHubSkills(
  owner: string,
  repo: string,
  token?: string
): Promise<Skill[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const apiBase = "https://api.github.com";
  const res = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/skills`, {
    headers,
  });
  if (!res.ok) {
    console.warn(`[registry] GitHub API 오류 ${owner}/${repo}: ${res.status}`);
    return [];
  }
  const dirs = (await res.json()) as Array<{ name: string; type: string }>;

  const skills: Skill[] = [];

  for (const dir of dirs) {
    if (dir.type !== "dir") continue;

    const mdRes = await fetch(
      `${apiBase}/repos/${owner}/${repo}/contents/skills/${dir.name}/SKILL.md`,
      { headers }
    );
    if (!mdRes.ok) continue;

    const mdJson = (await mdRes.json()) as { content: string; encoding: string };
    const raw = Buffer.from(mdJson.content, "base64").toString("utf-8");

    let parsed;
    try {
      parsed = parseSkillMd(raw);
    } catch {
      console.warn(`[registry] ${dir.name}/SKILL.md 파싱 실패, 건너뜀`);
      continue;
    }

    // scripts / references / assets 존재 여부 확인
    const [scriptsRes, refsRes, assetsRes] = await Promise.all([
      fetch(
        `${apiBase}/repos/${owner}/${repo}/contents/skills/${dir.name}/scripts`,
        { headers }
      ),
      fetch(
        `${apiBase}/repos/${owner}/${repo}/contents/skills/${dir.name}/references`,
        { headers }
      ),
      fetch(
        `${apiBase}/repos/${owner}/${repo}/contents/skills/${dir.name}/assets`,
        { headers }
      ),
    ]);

    const slug = slugify(parsed.frontmatter.name) || slugify(dir.name);

    skills.push({
      slug,
      name: parsed.frontmatter.name,
      description: parsed.frontmatter.description,
      source: {
        provider: "github",
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}/tree/main/skills/${dir.name}`,
      },
      hasScripts: scriptsRes.ok,
      hasReferences: refsRes.ok,
      hasAssets: assetsRes.ok,
      updatedAt: new Date().toISOString(),
      content: parsed.content,
    });
  }

  return skills;
}

// ──────────────────────────────────────────────
// slug 충돌 해소
// ──────────────────────────────────────────────

function deduplicateSlugs(skills: Skill[]): Skill[] {
  const seen = new Map<string, number>();
  return skills.map((skill) => {
    const count = seen.get(skill.slug) ?? 0;
    seen.set(skill.slug, count + 1);
    if (count === 0) return skill;

    // 충돌 시 {provider}-{owner}-{slug}
    const ns = `${skill.source.provider}-${skill.source.owner}-${skill.slug}`;
    return { ...skill, slug: ns };
  });
}

// ──────────────────────────────────────────────
// 메인 엔트리: buildRegistry
// ──────────────────────────────────────────────

export async function buildRegistry(repoRoot: string): Promise<Registry> {
  const sources = parseSkillSources();
  const allSkills: Skill[] = [];

  // 로컬 skills/ 우선 수집
  const localSkillsDir = path.join(repoRoot, "skills");
  const localSkills = collectLocalSkills(localSkillsDir);
  allSkills.push(...localSkills);

  // 원격 소스 수집
  for (const src of sources) {
    if (src.provider === "github") {
      const token = process.env.GITHUB_TOKEN;
      const remote = await fetchGitHubSkills(src.owner, src.repo, token);
      allSkills.push(...remote);
    } else {
      console.warn(
        `[registry] ${src.provider} 프로바이더는 아직 미지원입니다.`
      );
    }
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    skills: deduplicateSlugs(allSkills),
  };
}

// ──────────────────────────────────────────────
// 빌드 타임 스킬 로드 헬퍼 (Next.js SSG용)
// ──────────────────────────────────────────────

let _registry: Registry | null = null;

export async function getRegistry(): Promise<Registry> {
  if (_registry) return _registry;

  // public/registry.json 이 있으면 읽기 (pre-generated)
  const publicPath = path.join(process.cwd(), "public", "registry.json");
  if (fs.existsSync(publicPath)) {
    const raw = fs.readFileSync(publicPath, "utf-8");
    _registry = JSON.parse(raw) as Registry;
    return _registry;
  }

  // 없으면 동적 생성 (로컬 개발용)
  const repoRoot = path.join(process.cwd(), "..", "..");
  _registry = await buildRegistry(repoRoot);
  return _registry;
}
