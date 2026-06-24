/* RemitGuide motion — cinematic micro-interactions tuned for the scripted demo
   and live chat. Respects prefers-reduced-motion. */

(function () {
  const motionOK = () =>
    !window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function afterPaint(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  /* ---- tool step: spinning gear + staggered JSON panels ---- */
  function step(node) {
    if (!node || !motionOK()) return;
    node.classList.add("step-run");
    node.addEventListener("animationend", (e) => {
      if (e.animationName === "step-flash") node.classList.remove("step-run");
    }, { once: true });
  }

  /* ---- compare card: cascade methods, grow breakdown bar, shimmer best row ---- */
  function compareCard(node) {
    if (!node) return;
    node.classList.add("compare-enter");
    if (!motionOK()) {
      node.querySelectorAll(".breakdown .seg").forEach((seg) => {
        if (seg.dataset.w) seg.style.width = seg.dataset.w + "%";
      });
      return;
    }
    afterPaint(() => {
      node.querySelectorAll(".breakdown").forEach(breakdown);
      const best = node.querySelector(".method.best");
      if (best) setTimeout(() => best.classList.add("best-glow"), 380);
    });
  }

  function breakdown(wrap) {
    if (!wrap || !motionOK()) return;
    wrap.classList.add("breakdown-live");
    wrap.querySelectorAll(".seg").forEach((seg, i) => {
      const target = seg.dataset.w;
      if (target == null) return;
      seg.style.width = "0%";
      seg.style.transitionDelay = `${i * 130}ms`;
      afterPaint(() => { seg.style.width = target + "%"; });
    });
  }

  /* ---- approval: gentle attention on the gate ---- */
  function approval(node) {
    if (!node || !motionOK()) return;
    node.classList.add("approval-await");
  }

  /* ---- timeline: coin travels the rail when status advances ---- */
  function timelineAdvance(card, fillEl, toPct) {
    if (!card || !fillEl || !motionOK()) return;
    const track = card.querySelector(".track");
    if (!track) return;

    const dot = document.createElement("span");
    dot.className = "money-flight";
    dot.textContent = "💸";
    track.appendChild(dot);

    const rail = track.getBoundingClientRect();
    const pad = 18;
    const travel = rail.width - pad * 2;
    const from = parseFloat(fillEl.style.width) || 0;
    const startX = pad + (from / 100) * travel;
    const endX = pad + (toPct / 100) * travel;

    dot.style.left = startX + "px";
    afterPaint(() => {
      dot.style.transform = `translateX(${endX - startX}px)`;
      fillEl.classList.add("fill-surge");
      setTimeout(() => fillEl.classList.remove("fill-surge"), 900);
    });
    setTimeout(() => dot.remove(), 950);

    card.querySelectorAll(".stop.active").forEach((stop) => {
      stop.classList.add("stop-pop");
      stop.addEventListener("animationend", () => stop.classList.remove("stop-pop"), { once: true });
    });
  }

  /* ---- transfer sent: brief confetti burst (demo-friendly) ---- */
  function celebrate(origin) {
    if (!origin || !motionOK()) return;
    const box = origin.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height * 0.35;
    const colors = ["#10b981", "#f4b72e", "#ef5130", "#067a4e", "#fdfaf0"];
    const layer = document.createElement("div");
    layer.className = "rg-fx-layer";
    document.body.appendChild(layer);

    for (let i = 0; i < 28; i++) {
      const p = document.createElement("span");
      p.className = "rg-confetti";
      const angle = (i / 28) * Math.PI * 2;
      const dist = 40 + Math.random() * 90;
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", Math.sin(angle) * dist - 30 + "px");
      p.style.setProperty("--rot", Math.random() * 540 - 270 + "deg");
      p.style.animationDelay = (Math.random() * 0.12) + "s";
      layer.append(p);
    }
    setTimeout(() => layer.remove(), 1400);
  }

  /* ---- user message: satisfying send ripple ---- */
  function userSend(row) {
    if (!row || !motionOK()) return;
    row.classList.add("send-pop");
    const bubble = row.querySelector(".bubble");
    if (bubble) {
      const ring = document.createElement("span");
      ring.className = "send-ring";
      bubble.appendChild(ring);
      setTimeout(() => ring.remove(), 700);
    }
  }

  /* ---- scam shield: alarm entrance ---- */
  function scamAlert(node) {
    if (!node || !motionOK()) return;
    node.classList.add("scam-alarm");
    document.body.classList.add("scam-vignette");
    setTimeout(() => document.body.classList.remove("scam-vignette"), 900);
  }

  /* ---- intro dissolve when demo starts ---- */
  function introExit(node) {
    if (!node || !motionOK()) {
      if (node) node.style.display = "none";
      return;
    }
    node.classList.add("intro-exit");
    node.addEventListener("animationend", () => { node.style.display = "none"; }, { once: true });
  }

  window.RGAnim = {
    step, compareCard, approval, timelineAdvance, celebrate, userSend, scamAlert, introExit,
  };
})();
