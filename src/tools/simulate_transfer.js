import { createTransfer } from "../state/transfers.js";
import { METHODS } from "../data/methods.js";

export const schema = {
  type: "function",
  function: {
    name: "simulate_transfer",
    description:
      "Start a SIMULATED money transfer. This is the only tool that 'moves money', so it " +
      "is gated: it will NOT execute unless `approved` is true. Call it first WITHOUT " +
      "approval to get a confirmation summary, show that summary to the user, and only call " +
      "it again with `approved: true` after the user explicitly says yes.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount to send, in KRW" },
        method: {
          type: "string",
          description: "Method id from compare_costs, e.g. stablecoin, mto, bank_wire",
        },
        recipient: { type: "string", description: "Recipient name or label" },
        approved: {
          type: "boolean",
          description: "Must be true to actually run the transfer. Defaults to false.",
        },
      },
      required: ["amount", "method", "recipient"],
    },
  },
};

export async function handler({ amount, method, recipient, approved = false }) {
  const m = METHODS.find((x) => x.id === method);
  if (!m) {
    return { error: `Unknown method "${method}". Use compare_costs first to pick one.` };
  }

  if (!approved) {
    return {
      status: "pending_approval",
      requires_approval: true,
      summary: {
        amount,
        from_currency: "KRW",
        method: m.name,
        recipient,
        speed: m.speed,
      },
      message:
        "This transfer needs the user's explicit approval before it runs. " +
        "Show this summary and ask them to approve or decline.",
    };
  }

  const t = createTransfer({ amount, method: m.name, recipient });
  return {
    status: "sent",
    transfer_id: t.transfer_id,
    amount,
    from_currency: "KRW",
    method: m.name,
    recipient,
    note: "Simulated transfer started. Use get_transfer_status to follow it.",
  };
}
