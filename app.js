/* =========================================================
   Ping shell
   ========================================================= */

const VARIANTS = {
  pulse: ['electric', 'cyber', 'acid', 'heat', 'fuchsia'],
  slate: ['forest', 'mint', 'pine', 'cobalt', 'nordic'],
  linen: ['harvest', 'champagne', 'marigold', 'copper', 'peach'],
  paper: ['sky', 'ice', 'alabaster', 'denim', 'sage']
};

/* per-theme rolling cursor */
const cursor = { pulse: 0, slate: 0, linen: 0, paper: 0 };

const html  = document.documentElement;
const shell = document.getElementById('shell');

/* ---- bubble swatch palette (marble: 70% base + 30% variant accent) ---- */
const BASES = {
  pulse: '#000000',
  slate: '#0e1416',
  linen: '#f1e6d3',
  paper: '#f6f3e4'
};
const ACCENTS = {
  pulse: { electric: '#bf00ff', cyber: '#00f0ff',  acid: '#aaff00',     heat: '#ff4500',   fuchsia: '#ff0080' },
  slate: { forest:   '#34d399', mint:  '#6ee7b7',  pine: '#1f8b5a',     cobalt: '#3b6dff', nordic:  '#7aa6c2' },
  linen: { harvest:  '#b8732a', champagne: '#9d7c4a', marigold: '#c8841a', copper: '#a85a28', peach: '#d97757' },
  paper: { sky:      '#2563eb', ice:   '#74b9e8',  alabaster: '#5a6370', denim: '#4a7ba6',  sage:    '#6f8a5e' }
};

function applyTheme() {
  const t = html.dataset.theme;
  html.dataset.variant = VARIANTS[t][cursor[t]];

  document.querySelectorAll('.mf-bubble').forEach(b => {
    const bt = b.dataset.t;
    const isActive = bt === t;
    b.setAttribute('aria-pressed', isActive);
    // marble swatch — base + this theme's current variant accent
    const variantName = VARIANTS[bt][cursor[bt]];
    b.style.setProperty('--swatch-base', BASES[bt]);
    b.style.setProperty('--swatch-accent', ACCENTS[bt][variantName]);
    // dots
    const dots = b.querySelectorAll('.mf-vdots i');
    dots.forEach((dot, i) => {
      dot.classList.toggle('on', isActive && i === cursor[t]);
    });
  });
}

/* topbar event delegation */
document.querySelector('.mf-topbar').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.classList.contains('mf-bubble')) {
    const themeKey = t.dataset.t;
    if (html.dataset.theme === themeKey) {
      // same theme → cycle variant
      cursor[themeKey] = (cursor[themeKey] + 1) % VARIANTS[themeKey].length;
    } else {
      // switch theme (preserve cursor for that theme)
      html.dataset.theme = themeKey;
    }
    applyTheme();
  }
});

/* shuffle */
document.getElementById('shuffleBtn').addEventListener('click', () => {
  const themes = Object.keys(VARIANTS);
  const t = themes[Math.floor(Math.random() * themes.length)];
  cursor[t] = Math.floor(Math.random() * VARIANTS[t].length);
  html.dataset.theme = t;
  applyTheme();
});

function syncRailControls() {
  const rightPanel = shell.dataset.rightPanel || 'assist';
  const insightsOpen = shell.dataset.insights !== 'collapsed';
  const rightOpen = shell.dataset.right !== 'collapsed';
  const insightsBtn = document.getElementById('tabInsights');
  if (insightsBtn) {
    insightsBtn.dataset.state = insightsOpen ? 'open' : 'collapsed';
    insightsBtn.setAttribute('aria-pressed', String(insightsOpen));
    insightsBtn.classList.toggle('is-active', insightsOpen);
    insightsBtn.title = `${insightsOpen ? 'Collapse' : 'Open'} left panel`;
  }
  const rightToggle = document.getElementById('tabRightPanel');
  if (rightToggle) {
    rightToggle.dataset.state = rightOpen ? 'open' : 'collapsed';
    rightToggle.setAttribute('aria-pressed', String(rightOpen));
    rightToggle.classList.toggle('is-active', rightOpen);
    rightToggle.title = `${rightOpen ? 'Collapse' : 'Open'} right panel`;
  }
  [
    ['tabAssist', 'assist', 'assist'],
    ['tabCustomer', 'customer', 'customer message'],
    ['tabNotes',  'notes',  'side notes']
  ].forEach(([id, panel, label]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const isActive = rightPanel === panel;
    btn.dataset.state = isActive ? (rightOpen ? 'open' : 'selected') : 'inactive';
    btn.setAttribute('aria-pressed', String(isActive));
    btn.classList.toggle('is-active', isActive);
    btn.title = `${isActive && rightOpen ? 'Showing' : 'Open'} ${label} panel`;
  });
}

/* INSIGHTS — left dock toggle */
document.getElementById('tabInsights').addEventListener('click', (e) => {
  e.stopPropagation();
  shell.dataset.insights = shell.dataset.insights === 'open' ? 'collapsed' : 'open';
  syncRailControls();
});

/* RIGHT PANEL — dock toggle */
document.getElementById('tabRightPanel').addEventListener('click', (e) => {
  e.stopPropagation();
  shell.dataset.right = shell.dataset.right === 'open' ? 'collapsed' : 'open';
  if (!['assist', 'customer', 'notes'].includes(shell.dataset.rightPanel)) {
    shell.dataset.rightPanel = 'assist';
  }
  if (shell.dataset.right === 'open' && shell.dataset.rightPanel === 'assist') renderPingAssist();
  syncRailControls();
});

/* CUSTOMER MESSAGE — optional right panel */
document.getElementById('tabCustomer').addEventListener('click', (e) => {
  e.stopPropagation();
  shell.dataset.rightPanel = 'customer';
  shell.dataset.right = 'open';
  syncRailControls();
});

document.getElementById('tabNotes').addEventListener('click', (e) => {
  e.stopPropagation();
  shell.dataset.rightPanel = 'notes';
  shell.dataset.right = 'open';
  syncRailControls();
});

document.getElementById('tabAssist').addEventListener('click', (e) => {
  e.stopPropagation();
  shell.dataset.rightPanel = 'assist';
  shell.dataset.right = 'open';
  renderPingAssist();
  syncRailControls();
});

/* drag-resize insights */
const handle = document.getElementById('resizeHandle');
let dragging = false;
handle.addEventListener('mousedown', (e) => {
  if (shell.dataset.insights === 'collapsed') return;
  dragging = true;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});
document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dockW = document.querySelector('.mf-left-dock')?.getBoundingClientRect().width || 0;
  const w = Math.max(180, Math.min(520, e.clientX - dockW));
  if (w < 130) {
    shell.dataset.insights = 'collapsed';
    dragging = false;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    return;
  }
  shell.style.setProperty('--mf-rail-insights-w', w + 'px');
});
document.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  document.body.style.cursor = ''; document.body.style.userSelect = '';
  save();
});

/* =========================================================
   LIVE WIRING — editor, customer message (optional), persistence
   ========================================================= */
const editorEl   = document.getElementById('editorSurface');
const customerEl = document.getElementById('customerInput');
const sideNotesList = document.getElementById('sideNotesList');
const sideNotesSearch = document.getElementById('sideNotesSearch');
const sideNotesClearSearch = document.getElementById('sideNotesClearSearch');
const sideNotesStatus = document.getElementById('sideNotesStatus');
const addNoteBtn = document.getElementById('addNoteBtn');
const addNoteFromDraftBtn = document.getElementById('addNoteFromDraftBtn');
/* counterEl removed */
/* metaEl removed — auto-save status now lives in More popover */

let sideNotes = [];
let sideNotesQuery = '';







function makeNote(text = '', options = {}) {
  return {
    id: 'note-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    text,
    pinned: Boolean(options.pinned)
  };
}

function normalizeSideNotes(notes) {
  if (!Array.isArray(notes)) return sideNotes;
  return notes
    .filter(note => note && typeof note.id === 'string')
    .map(note => ({ id: note.id, text: String(note.text || ''), pinned: Boolean(note.pinned) }));
}

function visibleSideNotes() {
  const query = sideNotesQuery.trim().toLowerCase();
  return sideNotes
    .slice()
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
    .filter(note => !query || String(note.text || '').toLowerCase().includes(query));
}

function noteWordCount(text) {
  const words = String(text || '').trim().match(/\b[\w'-]+\b/g);
  return words ? words.length : 0;
}

function renderSideNotesStatus(visibleCount = null) {
  if (!sideNotesStatus) return;
  const query = sideNotesQuery.trim();
  const total = sideNotes.length;
  const pinned = sideNotes.filter(note => note.pinned).length;
  const shown = visibleCount === null ? visibleSideNotes().length : visibleCount;
  sideNotesStatus.textContent = query
    ? `${shown}/${total} match${shown === 1 ? '' : 'es'} · ${pinned} pinned`
    : `${total} note${total === 1 ? '' : 's'} · ${pinned} pinned`;
  if (sideNotesClearSearch) sideNotesClearSearch.disabled = !query;
}

function renderSideNotes() {
  if (!sideNotesList) return;
  if (!sideNotes.length) {
    sideNotesList.innerHTML = '<div class="mf-note-empty">No side notes yet. Add one for reusable copy.</div>';
    renderSideNotesStatus(0);
    return;
  }
  const notes = visibleSideNotes();
  if (!notes.length) {
    sideNotesList.innerHTML = '<div class="mf-note-empty">No matching notes.</div>';
    renderSideNotesStatus(0);
    return;
  }
  renderSideNotesStatus(notes.length);
  sideNotesList.innerHTML = notes.map(note => `
    <article class="mf-note-card" data-note-id="${escapeAttr(note.id)}" data-pinned="${note.pinned ? 'true' : 'false'}">
      <div class="mf-note-top">
        <span class="mf-note-pin" aria-hidden="true"></span>
        <span class="mf-note-meta">${noteWordCount(note.text)}w</span>
        <button class="mf-note-action" type="button" data-note-pin>${note.pinned ? 'Pinned' : 'Pin'}</button>
        <button class="mf-note-action is-primary" type="button" data-note-insert>Use</button>
        <button class="mf-note-action" type="button" data-note-copy>Copy</button>
        <button class="mf-note-action" type="button" data-note-delete>Del</button>
      </div>
      <textarea class="mf-note-input" spellcheck="false" placeholder="Write a reusable note...">${escapeHTML(note.text)}</textarea>
    </article>
  `).join('');
}

function focusFirstNote() {
  const first = sideNotesList && sideNotesList.querySelector('.mf-note-input');
  if (first) {
    first.focus();
    first.select();
  }
}

function saveSideNote(text, options = {}) {
  const value = String(text || '').trim();
  if (!value) return null;
  const note = makeNote(value, options);
  sideNotes.unshift(note);
  renderSideNotes();
  if (options.focus !== false) focusFirstNote();
  save();
  return note;
}

function addSideNoteFromDraft() {
  const selected = getSavedEditorSelectionText();
  const text = (selected || getDraftPlain()).trim();
  if (!text) {
    toast('No draft text to save');
    return;
  }
  saveSideNote(text);
  toast(selected ? 'Selection saved as note' : 'Draft saved as note');
}

function insertNoteIntoDraft(note) {
  const text = String(note?.text || '').trim();
  if (!text) {
    toast('Note empty');
    return;
  }
  insertAtCursor(text);
  toast('Note inserted');
}

if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    sideNotes.unshift(makeNote('', { pinned: sideNotesQuery ? false : false }));
    renderSideNotes();
    focusFirstNote();
    save();
  });
}

if (addNoteFromDraftBtn) {
  addNoteFromDraftBtn.addEventListener('click', addSideNoteFromDraft);
}

if (sideNotesSearch) {
  sideNotesSearch.addEventListener('input', () => {
    sideNotesQuery = sideNotesSearch.value || '';
    renderSideNotes();
  });
}

if (sideNotesClearSearch) {
  sideNotesClearSearch.addEventListener('click', () => {
    sideNotesQuery = '';
    if (sideNotesSearch) sideNotesSearch.value = '';
    renderSideNotes();
    toast('Note search cleared');
  });
}

if (sideNotesList) {
  sideNotesList.addEventListener('input', (e) => {
    const input = e.target.closest('.mf-note-input');
    if (!input) return;
    const card = input.closest('[data-note-id]');
    const note = sideNotes.find(item => item.id === card.dataset.noteId);
    if (!note) return;
    note.text = input.value;
    const meta = card.querySelector('.mf-note-meta');
    if (meta) meta.textContent = noteWordCount(note.text) + 'w';
    renderSideNotesStatus();
    save();
  });
  sideNotesList.addEventListener('click', async (e) => {
    const card = e.target.closest('[data-note-id]');
    if (!card) return;
    const note = sideNotes.find(item => item.id === card.dataset.noteId);
    if (!note) return;
    if (e.target.closest('[data-note-pin]')) {
      note.pinned = !note.pinned;
      renderSideNotes();
      save();
      toast(note.pinned ? 'Note pinned' : 'Note unpinned');
      return;
    }
    if (e.target.closest('[data-note-insert]')) {
      insertNoteIntoDraft(note);
      return;
    }
    if (e.target.closest('[data-note-copy]')) {
      if (!note.text.trim()) { toast('Note empty'); return; }
      try {
        await navigator.clipboard.writeText(note.text);
        toast('Note copied');
      } catch {
        toast('Copy failed - clipboard blocked');
      }
      return;
    }
    if (e.target.closest('[data-note-delete]')) {
      sideNotes = sideNotes.filter(item => item.id !== note.id);
      renderSideNotes();
      save();
    }
  });
}

