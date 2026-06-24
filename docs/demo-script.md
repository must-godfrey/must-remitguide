# RemitGuide — 3-Minute Demo Video Script

**Goal:** show a *real agent* (tools + RAG + human-in-the-loop) solving a real, painful
problem, with a multilingual guidance layer nobody else built. Record at
`http://localhost:3737/?demo` — the scripted flow is deterministic (no latency, no cost),
so the take is clean every time. Cut to the live `/chat` for one "this is really Qwen" beat.

Total: ~3:00. Times are cumulative.

---

### 0:00–0:25 — The problem (hook)
> *"Every month, millions of people working abroad send money home. It's expensive —
> 6 to 7 percent in fees — confusing, and the scary part is the last mile: the family on
> the other end struggling to get cash, with scammers waiting. The money rails are already
> fast and cheap. What's missing isn't technology. It's a guide."*

On screen: the RemitGuide landing page. Read the headline — *"Send money home, without the worry."*

### 0:25–0:55 — Ask + compare (the agent reasons with tools)
Type / play: **"I want to send 500,000 won to my mum in Lagos."**
> *"I just talk to it like a person. Watch — it's not guessing. It calls a tool,
> `compare_costs`, and ranks every option by the true all-in cost."*

On screen: the cost-comparison card animates in. Point at the **Best value** badge.
> *"Stablecoin: it costs me about 5,000 won, and my mum receives 573,000 naira. A bank
> wire would cost 41,000. It tells me, in plain language, this saves me 36,000 won."*

Point at the **"Where every won goes"** breakdown bar under the best option.
> *"And it's honest about the cost — it shows me exactly where every won goes: my family
> keeps 98.9%, this much is fee, this much is exchange-rate margin. No hidden cuts."*

### 0:55–1:25 — Human-in-the-loop (the safety story)
Play: **"Yes, send it the cheapest way."**
> *"Here's the part I care about. It does NOT just send my money. Approval isn't a
> suggestion — it's built into the tool itself. The agent literally cannot move money
> without my explicit yes."*

On screen: the gold approval card. Click **Approve & send**.

### 1:25–1:50 — Where's my money? (live tracking)
On screen: the transfer timeline animates Sent → Received → Cashed out.
> *"Anytime I wonder 'where's my money?', it tells me in plain words — on its way…
> arrived… collected. No jargon, no anxiety."*

### 1:50–2:20 — The last mile + multilingual (the differentiator)
Play (in Korean): **"엄마가 라고스에서 돈을 어떻게 안전하게 받나요?"**
> *"Now the magic. I switch to Korean — it detects the language and answers in Korean,
> and guides my mum on the other side: how to collect the cash safely. Grounded in a real
> retrieval knowledge base — concrete, not generic."*

On screen: language chip flips to **한국어**; the cash-out guide card. Tap the header **🔊**.
> *"And for someone who can't read easily, it reads everything aloud — in their language."*
(Let one line speak.)

### 2:20–2:50 — Scam Shield (the climax that wins the room)
Play: **"Someone called my mum saying she must pay a fee and give her OTP to release the
money, and to hurry."**
> *"This is where people lose everything. Watch."*

On screen: the red **Scam warning** card snaps in with the verdict and what-to-do steps.
> *"The agent calls its Scam Shield, recognizes every red flag — the fake fee, the OTP
> request, the pressure — and tells my mum, in plain words: stop, this is a scam, the money
> is already paid for. Nobody else in remittance protects the person on the receiving end."*

### 2:50–3:00 — Tech + close
Quick cut to the live `/chat` (or `npm run chat`): show a `⚙ called compare_costs` trace and a
real Qwen reply.
> *"A real agent loop on Qwen Cloud, six tools, pgvector retrieval, on Alibaba Cloud. The
> rails were never the problem. RemitGuide is the guide — in your language, on your side."*

---

## Recording tips
- 1280×800 window, browser zoom 100%, hide bookmarks bar.
- Use `/?demo` for the main flow; pre-open the live `/chat` tab for the 2:35 beat.
- The demo auto-advances; rehearse once to match your voiceover to the beats.
- Capture proof-of-deployment separately (Alibaba console + the public URL loading).
