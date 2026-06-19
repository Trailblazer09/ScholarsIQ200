"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  ImageIcon,
  Globe,
  BookOpen,
  Mic,
} from "lucide-react";
import { Brand } from "./Brand";

const SUGGESTIONS = [
  {
    icon: BookOpen,
    title: "Explain a concept",
    prompt: "Explain photosynthesis in simple terms using my notes.",
  },
  {
    icon: GraduationCap,
    title: "Quiz me",
    prompt: "Quiz me on Newton's three laws of motion.",
  },
  {
    icon: ImageIcon,
    title: "Solve from a photo",
    prompt: "I'll upload a photo of a problem, help me solve it step by step.",
  },
  {
    icon: Globe,
    title: "Search the web",
    prompt: "What are the latest breakthroughs in artificial intelligence?",
  },
];

export function EmptyState({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-lg"
      >
        <GraduationCap className="h-8 w-8" />
      </motion.div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Meet <Brand />
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your multimodal AI tutor. Ask by text, voice or image, get answers
        grounded in your course material, and test yourself with quizzes.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Badge icon={<Sparkles className="h-3 w-3" />}>Vision</Badge>
        <Badge icon={<Mic className="h-3 w-3" />}>Voice</Badge>
        <Badge icon={<BookOpen className="h-3 w-3" />}>RAG</Badge>
        <Badge icon={<Globe className="h-3 w-3" />}>Web search</Badge>
        <Badge icon={<GraduationCap className="h-3 w-3" />}>Quizzes</Badge>
      </div>

      <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
              <s.icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {s.prompt}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Badge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1">
      {icon}
      {children}
    </span>
  );
}
