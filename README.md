# MirrorFlow Lite

Single-file, offline writing and reply assistant (`index.html`). No build step, no dependencies.

- **Editor** with a compact toolbar. Less-used tools live under **More**.
- **Suggestions** (right panel): grammar, clarity and tone checks with one-click fixes.
- **Review** (left panel, hidden by default): send-readiness and writing quality. Adapts to the message automatically; nothing to configure. Rule profiles and diagnostics sit under *Advanced*.
- Everything runs locally; drafts are stored in the browser's `localStorage`.

Open `index.html` in a browser to run it.

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup only |
| `styles.css` | Design tokens and components |
| `app.js` | UI, state, persistence |
| `assist-rules.js` | Grammar / clarity / tone rule pack (spelling, confusables, agreement, punctuation, wordiness, tone) with tests |
| `assist-dictionary.js` | Generated spelling data (Bloom filter of ~274k UK+US words, 20k ranked common words). Rebuild with `tools/build-dictionary.js` |
| `assist-spell.js` | Dictionary spell checker: conservative, learns words, ignores names, codes and words the customer used |
| `assist-engine.js` | Rule runner, scoring, rewrites, profiles, self-tests |
| `insights-packs.js` | Adaptive check packs: refund, booking, delivery, complaint, status, access, technical, cover, explanation, plus signal-driven extras |
| `insights-engine.js` | Message classification, send-readiness, suggestions |

Run the rule self-tests from **Review → Advanced → Diagnostics**. They include false-positive guards.

## Data credits
Spelling data is built from [`word-list`](https://github.com/sindresorhus/word-list) (MIT, Sindre Sorhus) and
[`popular-english-words`](https://github.com/tkoop/popular-english-words) (ISC, Tim Koop).
