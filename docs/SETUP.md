# RemitGuide — Complete Setup & Deployment Plan

From "code on your laptop" → "live agent other devs can test" → "submitted to the hackathon".
RemitGuide is a **Node/Express app serving static HTML/CSS/JS** (no build step, not Next.js).

---

## Phase 0 — Run the offline demo right now (no key, ~1 min)
The scripted demo needs **no Qwen key and no database**.
```bash
cd remitguide
npm install
npm start
# open http://localhost:3737/?demo
```
You'll see the full flow: cost comparison → transparency → **interactive approval (you click it)** →
live timeline → "where's my money?" → Korean cash-out guide → Scam Shield. Every "⚙ step" shows
the exact tool inputs/outputs on screen. Toggle ☀️/🌙 for light/dark. `?theme=dark` also works.

---

## Phase 1 — Turn on the live agent (Qwen key, ~10 min)
This makes it a *real* agent (any-language chat + tool calls), not the script.

1. Go to **Alibaba Cloud Model Studio** (DashScope / "Model Studio") and sign in.
2. **Enable Model Studio**, then create an **API key**.
3. Note your region:
   - International → `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (default)
   - Mainland China → `https://dashscope.aliyuncs.com/compatible-mode/v1`
4. Configure env:
   ```bash
   cp .env.example .env
   # set QWEN_API_KEY=sk-...   (and QWEN_BASE_URL if you're on the China region)
   ```
5. Test:
   ```bash
   npm run chat        # terminal REPL
   # or: npm start  →  http://localhost:3737  and chat in English / 한국어 / Tiếng Việt / etc.
   ```
   Expect: the agent calls `compare_costs`, mirrors your language, and never sends without approval.

---

## Phase 1.5 — Require Google sign-in (optional, ~10 min)
Gates the **live chat** so each person logs in with their own Google account. The public
scripted demo (`/?demo`) stays open. If you skip this, the chat stays open and the server
warns about it at boot.

1. Go to **[Google Cloud Console](https://console.cloud.google.com)** → create/select a project.
2. **APIs & Services → OAuth consent screen** → choose **External**, fill in the app name + your
   support email, and publish (or add yourself as a test user).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
4. Add **Authorized redirect URIs** (exact match matters):
   - `http://localhost:3737/auth/google/callback` (local)
   - `https://<your-app>.onrender.com/auth/google/callback` (production)
5. Copy the **Client ID** + **Client secret** into your environment:
   ```bash
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   SESSION_SECRET=$(openssl rand -hex 32)     # signs the session cookie
   APP_BASE_URL=https://<your-app>.onrender.com   # prod only; sets the redirect URI
   ```
   Set the same vars in the **Render dashboard** for the deployed instance.
6. Restart. Boot log should say `auth: Google sign-in ENABLED`. Visit `/` → "Sign in with Google".

> No new npm packages — sign-in uses Node's built-in `crypto` + `fetch`. Sessions are stateless
> (a signed, HTTP-only cookie), so no database is required.

---

## Phase 2 — Enable RAG retrieval (optional, Docker + key, ~15 min)
Grounds `get_cashout_guide` in a real vector store. Falls back to seed data if skipped.
```bash
docker compose up -d                 # pgvector Postgres
# set DATABASE_URL=postgres://remit:remit@localhost:5432/remitguide  in .env
npm run seed:rag                     # embeds the knowledge base via Qwen
```
Now cash-out guidance is retrieved from pgvector (`source: "rag"` in the step output).

---

## Phase 3 — Put it online so other devs can test (~10 min)

> **Tip:** even with **no key**, a deployed instance serves `/?demo` — so you can share a working
> link immediately and add the key later.

**Easiest: Render or Railway** (they run the Node process directly — best fit for an Express app).
1. Push the repo to **GitHub** (public + MIT — the hackathon requires a public OSS repo).
2. **Render** → New → **Web Service** → connect the repo →
   - Build command: `npm install`
   - Start command: `npm start`
   - Add env var `QWEN_API_KEY` (and `DATABASE_URL` if you provisioned managed Postgres)
   - Deploy → share `https://<your-app>.onrender.com/?demo`
3. **Railway** is equivalent: New Project → Deploy from repo → add env vars → done.
4. Either platform can also build the included **Dockerfile** instead of the Node buildpack.

**About Vercel (you asked):** Vercel *can* host it, but it's built for serverless functions + static
sites, not a long-running Express server, and **pgvector won't run on Vercel**. For a quick shareable
demo it's possible (wrap the app as one serverless function), but **Render/Railway is simpler** for
this app. If you specifically want Vercel, say so and I'll add the serverless adapter + `vercel.json`.

---

## Phase 4 — Deploy on Alibaba Cloud (REQUIRED for the hackathon)
The rules require deployment on Alibaba Cloud + a proof-of-deployment recording.

**Option A — ECS (a small Linux VM), simplest to reason about:**
1. Create an **ECS instance** (Ubuntu, smallest size is fine).
2. In the **Security Group**, open the app port (e.g. 3737) or run behind Nginx on 80/443.
3. SSH in, then:
   ```bash
   # install Node 20, then:
   git clone <your-public-repo> && cd remitguide
   npm install --omit=dev
   printf 'QWEN_API_KEY=sk-...\nPORT=3737\n' > .env
   npx pm2 start "npm start" --name remitguide   # keeps it running + restarts
   ```
4. Visit `http://<ecs-public-ip>:3737/?demo`.

**Option B — Docker (portable):** build the included `Dockerfile` and run it on ECS-with-Docker or
Alibaba Container Service:
```bash
docker build -t remitguide .
docker run -d -p 3737:3737 -e QWEN_API_KEY=sk-... remitguide
```

**Record the proof:** screen-record the Alibaba console showing the running instance + the public URL
loading the app. That clip is part of the submission.

---

## Phase 5 — Submission package (deadline July 9, 2026)
- [x] Public repo (MIT) — this repo
- [x] Architecture diagram — [architecture.md](architecture.md)
- [ ] ~3-min demo video — record `/?demo` (no key needed) + one live `/chat` beat. Script: [demo-script.md](demo-script.md)
- [x] Written description — [devpost.md](devpost.md)
- [ ] Proof-of-deployment recording (Phase 4)

---

## Quick reference
| Want | Command |
|------|---------|
| Offline demo | `npm start` → `/?demo` |
| Live agent (terminal) | `npm run chat` |
| Live agent (web) | `npm start` → `/` |
| RAG | `docker compose up -d` → `npm run seed:rag` |
| Container | `docker build -t remitguide . && docker run -p 3737:3737 -e QWEN_API_KEY=... remitguide` |
| Supported languages | `GET /languages` |
