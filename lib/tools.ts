import { tool } from "ai";
import { z } from "zod";
import { webSearch } from "./tavily";

/**
 * Tools the model can call mid-conversation. Each tool's result is streamed
 * back to the client, where it is rendered as a rich, interactive component
 * (a web-search chip, or an interactive quiz card — "generative UI").
 */
export const tools = {
  searchWeb: tool({
    description:
      "Search the live web for current information, recent events, or facts that are not part of the course knowledge base. Returns relevant results with titles, URLs and snippets.",
    inputSchema: z.object({
      query: z.string().describe("A focused web search query."),
    }),
    execute: async ({ query }) => webSearch(query),
  }),

  createQuiz: tool({
    description:
      "Generate an interactive multiple-choice quiz to test the student's understanding. Use when the student asks to be quizzed/tested, wants practice questions, or when a short quiz would reinforce learning. You author the questions yourself.",
    // NOTE: keep this schema simple (no exact-length / min-max constraints).
    // Groq's constrained tool decoding is unreliable with those, so we enforce
    // shape in `execute` instead.
    inputSchema: z.object({
      title: z.string().describe("A short quiz title, e.g. 'Photosynthesis Quiz'."),
      questions: z
        .array(
          z.object({
            question: z.string().describe("The question text."),
            options: z
              .array(z.string())
              .describe("Four answer options."),
            correctIndex: z
              .number()
              .describe("Zero-based index (0-3) of the correct option."),
            explanation: z
              .string()
              .describe("A brief explanation of why the answer is correct."),
          }),
        )
        .describe("Two to five questions."),
    }),
    // The model authors the quiz; we normalise it (clamp to 4 options, valid
    // index, 2-5 questions) so the UI always receives a well-formed quiz.
    execute: async (quiz) => ({
      title: quiz.title,
      questions: quiz.questions.slice(0, 5).map((q) => {
        const options = q.options.slice(0, 4);
        while (options.length < 4) options.push("N/A");
        const correctIndex = Math.min(Math.max(Math.round(q.correctIndex), 0), 3);
        return { ...q, options, correctIndex };
      }),
    }),
  }),
};