function normalizeEditorVisibleText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

const EDITOR_LINE_BLOCKS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'LI']);

function editorNodeLineText(node) {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  if (node.tagName === 'BR') return '\n';
  return Array.from(node.childNodes).map(editorNodeLineText).join('');
}

function editorLineBlocks(root) {
  const blocks = [];
  let inline = '';
  function flushInline() {
    const text = normalizeEditorVisibleText(inline);
    if (text) blocks.push(text);
    inline = '';
  }
  Array.from(root.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      inline += node.nodeValue || '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (EDITOR_LINE_BLOCKS.has(node.tagName)) {
      flushInline();
      blocks.push(normalizeEditorVisibleText(editorNodeLineText(node)));
      return;
    }
    if (node.tagName === 'BR') {
      inline += '\n';
      return;
    }
    inline += editorNodeLineText(node);
  });
  flushInline();
  return blocks;
}

/* convert editor view → customer-facing plain text, preserving visible line breaks */
function getDraftPlain() {
  return normalizeEditorVisibleText(editorLineBlocks(editorEl).join('\n'));
}

/* collapsed text (used for counter/tone calcs) */

function getDraftStats() {
  const text = getDraftPlain();
  const words = text ? (text.match(/\b[\w'’-]+\b/g) || []).length : 0;
  const allLines = text ? text.split('\n') : [];
  const contentLines = allLines.filter(line => line.trim()).length;
  const blankLines = allLines.filter(line => !line.trim()).length;
  return { text, words, lines: allLines.length, contentLines, blankLines, chars: text.length };
}

function syncEditorStatus() {
  const status = document.getElementById('editorLiveStatus');
  const stats = getDraftStats();
  editorEl.dataset.empty = stats.words ? 'false' : 'true';
  if (status) {
    status.textContent = stats.words
      ? `${stats.words}w · ${Math.max(1, stats.lines)} lines${stats.blankLines ? ` · ${stats.blankLines} blank` : ''}`
      : 'Ready';
  }
}

let editorSavedRange = null;
let editorSavedSelectionText = '';
let mfAssistScope = 'draft';

function editorOwnsNode(node) {
  return Boolean(node && (node === editorEl || editorEl.contains(node)));
}

function editorRangeIsUsable(range) {
  try {
    return Boolean(range && editorOwnsNode(range.startContainer) && editorOwnsNode(range.endContainer));
  } catch (_) {
    return false;
  }
}

function captureEditorSelection() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !editorOwnsNode(sel.anchorNode) || !editorOwnsNode(sel.focusNode)) return;
  const range = sel.getRangeAt(0);
  editorSavedRange = range.cloneRange();
  editorSavedSelectionText = sel.isCollapsed ? '' : sel.toString().trim();
  syncAssistScopeControls();
}

function getSavedEditorSelectionText() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed && editorOwnsNode(sel.anchorNode) && editorOwnsNode(sel.focusNode)) {
    return sel.toString().trim();
  }
  return editorSavedSelectionText;
}

function mfAssistSelectionText() {
  return String(getSavedEditorSelectionText() || '').trim();
}

function mfAssistActiveScope() {
  return mfAssistScope === 'selection' && mfAssistSelectionText() ? 'selection' : 'draft';
}

function mfAssistAnalysisText() {
  return mfAssistActiveScope() === 'selection'
    ? mfAssistSelectionText()
    : getDraftPlain().trim();
}

function syncAssistScopeControls() {
  const btn = document.getElementById('mfAssistScopeToggle');
  if (!btn) return;
  const hasSelection = Boolean(mfAssistSelectionText());
  const active = mfAssistActiveScope() === 'selection';
  btn.dataset.active = String(active);
  btn.textContent = active ? 'Selection' : 'Draft';
  btn.title = hasSelection ? 'Toggle Assist between selected text and full draft' : 'Select text in the editor to check a fragment';
}

function setAssistScope(scope) {
  if (scope === 'selection' && !mfAssistSelectionText()) {
    mfAssistScope = 'draft';
    syncAssistScopeControls();
    toast('Select text first');
    return;
  }
  mfAssistScope = scope === 'selection' ? 'selection' : 'draft';
  syncAssistScopeControls();
  renderPingAssist();
}

document.addEventListener('selectionchange', captureEditorSelection);
editorEl.addEventListener('keyup', captureEditorSelection);
editorEl.addEventListener('mouseup', captureEditorSelection);
editorEl.addEventListener('focus', captureEditorSelection);









function updateCounter() { /* counter removed — keeping stub so refreshAll stays harmless */ }

/* The customer message is optional. Everything works from the reply alone; this only adds
   "does the reply answer them?" checks when something is pasted in. */
function getCustomerContextText() {
  return customerEl.value.trim();
}

/* ========== INSIGHTS RENDER + DOM WIRING ========== */

function mfSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function mfRenderRows(containerId, rows, options) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'mf-empty-insight';
    empty.textContent = (options && options.empty) || 'No active signals.';
    container.appendChild(empty);
    return;
  }
  rows.forEach(row => {
    const wrap = document.createElement('div');
    wrap.className = (options && options.kind) || 'mf-engine-row';
    if (row.severity) wrap.dataset.severity = row.severity;
    const dot = document.createElement('span');
    dot.className = 'mf-engine-dot';
    const body = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = row.label;
    const meta = document.createElement('span');
    meta.textContent = row.note || row.coach || row.value || '';
    body.appendChild(title);
    body.appendChild(meta);
    if (row.insert) {
      const btn = document.createElement('button');
      btn.className = 'mf-insert-btn';
      btn.type = 'button';
      btn.dataset.insightInsert = row.insert;
      btn.textContent = 'Insert';
      body.appendChild(btn);
    }
    wrap.appendChild(dot);
    wrap.appendChild(body);
    container.appendChild(wrap);
  });
}




function renderInsightGuidanceCue(result) {
  if (!result) return;
  const cue = mfBuildCoachModel(result);
  mfSetText('mfInsightCueTitle', cue.headline);
  mfSetText('mfInsightCueWhy', cue.why);
  mfSetText('mfInsightCueMove', cue.tryLabel);
  mfSetText('mfInsightCueText', cue.tryText);
  const btn = document.getElementById('mfInsightCueInsert');
  if (btn) {
    btn.dataset.insightInsert = cue.tryInsert || '';
    btn.disabled = !cue.tryInsert;
    btn.textContent = cue.tryInsert ? 'Insert move' : 'No insert yet';
  }
}


function renderPingInsights() {
  const result = MF_runPingUniversalEngine(getCustomerContextText(), getDraftPlain(), 'auto');
  const responseState = result.responseState || { code: 'blocked', label: 'Blocked', score: 0, reason: 'No response state available.', severity: 'high' };
  window.MF_PING_LAST_ENGINE = result;
  renderInsightGuidanceCue(result);

  const stateCard = document.getElementById('mfResponseStateCard');
  if (stateCard) stateCard.dataset.responseState = responseState.code;
  const dockBtn = document.getElementById('tabInsights');
  if (dockBtn) dockBtn.dataset.readiness = result.reply.hasDraft ? responseState.code : 'idle';
  mfSetText('mfReadyScore', result.reply.hasDraft ? responseState.score + '%' : '--');
  mfSetText('mfReadyLabel', result.reply.hasDraft ? responseState.label : 'Idle');
  const nextCard = document.getElementById('mfNextMoveCard');
  if (nextCard) nextCard.hidden = !result.reply.hasDraft || responseState.code === 'ready';
  if (stateCard && !result.reply.hasDraft) stateCard.dataset.responseState = 'idle';
  mfSetText('mfBriefWhy', result.reply.hasDraft
    ? [responseState.reason, responseState.next].filter(Boolean).join(' ')
    : 'Write or paste text to see if it’s ready to send.');
  const packChip = document.getElementById('mfPackChip');
  if (packChip) {
    const packOn = result.reply.hasDraft && result.domainChecks && result.domainChecks.active;
    packChip.hidden = !packOn;
    if (packOn) packChip.textContent = 'Checking as: ' + result.domainChecks.label;
  }
  const readyBar = document.getElementById('mfReadyBar');
  if (readyBar) readyBar.style.width = responseState.score + '%';

  /* Checks adapt to the message: the engine only emits pack/coverage rows that apply. */
  const domainCheckRows = result.domainChecks && result.domainChecks.active
    ? result.domainChecks.checks.map(check => ({
        label: check.label,
        value: check.passed ? 'Pass' : 'Gap',
        note: check.note,
        severity: check.passed ? 'low' : check.severity
      }))
    : [];
  const riskRow = { label:'Risk', value: result.reply.riskHits.length ? 'Flagged' : 'Clear', note: result.reply.riskHits.length ? result.reply.riskHits.slice(0, 4).join(', ') : 'No hard risk phrase found.', severity: result.reply.riskHits.length ? 'high' : 'low' };
  const draftOnly = result.sourceMode === 'draft_only';
  const checkRows = draftOnly ? [
    ...domainCheckRows,
    { label:'Plain language', value: result.reply.plain ? 'Clear' : 'Heavy', note: result.reply.plain ? 'Sentence load and jargon are under control.' : 'Split long sentences or translate internal terms.', severity: result.reply.plain ? 'low' : 'medium' },
    ...(result.reply.supportLike ? [{ label:'Action path', value: result.reply.nextStep ? 'Present' : 'Missing', note: result.reply.nextStep ? 'Action path is visible.' : 'Add the next concrete action.', severity: result.reply.nextStep ? 'low' : 'medium' }] : []),
    riskRow
  ] : [
    ...domainCheckRows,
    { label:'Coverage', value: result.reply.coverage.score + '%', note: result.reply.coverage.score >= 70 ? 'Customer ask is represented.' : 'Missing: ' + (result.reply.coverage.missing.join(', ') || 'customer details'), severity: result.reply.coverage.score >= 70 ? 'low' : 'medium' },
    { label:'Ownership', value: result.reply.ownership ? 'Present' : 'Missing', note: result.reply.ownership ? 'Sender action is visible.' : 'Add who will do what.', severity: result.reply.ownership ? 'low' : 'medium' },
    { label:'Next step', value: result.reply.nextStep ? 'Present' : 'Missing', note: result.reply.nextStep ? 'Action path is visible.' : 'Add the next concrete action.', severity: result.reply.nextStep ? 'low' : 'medium' },
    riskRow
  ];
  mfRenderRows('mfCheckList', result.reply.hasDraft ? checkRows : [], { empty: 'Checks appear once there is a draft.', kind: 'mf-gap-row' });
  mfRenderRows('mfGapList', result.gaps, { empty: '', kind: 'mf-gap-row' });
  mfRenderRows('mfSuggestionList', result.suggestions.map(s => ({ label: s.label, note: s.note, insert: s.insert })), { empty: '', kind: 'mf-suggestion-row' });
}

document.getElementById('pingInsightEngine').addEventListener('click', (e) => {
  if (e.target.closest('[data-open-assist]')) {
    shell.dataset.rightPanel = 'assist';
    shell.dataset.right = 'open';
    renderPingAssist();
    syncRailControls();
    return;
  }
  const btn = e.target.closest('[data-insight-insert]');
  if (!btn) return;
  insertAtCursor(btn.dataset.insightInsert);
  toast('Inserted insight move');
});

/* ========== THEGUIDE EXCHANGE EXPORT (Ping -> Coach/Sync) ========== */
const THEGUIDE_EXCHANGE_SCHEMA = 'theguide.exchange.v1';
const THEGUIDE_EXCHANGE_SOURCE = 'mirrorflow-ping';

function mfExchangeTrim(text, max) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!max || value.length <= max) return value;
  return value.slice(0, Math.max(0, max - 1)).trim() + '...';
}

function mfExchangeClone(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value == null ? fallback : value));
  } catch (_) {
    return fallback;
  }
}

