/* RemitGuide chat client.
   Renders the agent's natural-language reply AND rich visual components driven
   by the tool calls it makes (cost comparison, approval, live timeline, guide). */

const log = document.getElementById("log");
const intro = document.getElementById("intro");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");
const langChip = document.getElementById("lang-chip");
const voiceToggle = document.getElementById("voice-toggle");

let messages = []; // full history sent to the agent each turn
let busy = false;
let voiceOn = false;
let authEnabled = false; // server reports whether Google sign-in is configured
let authUser = null;     // the signed-in user (or null)
const isDemo = /[?&]demo/.test(location.search);

/* ---------- helpers ---------- */
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const krw = (n) => "₩" + Math.round(n).toLocaleString("en-US");
const ngn = (n) => "₦" + Math.round(n).toLocaleString("en-US");
const scrollDown = () => { log.scrollTop = log.scrollHeight; };
const t = (key, vars) => window.I18N.t(key, vars);
const fx = (name, node, ...args) => { if (window.RGAnim?.[name]) window.RGAnim[name](node, ...args); };

/* animated count-up for hero numbers */
function countUp(node, to, fmt, dur = 850) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !to) { node.textContent = fmt(to); return; }
  let startTs = null;
  function frame(ts) {
    if (startTs === null) startTs = ts;
    const p = Math.min(1, (ts - startTs) / dur);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    node.textContent = fmt(to * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function animateNumbers(scope) {
  scope.querySelectorAll("[data-krw]").forEach((n) => countUp(n, +n.dataset.krw, krw));
  scope.querySelectorAll("[data-ngn]").forEach((n) => countUp(n, +n.dataset.ngn, ngn));
}

/* streaming-style word-by-word reveal (escapes, preserves newlines) */
function revealHTML(text) {
  let i = 0;
  return esc(text).split("\n").map((line) =>
    line.split(" ").map((word) => {
      const delay = Math.min(i * 16, 900);
      i++;
      return word === "" ? "" : `<span class="w" style="animation-delay:${delay}ms">${word}</span>`;
    }).join(" ")
  ).join("<br>");
}

/* ---------- read-aloud (accessibility, any supported language) ---------- */
const synth = window.speechSynthesis;
function speak(text, btn) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = window.I18N.bcp47(window.I18N.detect(text)); // pick the voice for the text's language
  u.rate = 0.96;
  if (btn) {
    btn.classList.add("playing");
    u.onend = u.onerror = () => btn.classList.remove("playing");
  }
  synth.speak(u);
}

// Smart scroll: a card that DOESN'T fit the viewport gets its TOP brought into
// view; anything that fits is scrolled fully into view (so the whole card shows,
// not a cut-off slice). Short bubbles pin to bottom.
function add(node) {
  log.appendChild(node);
  const place = () => {
    const tooTall = node.offsetHeight > log.clientHeight - 24;
    // scrollIntoView is reliable within the scroll container: align the new node's
    // bottom to the viewport (fully visible) — or its top if it can't fit.
    node.scrollIntoView({ block: tooTall ? "start" : "end", behavior: "auto" });
  };
  requestAnimationFrame(place);
  // Re-assert as layout settles — fonts, count-up numbers and the word reveal can
  // change a node's height after it mounts, so the final resting position is correct.
  setTimeout(place, 90);
  setTimeout(place, 380);
  return node;
}

/* ---------- live re-localization ----------
   Cards register a rebuild closure so that switching language re-renders them in
   place. Bubbles (the agent's actual words) are intentionally NOT re-localized. */
const localizables = [];
function loc(build, after) {
  const entry = { build, after, node: build() };
  add(entry.node);
  if (after) after(entry.node);
  localizables.push(entry);
  return entry.node;
}
function relocalize() {
  for (const e of localizables) {
    if (!e.node || !e.node.isConnected) continue;
    const fresh = e.build();
    e.node.replaceWith(fresh);
    e.node = fresh;
    if (e.after) e.after(fresh);
  }
}
function localizeStatic() {
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-ph]").forEach((n) => { n.setAttribute("placeholder", t(n.getAttribute("data-i18n-ph"))); });
}

