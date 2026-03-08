"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function SkillViewer({ content, raw }: { content: string; raw: string }) {
  const [tab, setTab] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState(false);

  async function copyRaw() {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex border-b border-[var(--color-border)] mb-5">
        {(["preview", "raw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-2 text-sm mb-[-1px] border-b-2 transition-colors",
              tab === t
                ? "border-[var(--color-accent)] text-[var(--color-foreground)] font-semibold"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            ].join(" ")}
          >
            {t === "preview" ? "미리보기" : "원문"}
          </button>
        ))}
      </div>

      {tab === "preview" ? (
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <div>
          <textarea
            readOnly
            value={raw}
            className="w-full min-h-[400px] resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm text-[var(--color-foreground)] outline-none"
          />
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={copyRaw}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "복사됨" : "클립보드 복사"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
