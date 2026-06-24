# RemitGuide — Devpost Write-up

> A conversational, multilingual AI agent that guides a migrant worker through sending money
> home — and guides their family through safely collecting it. Built on the Qwen Cloud API,
> deployed on Alibaba Cloud. *(Demo: all money movement is simulated.)*

## Inspiration
Over **$650B** is sent home by migrant workers every year. They lose ~**6–7%** to fees and
hidden FX margins, the choices are confusing, and the hardest part is the **last mile** — the
family receiving the money struggles to turn it into cash, and scammers target people who
don't understand the process. The money rails are already fast and cheap. What's missing
isn't infrastructure — it's a **friendly, trustworthy guide**, in the user's own language.

## What it does
On the **Korea → Nigeria** corridor, RemitGuide lets a worker just talk ("I want to send
money home") and it:
1. **Compares the options** and recommends the cheapest, in plain language ("this costs you
   ₩5,488; a bank wire costs ₩41,625").
2. **Explains simply** what's happening to their money.
3. **Asks for approval** before anything happens — it never moves money on its own.
4. **Guides the recipient** on the other end — how to cash out safely, which scams to avoid.
5. **Answers "where's my money?"** anytime, in plain words (sent → received → cashed out).

It is **multilingual by design**: the conversation works in any language Qwen supports, auto-
detecting and replying in the user's own language (and switching mid-chat) — with the UI fully
localized in 13 languages, **read-aloud voice**, and **right-to-left** support for Arabic/Urdu.
That breadth matches the real migrant population in Korea: Vietnamese, Nepali, Filipino,
Indonesian, Chinese, Uzbek, Thai, and more. It even translates scary official Korean bank-speak
into the worker's own language.

And it goes further than any remittance app we've seen:
- **🛡️ Scam Shield** — the family describes a suspicious call ("pay a fee and give your OTP to
  release the money") and the agent judges the risk and tells them exactly what to do. It
  protects the person on the *receiving* end — where people actually lose everything.
- **🔊 Read-aloud** — it speaks its guidance in English or Korean, for low-literacy / low-vision
  users.
- **💸 Transparency receipt** — it shows where every won goes (family keeps / fee / FX margin).
- **📋 Hand-off for family** — one tap copies the cash-out guide as a message to send the recipient.

## How we built it
- **Brain:** Qwen Cloud API — `qwen-plus` for chat + function-calling, `text-embedding-v3`
  for retrieval. The whole intelligence layer is Qwen.
- **Agent loop:** a real tool-calling orchestrator (Node/Express). The model decides which
  of 5 tools to call, we execute them, feed results back, and loop until it answers.
- **Tools (6):** `fx_lookup`, `compare_costs`, `simulate_transfer`, `get_transfer_status`,
  `get_cashout_guide`, `check_scam` (Scam Shield).
- **RAG:** a pgvector knowledge base (Nigeria cash-out methods, scam patterns, corridor cost
  reference) embedded with Qwen; `get_cashout_guide` retrieves to ground its advice.
- **Human-in-the-loop:** approval is enforced in the *tool contract* — `simulate_transfer`
  refuses to run without `approved: true`.
- **Front-end:** one multilingual chat page that renders the agent's tool calls as rich
  components — ranked cost cards, an approval card, a live transfer timeline.
- **Deploy:** Alibaba Cloud (ECS).

## How it maps to the judging rubric

**Technical Depth & Engineering — 30%**
A genuine agent loop (not scripted): `qwen-plus` function-calling drives 5 tools through a
router, with a multi-step reason→act→observe cycle. Real RAG over pgvector with Qwen
embeddings and an HNSW cosine index. Safety encoded as a tool contract, not UI. Graceful
degradation (RAG → seed fallback) so it never hard-fails.

**Innovation & AI Creativity — 30%**
The **guidance layer nobody built**: most remittance tools optimize the *transfer*.
RemitGuide optimizes *understanding and safety* — for both the sender and the family
receiving. The **Scam Shield** actively defends the recipient against the fraud that targets
the last mile; **read-aloud** serves low-literacy users; the agent translates official Korean
bank-speak into plain language. Optimizing the *human* side of remittance, not the rails, is
the creative core.

**Problem Value & Impact — 25%**
A $650B+ market and an under-served, often financially-vulnerable user. Fee transparency
plus literacy-aware, language-native scam guidance directly addresses where real money and
real safety are lost.

**Presentation & Documentation — 15%**
A distinctive, culturally-resonant **"Naija Neo"** interface — emerald + gold + coral, an
animated aurora, bold expressive type (Bricolage Grotesque), animated count-up figures, a
streaming-style word reveal, and springy motion — deliberately *not* a generic AI chat or a
cold fintech dashboard. Plus full RTL, a deterministic offline demo mode for a clean video, a
clear architecture diagram, and complete docs.

## Challenges
Keeping the agent honest (always tool-grounded numbers, never hallucinated), and making
human-in-the-loop unbypassable rather than cosmetic.

## What's next
More corridors and languages, real (licensed) rails behind the same guidance layer, and
voice for low-literacy users.

## Built with
Qwen Cloud API · Node.js · Express · pgvector · PostgreSQL · Alibaba Cloud · vanilla JS

## Try it
- Live demo: _<deployment URL>_
- Offline UI demo (no key): `npm start` → `http://localhost:3737/?demo`
- Repo: _<public repo URL>_ (MIT)