/* ---------- message bubbles ---------- */
function userBubble(text) {
  const row = el("div", "row user");
  row.append(el("div", "avatar", "🧑🏾"), el("div", "bubble", esc(text)));
  add(row);
  fx("userSend", row);
  return row;
}
function botBubble(text) {
  const row = el("div", "row bot");
  const bubble = el("div", "bubble", revealHTML(text));
  const speaker = el("button", "speaker", "🔊 " + t("readAloud"));
  speaker.onclick = () => speak(text, speaker);
  bubble.append(el("br"), speaker);
  row.append(el("div", "avatar bot", "🪙"), bubble);
  add(row);
  if (voiceOn) speak(text, speaker);
  return row;
}
function typing() {
  const row = el("div", "row bot");
  row.append(el("div", "avatar bot", "🪙"), el("div", "bubble", '<div class="typing"><span></span><span></span><span></span></div>'));
  row.dataset.typing = "1";
  return add(row);
}
// Plain-English summary of what a tool call did (from its result).
function stepSummary(s) {
  const r = s.result || {};
  switch (s.name) {
    case "fx_lookup": return `looked up the rate: 1 ${r.from} = ${r.rate} ${r.to}`;
    case "compare_costs":
      return r.methods ? `compared ${r.methods.length} ways → recommends ${r.recommended}, saving ${krw(r.savings_vs_worst || 0)}` : "compared the options";
    case "simulate_transfer":
      return r.status === "pending_approval" ? "prepared the transfer — waiting for your approval (it won't send on its own)"
        : r.transfer_id ? `started transfer ${r.transfer_id} — status: ${r.status}` : "transfer";
    case "get_transfer_status": return `checked the transfer — status: ${r.status}`;
    case "get_cashout_guide":
      return r.methods ? `retrieved ${r.methods.length} cash-out methods + ${(r.scam_warnings || []).length} scam warnings (source: ${r.source})` : "fetched the guide";
    case "check_scam": return `analysed the message → risk: ${String(r.risk || "").toUpperCase()} (${(r.reasons || []).length} red flags found)`;
    default: return "";
  }
}

// "What happened under the hood" step: tool name + plain summary, with the exact
// inputs and raw output always shown. These stay expanded on screen so the agent's
// work is always visible to the user — never collapsed away.
function renderStep(s) {
  const step = el("div", "step open");
  const head = el("div", "step-head");
  head.innerHTML =
    `<span class="gear">⚙</span><b>${esc(s.name)}</b>` +
    `<span class="step-sum">${esc(stepSummary(s))}</span>`;
  const detail = el("div", "step-detail");
  detail.innerHTML =
    `<div class="step-sec">▸ what it received (inputs)</div><pre>${esc(JSON.stringify(s.args || {}, null, 2))}</pre>` +
    `<div class="step-sec">▸ what it returned (output)</div><pre>${esc(JSON.stringify(s.result || {}, null, 2))}</pre>`;
  step.append(head, detail);
  add(step);
  fx("step", step);
  return step;
}

/* ---------- rich cards (build* returns the node; render* mounts + registers) ---------- */
function renderCompare(r) {
  return loc(() => buildCompare(r), (node) => { animateNumbers(node); fx("compareCard", node); });
}
function buildCompare(r) {
  const card = el("div", "card compare-card");
  card.append(el("div", "card-head", `<span class="ic">📊</span> ${t("optionsToSend", { amount: krw(r.amount) })}`));
  const body = el("div", "card-body");
  r.methods.forEach((m, i) => {
    const best = m.id === r.recommended;
    const row = el("div", "method method-enter" + (best ? " best" : ""));
    row.style.setProperty("--stagger", i);
    row.innerHTML = `
      <div class="name">${esc(m.name)} ${best ? `<span class="badge-best">${t("bestValue")}</span>` : ""}</div>
      <div class="meta">${esc(m.speed)} · ${esc(m.payout)}</div>
      <div class="cost ${best ? "good" : ""}">
        <div class="num" data-krw="${m.all_in_cost}">${krw(m.all_in_cost)}</div>
        <div class="lbl">${t("allInCost")}</div>
      </div>
      <div class="gets">${t("familyReceives", { amount: `<b data-ngn="${m.recipient_gets}">${ngn(m.recipient_gets)}</b>` })}</div>`;
    if (best && m.breakdown) row.append(breakdownBar(m.breakdown));
    body.append(row);
  });
  if (r.savings_vs_worst > 0) {
    body.append(el("div", "savings-note savings-pop", `✅ ${t("saves", { amount: `<b>${krw(r.savings_vs_worst)}</b>` })}`));
  }
  card.append(body);
  return card;
}

