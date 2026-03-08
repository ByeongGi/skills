import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/types/skill";

export default function SkillCard({ skill }: { skill: Skill }) {
  const tags: string[] = [];
  if (skill.hasScripts) tags.push("scripts");
  if (skill.hasReferences) tags.push("references");
  if (skill.hasAssets) tags.push("assets");

  return (
    <Link href={`/skills/${skill.slug}/`} className="block no-underline">
      <Card className="h-full flex flex-col cursor-pointer">
        <CardHeader className="flex-1">
          <CardTitle>{skill.name}</CardTitle>
          <CardDescription>{skill.description}</CardDescription>
        </CardHeader>
        {tags.length > 0 && (
          <CardContent>
            <div className="flex gap-1.5 flex-wrap">
              {tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
