import { createGroq } from "@ai-sdk/groq";

/**
 * Groq provider instance. The API key is read from the GROQ_API_KEY env var.
 * Groq serves open models with very low latency and a generous free tier.
 */
export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * We route between two models:
 *
 * - VISION_MODEL (Llama 4 Scout) is multimodal and handles image inputs, but its
 *   tool-calling is unreliable, so we use it only when an image is attached.
 * - TOOL_MODEL (Qwen3 32B) is text-only but reliably emits valid native tool
 *   calls for our full tool set, so we use it for all text-only queries.
 *   (Llama 3.3/4 on Groq malform multi-tool calls — "tool_use_failed".)
 *
 * RAG works with both because retrieved context is injected into the system
 * prompt rather than fetched via a tool.
 */
export const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const TOOL_MODEL = "openai/gpt-oss-120b";
