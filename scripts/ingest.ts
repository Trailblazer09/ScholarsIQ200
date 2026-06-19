/**
 * Ingestion script: reads the Markdown files in /data, splits each into
 * section-sized chunks, and upserts them into Upstash Vector. We pass raw text
 * via the `data` field so Upstash's built-in embedding model handles vectors —
 * no separate embeddings API required.
 *
 * Run with:  npm run ingest
 */
import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Index } from "@upstash/vector";

// Load local env (Next.js uses .env.local; fall back to .env).
config({ path: ".env.local" });
config({ path: ".env" });

const DATA_DIR = join(process.cwd(), "data");

type Chunk = { id: string; title: string; source: string; text: string };

/** Split one Markdown document into chunks, one per `##` section. */
function parseDoc(filename: string): Chunk[] {
  const raw = readFileSync(join(DATA_DIR, filename), "utf-8");

  // Document title = first level-1 heading, else the filename.
  const h1 = raw.split("\n").find((l) => l.startsWith("# "));
  const docTitle = h1 ? h1.replace(/^#\s+/, "").trim() : filename.replace(/\.md$/, "");

  const sections = raw.split(/\n(?=##\s)/);
  const chunks: Chunk[] = [];
  let idx = 0;

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const headingMatch = lines[0].match(/^#{1,6}\s+(.*)/);
    const heading = headingMatch ? headingMatch[1].trim() : "";
    const body = (headingMatch ? lines.slice(1).join("\n") : section).trim();

    if (body.length < 40) continue; // skip the title-only preamble

    chunks.push({
      id: `${filename}#${idx++}`,
      title: heading ? `${docTitle}: ${heading}` : docTitle,
      source: filename,
      text: body,
    });
  }

  return chunks;
}

async function main() {
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    console.error(
      "✗ Missing UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN.\n" +
        "  Add them to .env.local (see .env.example), then run again.",
    );
    process.exit(1);
  }

  const index = new Index();
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".md"));

  const chunks = files.flatMap(parseDoc);
  console.log(
    `Ingesting ${chunks.length} chunks from ${files.length} document(s)…`,
  );

  // Upsert using the `data` field so Upstash embeds the text automatically.
  await index.upsert(
    chunks.map((c) => ({
      id: c.id,
      data: c.text,
      metadata: { title: c.title, source: c.source, text: c.text },
    })),
  );

  console.log(`✓ Done. ${chunks.length} passages are now searchable.`);
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
