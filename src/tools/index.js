// Tool registry. Each tool exports `schema` (OpenAI/Qwen function-calling spec)
// and `handler` (async fn returning a JSON-serializable result).

import * as fxLookup from "./fx_lookup.js";
import * as compareCosts from "./compare_costs.js";
import * as simulateTransfer from "./simulate_transfer.js";
import * as getTransferStatus from "./get_transfer_status.js";
import * as getCashoutGuide from "./get_cashout_guide.js";
import * as checkScam from "./check_scam.js";

const modules = [
  fxLookup,
  compareCosts,
  simulateTransfer,
  getTransferStatus,
  getCashoutGuide,
  checkScam,
];

export const toolSchemas = modules.map((m) => m.schema);

export const toolHandlers = Object.fromEntries(
  modules.map((m) => [m.schema.function.name, m.handler])
);

export async function runTool(name, args) {
  const handler = toolHandlers[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return await handler(args ?? {});
  } catch (err) {
    return { error: err.message };
  }
}
