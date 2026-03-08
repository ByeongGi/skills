export interface SkillSource {
  provider: "github" | "gitlab" | "gitea" | "bitbucket";
  owner: string;
  repo: string;
  url: string;
}

export interface Skill {
  slug: string;
  name: string;
  description: string;
  source: SkillSource;
  hasScripts: boolean;
  hasReferences: boolean;
  hasAssets: boolean;
  updatedAt: string;
  content?: string;
}

export interface Registry {
  version: string;
  generatedAt: string;
  skills: Skill[];
}

export interface SkillFrontmatter {
  name: string;
  description: string;
}
