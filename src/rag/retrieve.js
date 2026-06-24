import { embed } from "./embed.js";
import { search, isConfigured } from "./store.js";

// Retrieve a grounded cash-out guide from pgvector. Returns null if RAG is not
// configured or unavailable, so callers can fall back to seed knowledge.
export async function ragCashoutGuide(country, region) {
  if (!isConfigured() || !process.env.QWEN_API_KEY) return null;

  const query =
    `How can someone safely collect cash from a money transfer in ${country}` +
    (region ? `, ${region}` : "") +
    `? Include the steps and any scam warnings.`;

  const qvec = await embed(query);

  const [methodsHits, scamHits] = await Promise.all([
    search(qvec, { k: 3, type: "cashout_method" }),
    search(qvec, { k: 4, type: "scam" }),
  ]);

  if (!methodsHits.length) return null;

  return {
    country,
    region: region || "general",
    methods: methodsHits.map((h) => ({ name: h.metadata.name, steps: h.metadata.steps })),
    scam_warnings: scamHits.map((h) => h.metadata.text),
    source: "rag",
  };
}
