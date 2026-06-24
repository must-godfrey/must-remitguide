import { getClient } from "../qwen.js";

// Qwen text embeddings (Alibaba Model Studio). Keeps the whole brain on Qwen.
export const EMBED_DIM = 1024;
const EMBED_MODEL = () => process.env.QWEN_EMBED_MODEL || "text-embedding-v3";

export async function embed(text) {
  const client = getClient();
  const res = await client.embeddings.create({
    model: EMBED_MODEL(),
    input: text,
    dimensions: EMBED_DIM,
    encoding_format: "float",
  });
  return res.data[0].embedding;
}

export async function embedMany(texts) {
  const client = getClient();
  const res = await client.embeddings.create({
    model: EMBED_MODEL(),
    input: texts,
    dimensions: EMBED_DIM,
    encoding_format: "float",
  });
  // Preserve input order.
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
