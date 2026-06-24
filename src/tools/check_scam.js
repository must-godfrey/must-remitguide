// Scam Shield — the last-mile safety tool. A recipient (or the worker on their
// behalf) describes a suspicious request, and this returns a clear risk verdict
// with plain-language reasons and what to do. Deterministic pattern analysis so
// it works offline; enriched by the RAG scam knowledge when available.
import { SCAM_WARNINGS } from "../data/knowledge.js";

export const schema = {
  type: "function",
  function: {
    name: "check_scam",
    description:
      "Analyze a suspicious message, phone call, or request the user received around their " +
      "money transfer, and judge how likely it is to be a scam. Use this WHENEVER the user " +
      "describes someone asking for money/fees/codes to 'release' funds, pressuring them, or " +
      "anything that feels off. Returns a risk level (high/medium/low), reasons, and clear " +
      "next steps.",
    parameters: {
      type: "object",
      properties: {
        situation: {
          type: "string",
          description: "What happened, in the user's own words — the message or request received.",
        },
      },
      required: ["situation"],
    },
  },
};

// Each signal: a matcher, a weight, and a plain-language reason.
const SIGNALS = [
  {
    id: "fee_first",
    weight: "high",
    test: (t) =>
      /(pay|send|transfer|deposit).{0,40}(fee|charge|tax|clearance|activation|release|unlock)/.test(t) ||
      /(fee|charge|tax|clearance).{0,40}(first|before|to (get|receive|release|unlock))/.test(t),
    reason: "You are being asked to pay a fee to receive money — legitimate transfers never work this way.",
  },
  {
    id: "credentials",
    weight: "high",
    test: (t) => /(pin|otp|one[\s-]?time|password|passcode|cvv|verification code|보안코드|비밀번호)/.test(t),
    reason: "Someone is asking for your PIN, OTP, or password. Never share these — no real bank or agent needs them.",
  },
  {
    id: "overpayment",
    weight: "high",
    test: (t) => /(sent|paid).{0,30}(too much|extra|by mistake)|refund the (difference|extra|balance)/.test(t),
    reason: "The 'sent too much, refund the difference' trick is a classic scam — the original payment is usually fake.",
  },
  {
    id: "prize",
    weight: "high",
    test: (t) => /(you (won|have won)|prize|lottery|reward|gift|inheritance).{0,40}(claim|release|fee|pay)/.test(t),
    reason: "Prize or lottery messages that need a payment to 'claim' are almost always fraud.",
  },
  {
    id: "pressure",
    weight: "medium",
    test: (t) => /(urgent|immediately|right now|act fast|hurry|expire|stay on the (phone|line)|don'?t tell|keep this secret|지금 바로|서둘러)/.test(t),
    reason: "You are being pressured to act fast or stay quiet. Scammers use urgency so you can't stop and check.",
  },
  {
    id: "unofficial",
    weight: "medium",
    test: (t) => /(no receipt|won'?t show|refuse to show|hide the (screen|amount)|meet (outside|on the street)|unregistered)/.test(t),
    reason: "A legitimate agent shows you the amount on screen and gives a receipt. Refusing to is a warning sign.",
  },
  {
    id: "impersonation",
    weight: "medium",
    test: (t) => /(from your bank|bank official|government|customs|police|agent called|claims? to be)/.test(t),
    reason: "Someone is claiming to be an official. Hang up and contact the bank/agency yourself using a number you trust.",
  },
];

const SAFE_STEPS = {
  high: [
    "Do NOT send any money or share any codes.",
    "Stop the conversation now — do not reply under pressure.",
    "Your transfer is already paid for. Nobody legitimate needs another payment to release it.",
    "If unsure, ask the person who sent you the money before doing anything.",
  ],
  medium: [
    "Slow down — do not act until you have checked.",
    "Never share your PIN, OTP, or password with anyone.",
    "Contact your bank or the agent using an official number you find yourself, not one they gave you.",
  ],
  low: [
    "Nothing here looks clearly like a scam, but stay careful.",
    "Only collect cash from a registered agent who shows the amount on screen and gives a receipt.",
    "Never share your PIN, OTP, or password with anyone.",
  ],
};

const VERDICT = {
  high: "This looks like a SCAM. Please do not pay or share anything.",
  medium: "This is suspicious. Please be careful and double-check before doing anything.",
  low: "No clear scam signs — but always stay cautious with money.",
};

export async function handler({ situation }) {
  const t = String(situation || "").toLowerCase();
  if (!t.trim()) {
    return { error: "Please describe what happened so I can check it." };
  }

  const matched = SIGNALS.filter((s) => s.test(t));
  const hasHigh = matched.some((s) => s.weight === "high");
  const mediumCount = matched.filter((s) => s.weight === "medium").length;

  let risk = "low";
  if (hasHigh) risk = "high";
  else if (mediumCount >= 1) risk = "medium";

  return {
    risk,
    verdict: VERDICT[risk],
    reasons: matched.map((s) => s.reason),
    what_to_do: SAFE_STEPS[risk],
    // A couple of general reminders grounded in the scam knowledge base.
    remember: SCAM_WARNINGS.slice(0, 2),
  };
}
