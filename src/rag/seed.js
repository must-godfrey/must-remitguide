import "dotenv/config";
import { CASHOUT_GUIDES, SCAM_WARNINGS } from "../data/knowledge.js";
import { METHODS } from "../data/methods.js";
import { embed } from "./embed.js";
import { ensureSchema, upsertDoc, isConfigured, close } from "./store.js";

// Builds embeddable docs from the seed knowledge and ingests them into pgvector.
// content = the text we embed/retrieve on; metadata = structured fields the
// tools use to rebuild rich, grounded results.

function buildDocs() {
  const docs = [];

  for (const guide of CASHOUT_GUIDES) {
    for (const m of guide.methods) {
      docs.push({
        id: `cashout:${guide.country}:${guide.region}:${m.name}`.toLowerCase().replace(/\s+/g, "-"),
        content:
          `How to collect cash in ${guide.country}${guide.region !== "default" ? " (" + guide.region + ")" : ""} ` +
          `using ${m.name}. Steps: ${m.steps.join(" ")}`,
        metadata: {
          type: "cashout_method",
          country: guide.country,
          region: guide.region,
          name: m.name,
          steps: m.steps,
        },
      });
    }
  }

  SCAM_WARNINGS.forEach((w, i) => {
    docs.push({
      id: `scam:${i}`,
      content: `Money transfer scam warning for recipients in Nigeria: ${w}`,
      metadata: { type: "scam", country: "Nigeria", text: w },
    });
  });

  for (const m of METHODS) {
    docs.push({
      id: `cost:${m.id}`,
      content:
        `Korea to Nigeria transfer method: ${m.name}. Fee about ${m.fixed_fee_krw} KRW, ` +
        `FX margin ${(m.fx_margin_pct * 100).toFixed(1)}%, speed ${m.speed}, payout via ${m.payout}.`,
      metadata: { type: "cost_reference", method_id: m.id, name: m.name },
    });
  }

  return docs;
}

async function main() {
  if (!isConfigured()) {
    console.error("DATABASE_URL is not set. Start Postgres (docker compose up -d) and set DATABASE_URL in .env.");
    process.exit(1);
  }
  if (!process.env.QWEN_API_KEY) {
    console.error("QWEN_API_KEY is not set — embeddings require it.");
    process.exit(1);
  }

  const docs = buildDocs();
  console.log(`Ensuring schema and ingesting ${docs.length} docs…`);
  await ensureSchema();

  for (const doc of docs) {
    const embedding = await embed(doc.content);
    await upsertDoc({ ...doc, embedding });
    console.log(`  ✓ ${doc.id}`);
  }

  await close();
  console.log("Done. RAG knowledge base seeded.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
