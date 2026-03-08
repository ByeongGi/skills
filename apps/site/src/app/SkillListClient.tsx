"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SkillCard from "@/components/SkillCard";
import type { Skill } from "@/types/skill";

type Filter = "all" | "scripts" | "references" | "assets";

export default function SkillListClient({ skills }: { skills: Skill[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = skills;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    if (filter === "scripts") list = list.filter((s) => s.hasScripts);
    if (filter === "references") list = list.filter((s) => s.hasReferences);
    if (filter === "assets") list = list.filter((s) => s.hasAssets);
    return list;
  }, [skills, query, filter]);

  const filters: { label: string; value: Filter }[] = [
    { label: "전체", value: "all" },
    { label: "scripts", value: "scripts" },
    { label: "references", value: "references" },
    { label: "assets", value: "assets" },
  ];

  return (
    <div className="py-8">
      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <Input
            placeholder="스킬 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[var(--color-muted)] py-16">
          스킬이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {filtered.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} />
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--color-muted)] mt-8">
        총 {filtered.length}개 스킬
      </p>
    </div>
  );
}
