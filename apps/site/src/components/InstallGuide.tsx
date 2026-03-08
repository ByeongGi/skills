"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://byeonggi.github.io/skills";

function CopyCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-md border border-[var(--color-border)] bg-[var(--color-background)] font-mono text-sm overflow-x-auto">
      <pre className="p-3 pr-12 whitespace-pre">{cmd}</pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded border border-[var(--color-border)] bg-[var(--color-tag)] px-2 py-0.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex items-center gap-1"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

export default function InstallGuide({
  slug,
  source,
}: {
  slug: string;
  source: { owner: string; repo: string };
}) {
  const npxCmd = `npx skills add https://github.com/${source.owner}/${source.repo} --skill ${slug} -a claude-code`;
  const curlCmd = `curl -O ${SITE_URL}/downloads/${slug}/SKILL.md`;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 my-6">
      <h3 className="text-sm font-semibold mb-4">설치 / 다운로드</h3>

      <p className="text-xs text-[var(--color-muted)] mb-2">npx로 에이전트에 바로 설치</p>
      <CopyCmd cmd={npxCmd} />

      <p className="text-xs text-[var(--color-muted)] mt-4 mb-2">curl로 파일만 다운로드</p>
      <CopyCmd cmd={curlCmd} />
    </div>
  );
}