function mfExchangeId() {
  return 'ping_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function mfExchangeSlug(text) {
  const slug = String(text || 'ping-session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'ping-session';
}



function mfCompactAssistForExchange(analysis) {
  if (!analysis) return null;
  return {
    engine: analysis.engine || 'mirrorflow-assist-local-v1',
    quality: mfExchangeClone(analysis.quality, {}),
    tone: mfExchangeClone(analysis.tone, {}),
    clarity: mfExchangeClone(analysis.clarity, {}),
    issues: (analysis.issues || []).slice(0, 32).map(issue => ({
      id: issue.id,
      ruleId: issue.ruleId,
      category: issue.category,
      subtype: issue.subtype,
      severity: issue.severity,
      label: issue.label,
      message: issue.message,
      excerpt: issue.excerpt,
      replacement: issue.replacement,
      applySafe: Boolean(issue.applySafe),
      confidence: issue.confidence
    })),
    rewrites: (analysis.rewrites || []).slice(0, 4).map(rewrite => ({
      id: rewrite.id,
      title: rewrite.title,
      intent: rewrite.intent,
      impact: rewrite.impact,
      text: rewrite.text
    })),
    protectedSpans: (analysis.protectedSpans || []).slice(0, 16),
    rules: {
      disabled: analysis.rules && analysis.rules.disabled || [],
      categories: analysis.rules && analysis.rules.categories || []
    }
  };
}

function mfCompactInsightsForExchange(result) {
  if (!result) return null;
  return {
    mode: result.mode,
    sourceMode: result.sourceMode,
    hasCustomer: Boolean(result.hasCustomer),
    hasDraft: Boolean(result.hasDraft),
    domain: mfExchangeClone(result.domain, {}),
    query: mfExchangeClone(result.query, {}),
    responseState: mfExchangeClone(result.responseState, {}),
    brief: mfExchangeClone(result.brief, {}),
    gaps: mfExchangeClone(result.gaps || [], []),
    suggestions: mfExchangeClone(result.suggestions || [], []),
    domainChecks: mfExchangeClone(result.domainChecks, null),
    signals: mfExchangeClone(result.signals, {})
  };
}

function mfBuildCoachSeed(assist, insights, analysisText, customerText) {
  const categories = new Set((assist?.issues || []).map(issue => issue.category).filter(Boolean));
  const highIssues = (assist?.issues || []).filter(issue => issue.severity === 'high');
  const gaps = insights?.gaps || [];
  const suggestions = insights?.suggestions || [];
  const signals = insights?.signals?.rows || [];
  const modules = [];
  const focusAreas = [];

  if (categories.has('grammar') || categories.has('clarity')) {
    modules.push('Build');
    focusAreas.push('Writing mechanics and clarity');
  }
  if (categories.has('tone') || signals.length) {
    modules.push('Analyse');
    focusAreas.push('Tone, pressure, and reader impact');
  }
  if (customerText) {
    modules.push('Facilitate');
    focusAreas.push('Customer-context role play');
  }
  if (gaps.length || highIssues.length || (insights?.responseState?.score || 100) < 75) {
    modules.push('Assess');
    focusAreas.push('Readiness and coaching review');
  }

  return {
    targetApp: 'excelsior-coach',
    entryMode: 'analyse',
    primaryText: analysisText,
    sourceContext: customerText ? 'customer_context' : 'draft_or_sent_message',
    recommendedModes: Array.from(new Set(modules.length ? modules : ['Analyse'])),
    focusAreas: Array.from(new Set(focusAreas.length ? focusAreas : ['Clean message review'])),
    firstActions: [
      insights?.brief?.priority || 'Run Analyse on imported Ping text',
      suggestions[0]?.label || 'Review Coach findings',
      highIssues[0]?.label || gaps[0]?.label || 'Build a targeted practice step'
    ].filter(Boolean).slice(0, 3)
  };
}

function mfBuildExchangeTitle(insights, analysisText) {
  const domain = insights?.domain?.label;
  const query = insights?.query?.label;
  if (domain && query) return domain + ' - ' + query;
  const firstLine = String(analysisText || '').split('\n').map(line => line.trim()).find(Boolean);
  return mfExchangeTrim(firstLine || 'Ping session export', 72);
}

function mfBuildTheGuideExchangePacket() {
  const draftText = getDraftPlain();
  const finalText = '';
  const customerText = getCustomerContextText();
  const analysisText = draftText || customerText;
  const insightsDraft = draftText;
  const hasAssist = Boolean(insightsDraft && window.MirrorFlowAssistEngine?.analyzeText);
  const assist = hasAssist
    ? window.MirrorFlowAssistEngine.analyzeText(insightsDraft, { surface: 'ping_exchange', mode: 'writing_only' })
    : null;
  const insights = typeof window.MF_runPingUniversalEngine === 'function'
    ? window.MF_runPingUniversalEngine(customerText, insightsDraft, 'auto')
    : null;
  const title = mfBuildExchangeTitle(insights, analysisText);
  const assistPacket = mfCompactAssistForExchange(assist);
  const insightsPacket = mfCompactInsightsForExchange(insights);

  return {
    schema: THEGUIDE_EXCHANGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    sourceApp: THEGUIDE_EXCHANGE_SOURCE,
    sourceVersion: 'ping-shell-v6-codex',
    destinationHints: ['excelsior-coach', 'mirrorflow-sync'],
    session: {
      id: mfExchangeId(),
      title,
      customerText,
      draftText,
      finalText,
      analysisText,
      sideNotes: sideNotes.map(note => ({
        id: note.id,
        text: note.text,
        pinned: Boolean(note.pinned)
      })),
      chatTurns: []
    },
    analysis: {
      assist: assistPacket,
      insights: insightsPacket,
      drivers: {
        insightRows: mfExchangeClone(insights?.drivers || {}, {}),
        assistRows: []
      },
      coachSeed: mfBuildCoachSeed(assistPacket, insightsPacket, analysisText, customerText)
    },
    privacy: {
      redacted: false,
      containsCustomerText: Boolean(customerText),
      containsAgentText: Boolean(draftText || finalText),
      storage: 'local-download'
    }
  };
}

function mfDownloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 300);
}

function mfExportTheGuideExchangePacket() {
  const packet = mfBuildTheGuideExchangePacket();
  if (!packet.session.analysisText && !packet.session.chatTurns.length) {
    toast('Nothing to export');
    return null;
  }
  mfDownloadJson(packet, 'theguide-exchange-' + mfExchangeSlug(packet.session.title) + '.json');
  toast('Coach packet exported');
  return packet;
}

window.MF_buildTheGuideExchangePacket = mfBuildTheGuideExchangePacket;
window.MF_exportTheGuideExchangePacket = mfExportTheGuideExchangePacket;

/* ========== ASSIST STATE + RENDER ========== */
let mfAssistIgnore = new Set();
let mfAssistFilter = 'all';
let mfLastAssist   = null;
let mfAssistDebounce = 0;
let mfAssistLastTestReport = null;
let mfAssistLastApply = null;
let mfAssistRestoringUndo = false;
let mfAssistApplyingFix = false;

function mfAssistSetUndoState(state) {
  mfAssistLastApply = state || null;
  const btn = document.getElementById('mfAssistUndoApply');
  if (!btn) return;
  btn.style.display = mfAssistLastApply ? 'block' : 'none';
  if (mfAssistLastApply) btn.title = 'Undo ' + (mfAssistLastApply.label || 'last Assist fix');
}

const SEV_ORDER = { high: 0, medium: 1, low: 2 };

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}

function mfAssistIssueKey(issue) {
  return issue ? issue.ruleId + ':' + issue.excerpt : '';
}

function mfAssistIsIssueIgnored(issue) {
  return mfAssistIgnore.has(mfAssistIssueKey(issue));
}

function mfAssistSafeIssues(result) {
  let floor = Infinity;
  return (result?.issues || []).filter(issue =>
    !mfAssistIsIssueIgnored(issue) &&
    issue.applySafe &&
    issue.replacement !== null &&
    issue.replacement !== undefined &&
    issue.replacement !== issue.excerpt &&
    Number.isFinite(issue.start) &&
    Number.isFinite(issue.end))
    .sort((a, b) => (b.start - a.start) || (b.end - a.end))
    .filter(issue => {
      if (issue.end > floor) return false;
      floor = issue.start;
      return true;
    })
    .sort((a, b) => a.start - b.start);
}

function mfAssistIssueCounts(issues) {
  const active = issues.filter(i => !mfAssistIsIssueIgnored(i));
  return {
    all: active.length,
    grammar: active.filter(i => i.category === 'grammar').length,
    clarity: active.filter(i => i.category === 'clarity').length,
    tone:    active.filter(i => i.category === 'tone').length
  };
}

function updateAssistFilterTabs(counts) {
  counts = counts || { all:0, grammar:0, clarity:0, tone:0 };
  const map = { all: counts.all, grammar: counts.grammar, clarity: counts.clarity, tone: counts.tone };
  const labels = { all:'All', grammar:'Grammar', clarity:'Clarity', tone:'Tone' };
  document.querySelectorAll('.mf-assist-filter-btn').forEach(btn => {
    const f = btn.dataset.filter;
    const n = map[f] ?? 0;
    btn.textContent = n > 0 ? `${labels[f]} ${n}` : labels[f];
  });
}

function mfAssistSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function mfAssistEmptyHtml(title, note) {
  return `<div class="mf-assist-empty"><strong>${escHtml(title)}</strong><span>${escHtml(note)}</span></div>`;
}

function renderAssistRightStatus(result) {
  const box = document.getElementById('mfAssistRightStatus');
  if (!box) return;
  if (!result) {
    box.dataset.state = 'idle';
    mfAssistSetText('mfAssistRightScope', mfAssistScope === 'selection' ? 'Selection' : 'Draft');
    mfAssistSetText('mfAssistRightScore', '--');
    mfAssistSetText('mfAssistRightIssues', '0');
    mfAssistSetText('mfAssistRightFixes', '0');
    mfAssistSetText('mfAssistRightNote', mfAssistScope === 'selection'
      ? 'Select text in the editor to check a fragment.'
      : 'Type a draft to run the writing check.');
    return;
  }
  const counts = mfAssistIssueCounts(result.issues || []);
  const safeCount = mfAssistSafeIssues(result).length;
  const rewriteCount = (result.rewrites || []).filter(item => item && item.text).length;
  const score = result.quality?.score ?? 0;
  const scoped = result.editorScope === 'selection';
  const risk = result.tone?.risk || 'Low';
  const state = counts.all === 0 ? 'clean' : risk === 'High' ? 'risk' : safeCount ? 'action' : 'review';
  box.dataset.state = state;
  mfAssistSetText('mfAssistRightScope', scoped ? 'Selection' : 'Draft');
  const projected = result.quality?.projected;
  mfAssistSetText('mfAssistRightScore', Number.isFinite(score)
    ? (Number.isFinite(projected) && projected > score && safeCount ? `${score}→${projected}%` : `${score}%`) : '--');
  mfAssistSetText('mfAssistRightIssues', String(counts.all));
  mfAssistSetText('mfAssistRightFixes', String(safeCount));
  const note = counts.all === 0
    ? `${scoped ? 'Selection' : 'Draft'} is clean. ${rewriteCount} rewrite preview${rewriteCount === 1 ? '' : 's'} available.`
    : `${counts.grammar} grammar · ${counts.clarity} clarity · ${counts.tone} tone. ${safeCount} safe fix${safeCount === 1 ? '' : 'es'}${rewriteCount ? ` · ${rewriteCount} rewrite${rewriteCount === 1 ? '' : 's'}` : ''}.`;
  const reg = result.context && result.context.register;
  mfAssistSetText('mfAssistRightNote', note + (reg ? ` Reading as ${reg === 'email' ? 'an email' : 'a chat reply'}.` : ''));
  const noteEl = document.getElementById('mfAssistRightNote');
  if (noteEl) noteEl.title = (result.quality && result.quality.rationale) || '';
}

function updateAssistDotBadge(total) {
  const dot = document.getElementById('mfAssistDot');
  if (!dot) return;
  if (total > 0) {
    dot.textContent = total > 9 ? '9+' : String(total);
    dot.classList.add('visible');
  } else {
    dot.textContent = '';
    dot.classList.remove('visible');
  }
}

function mfAssistClearDraftState() {
  mfLastAssist = null;
  mfActiveIssueId = null;
  mfAssistScope = 'draft';
  mfAssistIgnore.clear();
  mfAssistSetUndoState(null);
  syncAssistScopeControls();
  renderAssistRightStatus(null);
}

function renderPingAssistSummary(result) {
  const issuesEl   = document.getElementById('mfAssistIssues');
  const recEl      = document.getElementById('mfAssistRec');

  if (!result) {
    renderAssistRightStatus(null);
    if (issuesEl) issuesEl.textContent = '0';
    [
      ['mfBarValGrammar', '—'],
      ['mfBarValClarity', '—'],
      ['mfBarValTone', '—']
    ].forEach(([id, label]) => {
      const el = document.getElementById(id); if (el) el.textContent = label;
    });
    ['mfBarGrammar','mfBarClarity','mfBarTone'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.width = '0%';
    });
    if (recEl) recEl.textContent = 'Start typing to check writing.';
    updateAssistDotBadge(0);
    updateAssistFilterTabs({ all:0, grammar:0, clarity:0, tone:0 });
    return;
  }

  const { issues = [], tone = {}, clarity = {} } = result;
  const scoped = result.editorScope === 'selection';
  const counts = mfAssistIssueCounts(issues);
  const total  = counts.all;
  renderAssistRightStatus(result);
  /* KPIs */
  if (issuesEl)    issuesEl.textContent    = total;

  /* bars — all show HEALTH (higher = cleaner/safer) */
  const grammarHealth = Math.max(0, 100 - counts.grammar * 20);
  const clarityHealth = clarity.quality != null ? Math.round(clarity.quality) : 0;
  const toneHealth    = tone.score      != null ? Math.max(0, 100 - Math.round(tone.score)) : 0;

  const grammarLabel  = counts.grammar === 0 ? 'Clean' : `${counts.grammar} issue${counts.grammar !== 1 ? 's' : ''}`;
  const clarityLabel  = clarity.level || 'Clear';
  const toneLabel     = tone.risk    || 'Low';

  [
    ['mfBarValGrammar', 'mfBarGrammar', grammarLabel, grammarHealth],
    ['mfBarValClarity', 'mfBarClarity', clarityLabel, clarityHealth],
    ['mfBarValTone',    'mfBarTone',    toneLabel,    toneHealth]
  ].forEach(([valId, fillId, label, pct]) => {
    const v = document.getElementById(valId); if (v) v.textContent = label;
    const f = document.getElementById(fillId); if (f) f.style.width = pct + '%';
  });

  /* top recommendation */
  const recs = clarity.recommendations || [];
  if (recEl) recEl.textContent = scoped
    ? (recs[0] || quality.nextAction || 'Selection check is reading only the highlighted text.')
    : (recs[0] || quality.nextAction || '');

  updateAssistDotBadge(total);
  updateAssistFilterTabs(counts);
}

