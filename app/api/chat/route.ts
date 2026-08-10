import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { TOOL_MODEL, VISION_MODEL, groq } from "@/lib/groq";
import { buildSystemPrompt } from "@/lib/prompts";
import { tools } from "@/lib/tools";
import { retrieve } from "@/lib/vector";

// Allow responses up to 30s (Groq is fast, but tool + RAG steps add up).
export const maxDuration = 30;

/** Extract the text of the most recent user message (used as the RAG query). */
function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    return m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim();
  }
  return "";
}

/** Does the conversation include an image attachment anywhere? */
function hasImage(messages: UIMessage[]): boolean {
  return messages.some((m) =>
    m.parts.some(
      (p) =>
        p.type === "file" &&
        typeof (p as { mediaType?: string }).mediaType === "string" &&
        (p as { mediaType: string }).mediaType.startsWith("image/"),
    ),
  );
}

function getFriendlyAIError(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const err = error as Record<string, unknown>;
  const rawMessage =
    typeof err.message === "string"
      ? err.message
      : typeof err.error === "object" && err.error !== null && typeof (err.error as any).message === "string"
      ? (err.error as any).message
      : typeof err.responseBody === "string"
      ? err.responseBody
      : typeof err.data === "object" && err.data !== null && typeof (err.data as any)?.error?.message === "string"
      ? (err.data as any).error.message
      : undefined;

  if (typeof rawMessage === "string") {
    if (/does not exist|do not have access|model_not_found|access denied|permission/i.test(rawMessage)) {
      return "Image search is unavailable because your Groq account does not have access to the configured vision model. Update `lib/groq.ts` to a supported multimodal model or enable vision access for your Groq API key.";
    }
    if (/Groq API key is missing|GROQ_API_KEY|API key is missing/i.test(rawMessage) || err.name === "AI_LoadAPIKeyError") {
      return "Groq API key is missing or invalid. Set `GROQ_API_KEY` in `.env.local` and restart the app.";
    }
  }

  return undefined;
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const query = lastUserText(messages);

  // Vision queries use the multimodal model (no tools); text queries use the
  // reliable tool-calling model with the full tool set.
  const useVision = hasImage(messages);
  const modelId = useVision ? VISION_MODEL : TOOL_MODEL;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // 1) Retrieval-Augmented Generation: fetch relevant passages and stream
      //    them to the client so they can be rendered as citation cards.
      const sources = await retrieve(query);
      if (sources.length > 0) {
        writer.write({ type: "data-sources", data: sources });
      }

      // 2) Generate the answer — grounded in the retrieved context, with tools
      //    available for web search and quiz generation.
      const result = streamText({
        model: groq(modelId),
        system: buildSystemPrompt(sources),
        messages: await convertToModelMessages(messages),
        // Only the text model gets tools (vision model's tool-calling is flaky).
        tools: useVision ? undefined : tools,
        // Qwen3 is a reasoning model — keep its chain-of-thought out of the
        // visible answer by routing it to a separate (unused) reasoning channel.
        providerOptions: useVision
          ? undefined
          : { groq: { reasoningFormat: "hidden" } },
        stopWhen: stepCountIs(5),
        onError: ({ error }) => console.error("[chat] generation error:", error),
      });

      writer.merge(result.toUIMessageStream());
    },
    onError: (error) => {
      console.error("[chat] stream error:", error);
      return (
        getFriendlyAIError(error) ??
        "Sorry, something went wrong while generating a response. Please try again."
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
