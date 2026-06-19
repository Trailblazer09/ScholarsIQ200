/** A single web search result returned by the Tavily API. */
export type WebResult = {
  title: string;
  url: string;
  content: string;
};

export type WebSearchResponse = {
  query: string;
  answer?: string;
  results: WebResult[];
  configured: boolean;
};

/**
 * Run a web search via Tavily (https://tavily.com), an LLM-oriented search API.
 * If no API key is configured we return `configured: false` so the model can
 * tell the user gracefully instead of crashing.
 */
export async function webSearch(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { query, results: [], configured: false };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      throw new Error(`Tavily responded ${res.status}`);
    }

    const data = (await res.json()) as {
      answer?: string;
      results?: { title: string; url: string; content: string }[];
    };

    return {
      query,
      answer: data.answer,
      configured: true,
      results: (data.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  } catch (err) {
    console.error("[tavily] search failed:", err);
    return { query, results: [], configured: true };
  }
}
