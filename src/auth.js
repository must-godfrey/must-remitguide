/* Google sign-in (OAuth 2.0 Authorization Code flow).
   Each person logs in with their own Google account; their identity is held in a
   signed, HTTP-only session cookie — no database, no third-party auth library.

   The live chat is gated behind this; the public scripted demo (/?demo) is not.
   If the Google env vars are not set, auth is DISABLED and the chat stays open
   (so the keyless offline demo still works) — the server warns loudly at boot. */

import crypto from "node:crypto";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;

const SESSION_COOKIE = "rg_session";
const STATE_COOKIE = "rg_oauth_state";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

// Auth is only enforced when all three secrets are present.
export function isAuthEnabled() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && SESSION_SECRET);
}

/* ---------- cookie + session helpers ---------- */
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

// HMAC-signed, base64url-encoded JSON: `<payload>.<signature>`.
function signSession(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifySession(token) {
  if (!token || typeof token !== "string") return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!obj.exp || Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

// Read the authenticated user from the request, or null.
export function getUser(req) {
  if (!isAuthEnabled()) return null;
  return verifySession(parseCookies(req)[SESSION_COOKIE]);
}

// Express middleware: gate live features behind a valid session.
export function requireAuth(req, res, next) {
  if (!isAuthEnabled()) return next(); // open mode — warned about at boot
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "auth_required", login_url: "/auth/google" });
  req.user = user;
  next();
}

/* ---------- OAuth flow ---------- */
function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}
const redirectUri = (req) => `${baseUrl(req)}/auth/google/callback`;
const cookieOpts = (req) => ({ httpOnly: true, sameSite: "lax", secure: baseUrl(req).startsWith("https"), path: "/" });

// Google returns the ID token directly from the token endpoint over TLS, so we can
// trust it without re-verifying the signature — we still validate audience/issuer/exp.
function readIdToken(idToken) {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("malformed id_token");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (claims.aud !== CLIENT_ID) throw new Error("id_token audience mismatch");
  if (!GOOGLE_ISSUERS.includes(claims.iss)) throw new Error("id_token issuer mismatch");
  if (!claims.exp || Date.now() / 1000 > claims.exp) throw new Error("id_token expired");
  return claims;
}

const errorPage = (msg) =>
  `<!doctype html><meta charset="utf-8"><title>Sign-in</title>` +
  `<body style="font-family:system-ui;max-width:32rem;margin:18vh auto;text-align:center;color:#1c2b25">` +
  `<h2>🔐 ${msg}</h2><p><a href="/" style="color:#067a4e;font-weight:600">← Back to RemitGuide</a></p></body>`;

const sanitize = (u) => (u ? { email: u.email, name: u.name, picture: u.picture } : null);

export function mountAuthRoutes(app) {
  // Lets the client know whether auth is on and who (if anyone) is signed in.
  app.get("/auth/me", (req, res) => {
    const user = getUser(req);
    res.json({ authEnabled: isAuthEnabled(), authenticated: Boolean(user), user: sanitize(user) });
  });

  if (!isAuthEnabled()) return; // no OAuth endpoints without configuration

  // Step 1 — bounce the user to Google's consent screen.
  app.get("/auth/google", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie(STATE_COOKIE, state, { ...cookieOpts(req), maxAge: STATE_TTL_MS });
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // Step 2 — Google redirects back with a code; exchange it and start a session.
  app.get("/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state || state !== parseCookies(req)[STATE_COOKIE]) {
        return res.status(400).send(errorPage("Sign-in failed (invalid request). Please try again."));
      }
      res.clearCookie(STATE_COOKIE, { path: "/" });

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: redirectUri(req),
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.id_token) {
        return res.status(400).send(errorPage("Sign-in failed (Google rejected the request). Please try again."));
      }

      const claims = readIdToken(tokens.id_token);
      if (claims.email_verified === false) {
        return res.status(403).send(errorPage("Your Google email is not verified, so you can't sign in."));
      }

      const session = {
        sub: claims.sub,
        email: claims.email,
        name: claims.name || claims.email,
        picture: claims.picture || null,
        exp: Date.now() + SESSION_TTL_MS,
      };
      res.cookie(SESSION_COOKIE, signSession(session), { ...cookieOpts(req), maxAge: SESSION_TTL_MS });
      res.redirect("/");
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.status(500).send(errorPage("Something went wrong during sign-in. Please try again."));
    }
  });

  // Clear the session.
  app.get("/auth/logout", (req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.redirect("/");
  });
}
