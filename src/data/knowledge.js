// Seed knowledge base for the recipient-side "last mile" in Nigeria.
// DEMO content, written plain-language and literacy-aware. At Milestone 4 this
// same content is embedded into pgvector and retrieved by get_cashout_guide;
// for now it is served directly so the tool works end to end.

export const CASHOUT_GUIDES = [
  {
    country: "Nigeria",
    region: "lagos",
    methods: [
      {
        name: "Agent banking (POS agent)",
        steps: [
          "Find a registered POS agent — look for the bank's signboard, not a random table.",
          "Tell them you want to withdraw money sent to your account or wallet.",
          "Check the amount on the screen yourself before you accept.",
          "Collect your cash and your receipt. Count it before you leave.",
        ],
      },
      {
        name: "Mobile money / bank app",
        steps: [
          "Open your bank or wallet app and confirm the money has arrived.",
          "Withdraw at an ATM or transfer to a trusted agent to get cash.",
        ],
      },
    ],
  },
  {
    country: "Nigeria",
    region: "default",
    methods: [
      {
        name: "Agent banking (POS agent)",
        steps: [
          "Use a registered POS agent with a visible bank signboard.",
          "Confirm the amount on screen before accepting cash.",
          "Always collect and keep your receipt.",
        ],
      },
    ],
  },
];

// Common scam patterns the recipient should be warned about.
export const SCAM_WARNINGS = [
  "Nobody legitimate will ask you to 'pay a fee first' to release money that is already yours. That is a scam.",
  "Never share your bank PIN, OTP, or app password — not even with someone claiming to be from your bank.",
  "Be careful with an agent who refuses to show the amount on screen or won't give a receipt.",
  "If a caller pressures you to act fast or stay on the phone while you withdraw, hang up and verify first.",
];

export function findGuide(country, region) {
  const c = String(country || "").toLowerCase();
  const r = String(region || "").toLowerCase();
  const matches = CASHOUT_GUIDES.filter((g) => g.country.toLowerCase() === c);
  return (
    matches.find((g) => g.region === r) ||
    matches.find((g) => g.region === "default") ||
    null
  );
}
