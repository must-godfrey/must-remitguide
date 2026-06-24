/* Offline demo player. Activate with /?demo
   Plays a scripted, well-paced Korea -> Nigeria conversation through the real
   rendering code — including the expandable "what happened under the hood" steps —
   so viewers can clearly follow how the agent works, with no Qwen key.
   Deterministic = a reliable, zero-cost source for the demo video. */

(function () {
  if (!/[?&]demo/.test(location.search)) return;
  const RG = window.RG;
  if (!RG) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---- seeded tool results (identical numbers to the real backend) ----
  const FX = { from: "KRW", to: "NGN", rate: 1.16, note: "Illustrative demo rate." };
  const COMPARE = {
    amount: 500000, from_currency: "KRW", to_country: "Nigeria", recommended: "stablecoin", savings_vs_worst: 36137,
    methods: [
      { id: "stablecoin", name: "Stablecoin transfer + local cash-out", speed: "minutes", payout: "Local P2P / agent cash-out in NGN", all_in_cost: 5488, recipient_gets: 573634,
        breakdown: { mid_market_value: 580000, fee_cost: 1740, fx_margin_cost: 4626, recipient_gets: 573634 } },
      { id: "mto", name: "Money transfer operator (remittance app)", speed: "minutes to a few hours", payout: "Bank account or cash pickup", all_in_cost: 16860, recipient_gets: 560442 },
      { id: "bank_wire", name: "Traditional bank wire", speed: "2–4 business days", payout: "Recipient's Nigerian bank account", all_in_cost: 41625, recipient_gets: 531715 },
    ],
  };
  const APPROVAL = { status: "pending_approval", requires_approval: true, summary: { amount: 500000, from_currency: "KRW", method: "Stablecoin transfer + local cash-out", recipient: "Mum (Lagos)", speed: "minutes" } };
  const SENT = { status: "sent", transfer_id: "RG-7KQ4M2", amount: 500000, from_currency: "KRW", method: "Stablecoin transfer + local cash-out", recipient: "Mum (Lagos)" };
  const STATUS = { transfer_id: "RG-7KQ4M2", status: "received", plain_language: "The money has arrived at the payout point. Your family can collect it now.", amount: 500000, method: "Stablecoin transfer + local cash-out", recipient: "Mum (Lagos)" };
  const GUIDE = {
    country: "Nigeria", region: "Lagos", source: "rag",
    methods: [
      { name: "Agent banking (POS agent)", steps: [
        "Find a registered POS agent — look for the bank's signboard, not a random table.",
        "Tell them you want to withdraw the money sent to your account.",
        "Check the amount on the screen yourself before you accept.",
        "Collect your cash and your receipt. Count it before you leave." ] },
      { name: "Mobile money / bank app", steps: [
        "Open your bank or wallet app and confirm the money has arrived.",
        "Withdraw at an ATM or transfer to a trusted agent to get cash." ] },
    ],
    scam_warnings: [
      "Nobody legitimate will ask you to 'pay a fee first' to release money that is already yours.",
      "Never share your bank PIN, OTP, or app password — not even with someone claiming to be your bank.",
      "Be careful with an agent who won't show the amount on screen or won't give a receipt.",
      "If a caller pressures you to act fast while you withdraw, hang up and verify first." ],
  };
  const SCAM = {
    risk: "high", verdict: "This looks like a SCAM. Please do not pay or share anything.",
    reasons: [
      "You are being asked to pay a fee to receive money — legitimate transfers never work this way.",
      "Someone is asking for your OTP. Never share it — no real bank or agent needs it.",
      "You are being pressured to act fast. Scammers use urgency so you can't stop and check." ],
    what_to_do: [
      "Do NOT send any money or share any codes.",
      "Stop the conversation now — do not reply under pressure.",
      "Your transfer is already paid for. Nobody legitimate needs another payment to release it.",
      "Ask the person who sent you the money before doing anything." ],
  };

  async function botSays(text, think = 1300, settle = 1600) {
    const t = RG.typing();
    await sleep(think);
    t.remove();
    RG.botBubble(text);
    await sleep(settle); // let the reveal finish + give time to read
  }

  async function play() {
    // Wait for web fonts so card heights are correct from the first frame (no cut-off).
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
    RG.hideIntro();
    await sleep(700);

    // 1 — the worker asks, in English
    const q1 = "I want to send 500,000 won to my mum in Lagos.";
    RG.updateLang(q1); RG.userBubble(q1);
    await sleep(900);

    // the agent reasons with tools (each step is expandable to see inputs/outputs)
    RG.step({ name: "fx_lookup", args: { from: "KRW", to: "NGN" }, result: FX });
    await sleep(1100);
    RG.step({ name: "compare_costs", args: { amount: 500000, from_currency: "KRW", to_country: "Nigeria" }, result: COMPARE });
    await sleep(1100);
    RG.renderCompare(COMPARE);
    await sleep(3600); // hold on the (now compact) card so it's fully readable before the reply

    await botSays(
      "Good news — I checked all the ways to send your ₩500,000.\n\n" +
      "The cheapest is a stablecoin transfer: it costs you only ₩5,488, and your mum receives ₦573,634 in minutes. " +
      "A bank wire would cost ₩41,625 — so this saves you about ₩36,137.\n\n" +
      "Want me to send it this way? I won't move anything until you say yes.", 1500, 2400);

    // 2 — the approval gate (the agent CANNOT send on its own)
    const q2 = "Yes, please send it the cheapest way.";
    RG.userBubble(q2);
    await sleep(900);
    RG.step({ name: "simulate_transfer", args: { amount: 500000, method: "stablecoin", recipient: "Mum (Lagos)" }, result: APPROVAL });
    await sleep(1100);
    // INTERACTIVE: the demo pauses here for a real click — you decide. (It auto-
    // approves after a while so an unattended video still progresses.)
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      RG.renderApproval(APPROVAL, (approved) => {
        if (approved) finish();
        else RG.botBubble("No problem — I won't send anything. Whenever you're ready, just tap “Approve & send”.");
      });
      setTimeout(finish, 14000); // fallback auto-advance for unattended playback
    });
    RG.userBubble("✓ Approved");
    await sleep(900);
    RG.step({ name: "simulate_transfer", args: { amount: 500000, method: "stablecoin", recipient: "Mum (Lagos)", approved: true }, result: SENT });
    await sleep(1100);
    RG.renderTimeline("RG-7KQ4M2", { status: "sent" }, true);
    await botSays("Sent! 🎉 You can watch it move above. I'll let you know the moment your mum can collect it.", 1300, 2600);

    // 3 — "where's my money?" → explicit status check
    const q3 = "Where's my money right now?";
    RG.userBubble(q3);
    await sleep(900);
    RG.step({ name: "get_transfer_status", args: { transfer_id: "RG-7KQ4M2" }, result: STATUS });
    await sleep(1100);
    await botSays("It just arrived at the payout point — your mum can collect it now. Want me to show her exactly how to do that safely?", 1300, 2200);

    // 4 — the last mile, in Korean (shows language detection + RAG-grounded guide)
    const q4 = "네, 엄마가 라고스에서 어떻게 안전하게 받을 수 있는지 알려주세요.";
    RG.updateLang(q4); RG.userBubble(q4);
    await sleep(900);
    RG.step({ name: "get_cashout_guide", args: { country: "Nigeria", region: "Lagos" }, result: GUIDE });
    await sleep(1100);
    RG.renderGuide(GUIDE);
    await sleep(3400);
    await botSays(
      "어머니께 이렇게 안내해 주세요 👇\n\n" +
      "등록된 POS 대리점(은행 간판이 있는 곳)에서 출금하시고, 현금을 받기 전에 화면의 금액을 꼭 확인하세요. 영수증도 챙기세요.\n\n" +
      "비밀번호(PIN·OTP)는 누구에게도 알려주지 마세요.", 1500, 2600);

    // 5 — Scam Shield (the safety climax), back in English
    const q5 = "Someone just called my mum saying she must pay a 5,000 naira fee and give her OTP to release the money, and to hurry.";
    RG.updateLang(q5); RG.userBubble(q5);
    await sleep(900);
    RG.step({ name: "check_scam", args: { situation: q5 }, result: SCAM });
    await sleep(1100);
    RG.renderScam(SCAM);
    await sleep(2600);
    await botSays(
      "Please tell your mum to STOP — this is a scam. 🛑\n\n" +
      "The money you sent is already paid for. Nobody honest will ask her to pay a fee or share her OTP to receive it. " +
      "She should hang up, share nothing, and only collect from a registered agent. You did everything right.", 1500, 2200);

    // ---- Demo complete: make EVERYTHING reviewable ----
    await sleep(700);
    const log = document.getElementById("log");

    // 1) Expand every ⚙ step so all the details (inputs + outputs) are visible.
    document.querySelectorAll(".step").forEach((s) => s.classList.add("open"));

    // 2) A clear end-marker in the conversation.
    const endCard = document.createElement("div");
    endCard.className = "demo-end";
    endCard.innerHTML =
      `<b>✓ That's the whole flow.</b> Every ⚙ step above is now expanded — scroll up to see ` +
      `exactly what each tool received and returned (the agent's real work). Tap any step to collapse it.`;
    log.appendChild(endCard);

    // 3) Scroll back to the very top so you can read it from the beginning, at your pace.
    await sleep(400);
    log.scrollTo({ top: 0, behavior: "smooth" });

    // 4) An always-visible pill to replay or jump around.
    const pill = document.createElement("div");
    pill.className = "demo-done";
    const top = document.createElement("button");
    top.textContent = "↑ Top";
    top.onclick = () => log.scrollTo({ top: 0, behavior: "smooth" });
    const bottom = document.createElement("button");
    bottom.textContent = "↓ End";
    bottom.onclick = () => log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
    const replay = document.createElement("button");
    replay.className = "primary";
    replay.textContent = "↻ Replay";
    replay.onclick = () => location.reload();
    const label = document.createElement("span");
    label.textContent = "Demo complete · explore the steps";
    pill.append(label, top, bottom, replay);
    document.body.appendChild(pill);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", play);
  } else {
    play();
  }
})();
