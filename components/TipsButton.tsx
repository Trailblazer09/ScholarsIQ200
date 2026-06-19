"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Mic,
  ImageIcon,
  BookOpen,
  Globe,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const TIPS = [
  {
    icon: BookOpen,
    title: "Ask about your notes",
    body: "Try “Explain photosynthesis from my notes.” Answers are grounded in your course material with citable sources.",
  },
  {
    icon: ImageIcon,
    title: "Solve from a photo",
    body: "Upload a picture of a problem or diagram and ask for a step-by-step solution.",
  },
  {
    icon: Mic,
    title: "Just speak",
    body: "Tap the mic and talk. It stops automatically when you finish, then fills the box for you to send.",
  },
  {
    icon: Globe,
    title: "Get current info",
    body: "Ask about recent events and it will search the web and cite the sources it finds.",
  },
  {
    icon: GraduationCap,
    title: "Test yourself",
    body: "Say “quiz me on Newton’s laws” for an interactive quiz with instant scoring.",
  },
  {
    icon: Sparkles,
    title: "Be specific",
    body: "The more precise your question, the sharper and more useful the answer.",
  },
];

export function TipsButton() {
  const [open, setOpen] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface/60 px-3 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <Lightbulb className="h-4 w-4 text-brand" />
        <span className="hidden sm:inline">Tips</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-away layer: one click anywhere outside closes the popover. */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-surface/90 p-2 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                <Lightbulb className="h-4 w-4 text-brand" />
                <span className="text-sm font-semibold text-foreground">
                  Tips
                </span>
              </div>
              <div className="space-y-1.5">
                {TIPS.map((t) => (
                  <div
                    key={t.title}
                    className="rounded-xl border border-border/70 bg-surface-muted/40 p-2.5"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent/10 text-accent">
                        <t.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {t.title}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t.body}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
