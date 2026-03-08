import type { Metadata } from "next";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Agent Skills";

export const metadata: Metadata = {
  title: siteName,
  description: "AI 에이전트 스킬 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        <header className="border-b border-[var(--color-border)]">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
            <a href="/" className="text-lg font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] no-underline">
              {siteName}
            </a>
            <span className="text-[var(--color-muted)] text-sm">— AI 에이전트 스킬 플랫폼</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-5">
          {children}
        </main>
      </body>
    </html>
  );
}
