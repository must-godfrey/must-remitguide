import "dotenv/config";
import express from "express";
import { runAgent } from "./agent.js";
import { getTransfer } from "./state/transfers.js";
import { LANGUAGES } from "./languages.js";
import { isAuthEnabled, requireAuth, mountAuthRoutes } from "./auth.js";

const app = express();
app.set("trust proxy", true); // behind Render/Alibaba TLS proxy — respect x-forwarded-proto
app.use(express.json());
app.use(express.static("public"));

// Google sign-in routes (/auth/*). No-op for the OAuth endpoints if not configured.
mountAuthRoutes(app);

// Health check — works with or without a Qwen key (used to verify the server boots).
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "remitguide",
    qwen_key_present: Boolean(process.env.QWEN_API_KEY),
    model: process.env.QWEN_MODEL || "qwen-plus",
    languages: { recognised: LANGUAGES.length, ui_localized: LANGUAGES.filter((l) => l.ui).length },
  });
});

// Discoverable list of supported languages (chrome-localized vs conversation-only).
app.get("/languages", (_req, res) => {
  res.json({
    note: "Conversation supports many more languages via Qwen; this is the recognised/labeled set.",
    languages: LANGUAGES,
  });
});

// Live transfer status — lets the UI animate the timeline without a Qwen turn.
// Pure mock state machine, so it works with or without a key.
app.get("/transfer/:id", requireAuth, (req, res) => {
  const t = getTransfer(req.params.id);
  if (!t) return res.status(404).json({ error: "Transfer not found" });
  res.json(t);
});

// Stateless for now: the client sends the full message history each turn.
const MAX_HISTORY = 40; // keep the conversation bounded
const MAX_CONTENT = 4000; // guard against oversized messages

app.post("/chat", requireAuth, async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Body must be { messages: [...] } with at least one message." });
    }
    const valid = messages.every(
      (m) => m && typeof m === "object" && typeof m.role === "string"
    );
    if (!valid) {
      return res.status(400).json({ error: "Each message must have a role and content." });
    }
    // Bound the history and clamp any oversized user content.
    const trimmed = messages.slice(-MAX_HISTORY).map((m) =>
      typeof m.content === "string" && m.content.length > MAX_CONTENT
        ? { ...m, content: m.content.slice(0, MAX_CONTENT) }
        : m
    );

    const { messages: updated, reply, toolTrace } = await runAgent(trimmed);
    res.json({ reply, messages: updated, toolTrace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "The agent could not complete that request. Please try again." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`RemitGuide listening on http://localhost:${port}`);
  console.log(`  health: http://localhost:${port}/health`);
  if (isAuthEnabled()) {
    console.log("  auth:   Google sign-in ENABLED — live chat requires login (/?demo stays public)");
  } else {
    console.warn("  ⚠️  Google sign-in NOT configured — the live chat is OPEN to everyone.");
    console.warn("      Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and SESSION_SECRET to require login.");
  }
});
