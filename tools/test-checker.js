/* Node regression check for the writing checker.  Usage: node tools/test-checker.js
   1. runs every built-in rule self-test (positive cases + false-positive guards)
   2. runs well-written support replies and fails if grammar or spelling issues appear (false-positive gate) */
global.window = {};
const fs = require("fs"), path = require("path");
for (const f of ["assist-rules.js", "assist-dictionary.js", "assist-spell.js", "assist-engine.js"]) {
  (0, eval)(fs.readFileSync(path.join(__dirname, "..", f), "utf8"));
}
const E = window.MirrorFlowAssistEngine;
let failed = 0;

const rt = E.runRuleTests();
console.log(`rule self-tests: ${rt.passed}/${rt.active}`);
rt.results.filter(r => !r.passed && !r.skipped).forEach(r => { failed++; console.log("  FAIL", r.id, r.ruleId, r.detail || ""); });

const CLEAN = [
  "Hi Sam,\n\nThanks for getting in touch. I've checked your booking and your appointment is confirmed for Friday at 14:30. If that time doesn't work, reply with a better window and I'll move it.\n\nKind regards,\nRiley",
  "Hello Priya,\n\nI'm sorry about the delay with your refund. It was processed on Monday, and it usually takes 3 to 5 working days to reach your card. I'll email you again on Thursday if it hasn't arrived.\n\nBest wishes,\nAlex",
  "Hi Jo, we've reset your password. Please log in with the temporary code (ref ABC-1234) and choose a new one. Let me know if you're still locked out and I'll escalate it today.",
  "Thanks for your patience. The courier attempted delivery twice, so we've sent a replacement to 12 High Street. It should arrive by Wednesday; the tracking link is https://track.example.com/x1.",
  "Your account was created on 3 May. You can update your details in the portal. There are a few options, so let me know which suits you.",
  "We couldn't find an order under that email address. Could you send the order number, please? It starts with #12345 or \"ORD-99881\".",
  "Our engineers have fixed the fault. Please restart the app and check whether the error still appears. If it does, send me a screenshot and your device version."
];
CLEAN.forEach((t, i) => {
  const bad = E.analyzeText(t, {}).issues.filter(x => x.category === "grammar");
  if (bad.length) { failed++; console.log(`  FAIL clean reply ${i + 1}:`, bad.map(b => `${b.ruleId} "${b.excerpt}"`).join("; ")); }
});
console.log(`clean-reply gate: ${CLEAN.length} replies checked`);
process.exit(failed ? 1 : 0);
