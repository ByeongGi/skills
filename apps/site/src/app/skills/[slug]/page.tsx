import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Download } from "lucide-react";
import { getRegistry } from "@/lib/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SkillViewer from "@/components/SkillViewer";
import InstallGuide from "@/components/InstallGuide";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://byeonggi.github.io/skills";

export async function generateStaticParams() {
  const registry = await getRegistry();
  return registry.skills.map((s) => ({ slug: s.slug }));
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const registry = await getRegistry();
  const skill = registry.skills.find((s) => s.slug === slug);
  if (!skill) notFound();

  const tags: string[] = [];
  if (skill.hasScripts) tags.push("scripts");
  if (skill.hasReferences) tags.push("references");
  if (skill.hasAssets) tags.push("assets");

  const raw = skill.content ?? "";

  return (
    <div className="py-8 pb-16">
      {/* Breadcrumb */}
      <p className="text-sm text-[var(--color-muted)] mb-5">
        <Link href="/" className="hover:text-[var(--color-accent)]">
          스킬 목록
        </Link>
        {" / "}
        <span className="text-[var(--color-foreground)]">{skill.name}</span>
      </p>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2">{skill.name}</h1>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 items-center text-sm text-[var(--color-muted)] mb-4">
        <span>
          {skill.source.provider}/{skill.source.owner}/{skill.source.repo}
        </span>
        <span>·</span>
        <span>{new Date(skill.updatedAt).toLocaleDateString("ko-KR")}</span>
        {tags.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>

      <p className="text-[var(--color-muted)] mb-6">{skill.description}</p>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button asChild variant="outline" size="sm">
          <a href={`${SITE_URL}/downloads/${skill.slug}/SKILL.md`} download>
            <Download className="w-3.5 h-3.5" />
            SKILL.md 다운로드
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={skill.source.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
            원본 레포 보기
          </a>
        </Button>
      </div>

      {/* Install guide */}
      <InstallGuide slug={skill.slug} source={skill.source} />

      {/* Content viewer */}
      <SkillViewer content={raw} raw={raw} />
    </div>
  );
}
