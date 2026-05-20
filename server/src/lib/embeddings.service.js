import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_MODEL = process.env.EMBEDDINGS_MODEL || "text-embedding-3-small";

export async function embedText(text) {
  if (!text || !text.trim()) return null;

  const cleaned = String(text).slice(0, 8192);

  const res = await client.embeddings.create({
    model: DEFAULT_MODEL,
    input: cleaned,
  });

  const vector = res.data?.[0]?.embedding || null;
  return vector;
}

export default { embedText };
