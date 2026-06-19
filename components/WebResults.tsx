"use client";

import { Globe, ExternalLink } from "lucide-react";
import type { WebSearchResponse } from "@/lib/tavily";

/** Renders the result of the searchWeb tool: a header chip + linked results. */
export function WebResults({ data }: { data: WebSearchResponse }) {
  if (!data.configured) {
    return (
      <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
        Web search isn&apos;t configured (no <code>TAVILY_API_KEY</code>).
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-xl border border-border bg-surface-muted/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <Globe className="h-4 w-4 text-accent" />
        Searched the web for &ldquo;{data.query}&rdquo;
      </div>
      <div className="space-y-2">
        {data.results.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-border bg-surface p-2.5 transition-colors hover:border-accent"
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span className="line-clamp-1">{r.title}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-accent" />
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {r.content}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
