import { getRate, ILLUSTRATIVE_NOTE } from "../data/fx.js";

export const schema = {
  type: "function",
  function: {
    name: "fx_lookup",
    description:
      "Look up the illustrative mid-market exchange rate between two currencies " +
      "(e.g. KRW to NGN). Returns 1 unit of `from` expressed in `to`.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "ISO currency code to convert from, e.g. KRW" },
        to: { type: "string", description: "ISO currency code to convert to, e.g. NGN" },
      },
      required: ["from", "to"],
    },
  },
};

export async function handler({ from, to }) {
  const f = String(from).toUpperCase();
  const t = String(to).toUpperCase();
  const rate = getRate(f, t);
  return { from: f, to: t, rate, note: ILLUSTRATIVE_NOTE };
}
