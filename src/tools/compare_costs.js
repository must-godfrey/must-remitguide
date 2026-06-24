import { getRate, ILLUSTRATIVE_NOTE } from "../data/fx.js";
import { METHODS } from "../data/methods.js";

export const schema = {
  type: "function",
  function: {
    name: "compare_costs",
    description:
      "Compare all available transfer methods for a given amount and corridor. " +
      "Returns each method ranked by total all-in cost (fee + FX margin), with " +
      "how much the recipient actually receives, and a recommended cheapest option. " +
      "Use this whenever the user asks how to send money or what it will cost.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount to send, in the sending currency" },
        from_currency: { type: "string", description: "Sending currency, e.g. KRW" },
        to_country: { type: "string", description: "Destination country, e.g. Nigeria" },
      },
      required: ["amount", "from_currency", "to_country"],
    },
  },
};

const COUNTRY_CURRENCY = { nigeria: "NGN" };

export async function handler({ amount, from_currency, to_country }) {
  const from = String(from_currency).toUpperCase();
  const to = COUNTRY_CURRENCY[String(to_country).toLowerCase()];
  if (!to) {
    return { error: `Corridor to "${to_country}" is not supported in this demo (Korea → Nigeria only).` };
  }

  const midRate = getRate(from, to);

  const ranked = METHODS.map((m) => {
    const amountAfterFee = Math.max(0, amount - m.fixed_fee_krw);
    const effectiveRate = midRate * (1 - m.fx_margin_pct);
    const recipientGets = amountAfterFee * effectiveRate;
    // What the sender effectively "loses" vs. converting the full amount at mid-market.
    const allInCost = amount - recipientGets / midRate;

    // Transparency breakdown, all in the recipient's currency, so it adds up:
    //   mid_value = fee_cost + fx_margin_cost + recipient_gets
    const midValueNgn = amount * midRate;
    const feeCostNgn = m.fixed_fee_krw * midRate;
    const fxCostNgn = amountAfterFee * midRate * m.fx_margin_pct;

    return {
      id: m.id,
      name: m.name,
      speed: m.speed,
      payout: m.payout,
      fixed_fee: Math.round(m.fixed_fee_krw),
      fx_margin_pct: m.fx_margin_pct,
      recipient_gets: Math.round(recipientGets),
      recipient_currency: to,
      all_in_cost: Math.round(allInCost),
      cost_currency: from,
      breakdown: {
        currency: to,
        mid_market_value: Math.round(midValueNgn),
        fee_cost: Math.round(feeCostNgn),
        fx_margin_cost: Math.round(fxCostNgn),
        recipient_gets: Math.round(recipientGets),
      },
    };
  }).sort((a, b) => a.all_in_cost - b.all_in_cost);

  return {
    amount,
    from_currency: from,
    to_country,
    recipient_currency: to,
    mid_market_rate: midRate,
    methods: ranked,
    recommended: ranked[0].id,
    savings_vs_worst: ranked.length > 1
      ? Math.round(ranked[ranked.length - 1].all_in_cost - ranked[0].all_in_cost)
      : 0,
    note: ILLUSTRATIVE_NOTE,
  };
}