function renderPingAssistRewrites(result) {
  const panel = document.getElementById('mfAssistRewritePanel');
  if (!panel) return;
  const rewrites = (result?.rewrites || []).filter(item => item && item.text).slice(0, 3);
  if (!rewrites.length) {
    panel.dataset.show = 'false';
    panel.innerHTML = '';
    return;
  }
  panel.dataset.show = 'true';
  panel.innerHTML = `
    <div class="mf-assist-rewrite-head">
      <span>${result.editorScope === 'selection' ? 'Selection rewrites' : 'Rewrite previews'}</span>
      <span>${rewrites.length}</span>
    </div>
    ${rewrites.map(rewrite => `
      <div class="mf-assist-rewrite-card" data-rewrite-id="${escAttr(rewrite.id)}">
        <div class="mf-assist-rewrite-title">${escHtml(rewrite.title)}</div>
        <div class="mf-assist-rewrite-intent">${escHtml(rewrite.intent)} · ${rewrite.changes || 0} change${rewrite.changes === 1 ? '' : 's'} · ${escHtml(rewrite.impact?.label || 'Mixed')}</div>
        <div class="mf-assist-rewrite-text" contenteditable="true" spellcheck="false" data-rewrite-edit="${escAttr(rewrite.id)}">${escHtml(rewrite.text)}</div>
        <div class="mf-assist-card-actions" style="margin-top:8px">
          <button class="mf-assist-act-btn apply" data-action="use-rewrite" data-rewrite-id="${escAttr(rewrite.id)}">Use</button>
          <button class="mf-assist-act-btn" data-action="copy-rewrite" data-rewrite-id="${escAttr(rewrite.id)}">Copy</button>
          <button class="mf-assist-act-btn" data-action="save-rewrite" data-rewrite-id="${escAttr(rewrite.id)}">Save</button>
          <button class="mf-assist-act-btn" data-action="reset-rewrite" data-rewrite-id="${escAttr(rewrite.id)}">Reset</button>
        </div>
      </div>
    `).join('')}`;
}