function breakdownBar(b) {
  const total = b.mid_market_value || (b.fee_cost + b.fx_margin_cost + b.recipient_gets);
  const pct = (n) => Math.max(0, (n / total) * 100);
  const keepPct = ((b.recipient_gets / total) * 100).toFixed(1);
  const wrap = el("div", "breakdown");
  wrap.innerHTML = `
    <div class="btitle">🔎 ${t("whereGoes")}</div>
    <div class="bbar">
      <div class="seg keep" data-w="${pct(b.recipient_gets)}" style="width:0%"></div>
      <div class="seg fee" data-w="${pct(b.fee_cost)}" style="width:0%"></div>
      <div class="seg fx" data-w="${pct(b.fx_margin_cost)}" style="width:0%"></div>
    </div>
    <div class="blegend">
      <span><i style="background:var(--green)"></i> ${t("familyKeeps")} <b>${keepPct}%</b> · ${ngn(b.recipient_gets)}</span>
      <span><i style="background:var(--gold)"></i> ${t("fee")} <b>${ngn(b.fee_cost)}</b></span>
      <span><i style="background:var(--amber)"></i> ${t("fxMargin")} <b>${ngn(b.fx_margin_cost)}</b></span>
    </div>`;
  return wrap;
}

function renderScam(r) { return loc(() => buildScam(r), (n) => fx("scamAlert", n)); }
function buildScam(r) {
  const card = el("div", "card shield " + r.risk);
  const head = { high: "🛑 " + t("scamWarning"), medium: "⚠️ " + t("beCareful"), low: "🛡️ " + t("safetyCheck") }[r.risk];
  card.append(el("div", "card-head", `<span class="ic"></span> ${head}`));
  const body = el("div", "card-body");
  body.append(el("div", "verdict", esc(r.verdict)));
  if (r.reasons && r.reasons.length) {
    const ul = el("ul", "reasons");
    r.reasons.forEach((x) => ul.append(el("li", null, esc(x))));
    body.append(ul);
  }
  if (r.what_to_do && r.what_to_do.length) {
    const td = el("div", "todo");
    td.append(el("div", "sh", t("whatToDo")));
    const ol = el("ol");
    r.what_to_do.forEach((x) => ol.append(el("li", null, esc(x))));
    td.append(ol);
    body.append(td);
  }
  card.append(body);
  return card;
}

// onDecision(approved) — when provided (e.g. the demo), buttons drive that callback
// instead of the live agent. Without it, buttons talk to the live agent as normal.
function renderApproval(r, onDecision) { return loc(() => buildApproval(r, onDecision), (n) => fx("approval", n)); }
function buildApproval(r, onDecision) {
  const s = r.summary;
  const card = el("div", "card approval");
  card.append(el("div", "card-head", `<span class="ic">🔐</span> ${t("confirm")}`));
  const body = el("div", "card-body");
  const dl = el("dl", "summary");
  dl.innerHTML = `
    <dt>${t("amount")}</dt><dd>${krw(s.amount)}</dd>
    <dt>${t("method")}</dt><dd>${esc(s.method)}</dd>
    <dt>${t("to")}</dt><dd>${esc(s.recipient)}</dd>
    <dt>${t("speed")}</dt><dd>${esc(s.speed)}</dd>`;
  body.append(dl);
  const actions = el("div", "actions");
  const approve = el("button", "btn approve", "✓ " + t("approve"));
  const decline = el("button", "btn decline", "✕ " + t("decline"));
  approve.onclick = () => {
    actions.classList.add("done");
    if (onDecision) onDecision(true);
    else turn(t("approved"), { payload: "Yes, I approve this transfer. Please send it now.", keepLang: true });
  };
  decline.onclick = () => {
    if (onDecision) { onDecision(false); } // keep the card active so they can still approve
    else { actions.classList.add("done"); turn(t("decline"), { payload: "No, please don't send it for now.", keepLang: true }); }
  };
  actions.append(approve, decline);
  body.append(actions);
  card.append(body);
  return card;
}

