// In-memory mock transfer store + state machine. DEMO ONLY — no persistence,
// no real money. A transfer progresses through states purely on elapsed time so
// that asking "where's my money?" again shows real movement during a demo.
//
//   sent  ->  received  ->  cashed_out
//
// Thresholds are short on purpose (seconds) so the progression is visible live.

const transfers = new Map();

const STAGE_SECONDS = {
  received: 8, // arrives at the payout point after ~8s
  cashed_out: 20, // family collects cash after ~20s
};

function makeId() {
  // RG-XXXXXX — readable, demo-friendly. Date/random are fine in app runtime.
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RG-${rand}`;
}

export function createTransfer({ amount, method, recipient, from_currency = "KRW" }) {
  const id = makeId();
  const record = {
    transfer_id: id,
    amount,
    from_currency,
    method,
    recipient,
    created_at: Date.now(),
  };
  transfers.set(id, record);
  return { ...record, status: "sent" };
}

export function getTransfer(id) {
  const record = transfers.get(id);
  if (!record) return null;
  const elapsed = (Date.now() - record.created_at) / 1000;

  let status = "sent";
  if (elapsed >= STAGE_SECONDS.cashed_out) status = "cashed_out";
  else if (elapsed >= STAGE_SECONDS.received) status = "received";

  return { ...record, status, elapsed_seconds: Math.round(elapsed) };
}

// Test/demo helper — clears all transfers.
export function _reset() {
  transfers.clear();
}
