/* MirrorFlow Assist — dictionary spell checker (offline).
   Needs assist-dictionary.js (Bloom filter of ~274k English words, UK + US, plus a frequency-ranked common list).
   Flags words that are not in the dictionary and proposes the most common one-edit correction.
   Deliberately conservative: names, brands, repeated words, codes and words the customer used are left alone. */
(function () {
  "use strict";
  const D = window.MirrorFlowDictionary;
  const R = window.MirrorFlowAssistRules;
  if (!D || !R) return;

  /* ---- Bloom filter (hashing must match tools/build-dictionary.js) ---- */
  const bin = atob(D.bloom), bits = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bits[i] = bin.charCodeAt(i);
  function hashes(w) {
    let h1 = 2166136261, h2 = 5381;
    for (let i = 0; i < w.length; i++) { const c = w.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = (Math.imul(h2, 33) + c) >>> 0; }
    return [h1, h2 | 1];
  }
  function inBloom(w) {
    const [a, b] = hashes(w);
    for (let i = 0; i < D.k; i++) {
      const bit = ((a + Math.imul(i, b)) >>> 0) % D.m;
      if (!(bits[bit >> 3] & (1 << (bit & 7)))) return false;
    }
    return true;
  }

  const rank = new Map();
  D.top.split(" ").forEach((w, i) => rank.set(w, i));

  /* names, brands and product/tech words that a general dictionary lacks */
  const EXTRA = new Set(("wifi iphone ipad ipod android ios macos paypal stripe klarna amazon google gmail outlook whatsapp facebook instagram " +
    "tiktok linkedin youtube zoom slack netflix spotify uber airbnb ebay etsy shopify apple samsung microsoft windows chrome firefox safari " +
    "onedrive dropbox otp sso api url urls pdf pdfs sms html css javascript json csv xlsx docx png jpeg jpg gif mp4 usb sim esim vpn app apps " +
    "faq faqs vat hmrc dvla nhs ltd plc inc llc okay ok ok email emails inbox online offline login logins signup username usernames " +
    "chargeback chargebacks rebook rebooked rebooking reschedule rescheduled rescheduling redelivery redeliver resend reship prepaid " +
    "hotfix bugfix wifi bluetooth smartphone smartphones touchscreen webpage webpages homepage unsubscribe unsubscribed refundable " +
    "nonrefundable checkin checkout backend frontend timestamp timestamps screenshot screenshots wishlist uris mailto href async param params").split(" "));

  const learned = new Set();
  const memo = new Map();

  function stems(w) {
    const out = [];
    if (w.endsWith("s") && !w.endsWith("ss")) out.push(w.slice(0, -1));
    if (w.endsWith("es")) out.push(w.slice(0, -2));
    if (w.endsWith("ies")) out.push(w.slice(0, -3) + "y");
    if (w.endsWith("ed")) { out.push(w.slice(0, -2), w.slice(0, -1)); if (/(.)\1ed$/.test(w)) out.push(w.slice(0, -3)); }
    if (w.endsWith("ing")) { out.push(w.slice(0, -3), w.slice(0, -3) + "e"); if (/(.)\1ing$/.test(w)) out.push(w.slice(0, -4)); }
    if (w.endsWith("ly")) out.push(w.slice(0, -2));
    if (w.endsWith("er")) out.push(w.slice(0, -2));
    return out;
  }
  function isKnown(w, ctx) {
    if (w.length <= 2) return true;
    if (inBloom(w) || EXTRA.has(w) || learned.has(w) || (ctx && ctx.has(w))) return true;
    return stems(w).some(s => s.length >= 4 && (inBloom(s) || EXTRA.has(s)));
  }

  const ALPHA = "abcdefghijklmnopqrstuvwxyz";
  function edits1(w) {
    const out = [];
    for (let i = 0; i <= w.length; i++) {
      const l = w.slice(0, i), r = w.slice(i);
      if (r) out.push({ w: l + r.slice(1), t: "del" });
      if (r.length > 1) out.push({ w: l + r[1] + r[0] + r.slice(2), t: "swap" });
      for (const c of ALPHA) {
        if (r) out.push({ w: l + c + r.slice(1), t: "sub" });
        out.push({ w: l + c + r, t: "ins" });
      }
    }
    return out;
  }
  const TYPE_COST = { swap: 0, sub: 1, del: 1, ins: 1 };

  /* returns { best, alts, safe } or null */
  function suggest(word) {
    if (memo.has(word)) return memo.get(word);
    const seen = new Map();
    edits1(word).forEach(e => {
      if (e.w.length < 3 || e.w === word || seen.has(e.w)) return;
      if (inBloom(e.w) || EXTRA.has(e.w)) seen.set(e.w, e.t);
    });
    let result = null;
    if (seen.size) {
      /* only ranked (common) words are offered: unranked hits are mostly Bloom false positives or rare words */
      const scored = [...seen.entries()].filter(([w]) => rank.has(w)).map(([w, t]) => ({ w, t, r: rank.get(w) }))
        .sort((a, b) => (a.r - b.r) || (TYPE_COST[a.t] - TYPE_COST[b.t]));
      if (scored.length) {
        const best = scored[0], second = scored[1];
        const clear = !second || second.r > best.r * 4 || (best.t === "swap" && second.t !== "swap");
        result = { best: best.w, alts: scored.slice(1, 4).map(s => s.w), safe: clear && word.length >= 5, type: best.t };
      }
    }
    if (!result && word.length >= 6) {
      for (let i = 2; i <= word.length - 2; i++) {
        const a = word.slice(0, i), b = word.slice(i);
        if (rank.has(a) && rank.has(b) && rank.get(a) < 8000 && rank.get(b) < 8000) { result = { best: a + " " + b, alts: [], safe: false }; break; }
      }
    }
    memo.set(word, result);
    return result;
  }

  function matchCase(orig, rep) {
    return orig[0] !== orig[0].toLowerCase() ? rep[0].toUpperCase() + rep.slice(1) : rep;
  }

  const spellRule = {
    id: "grammar.spelling.unknown_word", category: "grammar", subtype: "spelling", label: "Possible misspelling", severity: "medium", confidence: 0.84,
    run({ text, issues, push, context }) {
      const ctx = new Set();
      String((context && context.knownText) || "").toLowerCase().replace(/[a-z]{3,}/g, w => { ctx.add(w); return w; });
      const counts = new Map();
      const lowerText = text.toLowerCase();
      lowerText.replace(/[a-z]{4,}/g, w => { counts.set(w, (counts.get(w) || 0) + 1); return w; });
      const re = /[A-Za-z]{4,}(?:['’][A-Za-z]+)?/g; let m;
      while ((m = re.exec(text))) {
        const raw = m[0], start = m.index, end = start + raw.length;
        if (/['’]/.test(raw)) { if (!/['’]s$/i.test(raw)) continue; }
        const word = raw.replace(/['’]s$/i, ""), lw = word.toLowerCase();
        const prev = text[start - 1], next = text[end];
        if (prev && /[@#\/\\_.\-\w]/.test(prev) && !/\s/.test(prev)) { if (prev !== "." || /[A-Za-z]/.test(text[start - 2] || "")) continue; }
        if (next && /[@\/\\_\d]/.test(next)) continue;
        if (next === "." && /^[A-Za-z]/.test(text[end + 1] || "")) continue;
        const capitalised = word !== lw;
        if (capitalised) {
          /* only a lone capital at a sentence start is treated as a plain word; everything else is a name or acronym.
             A word alone on its line is a name or sign-off, not a sentence. */
          const atStart = start === 0 || /[.!?]\s+$|\n\s*$/.test(text.slice(Math.max(0, start - 4), start));
          const aloneOnLine = /^[ \t,.!]*(?:\n|$)/.test(text.slice(end));
          if (!(atStart && word === word[0] + lw.slice(1)) || aloneOnLine) continue;
        }
        if (isKnown(lw, ctx) || counts.get(lw) > 1) continue;
        if (issues.some(i => i.start != null && i.start < end && start < i.end)) continue;
        const s = suggest(lw);
        if (!s) continue;
        if (capitalised && (!s.safe || s.type === "sub")) continue;
        const replacement = matchCase(word, s.best);
        push({
          ruleId: this.id, category: this.category, subtype: this.subtype, label: this.label, start, end,
          message: `"${word}" isn't in the dictionary. Did you mean "${replacement}"?` + (s.alts.length ? " Other options: " + s.alts.join(", ") + "." : ""),
          replacement, severity: this.severity, confidence: s.safe ? 0.9 : 0.72, excerpt: raw, applySafe: s.safe,
          learnable: lw
        });
      }
    }
  };
  R.structural.push(spellRule);

  R.tests.push({ id: "XS-001", ruleId: spellRule.id, input: "Please check the ordr and the refnd.", expectedReplacement: "order" });
  R.tests.push({ id: "XS-002", ruleId: spellRule.id, input: "The confirmaton was late.", expectedReplacement: "confirmation" });
  R.negatives.push({ id: "NXS-001", ruleId: spellRule.id, input: "Hi Priyanka, your refund and courier update for Tesco are on the way, via www.example.com and PayPal." });
  R.negatives.push({ id: "NXS-002", ruleId: spellRule.id, input: "I apologise; we cancelled and rescheduled it. Colour and favourite are fine. Zorbex is our product, and Zorbex works." });

  window.MirrorFlowSpell = {
    isKnown: w => isKnown(String(w).toLowerCase()),
    suggest: w => suggest(String(w).toLowerCase()),
    learn: w => { const lw = String(w || "").toLowerCase().trim(); if (/^[a-z]{2,}$/.test(lw)) { learned.add(lw); memo.clear(); return true; } return false; },
    forget: w => learned.delete(String(w || "").toLowerCase()),
    learnedWords: () => Array.from(learned)
  };
})();
