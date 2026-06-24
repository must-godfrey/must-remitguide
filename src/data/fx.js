// Seeded FX rates — ILLUSTRATIVE ONLY, not a live feed.
// Mid-market reference rates for the demo corridor (Korea -> Nigeria).
// Numbers are plausible for 2026 but must not be treated as real quotes.

export const FX_TABLE = {
  // 1 unit of FROM = N units of TO
  "KRW->NGN": 1.16,
  "NGN->KRW": 0.862,
  "USD->KRW": 1380,
  "USD->NGN": 1600,
};

export const ILLUSTRATIVE_NOTE =
  "Rates are illustrative demo values, not live market quotes.";

export function getRate(from, to) {
  const key = `${from}->${to}`;
  const rate = FX_TABLE[key];
  if (rate == null) {
    throw new Error(`No seeded rate for ${key}`);
  }
  return rate;
}
