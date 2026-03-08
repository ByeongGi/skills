import matter from "gray-matter";
import type { SkillFrontmatter } from "@/types/skill";

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  content: string;
}

export function parseSkillMd(raw: string): ParsedSkill {
  const { data, content } = matter(raw);

  if (!data.name || typeof data.name !== "string") {
    throw new Error("SKILL.md frontmatter에 'name' 필드가 필요합니다.");
  }
  if (!data.description || typeof data.description !== "string") {
    throw new Error("SKILL.md frontmatter에 'description' 필드가 필요합니다.");
  }

  return {
    frontmatter: {
      name: String(data.name).trim(),
      description: String(data.description).trim(),
    },
    content: content.trim(),
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
