"use client";

import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Source } from "@/lib/vector";
import { cn } from "@/lib/utils";

/**
 * Collapsible list of knowledge-base passages that grounded the answer.
 * Makes the Retrieval-Augmented Generation visible and citable.
 */
export function SourceCards({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  return (
    <div className="mb-2 rounded-xl border border-border bg-surface-muted/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground"
      >
        <BookOpen className="h-4 w-4 text-accent" />
        <span>
          {sources.length} source{sources.length > 1 ? "s" : ""} from the
          knowledge base
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-3 pb-3">
              {sources.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-border bg-surface p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      [{i + 1}] {s.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {(s.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                    {s.source}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
