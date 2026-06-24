# RemitGuide

A conversational, multilingual AI agent that guides a migrant worker through sending
money home — **Korea → Nigeria** corridor. The agent compares costs, explains in plain
language, asks for approval before acting, guides the recipient on cash-out, and answers
"where's my money?" anytime.

> **Demo, not a product.** All money movement is **simulated**. FX rates are illustrative
> seed values, not live quotes. No banking, KYC, or accounts.

Built for the Global AI Hackathon Series with Qwen Cloud (Autopilot Agent track).
The intelligence runs on the **Qwen Cloud API** (chat + function-calling + embeddings),
deployed on **Alibaba Cloud**.

## Status

- [x] Milestone 1 — Qwen chat + agent loop + first tool call (`fx_lookup`, `compare_costs`)
- [x] Milestone 2 — all 5 tools + mock transfer state machine
- [x] Milestone 3 — human-in-the-loop approval (gated in the `simulate_transfer` tool contract)
- [x] Milestone 4 — pgvector RAG knowledge base *(code complete; auto-used when DB+key present, else seed fallback)*
- [x] Milestone 5 — multilingual chat UI (Approve/Decline, live timeline, cost cards)
- [x] Milestone 6 — Korean ⇄ English + literacy-aware explanations
- [ ] Milestone 7 — deploy to Alibaba Cloud *(needs your Alibaba account)*
- [x] Milestone 8 — docs, architecture diagram, demo script ([docs/](docs/))

> **Pending your accounts:** the live agent and RAG retrieval need a Qwen API key;
> deployment needs an Alibaba Cloud account. Everything else runs and is verified now.
> See the **offline demo** below to view the full UI with no key.

## Quick start

```bash
npm install
cp .env.example .env        # then paste your Qwen API key into .env
npm start                   # serve http://localhost:3737
```

### See the full UI with no key (offline demo)
```bash
npm start
# open http://localhost:3737/?demo
```
The `?demo` flag plays a scripted Korea→Nigeria conversation through the real
rendering code — cost comparison, human approval, live transfer timeline, and a
Korean cash-out guide — so you can view everything (and record the demo video)
before wiring a key.

### Talk to the live agent (needs a Qwen key)
```bash
npm run chat                # terminal REPL
# or open http://localhost:3737 and chat in English or 한국어
```

### Enable RAG retrieval (optional — needs Docker + key)
```bash
docker compose up -d                  # pgvector Postgres
# set DATABASE_URL in .env, then:
npm run seed:rag                      # embeds the knowledge base via Qwen
```
With `DATABASE_URL` set, `get_cashout_guide` retrieves from pgvector; otherwise it
falls back to the seed knowledge automatically.

## Architecture

See [docs/architecture.md](docs/architecture.md). In short:

```
Chat UI / CLI
   │  (full message history)
   ▼
Agent loop (Qwen qwen-plus + function-calling)  ──►  tool router
   │                                                   ├─ fx_lookup            (seed FX table)
   │                                                   ├─ compare_costs        (+ transparency breakdown)
   │                                                   ├─ simulate_transfer    (approval-gated)
   │                                                   ├─ get_transfer_status  (mock state machine)
   │                                                   ├─ get_cashout_guide ──► pgvector RAG (Qwen embeddings)
   │                                                   └─ check_scam           (Scam Shield)   └─ seed fallback
   ▼
plain-language reply (mirrors the user's language) + rich UI cards + read-aloud
```

## Languages

The **conversation works in any language Qwen supports** (dozens) — the agent auto-detects and
replies in the user's language, and switches mid-chat. On top of that, the **UI chrome is fully
localized in 13 languages** with English fallback for the rest, plus **read-aloud voice** and
**right-to-left** layout:

`English · 한국어 · 中文 · 日本語 · Español · Français · Português · Deutsch · Русский · العربية (RTL) · हिन्दी · Tiếng Việt · Bahasa Indonesia` — and recognised/voiced: Thai, Turkish, Bengali, Nepali, Urdu (RTL), Filipino, Uzbek.

Architecture (two-tier localization):
- **Tools** return language-neutral data (numbers, enums, IDs).
- **The agent (Qwen)** localizes all prose in its reply, in the user's language.
- **The UI** localizes its own chrome via [`public/i18n.js`](public/i18n.js) (script + heuristic
  detection → labels, BCP-47 voice, RTL). `GET /languages` lists the supported set.

## Why not just use Gemini / Claude / ChatGPT?

The model (Qwen) is a commodity — any frontier LLM could be the brain. **The product is
everything wrapped around it**, and that's what makes it more than a chat:

1. **It acts; it doesn't just talk.** A general chatbot *describes* options and *guesses*
   fees. RemitGuide runs a real cost engine (`compare_costs`) that computes the actual all-in
   cost (fee + FX margin) and a transparency breakdown. Numbers are computed, not hallucinated.
2. **Safety is enforced in code, not promised in a prompt.** `simulate_transfer` cannot
   execute without `approved: true`. A chatbot can "agree" to send money in conversation;
   RemitGuide structurally cannot move money without a human click.
3. **It does the whole job, with state.** Compare → approve → track ("where's my money?") →
   guide the recipient → defend against scams — a stateful workflow (transfer state machine +
   RAG knowledge base), not Q&A.
4. **It protects the person receiving the money.** The Scam Shield analyses a suspicious
   request and tells the family exactly what to do. No general assistant ships last-mile fraud
   defense for remittance.
5. **It's built for the actual user.** A migrant worker won't paste their money problem into
   ChatGPT. RemitGuide auto-detects their language (27 supported), reads answers aloud for
   low-literacy users, shows where every won goes, and lives on a trustworthy, purpose-built UI.

**Gemini/Claude are the engine; RemitGuide is the car** — the tools, guardrails, domain
grounding, workflow, and UX that turn a general model into something a worker can trust with
sending money home. (That agent-with-tools-and-guardrails is exactly what the "Autopilot
Agent" track judges — not the raw model.)

## Standout features

- **🛡️ Scam Shield (`check_scam`)** — the recipient describes a suspicious request; the agent
  returns a clear risk verdict (high/medium/low) + exactly what to do. Tackles the last-mile
  fraud that preys on under-served users.
- **🔊 Read-aloud** — the agent speaks its guidance in English or Korean (browser-native), for
  low-literacy / low-vision users.
- **💸 Transparency receipt** — a visual breakdown of where every won goes (family keeps / fee /
  FX margin), so the cost is honest and obvious.
- **📋 Hand-off for family** — one tap copies the cash-out guide as a plain message to send the
  recipient, closing the last-mile loop.
- **Autopilot proactivity** — the agent anticipates the next step (offers cash-out guidance after
  a send, runs the scam check unprompted) — autonomous on everything *except* moving money.

## License

MIT — see [LICENSE](LICENSE).
