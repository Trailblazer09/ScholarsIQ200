"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, GraduationCap, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Quiz = {
  title: string;
  questions: QuizQuestion[];
};

/**
 * Interactive multiple-choice quiz — the "generative UI" surface. The model
 * authors the questions; the student answers them here and gets instant
 * feedback and a final score.
 */
export function QuizCard({ quiz }: { quiz: Quiz }) {
  // answers[i] = selected option index for question i (undefined = unanswered)
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    () => quiz.questions.map(() => undefined),
  );

  function select(qIndex: number, optIndex: number) {
    if (answers[qIndex] !== undefined) return; // lock once answered
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIndex;
      return next;
    });
  }

  function reset() {
    setAnswers(quiz.questions.map(() => undefined));
  }

  const answeredCount = answers.filter((a) => a !== undefined).length;
  const correctCount = answers.filter(
    (a, i) => a === quiz.questions[i].correctIndex,
  ).length;
  const allAnswered = answeredCount === quiz.questions.length;

  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-border/70 bg-surface/55 shadow-lg shadow-black/5 backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-border/70 bg-gradient-to-r from-accent/15 to-accent-2/10 px-4 py-3">
        <GraduationCap className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">{quiz.title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {answeredCount}/{quiz.questions.length} answered
        </span>
      </div>

      <div className="space-y-5 p-4">
        {quiz.questions.map((q, qi) => {
          const selected = answers[qi];
          const answered = selected !== undefined;
          return (
            <div key={qi}>
              <p className="mb-2 font-medium text-foreground">
                {qi + 1}. {q.question}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex;
                  const isSelected = oi === selected;
                  return (
                    <button
                      key={oi}
                      onClick={() => select(qi, oi)}
                      disabled={answered}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        !answered &&
                          "border-border bg-surface hover:border-accent hover:bg-accent/5",
                        answered &&
                          isCorrect &&
                          "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        answered &&
                          isSelected &&
                          !isCorrect &&
                          "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
                        answered &&
                          !isCorrect &&
                          !isSelected &&
                          "border-border opacity-60",
                      )}
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[11px] font-semibold">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {answered && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      )}
                      {answered && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted-foreground"
                >
                  {q.explanation}
                </motion.p>
              )}
            </div>
          );
        })}
      </div>

      {allAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between border-t border-border bg-surface-muted/60 px-4 py-3"
        >
          <span className="text-sm font-semibold text-foreground">
            Score: {correctCount} / {quiz.questions.length}
            {correctCount === quiz.questions.length && " 🎉"}
          </span>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </motion.div>
      )}
    </div>
  );
}
