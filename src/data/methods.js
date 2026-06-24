// Seeded transfer methods for the Korea -> Nigeria corridor.
// ILLUSTRATIVE ONLY. Fees and FX margins are demo values chosen to make the
// "cheapest vs most expensive" contrast clear and educational.
//
//   fixed_fee_krw : flat fee charged in KRW
//   fx_margin_pct : markup taken on top of the mid-market rate (as a fraction)
//   speed         : human-readable delivery time
//   payout        : how the recipient ultimately receives the money

export const METHODS = [
  {
    id: "bank_wire",
    name: "Traditional bank wire",
    fixed_fee_krw: 25000,
    fx_margin_pct: 0.035,
    speed: "2–4 business days",
    payout: "Recipient's Nigerian bank account",
  },
  {
    id: "mto",
    name: "Money transfer operator (e.g. remittance app)",
    fixed_fee_krw: 7000,
    fx_margin_pct: 0.02,
    speed: "minutes to a few hours",
    payout: "Bank account or cash pickup",
  },
  {
    id: "stablecoin",
    name: "Stablecoin transfer + local cash-out",
    fixed_fee_krw: 1500,
    fx_margin_pct: 0.008,
    speed: "minutes",
    payout: "Local P2P / agent cash-out in NGN",
  },
];
