"use client";

import { motion } from "framer-motion";
import { GraduationCap, User, Globe, Loader2 } from "lucide-react";
import type { UIMessage } from "ai";
import { Markdown } from "./Markdown";
import { SourceCards } from "./SourceCards";
import { WebResults } from "./WebResults";
import { QuizCard, type Quiz } from "./QuizCard";
import { TypingIndicator } from "./TypingIndicator";
import type { Source } from "@/lib/vector";
import type { WebSearchResponse } from "@/lib/tavily";

/* The AI SDK types message parts as a wide union; we narrow with light casts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const parts = message.parts as AnyPart[];

  // Has the assistant produced any visible content yet?
  const hasVisible = parts.some(
    (p) =>
      (p.type === "text" && p.text?.trim()) ||
      p.type === "data-sources" ||
      (typeof p.type === "string" && p.type.startsWith("tool-")),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`chat-msg flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          isUser
            ? "bg-surface-muted text-muted-foreground"
            : "bg-gradient-to-br from-accent to-accent-2 text-white"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <GraduationCap className="h-4.5 w-4.5" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={
            isUser
              ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-accent to-accent-2 px-4 py-2.5 text-white shadow-lg shadow-accent/20"
              : "rounded-2xl rounded-tl-sm bg-surface/55 px-4 py-3 text-foreground ring-1 ring-border/70 backdrop-blur-md"
          }
        >
          {parts.map((part, i) => (
            <PartView key={i} part={part} isUser={isUser} />
          ))}

          {/* Thinking indicator before any content arrives */}
          {!isUser && !hasVisible && isStreaming && <TypingIndicator />}

          {/* Keep a live pulse while streaming so multi-step work (tool calls,
              retrieval) never feels stopped midway. */}
          {!isUser && hasVisible && isStreaming && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative grid h-2.5 w-2.5 place-items-center">
                <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-accent/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Working…
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PartView({ part, isUser }: { part: AnyPart; isUser: boolean }) {
  if (!part) return null;

  // Plain text
  if (part.type === "text") {
    if (!part.text?.trim()) return null;
    return isUser ? (
      <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">
        {part.text}
      </p>
    ) : (
      <Markdown content={part.text} />
    );
  }

  // Uploaded image / file
  if (part.type === "file") {
    if (typeof part.mediaType === "string" && part.mediaType.startsWith("image/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={part.url}
          alt={part.filename ?? "attachment"}
          className="mt-1.5 max-h-64 rounded-xl border border-white/20 object-contain"
        />
      );
    }
    return null;
  }

  // Retrieved knowledge-base sources (custom data part)
  if (part.type === "data-sources") {
    return <SourceCards sources={part.data as Source[]} />;
  }

  // Web search tool
  if (part.type === "tool-searchWeb") {
    if (part.state === "output-available") {
      return <WebResults data={part.output as WebSearchResponse} />;
    }
    return (
      <ToolPending
        icon={<Globe className="h-4 w-4" />}
        label="Searching the web…"
      />
    );
  }

  // Quiz generation tool (generative UI)
  if (part.type === "tool-createQuiz") {
    if (part.state === "output-available") {
      return <QuizCard quiz={part.output as Quiz} />;
    }
    return (
      <ToolPending
        icon={<GraduationCap className="h-4 w-4" />}
        label="Building a quiz…"
      />
    );
  }

  return null;
}

function ToolPending({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {icon}
      {label}
    </div>
  );
}