const STEPS = [
  { key: "sent", labelKey: "sent", icon: "💸" },
  { key: "received", labelKey: "received", icon: "📥" },
  { key: "cashed_out", labelKey: "cashedOut", icon: "✅" },
];

function renderTimeline(transferId, initial, simulate = false) {
  const card = el("div", "card");
  card.append(el("div", "card-head", `<span class="ic">📍</span> ${t("tracking")}`));
  const tl = el("div", "timeline");
  const track = el("div", "track");
  const fill = el("div", "fill");
  track.append(fill);
  const nodes = STEPS.map((st) => {
    const stop = el("div", "stop");
    stop.dataset.key = st.key;
    stop.innerHTML = `<div class="node">${st.icon}</div><div class="t">${t(st.labelKey)}</div>`;
    track.append(stop);
    return stop;
  });
  tl.append(track);
  const plain = el("div", "plain");
  const msgText = document.createTextNode("");
  plain.append(msgText, el("span", "tid", "ID: " + transferId));
  tl.append(plain);
  card.append(tl);
  add(card);

  let lastIdx = -1;
  function paint(status, plainText) {
    const idx = STEPS.findIndex((s) => s.key === status);
    const toPct = idx <= 0 ? 0 : idx === 1 ? 50 : 100;
    if (idx > lastIdx && lastIdx >= 0) fx("timelineAdvance", card, fill, toPct);
    nodes.forEach((n, i) => {
      n.classList.toggle("active", i <= idx);
      n.classList.toggle("pulse", i === idx && status !== "cashed_out");
    });
    fill.style.width = toPct + "%";
    if (plainText) {
      plain.classList.add("plain-swap");
      msgText.nodeValue = plainText;
      plain.addEventListener("animationend", () => plain.classList.remove("plain-swap"), { once: true });
    }
    if (status === "sent" && lastIdx < 0) setTimeout(() => fx("celebrate", card), 450);
    lastIdx = idx;
  }
  const plainMap = {
    sent: t("statusSent"),
    received: t("statusReceived"),
    cashed_out: t("statusCashed"),
  };
  paint(initial.status, plainMap[initial.status] || plainMap.sent);

  if (initial.status === "cashed_out") return;

  // Demo mode: advance locally so the UI works with no backend/key.
  if (simulate) {
    setTimeout(() => { paint("received", plainMap.received); scrollDown(); }, 3000);
    setTimeout(() => { paint("cashed_out", plainMap.cashed_out); scrollDown(); }, 6200);
    return;
  }

  // Live-poll the mock state machine so the timeline advances on its own.
  const iv = setInterval(async () => {
    try {
      const t = await (await fetch("/transfer/" + transferId)).json();
      if (t.error) return clearInterval(iv);
      paint(t.status, plainMap[t.status]);
      if (t.status === "cashed_out") clearInterval(iv);
      scrollDown();
    } catch { clearInterval(iv); }
  }, 2500);
}

