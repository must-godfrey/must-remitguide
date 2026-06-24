import { findGuide, SCAM_WARNINGS } from "../data/knowledge.js";
import { ragCashoutGuide } from "../rag/retrieve.js";

export const schema = {
  type: "function",
  function: {
    name: "get_cashout_guide",
    description:
      "Get a plain-language guide for how the recipient can turn a received transfer into cash " +
      "in their country/region, plus scam warnings to keep them safe. Use this to guide the " +
      "family member on the receiving end (the 'last mile').",
    parameters: {
      type: "object",
      properties: {
        country: { type: "string", description: "Destination country, e.g. Nigeria" },
        region: {
          type: "string",
          description: "City or region, e.g. Lagos. Optional; a general guide is used if omitted.",
        },
      },
      required: ["country"],
    },
  },
};

export async function handler({ country, region }) {
  // Prefer the RAG knowledge base; fall back to seed data if it's unavailable
  // (no DB/key, or a retrieval error). The result shape is identical either way.
  try {
    const rag = await ragCashoutGuide(country, region);
    if (rag) return rag;
  } catch {
    // fall through to seed knowledge
  }

  const guide = findGuide(country, region);
  if (!guide) {
    return { error: `No cash-out guide available for "${country}" in this demo (Nigeria only).` };
  }
  return {
    country: guide.country,
    region: region || "general",
    methods: guide.methods,
    scam_warnings: SCAM_WARNINGS,
    source: "seed_knowledge",
  };
}
