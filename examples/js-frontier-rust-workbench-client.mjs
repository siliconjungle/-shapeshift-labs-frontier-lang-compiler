export function workbenchClientScript() {
  return `
const initial = JSON.parse(document.getElementById('initial-state').textContent);
const state = {
  sources: { ...initial.sources },
  sourceLanguage: initial.sourceLanguage || 'typescript',
  result: initial.result,
  activeTab: 'graph',
  pending: false
};

window.frontierLangWorkbench = {
  kind: 'frontier.framework.demo.langWorkbench',
  version: 1,
  state,
  feature: {
    id: 'frontier-lang-ts-rust-workbench',
    package: '@shapeshift-labs/frontier-lang-compiler',
    route: '/examples/js-frontier-rust-workbench',
    panels: ['source', 'frontier', 'rust']
  },
  evidence: []
};

const typescriptInput = document.getElementById('typescriptInput');
const rustInput = document.getElementById('rustInput');
const frontierJson = document.getElementById('frontierJson');
const graphView = document.getElementById('graphView');
const readinessValue = document.getElementById('readinessValue');
const symbolValue = document.getElementById('symbolValue');
const mappingValue = document.getElementById('mappingValue');
const modeValue = document.getElementById('modeValue');
const typescriptStatus = document.getElementById('typescriptStatus');
const rustStatus = document.getElementById('rustStatus');

let updatingEditors = false;
typescriptInput.value = state.sources.typescript;
rustInput.value = state.sources.rust;
render();

typescriptInput.addEventListener('input', () => {
  if (updatingEditors) return;
  state.sources.typescript = typescriptInput.value;
  state.sourceLanguage = 'typescript';
  renderEditorModes();
});

rustInput.addEventListener('input', () => {
  if (updatingEditors) return;
  state.sources.rust = rustInput.value;
  state.sourceLanguage = 'rust';
  renderEditorModes();
});

document.getElementById('runButton').addEventListener('click', async () => {
  await convertFrom(state.sourceLanguage);
});

document.getElementById('resetButton').addEventListener('click', async () => {
  state.sources = { ...initial.sources };
  state.sourceLanguage = 'typescript';
  state.result = initial.result;
  render();
});

document.getElementById('copyButton').addEventListener('click', async () => {
  await navigator.clipboard.writeText(projectedSourceText());
});

for (const button of document.querySelectorAll('[data-source-mode]')) {
  button.addEventListener('click', () => {
    state.sourceLanguage = button.dataset.sourceMode;
    renderEditorModes();
  });
}

for (const button of document.querySelectorAll('[data-frontier-tab]')) {
  button.addEventListener('click', () => {
    state.activeTab = button.dataset.frontierTab;
    for (const peer of document.querySelectorAll('[data-frontier-tab]')) {
      peer.setAttribute('aria-pressed', String(peer === button));
    }
    render();
  });
}

async function convertFrom(sourceLanguage) {
  state.sourceLanguage = sourceLanguage;
  state.sources[sourceLanguage] = sourceLanguage === 'rust' ? rustInput.value : typescriptInput.value;
  setPending(true);
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: state.sources[sourceLanguage], sourceLanguage })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'conversion failed');
    state.result = payload.result;
    state.sources[payload.result.projection.targetLanguage] = payload.result.projection.output;
    window.frontierLangWorkbench.evidence.push({
      at: Date.now(),
      kind: 'conversion',
      sourceHash: payload.result.sourceHash,
      symbolCount: payload.result.summary.symbols,
      readiness: payload.result.summary.readiness
    });
  } catch (error) {
    state.result = errorResult(error);
  } finally {
    setPending(false);
    render();
  }
}

function render() {
  const result = state.result || {};
  const summary = result.summary || {};
  readinessValue.textContent = summary.readiness || 'error';
  readinessValue.style.color = readinessColor(summary.readiness);
  symbolValue.textContent = String(summary.symbols ?? 0);
  mappingValue.textContent = String(summary.sourceMapMappings ?? 0);
  modeValue.textContent = result.projection?.mode || '-';
  typescriptStatus.textContent = languageStatus('typescript', result);
  rustStatus.textContent = languageStatus('rust', result);
  renderEditorModes();
  frontierJson.textContent = JSON.stringify(result.frontier, null, 2);
  frontierJson.hidden = state.activeTab !== 'json';
  graphView.hidden = state.activeTab !== 'graph';
  if (!graphView.hidden) graphView.innerHTML = graphHtml(result);
}

function renderEditorModes() {
  updatingEditors = true;
  typescriptInput.value = state.sources.typescript || '';
  rustInput.value = state.sources.rust || '';
  updatingEditors = false;
  document.querySelector('[data-view-panel="source"]').classList.toggle('isSource', state.sourceLanguage === 'typescript');
  document.querySelector('[data-view-panel="rust"]').classList.toggle('isSource', state.sourceLanguage === 'rust');
  for (const button of document.querySelectorAll('[data-source-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.sourceMode === state.sourceLanguage));
  }
}

function languageStatus(language, result) {
  if (state.sourceLanguage === language) return result.sourceHash || 'source';
  return (result.projection?.targetLanguage === language ? result.projection.readiness : 'projection') || 'projection';
}

function graphHtml(result) {
  const summary = result.summary || {};
  const frontier = result.frontier || {};
  const symbols = frontier.symbols || [];
  const relations = frontier.relations || [];
  return [
    '<div class="chipRow">',
    chip(summary.readiness, readinessClass(summary.readiness)),
    chip(String(summary.losses || 0) + ' losses', 'review'),
    chip(String(summary.patchHints || 0) + ' patch hints', 'ready'),
    chip((result.sourceLanguage || '-') + ' -> ' + (result.projection?.targetLanguage || '-'), 'review'),
    '</div>',
    '<div class="sectionTitle">Symbols</div>',
    '<div class="graphGrid">',
    ...symbols.map((symbol) => nodeCard(symbol)),
    '</div>',
    '<div class="sectionTitle">Relations</div>',
    '<ul class="edgeList">',
    ...relations.slice(0, 18).map((edge) => '<li>' + escapeHtml(edge.label) + '</li>'),
    relations.length > 18 ? '<li>' + (relations.length - 18) + ' more</li>' : '',
    '</ul>',
    boundsHtml(result.bounds || {})
  ].join('');
}

function nodeCard(symbol) {
  return '<article class="nodeCard" data-graph-node="' + escapeHtml(symbol.id || symbol.name) + '">' +
    '<strong>' + escapeHtml(symbol.name) + '</strong>' +
    '<span>' + escapeHtml(symbol.kind || 'symbol') + ' · ' + escapeHtml(symbol.region || 'region') + '</span>' +
    '</article>';
}

function chip(text, className) {
  return '<span class="chip ' + className + '">' + escapeHtml(text || '-') + '</span>';
}

function readinessClass(readiness) {
  if (readiness === 'ready' || readiness === 'ready-with-losses') return 'ready';
  if (readiness === 'blocked') return 'blocked';
  return 'review';
}

function readinessColor(readiness) {
  if (readiness === 'ready' || readiness === 'ready-with-losses') return 'var(--green)';
  if (readiness === 'blocked') return 'var(--red)';
  return 'var(--amber)';
}

function errorResult(error) {
  return {
    summary: { readiness: 'blocked', symbols: 0, sourceMapMappings: 0, losses: 1, patchHints: 0 },
    frontier: { symbols: [], relations: [], error: String(error.message || error) },
    projection: { output: String(error.stack || error), readiness: 'blocked', mode: 'error' }
  };
}

function projectedSourceText() {
  const target = state.result?.projection?.targetLanguage;
  return target ? state.sources[target] || '' : '';
}

function boundsHtml(bounds) {
  return [
    '<div class="sectionTitle">Bounds</div>',
    '<div class="boundsGrid">',
    boundCard('Supported now', bounds.supportedNow || []),
    boundCard('Review required', bounds.reviewRequired || []),
    boundCard('Unsupported today', bounds.unsupportedToday || []),
    '</div>'
  ].join('');
}

function boundCard(title, rows) {
  return '<section class="boundCard"><strong>' + escapeHtml(title) + '</strong><ul>' +
    rows.map((row) => '<li>' + escapeHtml(row) + '</li>').join('') +
    '</ul></section>';
}

function setPending(pending) {
  state.pending = pending;
  document.body.toggleAttribute('data-pending', pending);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}
`;
}