function renderPingAssistCards(result) {
  queueMicrotask(renderEditorHighlights);
  const list        = document.getElementById('mfAssistCardList');
  const clearBtn    = document.getElementById('mfAssistClearIgnored');
  const applySafeBtn= document.getElementById('mfAssistApplySafe');
  if (!list) return;

  /* show/hide "clear ignored" button */
  if (clearBtn) clearBtn.style.display = mfAssistIgnore.size > 0 ? 'block' : 'none';
  if (applySafeBtn) {
    applySafeBtn.style.display = 'none';
    applySafeBtn.textContent = 'Fix safe';
    applySafeBtn.title = 'Apply all safe Assist fixes';
  }

  if (!result) {
    if (clearBtn) clearBtn.style.display = 'none';
    const empty = mfAssistScope === 'selection'
      ? ['Selection waiting', 'Highlight a sentence or paragraph, then run the fragment check.']
      : ['Draft waiting', 'Type or paste text to see grammar, clarity, tone, and rewrite help.'];
    list.innerHTML = mfAssistEmptyHtml(empty[0], empty[1]);
    return;
  }
  const { issues = [] } = result;
  const safeIssues = mfAssistSafeIssues(result);
  if (applySafeBtn) {
    applySafeBtn.style.display = safeIssues.length ? 'block' : 'none';
    applySafeBtn.textContent = safeIssues.length ? `Fix safe ${safeIssues.length}` : 'Fix safe';
    applySafeBtn.title = safeIssues.length
      ? `Apply ${safeIssues.length} safe Assist fix${safeIssues.length === 1 ? '' : 'es'}${result.editorScope === 'selection' ? ' to selection' : ''}`
      : 'Apply all safe Assist fixes';
  }

  /* update filter tab counts (may have changed via ignore) */
  updateAssistFilterTabs(mfAssistIssueCounts(issues));

  const visible = issues
    .filter(i => {
      if (mfAssistIsIssueIgnored(i)) return false;
      return mfAssistFilter === 'all' || i.category === mfAssistFilter;
    })
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 1) - (SEV_ORDER[b.severity] ?? 1));

  if (!visible.length) {
    const activeCount = issues.filter(i => !mfAssistIsIssueIgnored(i)).length;
    const empty = mfAssistFilter !== 'all'
      ? [`No ${mfAssistFilter} issues`, `Switch filters or keep writing. ${result.editorScope === 'selection' ? 'Selection' : 'Draft'} check is still active.`]
      : activeCount === 0 && mfAssistIgnore.size > 0
        ? ['Ignored issues hidden', 'Clear ignored to bring the hidden cards back.']
        : ['All clear ✓', 'Grammar, clarity and tone look good. Use rewrite previews if you want a different tone or length.'];
    list.innerHTML = mfAssistEmptyHtml(empty[0], empty[1]);
    return;
  }

  const CAT_ORDER = ['grammar', 'clarity', 'tone'];
  if (mfAssistFilter === 'all') {
    visible.sort((a, b) => {
      const catDiff = CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return (SEV_ORDER[a.severity] ?? 1) - (SEV_ORDER[b.severity] ?? 1);
    });
  }

  const catLabels = { grammar:'Grammar', clarity:'Clarity', tone:'Tone' };
  let html = '', currentCat = '';

  visible.forEach(issue => {
    /* group header when showing all */
    if (mfAssistFilter === 'all' && issue.category !== currentCat) {
      currentCat = issue.category;
      const groupCount = visible.filter(i => i.category === currentCat).length;
      html += `<div class="mf-assist-group-label">${catLabels[currentCat] || currentCat} · ${groupCount}</div>`;
    }

    const hasR     = issue.replacement != null && issue.replacement !== issue.excerpt;
    const isSafe   = hasR && issue.applySafe;
    const afterCls = hasR && !issue.applySafe ? ' review-only' : '';
    const isActive = issue.id === mfActiveIssueId;
    const previewReplacement = issue.replacement === '' ? 'Remove this phrase' : issue.replacement;
    const canCopyReplacement = hasR && issue.replacement !== '';

    html += `<div class="mf-assist-card" data-cat="${issue.category}" data-issue-id="${escAttr(issue.id)}"${isActive ? ' data-active="true"' : ''}>
      <div class="mf-assist-card-head">
        <span class="mf-assist-badge" data-cat="${issue.category}">${issue.category}</span>
        <span class="mf-assist-sev" data-sev="${issue.severity}">${issue.severity}</span>
        <span style="font:700 11px var(--mf-font-ui);color:var(--mf-ink-2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(issue.label)}</span>
      </div>
      <div style="font:400 12px/1.5 var(--mf-font-ui);color:var(--mf-ink-2);margin-bottom:6px">${escHtml(issue.message)}</div>
      <div class="mf-assist-before-after">
        <div class="mf-assist-preview-label">Current</div>
        <div class="mf-assist-before">${escHtml(issue.excerpt)}</div>
        ${hasR ? `<div class="mf-assist-preview-label">Suggestion</div><div class="mf-assist-after${afterCls}">${escHtml(previewReplacement)}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        ${hasR ? `<button class="mf-assist-act-btn apply" data-action="apply" data-issue-id="${escAttr(issue.id)}">${isSafe ? 'Apply' : 'Use'}</button>` : ''}
        ${issue.learnable ? `<button class="mf-assist-act-btn" data-action="learn" data-word="${escAttr(issue.learnable)}">Add word</button>` : ''}
        ${canCopyReplacement ? `<button class="mf-assist-act-btn" data-action="copy" data-replacement="${escAttr(issue.replacement)}">Copy</button>` : ''}
        <button class="mf-assist-act-btn" data-action="ignore" data-rule-id="${escAttr(issue.ruleId)}" data-excerpt="${escAttr(issue.excerpt)}">Ignore</button>
        <button class="mf-assist-act-btn" data-action="ignore-rule" data-rule-id="${escAttr(issue.ruleId)}">Rule off</button>
      </div>
    </div>`;
  });

  list.innerHTML = html;
}

function renderPingAssist() {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const scope = mfAssistActiveScope();
  const text = mfAssistAnalysisText();
  syncAssistScopeControls();
  if (!text) {
    clearEditorHighlights();
    mfAssistClearDraftState();
    renderPingAssistSummary(null);
    renderPingAssistRewrites(null);
    renderPingAssistCards(null);
    renderPingAssistSpans(null);
    renderPingAssistRules();
    renderPingAssistProfilePresets();
    renderPingAssistDiagnostics();
    return;
  }
  try {
    mfLastAssist = window.MirrorFlowAssistEngine.analyzeText(text, { surface: 'ping_assist', mode: 'writing_only', knownText: getCustomerContextText() });
    mfLastAssist.sourceText = text;
    mfLastAssist.editorScope = scope;
    renderPingAssistSummary(mfLastAssist);
    renderPingAssistRewrites(mfLastAssist);
    renderPingAssistCards(mfLastAssist);
    renderPingAssistSpans(mfLastAssist);
    renderPingAssistRules();
    renderPingAssistProfilePresets();
    renderPingAssistDiagnostics();
  } catch (_) {}
}

function renderPingAssistDebounced() {
  clearTimeout(mfAssistDebounce);
  mfAssistDebounce = setTimeout(renderPingAssist, 350);
}

function replaceEditorTextMatch(excerpt, replacement) {
  const needle = String(excerpt || '');
  if (!needle) return false;
  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const idx = node.nodeValue.indexOf(needle);
    if (idx < 0) continue;
    node.nodeValue = node.nodeValue.slice(0, idx) + replacement + node.nodeValue.slice(idx + needle.length);
    return true;
  }
  return false;
}

function plainToEditorHtml(value) {
  return String(value || '').split('\n\n')
    .map(p => `<p>${escHtml(p).replace(/\n/g, '<br>') || '<br>'}</p>`)
    .join('');
}

function replaceSavedEditorSelectionWithPlainText(value) {
  if (!editorRangeIsUsable(editorSavedRange)) return false;
  const range = editorSavedRange.cloneRange();
  editorEl.focus({ preventScroll: true });
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  const frag = plainTextToFragment(value);
  const lastNode = frag.lastChild;
  range.deleteContents();
  range.insertNode(frag);
  placeEditorCursorAfter(lastNode);
  return true;
}


/* ---- focus issue: highlight excerpt in editor ---- */
function buildEditorTextIndex() {
  const chunks = [];
  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
  let text = '', node;
  while ((node = walker.nextNode())) {
    const start = text.length;
    text += node.nodeValue;
    chunks.push({ node, start, end: text.length });
    const par = node.parentElement;
    if (par && /^(P|DIV|LI|H[1-6])$/.test(par.tagName)) text += '\n';
  }
  return { text, chunks };
}

function offsetToPoint(index, offset) {
  const direct = index.chunks.find(c => offset >= c.start && offset <= c.end);
  if (direct) return { node: direct.node, offset: Math.max(0, Math.min(direct.node.nodeValue.length, offset - direct.start)) };
  const next = index.chunks.find(c => c.start > offset);
  if (next) return { node: next.node, offset: 0 };
  const last = index.chunks[index.chunks.length - 1];
  return last ? { node: last.node, offset: last.node.nodeValue.length } : null;
}

let mfActiveIssueId = null;

/* Finds an issue in the editor DOM text by counting how many identical excerpts precede it, so repeated words
   ("i", "the") resolve to the right occurrence even when whitespace differs from the analysed text. */
function mfAssistLocate(issue, index) {
  const ex = String(issue && issue.excerpt || '');
  const plain = mfLastAssist && mfLastAssist.sourceText;
  if (!ex || plain == null || issue.start == null) return null;
  let nth = 0, pos = -1;
  while ((pos = plain.indexOf(ex, pos + 1)) !== -1 && pos < issue.start) nth++;
  let p = -1;
  for (let k = 0; k <= nth; k++) { p = index.text.indexOf(ex, p + 1); if (p < 0) return null; }
  return { start: p, end: p + ex.length };
}

function mfReplaceEditorRange(start, end, replacement) {
  const index = buildEditorTextIndex();
  const s = offsetToPoint(index, start), e = offsetToPoint(index, end);
  if (!s || !e) return false;
  const range = document.createRange();
  range.setStart(s.node, s.offset);
  range.setEnd(e.node, e.offset);
  range.deleteContents();
  const node = document.createTextNode(replacement);
  range.insertNode(node);
  editorEl.normalize();
  return true;
}

function focusPingIssue(issueId) {
  if (!mfLastAssist) return;
  const issue = mfLastAssist.issues.find(i => i.id === issueId);
  if (!issue || issue.start == null || issue.end == null) return;
  mfActiveIssueId = issueId;

  // re-render cards to show active state
  renderPingAssistCards(mfLastAssist);

  // build text index and select range in editor
  const index = buildEditorTextIndex();
  const loc = mfAssistLocate(issue, index);
  let start = loc ? loc.start : index.text.indexOf(issue.excerpt, Math.max(0, issue.start - 20));
  if (start < 0) start = issue.start;
  const end = start + String(issue.excerpt || '').length;
  const startPt = offsetToPoint(index, start);
  const endPt   = offsetToPoint(index, end);
  if (!startPt || !endPt) return;

  const range = document.createRange();
  range.setStart(startPt.node, startPt.offset);
  range.setEnd(endPt.node, endPt.offset);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  const target = startPt.node.parentElement || editorEl;
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  editorEl.focus({ preventScroll: true });
}

/* ---- inline underlines (CSS Custom Highlight API: no DOM changes inside the editor) ---- */
const MF_HL = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';
let mfHighlightMap = [];

function clearEditorHighlights() {
  mfHighlightMap = [];
  if (!MF_HL) return;
  ['grammar', 'clarity', 'tone'].forEach(c => CSS.highlights.delete('mf-' + c));
}

function renderEditorHighlights() {
  clearEditorHighlights();
  if (!MF_HL || !mfLastAssist || mfLastAssist.editorScope === 'selection') return;
  const index = buildEditorTextIndex();
  const buckets = { grammar: [], clarity: [], tone: [] };
  mfLastAssist.issues.forEach(issue => {
    if (mfAssistIsIssueIgnored(issue) || !buckets[issue.category]) return;
    const ex = String(issue.excerpt || '');
    if (!/\S/.test(ex) || ex.length > 60) return;
    const loc = mfAssistLocate(issue, index);
    if (!loc) return;
    const s = offsetToPoint(index, loc.start), e = offsetToPoint(index, loc.end);
    if (!s || !e) return;
    const range = document.createRange();
    try { range.setStart(s.node, s.offset); range.setEnd(e.node, e.offset); } catch (_) { return; }
    buckets[issue.category].push(range);
    mfHighlightMap.push({ issue, range });
  });
  Object.keys(buckets).forEach(c => { if (buckets[c].length) CSS.highlights.set('mf-' + c, new Highlight(...buckets[c])); });
}

/* small fix card next to an underlined word */
const mfIssueTip = document.createElement('div');
mfIssueTip.className = 'mf-issue-tip';
mfIssueTip.hidden = true;
mfIssueTip.setAttribute('role', 'dialog');
document.body.appendChild(mfIssueTip);
let mfTipIssueId = null;

function hideIssueTip() { mfIssueTip.hidden = true; mfTipIssueId = null; }

function showIssueTip(entry) {
  const issue = entry.issue;
  const hasR = issue.replacement != null && issue.replacement !== issue.excerpt;
  const rep = issue.replacement === '' ? 'Remove' : issue.replacement;
  mfTipIssueId = issue.id;
  mfIssueTip.dataset.cat = issue.category;
  mfIssueTip.innerHTML = `
    <div class="mf-tip-head"><span class="mf-assist-badge" data-cat="${issue.category}">${issue.category}</span><b>${escHtml(issue.label)}</b></div>
    <div class="mf-tip-msg">${escHtml(issue.message)}</div>
    ${hasR ? `<div class="mf-tip-fix"><s>${escHtml(issue.excerpt)}</s> → <strong>${escHtml(rep)}</strong></div>` : ''}
    <div class="mf-tip-actions">
      ${hasR ? '<button type="button" class="mf-assist-act-btn apply" data-tip="apply">' + (issue.replacement === '' ? 'Remove' : 'Fix') + '</button>' : ''}
      ${issue.learnable ? '<button type="button" class="mf-assist-act-btn" data-tip="learn">Add word</button>' : ''}
      <button type="button" class="mf-assist-act-btn" data-tip="ignore">Ignore</button>
      <button type="button" class="mf-assist-act-btn" data-tip="open">Details</button>
    </div>`;
  mfIssueTip.hidden = false;
  const r = entry.range.getBoundingClientRect();
  const w = mfIssueTip.offsetWidth, h = mfIssueTip.offsetHeight;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left));
  const below = r.bottom + 8 + h < window.innerHeight;
  mfIssueTip.style.left = left + 'px';
  mfIssueTip.style.top = (below ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + 'px';
}

editorEl.addEventListener('click', () => {
  const sel = window.getSelection();
  if (!sel.rangeCount || !sel.isCollapsed || !mfHighlightMap.length) { hideIssueTip(); return; }
  const hit = mfHighlightMap
    .filter(en => { try { return en.range.isPointInRange(sel.anchorNode, sel.anchorOffset); } catch (_) { return false; } })
    .sort((x, y) => String(x.issue.excerpt).length - String(y.issue.excerpt).length)[0];
  if (hit) showIssueTip(hit); else hideIssueTip();
});
editorEl.addEventListener('input', hideIssueTip);
editorEl.addEventListener('scroll', hideIssueTip, { passive: true });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideIssueTip(); });
document.addEventListener('mousedown', e => { if (!mfIssueTip.hidden && !mfIssueTip.contains(e.target) && !editorEl.contains(e.target)) hideIssueTip(); });
mfIssueTip.addEventListener('mousedown', e => e.preventDefault());
mfIssueTip.addEventListener('click', e => {
  const btn = e.target.closest('[data-tip]');
  const issue = mfLastAssist && mfLastAssist.issues.find(i => i.id === mfTipIssueId);
  if (!btn || !issue) return;
  const kind = btn.dataset.tip;
  hideIssueTip();
  if (kind === 'apply') mfAssistApplyIssueById(issue.id);
  else if (kind === 'learn') mfAssistLearnWord(issue.learnable);
  else if (kind === 'ignore') {
    mfAssistIgnore.add(mfAssistIssueKey(issue));
    renderPingAssistCards(mfLastAssist);
    renderPingAssistSummary(mfLastAssist);
    save();
  } else if (kind === 'open') {
    shell.dataset.rightPanel = 'assist';
    shell.dataset.right = 'open';
    syncRailControls();
    focusPingIssue(issue.id);
    const card = document.querySelector('.mf-assist-card[data-issue-id="' + issue.id + '"]');
    if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});

/* ---- apply using start/end offsets (more reliable than excerpt search) ---- */
function applyAssistByOffset(issue) {
  if (mfLastAssist?.editorScope === 'selection') {
    return applyAssistSelectionByOffset(issue);
  }
  const loc = mfAssistLocate(issue, buildEditorTextIndex());
  if (loc && mfReplaceEditorRange(loc.start, loc.end, issue.replacement)) {
    mfActiveIssueId = null;
    refreshAll();
    save();
    return true;
  }
  if (replaceEditorTextMatch(issue.excerpt, issue.replacement)) {
    mfActiveIssueId = null;
    refreshAll();
    save();
    return true;
  }
  const plain = getDraftPlain();
  let start = issue.start, end = issue.end;
  // verify offset region matches excerpt (text may have shifted)
  if (plain.slice(start, end) !== issue.excerpt) {
    // fallback: search by excerpt
    const idx = plain.indexOf(issue.excerpt);
    if (idx === -1) { toast('Excerpt not found - re-run check'); return false; }
    start = idx; end = idx + issue.excerpt.length;
  }
  const newPlain = plain.slice(0, start) + issue.replacement + plain.slice(end);
  editorEl.innerHTML = plainToEditorHtml(newPlain);
  mfActiveIssueId = null;
  refreshAll();
  save();
  return true;
}

function applyAssistSelectionByOffset(issue) {
  const plain = mfAssistSelectionText();
  let start = issue.start, end = issue.end;
  if (!plain || !editorRangeIsUsable(editorSavedRange)) {
    toast('Selection lost - select text again');
    return false;
  }
  if (plain.slice(start, end) !== issue.excerpt) {
    const idx = plain.indexOf(issue.excerpt);
    if (idx === -1) {
      toast('Selection changed - re-run check');
      return false;
    }
    start = idx; end = idx + issue.excerpt.length;
  }
  const next = plain.slice(0, start) + issue.replacement + plain.slice(end);
  if (!replaceSavedEditorSelectionWithPlainText(next)) {
    toast('Selection lost - select text again');
    return false;
  }
  mfActiveIssueId = null;
  mfAssistScope = 'draft';
  refreshAll();
  save();
  return true;
}

function mfAssistNormalizePlain(value) {
  return String(value || '')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .replace(/(^|[.!?]\s+|\n+)([a-z])/g, (_, lead, first) => lead + first.toUpperCase());
}

function mfAssistApplyIssueSetToPlain(plain, issues) {
  let next = String(plain || '');
  let floor = next.length + 1;
  const applied = [];
  let skipped = 0;
  const canShareBoundary = issue =>
    issue && issue.subtype === 'punctuation' &&
    issue.start < floor && issue.end === floor + 1;
  issues.slice().sort((a, b) => (b.start - a.start) || (b.end - a.end)).forEach(issue => {
    if ((issue.end > floor && !canShareBoundary(issue)) || next.slice(issue.start, issue.end) !== issue.excerpt) {
      skipped += 1;
      return;
    }
    next = next.slice(0, issue.start) + String(issue.replacement) + next.slice(issue.end);
    floor = issue.start;
    applied.push(issue);
  });
  return { text: mfAssistNormalizePlain(next), applied: applied.reverse(), skipped };
}

function mfAssistApplySafeIssues() {
  if (!mfLastAssist) return;
  const issues = mfAssistSafeIssues(mfLastAssist);
  if (!issues.length) { toast('No safe fixes available'); return; }
  const beforeHtml = editorEl.innerHTML;
  const isSelection = mfLastAssist.editorScope === 'selection';
  const beforePlain = isSelection ? mfAssistSelectionText() : getDraftPlain();
  if (isSelection && (!beforePlain || !editorRangeIsUsable(editorSavedRange))) {
    toast('Selection lost - select text again');
    return;
  }
  const result = mfAssistApplyIssueSetToPlain(beforePlain, issues);
  if (!result.applied.length || result.text === beforePlain.trim()) {
    toast(result.skipped ? 'Re-run Assist check' : 'No safe changes applied');
    return;
  }
  mfAssistApplyingFix = true;
  try {
    if (isSelection) {
      if (!replaceSavedEditorSelectionWithPlainText(result.text)) {
        toast('Selection lost - select text again');
        return;
      }
      mfAssistScope = 'draft';
    } else {
      editorEl.innerHTML = plainToEditorHtml(result.text);
    }
    mfActiveIssueId = null;
    refreshAll();
    save();
  } finally {
    mfAssistApplyingFix = false;
  }
  mfAssistSetUndoState({
    beforeHtml,
    afterHtml: editorEl.innerHTML,
    issueCount: result.applied.length,
    label: 'safe Assist fixes',
    appliedAt: Date.now()
  });
  toast(`Applied ${result.applied.length} safe fix${result.applied.length === 1 ? '' : 'es'} - Undo available`);
}

function mfAssistUseRewrite(rewrite) {
  const text = String(rewrite?.text || '').trim();
  if (!text) {
    toast('Rewrite preview empty');
    return;
  }
  const beforeHtml = editorEl.innerHTML;
  const isSelection = mfLastAssist?.editorScope === 'selection';
  if (isSelection) {
    if (!replaceSavedEditorSelectionWithPlainText(text)) {
      toast('Selection lost - select text again');
      return;
    }
    mfAssistScope = 'draft';
  } else {
    editorEl.innerHTML = plainToEditorHtml(text);
  }
  mfActiveIssueId = null;
  refreshAll();
  save();
  mfAssistSetUndoState({
    beforeHtml,
    afterHtml: editorEl.innerHTML,
    rewriteId: rewrite.id,
    issueCount: rewrite.changes || 0,
    label: `${rewrite.title || 'Assist'} rewrite`,
    appliedAt: Date.now()
  });
  toast('Rewrite inserted - Undo available');
}

/* ---- summary detail rows ---- */


/* ---- protected spans list ---- */
function renderPingAssistSpans(result) {
  const el   = document.getElementById('mfAssistSpansList');
  const lbl  = document.getElementById('mfAssistSpansLabel');
  if (!el) return;
  const spans = result?.protectedSpans || [];
  if (lbl) lbl.textContent = `Protected tokens${spans.length ? ' · ' + spans.length : ''}`;
  if (!spans.length) {
    el.innerHTML = '<div class="mf-assist-empty" style="padding:8px 0">No protected tokens detected.</div>';
    return;
  }
  el.innerHTML = spans.map(s =>
    `<div class="mf-assist-span-row">
      <span class="mf-assist-span-type">${escHtml(s.type)}</span>
      <span class="mf-assist-span-text">${escHtml(s.text)}</span>
    </div>`
  ).join('');
}

/* ---- rule controls ---- */
function renderPingAssistRules() {
  const el = document.getElementById('mfAssistRuleList');
  if (!el || typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const eng = window.MirrorFlowAssistEngine;
  el.innerHTML = eng.rules.map(rule => {
    const disabled = eng.isRuleDisabled(rule.id);
    const catLabel = { grammar:'Grammar', clarity:'Clarity', tone:'Tone' }[rule.category] || rule.category;
    return `<div class="mf-assist-rule-card" data-disabled="${disabled}">
      <div class="mf-assist-rule-info">
        <div class="mf-assist-rule-label">${escHtml(rule.label)}</div>
        <div class="mf-assist-rule-meta">${catLabel} · ${rule.severity} · ${Math.round((rule.confidence || 0) * 100)}%</div>
      </div>
      <button class="mf-assist-rule-switch" type="button"
        data-rule-toggle="${escAttr(rule.id)}"
        aria-pressed="${!disabled}"
        title="${disabled ? 'Enable' : 'Disable'} rule"></button>
    </div>`;
  }).join('');
}

function renderPingAssistProfilePresets() {
  const el = document.getElementById('mfAssistProfilePresets');
  const label = document.getElementById('mfAssistProfileLabel');
  if (!el || typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const eng = window.MirrorFlowAssistEngine;
  const presets = typeof eng.getProfilePresets === 'function' ? eng.getProfilePresets() : [];
  const profile = typeof eng.exportProfile === 'function' ? eng.exportProfile() : {};
  const activePresetId = profile.presetId || (!((profile.disabledRuleIds || []).length) ? 'balanced' : 'custom');
  if (label) label.textContent = profile.name ? `Profiles · ${profile.name}` : 'Profiles';
  if (!presets.length) {
    el.innerHTML = '<div class="mf-assist-empty" style="padding:8px 0">No profile presets available.</div>';
    return;
  }
  el.innerHTML = presets.map(preset => {
    const active = activePresetId === preset.id;
    return `<button class="mf-assist-profile-btn" type="button"
      data-profile-preset="${escAttr(preset.id)}"
      data-active="${active}"
      title="${escAttr(preset.note)}">
      <strong>${escHtml(preset.name)}</strong>
      <span>${escHtml(preset.activeRuleCount)} on · ${escHtml(preset.disabledRuleCount)} off</span>
    </button>`;
  }).join('');
}

function mfAssistSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function mfAssistBuildDiagnosticsPayload() {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return null;
  const eng = window.MirrorFlowAssistEngine;
  mfAssistLastTestReport = mfAssistLastTestReport || eng.runRuleTests();
  return {
    app: 'MirrorFlow Ping',
    exportedAt: new Date().toISOString(),
    contract: eng.contract,
    ruleProfile: eng.exportProfile(),
    testReport: mfAssistLastTestReport
  };
}

function renderPingAssistDiagnostics(report) {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const eng = window.MirrorFlowAssistEngine;
  const box = document.getElementById('mfAssistDiagnostics');
  if (!box) return;
  const r = report || mfAssistLastTestReport || eng.runRuleTests();
  mfAssistLastTestReport = r;
  const profile = eng.exportProfile();
  const validation = profile.validation || {};
  const disabledCount = Array.isArray(profile.disabledRuleIds) ? profile.disabledRuleIds.length : 0;
  const activeRuleCount = Array.isArray(profile.activeRuleIds) ? profile.activeRuleIds.length : Math.max(0, eng.rules.length - disabledCount);
  const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];
  const failures = (r.results || []).filter(result => !result.skipped && !result.passed);
  const profileState = profile.valid === false ? 'invalid' : (validation.status || 'valid');
  const uiState = failures.length ? 'fail' : profileState === 'warning' ? 'warn' : profileState === 'invalid' ? 'fail' : 'pass';

  mfAssistSetText('mfAssistDiagStatus', failures.length ? 'Rule tests failing' : profileState === 'warning' ? 'Profile warnings' : 'Rule tests passing');
  mfAssistSetText('mfAssistDiagPill', failures.length ? `${failures.length} fail` : uiState === 'warn' ? 'Warn' : 'Pass');
  mfAssistSetText('mfAssistDiagTests', `${r.passed || 0}/${r.active || 0}`);
  mfAssistSetText('mfAssistDiagRules', `${activeRuleCount}/${eng.rules.length}`);
  mfAssistSetText('mfAssistDiagDisabled', String(disabledCount));
  mfAssistSetText('mfAssistDiagProfile', profileState === 'warning' ? 'Warn' : profileState === 'invalid' ? 'Invalid' : 'Valid');

  const pill = document.getElementById('mfAssistDiagPill');
  if (pill) pill.dataset.state = uiState;

  const note = document.getElementById('mfAssistDiagNote');
  if (note) {
    const skipped = r.skipped || 0;
    if (failures.length) {
      note.textContent = `${failures.length} active test${failures.length === 1 ? '' : 's'} failing. ${skipped} skipped by disabled rules.`;
    } else if (warnings.length) {
      note.textContent = `${r.passed || 0} active tests passing. Profile has ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`;
    } else {
      note.textContent = `${r.passed || 0} active tests passing. ${skipped} skipped by disabled rules.`;
    }
  }

  const failBox = document.getElementById('mfAssistDiagFailures');
  if (failBox) {
    const rows = failures.length ? failures.slice(0, 4) : warnings.slice(0, 4).map((warning, idx) => ({
      id: `W-${idx + 1}`,
      ruleId: 'profile.warning',
      detail: warning
    }));
    failBox.dataset.show = rows.length ? 'true' : 'false';
    failBox.innerHTML = rows.map(row => {
      const detail = row.detail || `matched ${row.matched || 0}; expected ${row.expectedReplacement == null ? 'issue' : row.expectedReplacement}`;
      return `<div class="mf-assist-diag-failure">
        <strong>${escHtml(row.id)} · ${escHtml(row.ruleId)}</strong>
        <span>${escHtml(detail)}</span>
      </div>`;
    }).join('');
  }
}


function mfAssistRunTests() {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return;
  mfAssistLastTestReport = window.MirrorFlowAssistEngine.runRuleTests();
  renderPingAssistDiagnostics(mfAssistLastTestReport);
  toast(mfAssistLastTestReport.failed ? 'Rule tests failing' : 'Rule tests passing');
}

async function mfAssistCopyDiagnosticsReport() {
  const payload = mfAssistBuildDiagnosticsPayload();
  if (!payload || !navigator.clipboard?.writeText) { toast('Copy failed - clipboard blocked'); return; }
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast('Diagnostics copied');
  } catch (_) {
    toast('Copy failed - clipboard blocked');
  }
}

function mfAssistDownloadDiagnosticsReport() {
  const payload = mfAssistBuildDiagnosticsPayload();
  if (!payload) return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mirrorflow-ping-assist-diagnostics.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 300);
  toast('Diagnostics exported');
}

/* ---- analysis export ---- */
function mfAssistExportJson() {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const eng = window.MirrorFlowAssistEngine;
  const text = getDraftPlain();
  const analysis = mfLastAssist || eng.analyzeText(text, { surface: 'ping_assist', mode: 'writing_only' });
  const payload = {
    app: 'MirrorFlow Ping',
    exportedAt: new Date().toISOString(),
    contract: eng.contract,
    ruleProfile: eng.exportProfile(),
    text,
    analysis
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mirrorflow-assist-analysis.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 300);
  toast('Analysis exported');
}

function mfAssistExportProfile() {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const payload = {
    app: 'MirrorFlow Ping', exportedAt: new Date().toISOString(),
    contract: window.MirrorFlowAssistEngine.contract,
    ruleProfile: window.MirrorFlowAssistEngine.exportProfile()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mirrorflow-assist-rule-profile.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 300);
  toast('Profile exported');
}

function mfAssistImportProfile(file) {
  if (!file || typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '{}'));
      const v = window.MirrorFlowAssistEngine.importProfile(data);
      if (!v.valid) { toast('Invalid profile — ' + (v.errors[0] || 'unknown error')); return; }
      mfAssistLastTestReport = null;
      renderPingAssistRules();
      renderPingAssistProfilePresets();
      renderPingAssist();
      save();
      toast(v.status === 'warning' ? 'Profile loaded with warnings' : 'Rule profile loaded');
    } catch (_) { toast('Invalid profile JSON'); }
  };
  reader.readAsText(file);
}

function mfAssistResetProfile() {
  if (typeof window.MirrorFlowAssistEngine === 'undefined') return;
  window.MirrorFlowAssistEngine.resetProfile();
  mfAssistLastTestReport = null;
  renderPingAssistRules();
  renderPingAssistProfilePresets();
  renderPingAssist();
  save();
  toast('Profile reset to default');
}

function mfAssistApplyProfilePreset(id) {
  if (!id || typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const eng = window.MirrorFlowAssistEngine;
  if (typeof eng.applyProfilePreset !== 'function') return;
  const result = eng.applyProfilePreset(id);
  if (!result || !result.valid) {
    toast('Profile preset failed');
    return;
  }
  mfAssistLastTestReport = null;
  renderPingAssistRules();
  renderPingAssistProfilePresets();
  renderPingAssist();
  save();
  toast('Profile set: ' + (result.profile?.name || id));
}

/* ---- collapsible section toggle ---- */
document.querySelectorAll('[data-section-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sec = document.getElementById(btn.dataset.sectionToggle);
    if (!sec) return;
    const isOpen = sec.dataset.open === 'true';
    sec.dataset.open = isOpen ? 'false' : 'true';
  });
});

/* ---- rule toggle delegation ---- */
document.getElementById('mfAssistRuleList').addEventListener('click', e => {
  const btn = e.target.closest('[data-rule-toggle]');
  if (!btn || typeof window.MirrorFlowAssistEngine === 'undefined') return;
  const id = btn.dataset.ruleToggle;
  const eng = window.MirrorFlowAssistEngine;
  const wasDisabled = eng.isRuleDisabled(id);
  if (wasDisabled) eng.enableRule(id); else eng.disableRule(id);
  mfAssistLastTestReport = null;
  renderPingAssistRules();
  renderPingAssistProfilePresets();
  renderPingAssist();
  save();
  toast(wasDisabled ? 'Rule enabled' : 'Rule disabled');
});

document.getElementById('mfAssistProfilePresets')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-profile-preset]');
  if (!btn) return;
  mfAssistApplyProfilePreset(btn.dataset.profilePreset);
});

/* ---- action buttons ---- */
document.getElementById('mfAssistScopeToggle')?.addEventListener('click', () => {
  setAssistScope(mfAssistActiveScope() === 'selection' ? 'draft' : 'selection');
});
document.getElementById('mfAssistExportJson').addEventListener('click', mfAssistExportJson);
document.getElementById('mfAssistExportProfile').addEventListener('click', mfAssistExportProfile);
document.getElementById('mfAssistResetProfile').addEventListener('click', mfAssistResetProfile);
document.getElementById('mfAssistImportProfile').addEventListener('click', () =>
  document.getElementById('mfAssistProfileInput').click());
document.getElementById('mfAssistProfileInput').addEventListener('change', e => {
  mfAssistImportProfile(e.target.files && e.target.files[0]);
  e.target.value = '';
});

const mfAssistDiagnosticsToggle = document.getElementById('mfAssistDiagnosticsToggle');
if (mfAssistDiagnosticsToggle) {
  mfAssistDiagnosticsToggle.addEventListener('click', () => {
    const box = document.getElementById('mfAssistDiagnostics');
    if (!box) return;
    const nextOpen = box.dataset.open !== 'true';
    setAssistDiagnosticsOpen(nextOpen);
    save();
  });
}
document.getElementById('mfAssistRunTests')?.addEventListener('click', mfAssistRunTests);
document.getElementById('mfAssistCopyReport')?.addEventListener('click', mfAssistCopyDiagnosticsReport);
document.getElementById('mfAssistDownloadReport')?.addEventListener('click', mfAssistDownloadDiagnosticsReport);
document.getElementById('mfAssistApplySafe')?.addEventListener('click', mfAssistApplySafeIssues);
document.getElementById('mfAssistUndoApply')?.addEventListener('click', () => {
  if (!mfAssistLastApply) return;
  mfAssistRestoringUndo = true;
  editorEl.innerHTML = mfAssistLastApply.beforeHtml;
  mfAssistRestoringUndo = false;
  mfAssistSetUndoState(null);
  mfActiveIssueId = null;
  refreshAll();
  save();
  toast('Assist fix undone');
});

/* filter bar */
document.getElementById('mfAssistFilterBar').addEventListener('click', e => {
  const btn = e.target.closest('.mf-assist-filter-btn');
  if (!btn) return;
  mfAssistFilter = btn.dataset.filter || 'all';
  document.querySelectorAll('.mf-assist-filter-btn').forEach(b =>
    b.classList.toggle('is-active', b === btn));
  renderPingAssistCards(mfLastAssist);
});

async function mfAssistCopySuggestion(text) {
  const value = String(text || '').trim();
  if (!value) return;
  if (!navigator.clipboard?.writeText) {
    toast('Copy failed - clipboard blocked');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    toast('Suggestion copied');
  } catch (_) {
    toast('Copy failed - clipboard blocked');
  }
}

function mfAssistRewriteById(id) {
  return (mfLastAssist?.rewrites || []).find(item => item && item.id === id);
}

function mfAssistRewriteEditor(id) {
  return document.getElementById('mfAssistRewritePanel')
    ?.querySelector(`[data-rewrite-edit="${id}"]`) || null;
}

function mfAssistRewriteText(id) {
  const el = mfAssistRewriteEditor(id);
  return String((el?.innerText ?? el?.textContent) || '').trim();
}

function mfAssistSetRewriteEditedState(el) {
  if (!el) return;
  const rewrite = mfAssistRewriteById(el.dataset.rewriteEdit);
  const card = el.closest('.mf-assist-rewrite-card');
  if (!rewrite || !card) return;
  card.dataset.edited = String(String(el.innerText || el.textContent || '').trim() !== String(rewrite.text || '').trim());
}

document.getElementById('mfAssistRewritePanel')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const rewrite = mfAssistRewriteById(btn.dataset.rewriteId);
  if (!rewrite) return;
  const editedText = mfAssistRewriteText(rewrite.id);
  if (btn.dataset.action === 'copy-rewrite') {
    if (!editedText) { toast('Rewrite preview empty'); return; }
    mfAssistCopySuggestion(editedText);
  } else if (btn.dataset.action === 'use-rewrite') {
    mfAssistUseRewrite({ ...rewrite, text: editedText });
  } else if (btn.dataset.action === 'save-rewrite') {
    const note = saveSideNote(editedText, { focus: false });
    if (note) toast('Rewrite saved to notes');
    else toast('Rewrite preview empty');
  } else if (btn.dataset.action === 'reset-rewrite') {
    const el = mfAssistRewriteEditor(rewrite.id);
    if (el) {
      el.textContent = rewrite.text;
      mfAssistSetRewriteEditedState(el);
      toast('Preview reset');
    }
  }
});

document.getElementById('mfAssistRewritePanel')?.addEventListener('input', e => {
  const el = e.target.closest('[data-rewrite-edit]');
  mfAssistSetRewriteEditedState(el);
});

function mfAssistApplyIssueById(issueId) {
  const issue = mfLastAssist?.issues.find(i => i.id === issueId);
  if (!issue) return false;
  const beforeHtml = editorEl.innerHTML;
  let applied = false;
  mfAssistApplyingFix = true;
  try {
    applied = applyAssistByOffset(issue);
  } finally {
    mfAssistApplyingFix = false;
  }
  if (applied) {
    mfAssistSetUndoState({
      beforeHtml,
      afterHtml: editorEl.innerHTML,
      issueId: issue.id,
      ruleId: issue.ruleId,
      label: issue.label,
      appliedAt: Date.now()
    });
    mfActiveIssueId = null;
    toast('Fix applied - Undo available');
  }
  return applied;
}

function mfAssistLearnWord(word) {
  if (window.MirrorFlowSpell && window.MirrorFlowSpell.learn(word)) {
    toast('Added "' + word + '" to your dictionary');
    renderPingAssist();
    save();
  }
}

/* card actions + click-to-focus */
document.getElementById('mfAssistCardList').addEventListener('click', e => {
  const btn  = e.target.closest('[data-action]');
  const card = e.target.closest('.mf-assist-card[data-issue-id]');

  if (btn) {
    if (btn.dataset.action === 'apply') {
      mfAssistApplyIssueById(btn.dataset.issueId);
    } else if (btn.dataset.action === 'learn') {
      mfAssistLearnWord(btn.dataset.word);
    } else if (btn.dataset.action === 'ignore') {
      mfAssistIgnore.add(btn.dataset.ruleId + ':' + btn.dataset.excerpt);
      if (mfActiveIssueId === card?.dataset.issueId) mfActiveIssueId = null;
      renderPingAssistCards(mfLastAssist);
      renderPingAssistSummary(mfLastAssist);
      save();
    } else if (btn.dataset.action === 'ignore-rule') {
      const eng = window.MirrorFlowAssistEngine;
      if (!eng?.disableRule(btn.dataset.ruleId)) {
        toast('Rule not found');
        return;
      }
      mfAssistLastTestReport = null;
      mfActiveIssueId = null;
      renderPingAssistRules();
      renderPingAssist();
      save();
      toast('Rule disabled');
    } else if (btn.dataset.action === 'copy') {
      mfAssistCopySuggestion(btn.dataset.replacement || '');
    }
    return;
  }

  /* click anywhere on card (not a button) → focus in editor */
  if (card) focusPingIssue(card.dataset.issueId);
});

/* clear ignored */
document.getElementById('mfAssistClearIgnored').addEventListener('click', () => {
  mfAssistIgnore.clear();
  renderPingAssist();
  save();
  toast('Ignored issues restored');
});

/* ========== PERSISTENCE ========== */
const KEY = 'mf-ping-state';
const STATE_VERSION = 4;
const DEFAULT_LAYOUT_STATE = Object.freeze({
  insights: 'collapsed',
  right: 'open',
  rightPanel: 'assist'
});
const VALID_PANEL_STATES = new Set(['open', 'collapsed']);
const VALID_RIGHT_PANELS = new Set(['assist', 'customer', 'notes']);

function setAssistDiagnosticsOpen(open) {
  const box = document.getElementById('mfAssistDiagnostics');
  const toggle = document.getElementById('mfAssistDiagnosticsToggle');
  if (!box) return;
  const nextOpen = Boolean(open);
  box.dataset.open = nextOpen ? 'true' : 'false';
  if (toggle) toggle.setAttribute('aria-expanded', String(nextOpen));
}

function normalizePanelState(value, fallback) {
  return VALID_PANEL_STATES.has(value) ? value : fallback;
}

function normalizeRightPanel(value) {
  return VALID_RIGHT_PANELS.has(value) ? value : DEFAULT_LAYOUT_STATE.rightPanel;
}

function railWidthValue(value, min, max) {
  const n = parseInt(String(value || '').replace('px', ''), 10);
  if (!Number.isFinite(n)) return '';
  return Math.max(min, Math.min(max, n)) + 'px';
}
function getRailWidth(prop) {
  return shell.style.getPropertyValue(prop).trim();
}
function restoreRailWidth(prop, value, min, max) {
  const px = railWidthValue(value, min, max);
  if (px) shell.style.setProperty(prop, px);
  else shell.style.removeProperty(prop);
}

function normalizeCursorState(value) {
  const next = Object.assign({}, cursor);
  Object.keys(VARIANTS).forEach(theme => {
    const raw = value && Number.isFinite(value[theme]) ? value[theme] : next[theme];
    next[theme] = Math.max(0, Math.min(VARIANTS[theme].length - 1, Math.floor(raw || 0)));
  });
  return next;
}

function normalizeSavedState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw && typeof raw === 'object' ? raw : {};
  const theme = VARIANTS[source.theme] ? source.theme : html.dataset.theme;
  return Object.assign({}, source, {
    version: STATE_VERSION,
    theme,
    cursor: normalizeCursorState(source.cursor),
    insights: source.version >= 4 ? normalizePanelState(source.insights, DEFAULT_LAYOUT_STATE.insights) : DEFAULT_LAYOUT_STATE.insights,
    right: normalizePanelState(source.right !== undefined ? source.right : source.phone, DEFAULT_LAYOUT_STATE.right),
    rightPanel: normalizeRightPanel(source.rightPanel),
    insightsWidth: railWidthValue(source.insightsWidth, 180, 520),
    rightWidth: railWidthValue(source.rightWidth !== undefined ? source.rightWidth : source.phoneWidth, 220, 560),
    sideNotes: Array.isArray(source.sideNotes) ? normalizeSideNotes(source.sideNotes) : sideNotes,
    assistDiagnosticsOpen: source.assistDiagnosticsOpen === true,
    assistIgnore: Array.isArray(source.assistIgnore) ? source.assistIgnore : [],
    assistLearnedWords: Array.isArray(source.assistLearnedWords) ? source.assistLearnedWords : [],
    assistRuleProfile: source.assistRuleProfile && typeof source.assistRuleProfile === 'object' ? source.assistRuleProfile : null,
    assistDisabledRules: Array.isArray(source.assistDisabledRules) ? source.assistDisabledRules : []
  });
}

function resetPingLayout() {
  shell.dataset.insights = DEFAULT_LAYOUT_STATE.insights;
  shell.dataset.right = DEFAULT_LAYOUT_STATE.right;
  shell.dataset.rightPanel = DEFAULT_LAYOUT_STATE.rightPanel;
  shell.style.removeProperty('--mf-rail-insights-w');
  shell.style.removeProperty('--mf-rail-right-w');
  syncRailControls();
  renderPingInsights();
  renderPingAssist();
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      version: STATE_VERSION,
      theme: html.dataset.theme,
      cursor,
      insights: shell.dataset.insights,
      insightsWidth: getRailWidth('--mf-rail-insights-w'),
      right: shell.dataset.right,
      rightWidth: getRailWidth('--mf-rail-right-w'),
      rightPanel: shell.dataset.rightPanel,
      sideNotes,
      assistDiagnosticsOpen: document.getElementById('mfAssistDiagnostics')?.dataset.open === 'true',
      draft: editorEl.innerHTML,
      customer: customerEl.value,
      assistIgnore: Array.from(mfAssistIgnore),
      assistLearnedWords: window.MirrorFlowSpell ? window.MirrorFlowSpell.learnedWords() : [],
      assistRuleProfile: typeof window.MirrorFlowAssistEngine !== 'undefined'
        ? window.MirrorFlowAssistEngine.exportProfile() : null,
      assistDisabledRules: typeof window.MirrorFlowAssistEngine !== 'undefined'
        ? window.MirrorFlowAssistEngine.getDisabledRules() : []
    }));
  } catch (_) {}
}
function load() {
  try {
    const s = normalizeSavedState(JSON.parse(localStorage.getItem(KEY) || 'null'));
    if (!s) return null;
    if (s.theme && VARIANTS[s.theme]) html.dataset.theme = s.theme;
    if (s.cursor) Object.assign(cursor, s.cursor);
    shell.dataset.insights = s.insights;
    restoreRailWidth('--mf-rail-insights-w', s.insightsWidth, 180, 520);
    shell.dataset.right = s.right;
    restoreRailWidth('--mf-rail-right-w', s.rightWidth, 220, 560);
    shell.dataset.rightPanel = s.rightPanel;
    if (Array.isArray(s.assistIgnore)) mfAssistIgnore = new Set(s.assistIgnore);
    if (window.MirrorFlowSpell && Array.isArray(s.assistLearnedWords)) s.assistLearnedWords.forEach(w => window.MirrorFlowSpell.learn(w));
    if (typeof window.MirrorFlowAssistEngine !== 'undefined') {
      if (s.assistRuleProfile && typeof window.MirrorFlowAssistEngine.importProfile === 'function') {
        const v = window.MirrorFlowAssistEngine.importProfile(s.assistRuleProfile);
        if (!v.valid && Array.isArray(s.assistDisabledRules)) {
          s.assistDisabledRules.forEach(id => window.MirrorFlowAssistEngine.disableRule(id));
        }
      } else if (Array.isArray(s.assistDisabledRules)) {
        s.assistDisabledRules.forEach(id => window.MirrorFlowAssistEngine.disableRule(id));
      }
    }
    setAssistDiagnosticsOpen(s.assistDiagnosticsOpen);
    if (Array.isArray(s.sideNotes)) sideNotes = s.sideNotes;
    if (s.draft) editorEl.innerHTML = s.draft;
    if (s.customer) customerEl.value = s.customer;
    return s;
  } catch (_) {
    try { localStorage.removeItem(KEY); } catch (_) {}
    return null;
  }
}

/* ========== AUTO-SAVE STATE (surfaced via More menu) ========== */
let lastEdit = Date.now();
let savedAgo = 'saved just now';
function tickMeta() {
  const s = Math.floor((Date.now() - lastEdit) / 1000);
  if (s < 2)       savedAgo = 'saved just now';
  else if (s < 60) savedAgo = `auto-saved ${s}s ago`;
  else             savedAgo = `auto-saved ${Math.floor(s/60)}m ago`;
  // if More popover is open, refresh its first row in-place
  const tag = document.getElementById('moreSavedTag');
  if (tag) tag.textContent = savedAgo;
}
setInterval(tickMeta, 1000);

/* ========== TOAST ========== */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'mf-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    setTimeout(() => t.remove(), 320);
  }, 2200);
}

/* ========== INPUT WIRING ========== */
let mfInsightsDebounce = 0;
let mfSaveDebounce = 0;

function renderPingInsightsDebounced(delay = 180) {
  clearTimeout(mfInsightsDebounce);
  mfInsightsDebounce = setTimeout(renderPingInsights, delay);
}

function saveDebounced(delay = 220) {
  clearTimeout(mfSaveDebounce);
  mfSaveDebounce = setTimeout(save, delay);
}

function refreshAll(options = {}) {
  const immediate = options && options.immediate === true;
  syncEditorStatus();
  updateCounter();
  if (immediate) {
    clearTimeout(mfInsightsDebounce);
    renderPingInsights();
    renderPingAssist();
  } else {
    renderPingInsightsDebounced();
    renderPingAssistDebounced();
  }
}
editorEl.addEventListener('input', () => {
  lastEdit = Date.now();
  captureEditorSelection();
  if (!mfAssistApplyingFix && !mfAssistRestoringUndo) mfAssistSetUndoState(null);
  if (!getDraftPlain().trim()) mfAssistClearDraftState();
  refreshAll();
  saveDebounced();
});
customerEl.addEventListener('input', () => {
  syncCustomerState();
  renderPingInsightsDebounced();
  renderPingAssistDebounced();
  saveDebounced();
});

/* persist theme/variant changes too */
const _applyTheme = applyTheme;
applyTheme = function() { _applyTheme(); save(); };

/* persist rail state changes */
const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
let _prevPanels = { insights: shell.dataset.insights, right: shell.dataset.right };
const observer = new MutationObserver(() => {
  /* on small screens the panels are sheets: opening one closes the other */
  if (isMobile() && shell.dataset.insights === 'open' && shell.dataset.right === 'open') {
    if (_prevPanels.insights !== 'open') shell.dataset.right = 'collapsed';
    else shell.dataset.insights = 'collapsed';
  }
  _prevPanels = { insights: shell.dataset.insights, right: shell.dataset.right };
  syncRailControls();
  save();
});
observer.observe(shell, { attributes: true, attributeFilter: ['data-insights', 'data-right', 'data-right-panel'] });

/* ========== FOCUS MODE — ⌘. ========== */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === '.') {
    e.preventDefault();
    shell.dataset.focus = shell.dataset.focus === 'editor' ? '' : 'editor';
    toast(shell.dataset.focus === 'editor' ? `Focus mode — ${MOD_KEY}+. to exit` : 'Focus off');
  }
});

/* =========================================================
   shell features
   ========================================================= */

/* platform-aware modifier key for shortcut hints */
const MOD_KEY = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? 'Cmd' : 'Ctrl';

/* ---------- SNIPPET LIBRARY (compact, Lite-inspired) ---------- */
const SNIPPETS = {
  replies: {
    head: 'Replies — full templates',
    sections: [
      { title: 'Apology + fix', items: [
        'Hi {name} — that was on us. {fix} is locked in. Sorry for the runaround.',
        'Hi {name}, sorry for the hassle. We\'ve fixed {issue} and you\'re sorted.'
      ]},
      { title: 'Status update', items: [
        'Hi {name} — this is in motion. I\'ll update you by {time}.',
        'Hi {name}, quick update: {progress}. Next step: {next}.'
      ]},
      { title: 'Confirmation', items: [
        'Hi {name} — confirmed. {detail}. See you then.',
        'Hi {name}, all set: {detail}.'
      ]},
      { title: 'Closing', items: [
        'Anything else? Happy to help.',
        'That should do it — give a shout if anything shifts.'
      ]}
    ]
  },
  phrases: {
    head: 'Phrases — by intent',
    sections: [
      { title: 'Empathy',     items: ['I get the frustration.', 'That\'s not the experience we want.', 'Totally fair.', 'I hear you.'] },
      { title: 'Good news',   items: ['Good news — ', 'Sorted.', 'Locked in.', 'You\'re all set.'] },
      { title: 'Sorry',       items: ['That was on us.', 'Sorry for the hassle.', 'We dropped the ball — sorry.', 'My apologies.'] },
      { title: 'Reassurance', items: ['We\'ve got it from here.', 'You\'re sorted.', 'I\'ll see this through.', 'Nothing to worry about.'] },
      { title: 'Closing',     items: ['Anything else?', 'Talk soon.', 'Cheers,', 'Hope this helps.'] }
    ]
  },
};

/* ---------- POPOVER ENGINE ---------- */
const popoverEl = document.getElementById('popover');
let popoverOpen = false;

function closePopover() {
  popoverEl.classList.remove('is-open');
  popoverEl.setAttribute('aria-hidden', 'true');
  popoverOpen = false;
}

function openPopoverAt(anchor, html, alignRight = false) {
  popoverEl.innerHTML = html;
  popoverEl.classList.add('is-open');
  popoverEl.setAttribute('aria-hidden', 'false');
  popoverOpen = true;
  // position
  const r = anchor.getBoundingClientRect();
  const pw = popoverEl.offsetWidth;
  const ph = popoverEl.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = alignRight ? r.right - pw : r.left;
  let top  = r.bottom + 6;
  if (left + pw > vw - 8) left = vw - pw - 8;
  if (left < 8) left = 8;
  if (top + ph > vh - 8) top = r.top - ph - 6;
  popoverEl.style.left = left + 'px';
  popoverEl.style.top  = top  + 'px';
}

document.addEventListener('click', (e) => {
  if (popoverOpen && !popoverEl.contains(e.target) &&
      !e.target.closest('[data-snippet]') &&
      !e.target.closest('#newSessionBtn')) closePopover();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popoverOpen) closePopover();
});

/* ---------- SNIPPET INSERTION ---------- */
function placeEditorCursorAfter(node) {
  if (!node) return;
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  editorSavedRange = range.cloneRange();
  editorSavedSelectionText = '';
}

function placeEditorCursorAtEnd() {
  editorEl.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(editorEl);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  editorSavedRange = range.cloneRange();
  editorSavedSelectionText = '';
}

function plainTextToFragment(value) {
  const frag = document.createDocumentFragment();
  String(value || '').split('\n').forEach((line, index) => {
    if (index) frag.appendChild(document.createElement('br'));
    frag.appendChild(document.createTextNode(line));
  });
  return frag;
}

function insertAtCursor(text) {
  const value = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!value) return false;

  const sel = window.getSelection();
  let range = null;

  if (sel && sel.rangeCount && editorOwnsNode(sel.anchorNode) && editorOwnsNode(sel.focusNode)) {
    range = sel.getRangeAt(0);
  } else if (editorRangeIsUsable(editorSavedRange)) {
    editorEl.focus({ preventScroll: true });
    sel.removeAllRanges();
    sel.addRange(editorSavedRange);
    range = editorSavedRange;
  } else {
    editorEl.focus({ preventScroll: true });
  }

  if (!getDraftPlain()) {
    editorEl.innerHTML = plainToEditorHtml(value);
    placeEditorCursorAtEnd();
  } else if (range && editorRangeIsUsable(range)) {
    const frag = plainTextToFragment(value);
    const lastNode = frag.lastChild;
    range.deleteContents();
    range.insertNode(frag);
    placeEditorCursorAfter(lastNode);
  } else {
    editorEl.insertAdjacentHTML('beforeend', plainToEditorHtml(value));
    placeEditorCursorAtEnd();
  }

  lastEdit = Date.now();
  mfAssistSetUndoState(null);
  refreshAll();
  save();
  return true;
}

/* tone shifts removed with the Tone tab */

/* ---------- SNIPPET POPOVER RENDER ---------- */
function snippetHTML(kind) {
  const lib = SNIPPETS[kind];
  let html = `<div class="mf-pop-head">${lib.head}</div>`;
  lib.sections.forEach(sec => {
    html += `<div class="mf-pop-section"><div class="mf-pop-section-title">${sec.title}</div><div class="mf-chipwrap">`;
    sec.items.forEach(item => {
      if (typeof item === 'string') {
        const isTemplate = kind === 'replies';
        html += `<button class="mf-chip${isTemplate ? ' is-template' : ''}" data-text="${escapeAttr(item)}">${escapeHTML(item)}</button>`;
      } else {
        html += `<button class="mf-chip" data-tone="${item.act}">${item.label}</button>`;
      }
    });
    html += `</div></div>`;
  });
  return html;
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHTML(s); }

document.querySelectorAll('[data-snippet]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const kind = btn.dataset.snippet;
    if (popoverOpen && popoverEl.dataset.kind === kind) { closePopover(); return; }
    openPopoverAt(btn, snippetHTML(kind));
    popoverEl.dataset.kind = kind;
  });
});

popoverEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.mf-chip');
  if (!chip) return;
  if (chip.dataset.text) {
    // strip {name} placeholder since no thread/customer concept anymore
    insertAtCursor(chip.dataset.text.replace(/\{name\}/g, '').replace(/\s{2,}/g, ' ').replace(/^\s*[—–-]\s*/, ''));
    closePopover();
    return;
  }
});

/* (insight cards + tone detail removed — placeholder until rebuild) */

/* =========================================================
   shell features
   ========================================================= */

/* ---------- TOOLBAR EXEC ---------- */
function exec(cmd, arg) {
  editorEl.focus();
  try { document.execCommand(cmd, false, arg || null); } catch (_) {}
  lastEdit = Date.now();
  mfAssistSetUndoState(null);
  refreshAll();
  syncToolbarState();
  saveDebounced();
}

function syncToolbarState() {
  let currentBlock = '';
  try { currentBlock = String(document.queryCommandValue('formatBlock') || '').replace(/[<>]/g, '').toLowerCase(); } catch (_) {}
  document.querySelectorAll('.mf-tb-btn[data-cmd]').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList'].includes(cmd)) {
      try { btn.classList.toggle('is-active', document.queryCommandState(cmd)); } catch (_) {}
    } else if (cmd === 'formatBlock') {
      const expected = String(btn.dataset.arg || '').toLowerCase();
      btn.classList.toggle('is-active', Boolean(expected && currentBlock === expected));
    }
  });
}

document.querySelectorAll('.mf-tb-btn[data-cmd]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const cmd = btn.dataset.cmd;
    let arg  = btn.dataset.arg || null;
    if (cmd === 'createLink') {
      const url = prompt('Link URL:', 'https://');
      if (!url) return;
      arg = url;
    }
    exec(cmd, arg);
  });
});

function insertSoftBreak() {
  editorEl.focus();
  try {
    document.execCommand('insertLineBreak');
  } catch (_) {
    try { document.execCommand('insertHTML', false, '<br>'); } catch (_) {}
  }
  lastEdit = Date.now();
  mfAssistSetUndoState(null);
  refreshAll();
  syncToolbarState();
  saveDebounced();
}

editorEl.addEventListener('keyup', syncToolbarState);
editorEl.addEventListener('mouseup', syncToolbarState);

/* keyboard: Cmd+B / I / U / K */
editorEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    insertSoftBreak();
    return;
  }
  if (!(e.metaKey || e.ctrlKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'b') { e.preventDefault(); exec('bold'); }
  else if (k === 'i') { e.preventDefault(); exec('italic'); }
  else if (k === 'u') { e.preventDefault(); exec('underline'); }
  else if (k === 'k') {
    e.preventDefault();
    const url = prompt('Link URL:', 'https://');
    if (url) exec('createLink', url);
  }
});

/* ---------- TOOLBAR ACTIONS (clean / clear / copy / paste / more) ---------- */
document.querySelectorAll('.mf-tb-btn[data-action="more"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMore(btn);
  });
});

function cleanFormatting() {
  editorEl.focus();
  const sel = window.getSelection();
  if (sel.rangeCount && !sel.isCollapsed) {
    document.execCommand('removeFormat');
  } else {
    // strip whole document
    const text = editorEl.innerText;
    editorEl.innerHTML = text.split(/\n+/).map(p => `<p>${escapeHTML(p)}</p>`).join('');
  }
  lastEdit = Date.now();
  mfAssistSetUndoState(null);
  refreshAll(); save();
  toast('Formatting cleaned');
}


async function copyDraft() {
  const text = getDraftPlain();
  if (!text) { toast('Nothing to copy'); return; }
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
  } catch {
    toast('Copy failed — clipboard blocked');
  }
}

async function pasteDraft() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) { toast('Clipboard empty'); return; }
    insertAtCursor(text);
    mfAssistSetUndoState(null);
    toast('Pasted');
  } catch {
    toast('Paste failed — try Cmd+V');
  }
}

function openMore(anchor) {
  if (popoverOpen && popoverEl.dataset.kind === 'more') { closePopover(); return; }
  const html = `
    <div class="mf-pop-head">More actions</div>
    <div class="mf-more-status">
      <span class="mf-more-dot"></span>
      <span>Agent draft · <span id="moreSavedTag">${savedAgo}</span></span>
    </div>
    <div class="mf-chipwrap" style="flex-direction:column;">
      <button class="mf-chip" data-more="export">Copy as plain text</button>
      <button class="mf-chip" data-more="paste">Paste from clipboard</button>
      <button class="mf-chip" data-more="clean">Clear formatting</button>
      <button class="mf-chip" data-more="linebreak">Insert line break</button>
      <button class="mf-chip" data-more="reset">Clear draft</button>
      <button class="mf-chip" data-more="layout">Reset panels and layout</button>
      <button class="mf-chip" data-more="coach-export">Export Coach packet</button>
      <button class="mf-chip" data-more="help">Keyboard shortcuts</button>
    </div>`;
  openPopoverAt(anchor, html);
  popoverEl.dataset.kind = 'more';
}

popoverEl.addEventListener('click', (e) => {
  const m = e.target.closest('[data-more]');
  if (!m) return;
  const a = m.dataset.more;
  closePopover();
  if (a === 'reset') {
    editorEl.innerHTML = '<p><br></p>';
    lastEdit = Date.now(); mfAssistClearDraftState(); refreshAll(); save();
    toast('Draft reset');
  } else if (a === 'layout') {
    resetPingLayout();
    save();
    toast('Panels reset');
  } else if (a === 'export') {
    copyDraft();
  } else if (a === 'paste') {
    pasteDraft();
  } else if (a === 'clean') {
    cleanFormatting();
  } else if (a === 'coach-export') {
    mfExportTheGuideExchangePacket();
  } else if (a === 'linebreak') {
    insertSoftBreak();
  } else if (a === 'help') {
    showHelp();
  }
});

function showHelp() {
  alert(
    'Keyboard shortcuts\n' +
    `— ${MOD_KEY}+Enter   Copy reply\n` +
    `— ${MOD_KEY}+B/I/U   Bold / Italic / Underline\n` +
    `— ${MOD_KEY}+K       Insert link\n` +
    `— ${MOD_KEY}+.       Toggle focus mode\n` +
    '— Shift+Enter (in draft)          New line\n' +
    '— Esc                             Close popover'
  );
}

/* ---------- COPY REPLY — the reply is pasted into the helpdesk; nothing is sent from here ---------- */
async function copyReply() {
  const text = getDraftPlain().trim();
  if (!text) { toast('Nothing to copy yet'); return; }
  const btn = document.querySelector('.mf-tb-btn.primary');
  btn.style.transform = 'scale(0.96)';
  setTimeout(() => btn.style.transform = '', 140);
  try {
    if (window.ClipboardItem && navigator.clipboard.write) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([editorEl.innerHTML], { type: 'text/html' })
      })]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    toast('Reply copied - paste it into your helpdesk');
  } catch (_) {
    toast('Copy failed - select the text and copy manually');
  }
}
document.querySelector('.mf-tb-btn.primary').addEventListener('click', copyReply);
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); copyReply(); }
});

/* ---------- NEW SESSION — wipe everything ---------- */
function newSession() {
  if (!confirm('Start a new reply? This clears the draft and the customer message.')) return;
  editorEl.innerHTML = '<p><br></p>';
  customerEl.value = '';
  mfAssistClearDraftState();
  lastEdit = Date.now();
  syncCustomerState();
  refreshAll();
  toast('Cleared - ready for the next reply');
  save();
}
document.getElementById('newSessionBtn').addEventListener('click', newSession);

/* ---------- CUSTOMER MESSAGE PANEL (optional) ---------- */
function syncCustomerState() {
  const has = Boolean(customerEl.value.trim());
  const state = document.getElementById('customerState');
  if (state) {
    state.dataset.on = String(has);
    state.textContent = has
      ? 'In use: the review also checks that your reply answers this.'
      : 'Not used: the reply is checked on its own.';
  }
  const tab = document.getElementById('tabCustomer');
  if (tab) tab.dataset.has = String(has);
}
document.getElementById('customerPasteBtn').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) { toast('Clipboard empty'); return; }
    customerEl.value = text;
    customerEl.dispatchEvent(new Event('input'));
  } catch (_) {
    toast('Paste failed - use Ctrl+V in the box');
  }
});
document.getElementById('customerClearBtn').addEventListener('click', () => {
  customerEl.value = '';
  customerEl.dispatchEvent(new Event('input'));
});

/* ========== INIT ========== */
const _loaded = load();
if (!_loaded && isMobile()) shell.dataset.right = 'collapsed';
applyTheme();            // sync: sets CSS vars on bubbles immediately
syncRailControls();
renderSideNotes();
refreshAll();
renderPingAssistRules();
renderPingAssistProfilePresets();
renderPingAssistDiagnostics();
tickMeta();
syncCustomerState();
requestAnimationFrame(() => {
  // Re-apply theme after browser's first layout/style pass — guarantees CSS
  // custom-property gradients on marble swatches resolve against inline values,
  // not the class-level defaults that were active before the first paint cycle.
  applyTheme();
  renderPingInsights();
});
