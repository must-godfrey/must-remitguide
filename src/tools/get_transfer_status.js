import { getTransfer } from "../state/transfers.js";

const PLAIN = {
  sent: "Your money is on its way. It has left and is heading to your family.",
  received: "The money has arrived at the payout point. Your family can now collect it.",
  cashed_out: "Done — your family has collected the cash. The transfer is complete.",
};

export const schema = {
  type: "function",
  function: {
    name: "get_transfer_status",
    description:
      "Check the current status of a simulated transfer by its transfer_id. Returns one of " +
      "sent / received / cashed_out, with a plain-language explanation. Use this whenever the " +
      "user asks 'where is my money?'.",
    parameters: {
      type: "object",
      properties: {
        transfer_id: { type: "string", description: "The transfer id, e.g. RG-AB12CD" },
      },
      required: ["transfer_id"],
    },
  },
};

export async function handler({ transfer_id }) {
  const t = getTransfer(transfer_id);
  if (!t) {
    return { error: `No transfer found with id "${transfer_id}".` };
  }
  return {
    transfer_id: t.transfer_id,
    status: t.status,
    plain_language: PLAIN[t.status],
    amount: t.amount,
    method: t.method,
    recipient: t.recipient,
  };
}