/* Map tool results -> components. Returns true if it rendered something. */
function renderTool(t) {
  const r = t.result || {};
  if (r.error) return false;
  if (t.name === "compare_costs" && r.methods) { renderCompare(r); return true; }
  if (t.name === "simulate_transfer" && r.status === "pending_approval") { renderApproval(r); return true; }
  if (t.name === "simulate_transfer" && r.status === "sent" && r.transfer_id) {
    renderTimeline(r.transfer_id, { status: "sent" }); return true;
  }
  if (t.name === "get_transfer_status" && r.transfer_id) {
    renderTimeline(r.transfer_id, r); return true;
  }
  if (t.name === "get_cashout_guide" && r.methods) { renderGuide(r); return true; }
  if (t.name === "check_scam" && r.risk) { renderScam(r); return true; }
  return false;
}

function renderGuide(r) { return loc(() => buildGuide(r), (n) => n.classList.add("guide-enter")); }
function buildGuide(r) {
  const card = el("div", "card");
  const place = esc(r.country) + (r.region && r.region !== "general" ? " · " + esc(r.region) : "");
  card.append(el("div", "card-head", `<span class="ic">🛡️</span> ${t("collectingIn", { place })}`));
  const body = el("div", "card-body");
  r.methods.forEach((m) => {
    const g = el("div", "guide-method");
    g.innerHTML = `<h4>📌 ${esc(m.name)}</h4><ol>${m.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
    body.append(g);
  });
  if (r.scam_warnings && r.scam_warnings.length) {
    const scams = el("div", "scams");
    scams.append(el("div", "sh", "⚠️ " + t("staySafe")));
    r.scam_warnings.forEach((w) => scams.append(el("div", "scam", esc(w))));
    body.append(scams);
  }

  // One-tap hand-off: copy the whole guide as a plain message to send the family.
  const copyBtn = el("button", "copy-family", "📋 " + t("copyFamily"));
  copyBtn.onclick = async () => {
    const lines = [`How to collect the money safely in ${r.country}:`, ""];
    r.methods.forEach((m) => {
      lines.push(`• ${m.name}`);
      m.steps.forEach((s, i) => lines.push(`   ${i + 1}. ${s}`));
    });
    if (r.scam_warnings?.length) {
      lines.push("", "Stay safe:");
      r.scam_warnings.forEach((w) => lines.push(`- ${w}`));
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      copyBtn.textContent = "✓ " + t("copied");
      copyBtn.classList.add("done");
    } catch {
      copyBtn.textContent = "Copy not available in this browser";
    }
  };
  body.append(copyBtn);

  card.append(body);
  return card;
}

/* ---------- language detection + UI localization ---------- */
function applyLang(code) {
  window.I18N.setLang(code);
  langChip.textContent = window.I18N.native(code);
  document.documentElement.dir = window.I18N.isRTL(code) ? "rtl" : "ltr";
  localizeStatic();   // hero, starters, footer, placeholder, tagline
  relocalize();       // already-rendered cards
}
function updateLang(text) {
  applyLang(window.I18N.detect(text));
}

/* ---------- turn ----------
   opts.payload  — text actually sent to the agent (defaults to the shown text)
   opts.keepLang — don't re-detect language from this text (e.g. control phrases) */
async function turn(text, opts = {}) {
  if (busy) return;
  if (authEnabled && !authUser && !isDemo) { promptSignIn(); return; } // live chat is gated
  if (intro) { intro.style.display = "none"; }
  if (!opts.keepLang) updateLang(text);
  userBubble(text);
  messages.push({ role: "user", content: opts.payload || text });

  busy = true; send.disabled = true;
  const typer = typing();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (res.status === 401) { // session expired or never signed in
      typer.remove();
      authUser = null;
      renderAuthChip();
      gateComposer();
      promptSignIn();
      return;
    }
    const data = await res.json();
    typer.remove();

    if (data.error) { botBubble("⚠️ " + data.error); return; }
    messages = data.messages;

    for (const tc of data.toolTrace || []) { renderStep(tc); renderTool(tc); }
    if (data.reply) botBubble(data.reply);
  } catch (e) {
    typer.remove();
    botBubble("⚠️ Network error: " + e.message);
  } finally {
    busy = false; send.disabled = false; input.focus();
  }
}

/* ---------- wiring ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.style.height = "auto";
  turn(text);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});

document.querySelectorAll(".starter").forEach((b) => {
  // keepLang so a language picked from the dropdown isn't overridden by the English prompt
  b.addEventListener("click", () => turn(b.dataset.msg, { keepLang: window.I18N.getLang() !== "en" }));
});

voiceToggle.addEventListener("click", () => {
  voiceOn = !voiceOn;
  voiceToggle.classList.toggle("on", voiceOn);
  voiceToggle.textContent = voiceOn ? "🔊" : "🔈";
  voiceToggle.title = voiceOn ? "Read-aloud is on" : "Read answers aloud";
  if (!voiceOn && synth) synth.cancel();
});

/* ---------- light / dark theme ---------- */
const themeToggle = document.getElementById("theme-toggle");

/* ---------- demo entry (/?demo scripted playback) ---------- */
function demoUrl() {
  const u = new URL(location.origin + "/");
  const lang = new URLSearchParams(location.search).get("lang");
  if (lang) u.searchParams.set("lang", lang);
  u.searchParams.set("demo", "");
  return u.pathname + u.search;
}

function wireDemoLinks() {
  const chip = document.getElementById("demo-chip");
  const launch = document.getElementById("demo-launch");
  if (isDemo) {
    if (chip) {
      chip.classList.add("active");
      chip.setAttribute("aria-current", "page");
      chip.removeAttribute("href");
      chip.title = "Scripted demo in progress";
    }
    if (launch) launch.style.display = "none";
    const orLine = document.querySelector(".demo-or");
    if (orLine) orLine.style.display = "none";
    return;
  }
  const url = demoUrl();
  if (chip) {
    chip.href = url;
    chip.title = "Watch the full scripted demo";
  }
  if (launch) launch.href = url;
}

wireDemoLinks();

function syncThemeIcon() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  themeToggle.textContent = dark ? "☀️" : "🌙";
  themeToggle.classList.toggle("on", dark);
}
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("rg-theme", next);
  syncThemeIcon();
});
syncThemeIcon();

/* ---------- language picker ---------- */
let langMenu = null, langMenuOpen = false;

function selectLang(code) {
  applyLang(code);
  // In live chat, tell the agent to reply in the chosen language going forward.
  if (!isDemo) messages.push({ role: "system", content: `The user has selected ${window.I18N.name(code)} (${window.I18N.native(code)}). Reply in ${window.I18N.name(code)} from now on, unless they switch languages.` });
  closeLangMenu();
  input.focus();
}

function buildLangMenu() {
  const menu = el("div", "lang-menu");
  const search = el("input", "lang-search");
  search.type = "text";
  search.placeholder = "Search 26 languages…";
  const list = el("div");
  menu.append(search, list);

  const langs = window.I18N.languages.map((l) => ({
    code: l.code, native: l.native, en: window.I18N.name(l.code), ui: window.I18N.uiLocalized(l.code),
  }));

  function render(q = "") {
    list.innerHTML = "";
    const ql = q.trim().toLowerCase();
    const ok = (l) => !ql || l.en.toLowerCase().includes(ql) || l.native.toLowerCase().includes(ql) || l.code.includes(ql);
    const cur = window.I18N.getLang();
    const ui = langs.filter((l) => l.ui && ok(l)).sort((a, b) => a.en.localeCompare(b.en));
    const conv = langs.filter((l) => !l.ui && ok(l)).sort((a, b) => a.en.localeCompare(b.en));
    const section = (title, arr) => {
      if (!arr.length) return;
      list.append(el("div", "lm-sec", title));
      arr.forEach((l) => {
        const it = el("div", "lang-item" + (l.code === cur ? " active" : ""));
        it.innerHTML = `<span class="lm-native">${esc(l.native)}</span><span class="lm-en">${esc(l.en)}</span>` +
          (l.ui ? `<span class="lm-tag">UI</span>` : ``) + (l.code === cur ? `<span class="check">✓</span>` : ``);
        it.onclick = () => selectLang(l.code);
        list.append(it);
      });
    };
    section("Full interface", ui);
    section("Chat in these (UI in English)", conv);
  }

  search.addEventListener("input", () => render(search.value));
  search.addEventListener("click", (e) => e.stopPropagation());
  return { menu, search, render };
}

function openLangMenu() {
  if (!langMenu) { langMenu = buildLangMenu(); document.querySelector(".chips").append(langMenu.menu); }
  langMenu.menu.style.display = "";
  langMenu.search.value = "";
  langMenu.render();
  langMenuOpen = true;
  setTimeout(() => langMenu.search.focus(), 0);
}
function closeLangMenu() { if (langMenu) langMenu.menu.style.display = "none"; langMenuOpen = false; }

langChip.style.cursor = "pointer";
langChip.addEventListener("click", (e) => { e.stopPropagation(); langMenuOpen ? closeLangMenu() : openLangMenu(); });
document.addEventListener("click", (e) => {
  if (langMenuOpen && langMenu && !langMenu.menu.contains(e.target) && e.target !== langChip) closeLangMenu();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLangMenu(); });

/* ---------- Google sign-in (gates the live chat; the /?demo player is always public) ---------- */
const authChipSlot = document.getElementById("auth-chip");
const GOOGLE_G =
  `<svg class="g-ic" viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">` +
  `<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>` +
  `<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>` +
  `<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>` +
  `<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;

function signInLink(label, cls) {
  const a = el("a", cls, `${GOOGLE_G}<span>${esc(label)}</span>`);
  a.href = "/auth/google";
  return a;
}

function renderAuthChip() {
  if (!authChipSlot) return;
  authChipSlot.innerHTML = "";
  if (!authEnabled) return; // sign-in not configured → no chip
  if (authUser) {
    const chip = el("button", "chip user-chip", `👤 ${esc(authUser.name || authUser.email)}`);
    chip.title = "Sign out";
    chip.onclick = () => { location.href = "/auth/logout"; };
    authChipSlot.append(chip);
  } else {
    authChipSlot.append(signInLink("Sign in", "chip signin-chip"));
  }
}

function gateComposer() {
  const locked = authEnabled && !authUser && !isDemo;
  input.disabled = locked;
  send.disabled = locked;
  if (locked) input.placeholder = "Sign in with Google to start chatting…";
  document.querySelectorAll(".starter").forEach((b) => { b.disabled = locked; });
}

let signInCardShown = false;
function promptSignIn() {
  scrollDown();
  if (signInCardShown) return;
  signInCardShown = true;
  if (intro) intro.style.display = "none";
  const card = el("div", "card signin-card");
  card.append(el("div", "card-head", `<span class="ic">🔐</span> Sign in to start`));
  const body = el("div", "card-body");
  body.append(el("p", "signin-copy",
    "The live chat is private — sign in with your Google account to send money home with RemitGuide. The scripted demo stays open at <b>/?demo</b>."));
  body.append(signInLink("Sign in with Google", "btn-google"));
  card.append(body);
  add(card);
}

async function initAuth() {
  if (isDemo) return; // public demo: never gate
  let data;
  try { data = await (await fetch("/auth/me")).json(); }
  catch { return; } // network hiccup — the server still enforces /chat
  authEnabled = Boolean(data.authEnabled);
  authUser = data.authenticated ? data.user : null;
  renderAuthChip();
  gateComposer();
  if (authEnabled && !authUser) promptSignIn();
}

// Initialize chrome. ?lang=xx forces a starting language (shareable); else English.
const urlLang = new URLSearchParams(location.search).get("lang");
applyLang(urlLang && window.I18N.languages.some((l) => l.code === urlLang) ? urlLang : "en");
input.focus();
initAuth();

/* Render API reused by the offline demo player (demo.js). */
window.RG = {
  userBubble, botBubble, typing, step: renderStep, updateLang,
  renderCompare, renderApproval, renderTimeline, renderGuide, renderScam,
  hideIntro: () => fx("introExit", intro) || (intro && (intro.style.display = "none")),
  scrollDown,
};
