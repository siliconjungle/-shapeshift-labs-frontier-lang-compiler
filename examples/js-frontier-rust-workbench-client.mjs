export function workbenchClientScript() {
  return `
const initial = JSON.parse(document.getElementById('initial-state').textContent);
const state = {
  sources: { typescript: initial.sources?.typescript || '' },
  sourceLanguage: 'typescript',
  result: initial.result,
  activeTab: 'graph',
  pending: false
};

window.frontierLangWorkbench = {
  kind: 'frontier.framework.demo.langWorkbench',
  version: 2,
  state,
  feature: {
    id: 'frontier-lang-ts-rust-python-workbench',
    package: '@shapeshift-labs/frontier-lang-compiler',
    route: '/examples/js-frontier-rust-workbench',
    panels: ['typescript', 'frontier', 'rust', 'python'],
    conversions: ['typescript->rust', 'typescript->python']
  },
  evidence: []
};

const typescriptInput = document.getElementById('typescriptInput');
const rustOutput = document.getElementById('rustOutput');
const pythonOutput = document.getElementById('pythonOutput');
const frontierJson = document.getElementById('frontierJson');
const graphView = document.getElementById('graphView');
const readinessValue = document.getElementById('readinessValue');
const symbolValue = document.getElementById('symbolValue');
const mappingValue = document.getElementById('mappingValue');
const rustValue = document.getElementById('rustValue');
const pythonValue = document.getElementById('pythonValue');
const typescriptStatus = document.getElementById('typescriptStatus');
const rustStatus = document.getElementById('rustStatus');
const pythonStatus = document.getElementById('pythonStatus');

typescriptInput.value = state.sources.typescript;
render();

typescriptInput.addEventListener('input', () => {
  state.sources.typescript = typescriptInput.value;
});

document.getElementById('convertForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  await convertFromTypescript();
});

document.getElementById('resetButton').addEventListener('click', () => {
  state.sources = { typescript: initial.sources?.typescript || '' };
  state.sourceLanguage = 'typescript';
  state.result = initial.result;
  render();
});

document.getElementById('copyButton').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(projectedSourceText());
  } catch (error) {
    window.frontierLangWorkbench.evidence.push({
      at: Date.now(),
      kind: 'clipboard',
      status: 'failed',
      message: String(error.message || error)
    });
  }
});

for (const button of document.querySelectorAll('[data-frontier-tab]')) {
  button.addEventListener('click', () => {
    state.activeTab = button.dataset.frontierTab;
    for (const peer of document.querySelectorAll('[data-frontier-tab]')) {
      peer.setAttribute('aria-pressed', String(peer === button));
    }
    render();
  });
}

async function convertFromTypescript() {
  state.sourceLanguage = 'typescript';
  state.sources.typescript = typescriptInput.value;
  setPending(true);
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: state.sources.typescript, sourceLanguage: 'typescript' })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'conversion failed');
    state.result = payload.result;
    const projections = projectionSet(payload.result);
    window.frontierLangWorkbench.evidence.push({
      at: Date.now(),
      kind: 'conversion',
      sourceHash: payload.result.sourceHash,
      symbolCount: payload.result.summary.symbols,
      readiness: payload.result.summary.readiness,
      projections: Object.keys(projections),
      semanticMergeReadiness: payload.result.routeExplanation?.semanticMerge?.readiness,
      missingEvidence: payload.result.routeExplanation?.semanticMerge?.missingEvidence ?? [],
      routeExplanation: (payload.result.routeExplanation?.routes ?? []).map((route) => ({
        target: route.target,
        mode: route.mode,
        routeAction: route.routeAction,
        readiness: route.readiness,
        admissionAction: route.semanticMerge?.admissionAction,
        missingEvidence: route.missingEvidence
      }))
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
  const projections = projectionSet(result);
  readinessValue.textContent = summary.readiness || 'error';
  readinessValue.style.color = readinessColor(summary.readiness);
  symbolValue.textContent = String(summary.symbols ?? 0);
  mappingValue.textContent = String(summary.sourceMapMappings ?? 0);
  rustValue.textContent = projectionStatus(projections.rust);
  pythonValue.textContent = projectionStatus(projections.python);
  typescriptStatus.textContent = result.sourceHash || 'source';
  rustStatus.textContent = projectionSummaryText(projections.rust);
  pythonStatus.textContent = projectionSummaryText(projections.python);
  typescriptInput.value = state.sources.typescript || '';
  rustOutput.value = projections.rust?.output || '';
  pythonOutput.value = projections.python?.output || '';
  document.querySelector('[data-view-panel="source"]').classList.add('isSource');
  frontierJson.textContent = JSON.stringify(result.frontier || {}, null, 2);
  frontierJson.hidden = state.activeTab !== 'json';
  graphView.hidden = state.activeTab !== 'graph';
  if (!graphView.hidden) graphView.innerHTML = graphHtml(result);
}

function projectionSet(result) {
  if (result.projections) return result.projections;
  const projections = {};
  if (result.projection) {
    projections[result.projection.targetLanguage || result.projection.target || 'rust'] = result.projection;
  }
  return projections;
}

function projectionStatus(projection) {
  if (!projection) return 'missing';
  return projection.ok ? projection.readiness || 'ready' : 'blocked';
}

function projectionSummaryText(projection) {
  if (!projection) return 'missing';
  return (projection.mode || '-') + ' / ' + String(projection.sourceMapMappings ?? 0) + ' maps';
}

function graphHtml(result) {
  const summary = result.summary || {};
  const frontier = result.frontier || {};
  const routeExplanation = result.routeExplanation || {};
  const semanticMerge = routeExplanation.semanticMerge || {};
  const symbols = frontier.symbols || [];
  const relations = frontier.relations || [];
  const missingEvidence = semanticMerge.missingEvidence || [];
  return [
    '<div class="chipRow">',
    chip(summary.readiness, readinessClass(summary.readiness)),
    chip('merge ' + (semanticMerge.readiness || 'unknown'), readinessClass(semanticMerge.readiness)),
    chip(String(missingEvidence.length) + ' missing evidence', missingEvidence.length ? 'review' : 'ready'),
    chip(String(summary.losses || 0) + ' losses', 'review'),
    chip(String(summary.patchHints || 0) + ' patch hints', 'ready'),
    chip(projectionTargets(result), 'review'),
    '</div>',
    routeExplanationHtml(routeExplanation),
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

function projectionTargets(result) {
  const targets = Object.keys(projectionSet(result));
  return (result.sourceLanguage || '-') + ' -> ' + (targets.length ? targets.join('/') : '-');
}

function routeExplanationHtml(explanation) {
  const routes = explanation.routes || [];
  if (!routes.length) return '';
  const semanticMerge = explanation.semanticMerge || {};
  return [
    '<div class="sectionTitle">Route Explanation</div>',
    '<section class="routeSummary">',
    '<strong>' + escapeHtml('Semantic merge: ' + (semanticMerge.readiness || 'unknown')) + '</strong>',
    '<span>' + escapeHtml((semanticMerge.admissionAction || 'prioritize') + ' / score ' + String(semanticMerge.score ?? 0)) + '</span>',
    '</section>',
    '<div class="routeGrid">',
    ...routes.map((route) => routeCard(route)),
    '</div>'
  ].join('');
}

function routeCard(route) {
  const semanticMerge = route.semanticMerge || {};
  const missing = route.missingEvidenceDetails || [];
  return '<article class="routeCard">' +
    '<div class="routeCardHeader">' +
    '<strong>' + escapeHtml((route.sourceLanguage || '-') + ' -> ' + (route.target || '-')) + '</strong>' +
    chip(semanticMerge.readiness || route.readiness, readinessClass(semanticMerge.readiness || route.readiness)) +
    '</div>' +
    '<p>' + escapeHtml(route.explanation || '') + '</p>' +
    '<dl class="routeFacts">' +
    factHtml('Mode', route.mode) +
    factHtml('Action', route.routeAction) +
    factHtml('Adapter', route.adapter || 'none') +
    factHtml('Admission', semanticMerge.admissionAction || 'prioritize') +
    '</dl>' +
    '<div class="missingEvidenceList">' +
    missing.map((gap) => '<span title="' + escapeHtml(gap.summary) + '">' + escapeHtml(gap.label) + '</span>').join('') +
    '</div>' +
    '</article>';
}

function factHtml(label, value) {
  return '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value || '-') + '</dd></div>';
}

function nodeCard(symbol) {
  return '<article class="nodeCard" data-graph-node="' + escapeHtml(symbol.id || symbol.name) + '">' +
    '<strong>' + escapeHtml(symbol.name) + '</strong>' +
    '<span>' + escapeHtml(symbol.kind || 'symbol') + ' - ' + escapeHtml(symbol.region || 'region') + '</span>' +
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
    projections: {
      rust: { output: String(error.stack || error), readiness: 'blocked', mode: 'error', ok: false },
      python: { output: String(error.stack || error), readiness: 'blocked', mode: 'error', ok: false }
    }
  };
}

function projectedSourceText() {
  const projections = projectionSet(state.result || {});
  return [
    '// Rust projection',
    projections.rust?.output || '',
    '',
    '# Python projection',
    projections.python?.output || ''
  ].join('\\n');
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
