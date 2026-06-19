import { Index } from "@upstash/vector";

/** A single retrieved knowledge-base passage shown to the user as a citation. */
export type Source = {
  id: string;
  title: string;
  source: string;
  text: string;
  score: number;
};

/** Metadata we store alongside each vector in Upstash. */
export type VectorMetadata = {
  title: string;
  source: string;
  text: string;
};

let cachedIndex: Index<VectorMetadata> | null = null;

/**
 * Returns the Upstash Vector index, or `null` if the credentials are not set.
 * Returning null lets the rest of the app degrade gracefully (no RAG) instead
 * of throwing, which is handy during local development.
 */
export function getIndex(): Index<VectorMetadata> | null {
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    return null;
  }
  if (!cachedIndex) {
    cachedIndex = new Index<VectorMetadata>({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }
  return cachedIndex;
}

/**
 * Retrieve the most relevant knowledge-base passages for a query. We rely on
 * Upstash's built-in embedding model by passing raw text via the `data` field,
 * so no separate embeddings API is required.
 */
export async function retrieve(query: string, topK = 4): Promise<Source[]> {
  const index = getIndex();
  if (!index || !query.trim()) return [];

  try {
    const results = await index.query({
      data: query,
      topK,
      includeMetadata: true,
    });

    return results
      // Drop weak matches so we only cite genuinely relevant passages.
      .filter((r) => (r.score ?? 0) > 0.7)
      .map((r) => ({
        id: String(r.id),
        title: r.metadata?.title ?? "Untitled",
        source: r.metadata?.source ?? "knowledge-base",
        text: r.metadata?.text ?? "",
        score: r.score ?? 0,
      }));
  } catch (err) {
    console.error("[vector] retrieval failed:", err);
    return [];
  }
}
