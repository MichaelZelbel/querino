// One place that turns text into a vector.
//
// WHY THIS FILE EXISTS (23 August 2026)
//
// Two functions called https://api.openai.com/v1/embeddings directly, with the
// same model name written out in each. On 23 August the OpenAI account ran out
// of credit, and every embedding call in the project started coming back
//
//   429 "You have no credits remaining."
//
// Nothing anywhere said so. backfill-embeddings counted the failures into a
// response nobody was reading, and generate-embedding's caller
// (useSemanticMerge) catches its own errors and returns an empty list on
// purpose, so concept search on the website quietly became keyword search and
// looked exactly like a site where nothing matched.
//
// So the provider is now a list rather than a constant. If the first one
// cannot answer, the next one does.
//
// THE ONE RULE FOR ADDING A PROVIDER
//
// Every vector in the database was made by text-embedding-3-small. Similarity
// is only meaningful between vectors from the SAME model, and a vector from a
// different model does not error, it just returns confident nonsense. So a new
// provider has to serve that exact model, and you check it rather than trust
// the model string.
//
// The check that matters: embed a row whose vector is already stored, and take
// the cosine similarity of the two. OpenRouter was added after scoring
// 1.000000 against a stored OpenAI vector, which is the same model answering.
// Anything below about 0.98 is a different model wearing the same name.

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const MAX_INPUT_CHARS = 8000;

interface Provider {
  /** Short name, for logs and for the response body. */
  name: string;
  url: string;
  apiKey: string;
  /** What this provider calls text-embedding-3-small. */
  model: string;
}

/**
 * Providers in the order they are tried, skipping any whose key is not set.
 *
 * OpenAI first because it is the direct route and the one the stored vectors
 * came from. OpenRouter second because it proxies the identical model and is
 * billed to a different account, so one empty balance cannot take embeddings
 * down on its own.
 */
export function embeddingProviders(): Provider[] {
  const providers: Provider[] = [];

  const openai = Deno.env.get("OPENAI_API_KEY");
  if (openai) {
    providers.push({
      name: "openai",
      url: "https://api.openai.com/v1/embeddings",
      apiKey: openai,
      model: EMBEDDING_MODEL,
    });
  }

  const openrouter = Deno.env.get("OPENROUTER_API_KEY");
  if (openrouter) {
    providers.push({
      name: "openrouter",
      url: "https://openrouter.ai/api/v1/embeddings",
      apiKey: openrouter,
      model: `openai/${EMBEDDING_MODEL}`,
    });
  }

  return providers;
}

export interface EmbeddingResult {
  embedding: number[];
  /** Which provider actually answered. */
  provider: string;
  /** The model string the provider reported, for usage records. */
  model: string;
  promptTokens: number;
  totalTokens: number;
}

export class NoEmbeddingProviderError extends Error {}

/**
 * Embed one piece of text, trying each configured provider in turn.
 *
 * Throws only when every provider failed, and the message carries what each
 * one said. A caller that swallows this error is how the outage above stayed
 * invisible for as long as it did, so say something.
 */
export async function createEmbedding(input: string): Promise<EmbeddingResult> {
  const text = input.slice(0, MAX_INPUT_CHARS);
  if (!text.trim()) throw new NoEmbeddingProviderError("empty text");

  const providers = embeddingProviders();
  if (providers.length === 0) {
    throw new NoEmbeddingProviderError(
      "No embedding provider configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.",
    );
  }

  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const resp = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: provider.model, input: text }),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        failures.push(`${provider.name}: ${resp.status} ${body.slice(0, 160)}`);
        continue;
      }

      const json = await resp.json() as {
        data?: Array<{ embedding?: number[] }>;
        usage?: { prompt_tokens?: number; total_tokens?: number };
        model?: string;
      };

      const embedding = json.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
        // A wrong length is a different model, and storing it would poison
        // every comparison against it. Refuse rather than write.
        failures.push(`${provider.name}: expected ${EMBEDDING_DIMENSIONS} dims, got ${embedding?.length}`);
        continue;
      }

      const promptTokens = Number(json.usage?.prompt_tokens ?? 0);
      return {
        embedding,
        provider: provider.name,
        model: json.model || provider.model,
        promptTokens,
        totalTokens: Number(json.usage?.total_tokens ?? promptTokens),
      };
    } catch (e) {
      failures.push(`${provider.name}: ${String(e).slice(0, 160)}`);
    }
  }

  throw new NoEmbeddingProviderError(`every embedding provider failed — ${failures.join(" | ")}`);
}

/** The text an artifact is embedded from. One definition, so the backfill and
 *  any future caller cannot drift apart and re-embed the same row forever. */
export function embeddableText(row: Record<string, unknown>, fields: readonly string[]): string {
  return fields
    .map((f) => (row[f] ? String(row[f]) : ""))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_INPUT_CHARS);
}
