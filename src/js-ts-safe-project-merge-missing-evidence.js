import { HtmlCssProjectMergeMissingSignals, htmlCssProjectMergeAdmissionMatrixRows, htmlCssProjectMergeMatrixProofStatus, htmlCssProjectMergeMissingEvidenceItems, htmlCssProjectMergeMissingEvidenceRoutes } from './js-ts-safe-project-merge-html-css-matrix.js';
import { sourceTextMergeMatrixProofStatus, sourceTextMergeMissingEvidenceItem } from './js-ts-safe-project-merge-source-text-candidate.js';
const ProjectMergeMissingSignals = Object.freeze({
  sourceTextMergeCandidate: 'source-text-merge-candidate-not-produced',
  outputDiagnosticsGate: 'output-diagnostics-gate-not-run',
  declarationGate: 'declaration-gate-not-run',
  qualityGates: 'quality-gates-not-run',
  focusedTestGate: 'focused-test-gate-not-run',
  projectGraphEvidence: 'project-graph-evidence-not-included',
  projectGraphDeltaEvidence: 'project-graph-delta-evidence-not-included',
  sourceSpanRoundtrip: 'source-span-roundtrip-evidence-not-produced',
  semanticArtifacts: 'semantic-artifacts-not-produced',
  semanticEditReplayProof: 'semantic-edit-replay-proof-not-produced',
  semanticEditReplayOutputMismatch: 'semantic-edit-replay-proof-output-mismatch',
  unsupportedJsTsSurface: 'unsupported-js-ts-surface-proof-not-available',
  ...HtmlCssProjectMergeMissingSignals,
  cssModuleUseSiteGraph: 'css-module-use-site-graph-proof-blocked',
  semanticEquivalenceProof: 'semantic-equivalence-proof-not-available'
});

const ProjectMergeMissingEvidenceRoutes = Object.freeze({
  [ProjectMergeMissingSignals.sourceTextMergeCandidate]: route('produce-source-text-merge-candidate', 'source-files', 'run-conservative-three-way-source-merge'),
  [ProjectMergeMissingSignals.outputDiagnosticsGate]: route('run-output-diagnostics', 'project-output', 'supply-output-diagnostics'),
  [ProjectMergeMissingSignals.declarationGate]: route('emit-output-declarations', 'project-output', 'supply-declaration-output'),
  [ProjectMergeMissingSignals.qualityGates]: route('attach-quality-gates', 'quality-gates', 'attach-passing-quality-gates'),
  [ProjectMergeMissingSignals.focusedTestGate]: route('attach-focused-test-gate', 'quality-gates', 'attach-focused-test-gate'),
  [ProjectMergeMissingSignals.projectGraphEvidence]: route('include-project-graph-delta', 'project-graph', 'include-project-graph-delta'),
  [ProjectMergeMissingSignals.projectGraphDeltaEvidence]: route('include-project-graph-delta', 'project-graph', 'include-project-graph-delta'),
  [ProjectMergeMissingSignals.sourceSpanRoundtrip]: route('produce-source-span-roundtrip-evidence', 'source-files', 'supply-source-span-roundtrip-evidence'),
  [ProjectMergeMissingSignals.semanticArtifacts]: route('produce-semantic-artifacts', 'source-files', 'produce-semantic-edit-artifacts'),
  [ProjectMergeMissingSignals.semanticEditReplayProof]: route('produce-semantic-edit-replay-proof', 'source-files', 'run-semantic-edit-replay-diagnostics'),
  [ProjectMergeMissingSignals.semanticEditReplayOutputMismatch]: route('reject-semantic-edit-replay-output-mismatch', 'source-files', 'inspect-semantic-edit-replay-output-binding'),
  [ProjectMergeMissingSignals.unsupportedJsTsSurface]: route('prove-unsupported-js-ts-surface', 'semantic-proof', 'supply-unsupported-surface-evidence'),
  ...htmlCssProjectMergeMissingEvidenceRoutes(route, ProjectMergeMissingSignals),
  [ProjectMergeMissingSignals.cssModuleUseSiteGraph]: route('prove-css-module-use-site-graph', 'layout-style-graph', 'supply-css-module-transform-and-use-site-proof'),
  [ProjectMergeMissingSignals.semanticEquivalenceProof]: route('external-semantic-equivalence-proof', 'semantic-proof', 'attach-external-equivalence-proof')
});

const ProjectMergeAdmissionMatrixRows = Object.freeze([
  matrixRow('source-text-merge-candidate', 'baseline', ['source-text-merge-candidate'], [ProjectMergeMissingSignals.sourceTextMergeCandidate]),
  matrixRow('parser-source-span-trivia', 'partial', ['source-span-roundtrip'], [ProjectMergeMissingSignals.sourceSpanRoundtrip, ProjectMergeMissingSignals.semanticArtifacts]),
  matrixRow('scope-use-def-graph', 'partial', ['project-graph-delta'], [ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence]),
  matrixRow('module-export-import-graph', 'partial', ['project-graph-delta'], [ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence]),
  matrixRow('type-public-api-graph', 'partial', ['declaration-output-stable', 'project-graph-delta'], [ProjectMergeMissingSignals.declarationGate, ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence]),
  matrixRow('jsx-tsx-element-prop-graph', 'partial', ['project-graph-delta', 'focused-test-passed'], [ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence, ProjectMergeMissingSignals.qualityGates, ProjectMergeMissingSignals.focusedTestGate]),
  matrixRow('control-flow-effect-graph', 'partial', ['source-span-roundtrip', 'focused-test-passed'], [ProjectMergeMissingSignals.sourceSpanRoundtrip, ProjectMergeMissingSignals.semanticArtifacts, ProjectMergeMissingSignals.qualityGates, ProjectMergeMissingSignals.focusedTestGate]),
  matrixRow('generic-semantic-edit-admission', 'partial', ['source-span-roundtrip', 'semantic-edit-replay-clean'], [ProjectMergeMissingSignals.sourceSpanRoundtrip, ProjectMergeMissingSignals.semanticArtifacts, ProjectMergeMissingSignals.semanticEditReplayProof, ProjectMergeMissingSignals.semanticEditReplayOutputMismatch]),
  matrixRow('unsupported-js-ts-surface-coverage', 'partial', ['unsupported-js-ts-surface-review'], [ProjectMergeMissingSignals.unsupportedJsTsSurface]),
  ...htmlCssProjectMergeAdmissionMatrixRows(matrixRow, ProjectMergeMissingSignals),
  matrixRow('css-modules-use-site-graph', 'partial', ['css-module-use-site-graph', 'css-module-transform-proof', 'project-graph-evidence'], [ProjectMergeMissingSignals.cssModuleUseSiteGraph]),
  matrixRow('semantic-equivalence-proof', 'bounded-evidence', ['semantic-equivalence-external', 'semantic-equivalence-unknown'], [ProjectMergeMissingSignals.semanticEquivalenceProof]),
  matrixRow('cross-file-symbol-rename', 'partial', ['diagnostics-clean', 'declaration-output-stable', 'project-graph-delta'], [ProjectMergeMissingSignals.outputDiagnosticsGate, ProjectMergeMissingSignals.declarationGate, ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence]),
  matrixRow('symbol-move-between-files', 'partial', ['diagnostics-clean', 'declaration-output-stable', 'project-graph-delta'], [ProjectMergeMissingSignals.outputDiagnosticsGate, ProjectMergeMissingSignals.declarationGate, ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence]),
  matrixRow('split-merge-modules-classes', 'partial', ['diagnostics-clean', 'declaration-output-stable', 'project-graph-delta'], [ProjectMergeMissingSignals.outputDiagnosticsGate, ProjectMergeMissingSignals.declarationGate, ProjectMergeMissingSignals.projectGraphEvidence, ProjectMergeMissingSignals.projectGraphDeltaEvidence]),
  matrixRow('real-repo-benchmark-suite', 'partial', ['manifest-metadata-validated', 'local-checkout-metadata-proof', 'dependency-install-not-run-default', 'repository-commands-not-run-default'], [ProjectMergeMissingSignals.qualityGates, ProjectMergeMissingSignals.focusedTestGate]),
  matrixRow('telemetry-confidence-routing', 'partial', ['semantic-equivalence-external', 'semantic-equivalence-unknown'], [ProjectMergeMissingSignals.semanticEquivalenceProof])
]);

function missingEvidenceItems(summary, context = {}) {
  const items = [];
  const sourceTextMissing = sourceTextMergeMissingEvidenceItem(summary, ProjectMergeMissingSignals.sourceTextMergeCandidate, missingEvidenceItem);
  if (sourceTextMissing) items.push(sourceTextMissing);
  if (!context.hasProjectGraphEvidence) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.projectGraphEvidence,
    scope: 'project-graph',
    kind: 'project-graph-delta',
    proofLevel: 'project-graph-evidence',
    action: 'review',
    relatedSignals: [ProjectMergeMissingSignals.projectGraphDeltaEvidence],
    summary: 'Include project graph delta evidence before applying broad project merges so public contract, source span, compiler type, runtime region, scope/use-def, JSX prop, re-export, import-attribute, and import-target gaps are checked.',
    suggestedInput: { includeProjectGraphDelta: true }
  }));
  else if (!summary.projectGraphDeltaEvidenceIncluded) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.projectGraphDeltaEvidence,
    scope: 'project-graph',
    kind: 'project-graph-delta',
    proofLevel: 'project-graph-delta',
    action: 'review',
    summary: 'Output project graph evidence was available, but graph-delta evidence was not included for broad semantic gap checks across base, worker, head, and output.',
    suggestedInput: { includeProjectGraphDelta: true }
  }));
  if (!context.outputDiagnosticsGate) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.outputDiagnosticsGate,
    scope: 'project-output',
    kind: 'diagnostics',
    proofLevel: 'diagnostics-clean',
    action: 'review',
    summary: 'Run or supply output diagnostics so syntax/type diagnostic conflicts can block unsafe project output.',
    suggestedInput: { requireOutputDiagnostics: true, outputDiagnostics: [] }
  }));
  if (!context.outputDeclarationGate) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.declarationGate,
    scope: 'project-output',
    kind: 'declaration-output',
    proofLevel: 'declaration-output-stable',
    action: 'review',
    summary: 'Run or supply declaration output evidence so public declaration drift is checked before apply.',
    suggestedInput: { includeDeclarationOutput: true }
  }));
  if (!context.outputQualityGate) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.qualityGates,
    scope: 'quality-gates',
    kind: 'quality-gate',
    proofLevel: 'focused-test-passed',
    action: 'review',
    relatedSignals: [ProjectMergeMissingSignals.focusedTestGate],
    summary: 'Attach focused lint, build, or test gate evidence before treating the project merge as evidence-complete.',
    suggestedInput: { testGates: [{ id: 'focused', status: 'passed', command: 'node test/smoke/<focused>.mjs' }] }
  }));
  else if (!Number(context.outputQualityGate.summary?.test ?? 0)) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.focusedTestGate,
    scope: 'quality-gates',
    kind: 'quality-gate',
    proofLevel: 'focused-test-passed',
    action: 'review',
    summary: 'Quality gate evidence was supplied without a focused test gate; attach at least one passing focused test for the changed project behavior.',
    suggestedInput: { testGates: [{ id: 'focused', status: 'passed', command: 'node test/smoke/<focused>.mjs' }] }
  }));
  if (!summary.semanticArtifactFiles) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.semanticArtifacts,
    scope: 'source-files',
    kind: 'semantic-artifacts',
    proofLevel: 'parser-roundtrip',
    action: 'review',
    summary: 'No semantic edit artifacts were produced for source files, so parser/projection/replay evidence cannot support automatic apply.'
  }));
  if (summary.semanticArtifactFiles && summary.proofSemanticEditReplayCleanStatus !== 'passed') items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.semanticEditReplayProof,
    scope: 'source-files',
    kind: 'semantic-edit-replay',
    proofLevel: 'semantic-edit-replay-clean',
    action: 'review',
    summary: 'Semantic edit artifacts were produced, but clean replay proof was not available for every semantic edit candidate.'
  }));
  if (summary.semanticEquivalenceLevel === 'semantic-equivalence-unknown') items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.semanticEquivalenceProof,
    scope: 'project',
    kind: 'semantic-equivalence',
    proofLevel: 'semantic-equivalence-unknown',
    action: 'review',
    summary: 'Executable semantic equivalence is still unknown; keep semanticEquivalenceClaim false and require human or external proof for equivalence claims.'
  }));
  if (summary.projectGraphCssModuleUseSiteConflicts) items.push(missingEvidenceItem({
    code: ProjectMergeMissingSignals.cssModuleUseSiteGraph, scope: 'layout-style-graph', kind: 'css-module-use-site-proof', proofLevel: 'css-module-use-site-graph', action: 'review',
    summary: `CSS Module use-site graph has ${summary.projectGraphCssModuleUseSiteConflicts} blocker(s); supply generated class maps, bundler transform identity, source-map proof, and narrow use-site evidence before admission.`,
    suggestedInput: { includeOutputProjectSymbolGraph: true, cssModuleEvidence: true }
  }));
  items.push(...htmlCssProjectMergeMissingEvidenceItems(summary, ProjectMergeMissingSignals, missingEvidenceItem));
  return items;
}

function missingEvidenceSignals(items = []) {
  return uniqueStrings(items.flatMap((item) => [item.code, ...(item.relatedSignals ?? [])]));
}

function confidenceRecommendedAction(status, failedEvidence, missingEvidence, options = {}) {
  if (status !== 'merged' || failedEvidence > 0) {
    return shouldRecommendRerun(missingEvidence, options) ? 'rerun' : 'block';
  }
  return missingEvidence.length ? 'review' : 'apply';
}

function compactMissingEvidenceTelemetry(items = []) {
  return {
    total: items.length,
    byScope: countField(items, 'scope'),
    byKind: countField(items, 'kind'),
    byStatus: countField(items, 'status'),
    byAction: countField(items, 'action'),
    byRoute: countRoute(items),
    byLane: countRoute(items, 'lane')
  };
}

function createProjectMergeAdmissionMatrixAudit(summary = {}, missingEvidence = [], proofEvidence = undefined) {
  const surfaces = ProjectMergeAdmissionMatrixRows.map((row) => matrixAuditSurface(row, summary, missingEvidence, proofEvidence));
  const missingRouteItems = surfaces.flatMap((surface) => (surface.missingRouteIds ?? []).map((routeId) => ({ routeId })));
  const semanticEquivalenceLevel = summary.semanticEquivalenceLevel ?? proofEvidence?.summary?.semanticEquivalenceLevel ?? 'semantic-equivalence-unknown';
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectMergeAdmissionMatrixAudit',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeAdmissionMatrixAudit.v1',
    total: surfaces.length,
    partialRows: surfaces.filter((surface) => surface.status === 'partial').length,
    missingRows: surfaces.filter((surface) => (surface.missingSignals ?? []).length).length,
    semanticEquivalenceLevel,
    semanticEquivalenceUnknown: semanticEquivalenceLevel === 'semantic-equivalence-unknown',
    autoMergeClaim: false,
    semanticEquivalenceClaim: semanticEquivalenceLevel !== 'semantic-equivalence-unknown',
    routeIds: uniqueStrings(surfaces.flatMap((surface) => surface.routeIds ?? [])),
    missingRouteIds: uniqueStrings(surfaces.flatMap((surface) => surface.missingRouteIds ?? [])),
    byRoute: countRoute(missingRouteItems),
    surfaces
  });
}

function prioritizedMissingEvidence(proofEvidenceMissing = [], policyMissing = []) {
  const combined = uniqueMissingEvidence([...proofEvidenceMissing, ...policyMissing]);
  return [
    ...combined.filter((item) => !isSemanticEquivalenceMissing(item)),
    ...combined.filter(isSemanticEquivalenceMissing)
  ];
}

function missingEvidenceRouteForSignal(signal) {
  return ProjectMergeMissingEvidenceRoutes[signal];
}

function missingEvidenceItem(input) {
  const route = input.route ?? missingEvidenceRouteForSignal(input.code);
  return compactRecord({
    code: input.code,
    kind: input.kind,
    scope: input.scope,
    status: 'missing',
    action: input.action ?? 'review',
    proofLevel: input.proofLevel,
    route,
    routeId: route?.id,
    routeLane: route?.lane,
    routeNext: route?.next,
    relatedSignals: input.relatedSignals,
    summary: input.summary,
    suggestedInput: input.suggestedInput,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function matrixAuditSurface(row, summary, missingEvidence, proofEvidence) {
  const routeIds = matrixRouteIds(row.signals);
  const activeMissing = missingEvidence.filter((item) => matrixRowMatchesMissingEvidence(row, routeIds, item));
  const missingRouteIds = uniqueStrings(activeMissing.flatMap((item) => [item.routeId, item.route?.id]));
  return compactRecord({
    surface: row.surface,
    status: row.status,
    proofLevels: row.proofLevels,
    proofStatuses: matrixProofStatuses(row.proofLevels, summary, proofEvidence),
    routeIds,
    missingSignals: missingEvidenceSignals(activeMissing),
    missingRouteIds,
    nextMissingRouteId: missingRouteIds[0],
    semanticEquivalenceClaim: row.surface === 'semantic-equivalence-proof' && summary.semanticEquivalenceClaim === true
  });
}

function matrixRowMatchesMissingEvidence(row, routeIds, item) {
  return row.signals.includes(item?.code)
    || (item?.relatedSignals ?? []).some((signal) => row.signals.includes(signal))
    || row.proofLevels.includes(item?.proofLevel)
    || routeIds.includes(item?.routeId ?? item?.route?.id);
}

function matrixProofStatuses(proofLevels, summary, proofEvidence) {
  return Object.fromEntries(proofLevels.map((level) => [level, matrixProofStatus(level, summary, proofEvidence)]));
}

function matrixProofStatus(level, summary, proofEvidence) {
  const levelStatuses = proofEvidence?.summary?.levelStatuses ?? summary.proofEvidenceLevelStatuses ?? {};
  if (levelStatuses[level]) return levelStatuses[level];
  const htmlCssStatus = htmlCssProjectMergeMatrixProofStatus(level, summary);
  if (htmlCssStatus) return htmlCssStatus;
  const sourceTextStatus = sourceTextMergeMatrixProofStatus(level, summary);
  if (sourceTextStatus) return sourceTextStatus;
  if (level === 'project-graph-delta') return summary.projectGraphDeltaEvidenceIncluded ? (summary.projectGraphDeltaConflicts ? 'failed' : 'passed') : 'missing';
  if (level === 'project-graph-evidence') return summary.projectGraphConflicts ? 'failed' : summary.projectGraphEvidenceIncluded || summary.projectGraphDeltaEvidenceIncluded ? 'passed' : 'missing';
  if (level === 'css-module-use-site-graph') return summary.projectGraphCssModuleUseSiteConflicts ? 'failed' : summary.projectGraphCssModuleUseSiteGraphs ? 'passed' : summary.projectGraphEvidenceIncluded ? 'absent' : 'missing';
  if (level === 'css-module-transform-proof') return summary.projectGraphCssModuleUseSiteConflicts ? 'failed' : summary.projectGraphCssModuleImportBindings ? 'passed' : summary.projectGraphEvidenceIncluded ? 'absent' : 'missing';
  if (level === 'semantic-artifacts') return summary.semanticArtifactFiles ? 'present' : 'missing';
  return 'absent';
}

function matrixRouteIds(signals) {
  return uniqueStrings(signals.map((signal) => missingEvidenceRouteForSignal(signal)?.id));
}

function matrixRow(surface, status, proofLevels, signals) {
  return Object.freeze({ surface, status, proofLevels, signals });
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function uniqueMissingEvidence(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.code ?? item?.proofLevel ?? item?.summary;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countField(items, field) {
  const counts = {};
  for (const item of items) if (item?.[field]) counts[item[field]] = (counts[item[field]] ?? 0) + 1;
  return counts;
}

function countRoute(items, field = 'id') {
  const counts = {};
  for (const item of items) countRouteItem(counts, item, field);
  return counts;
}
function countRouteItem(counts, item, field) { const key = field === 'lane' ? item?.routeLane ?? item?.route?.lane : item?.routeId ?? item?.route?.id; if (key) counts[key] = (counts[key] ?? 0) + 1; }

function route(id, lane, next) { return Object.freeze({ id, lane, next }); }
function shouldRecommendRerun(missingEvidence = [], options = {}) {
  const rerunReasonCodes = new Set((options.rerunReasonCodes ?? []).filter(Boolean));
  if (!rerunReasonCodes.size) return false;
  const reasonCodes = (options.reasonCodes ?? []).filter(Boolean);
  if (reasonCodes.length) return reasonCodes.every((code) => rerunReasonCodes.has(code));
  return missingEvidence[0]?.action === 'rerun-gate' && missingEvidence[0]?.kind === 'quality-gate';
}
function isSemanticEquivalenceMissing(item) { return item?.proofLevel === 'semantic-equivalence-unknown' || item?.code === ProjectMergeMissingSignals.semanticEquivalenceProof; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { compactMissingEvidenceTelemetry, confidenceRecommendedAction, createProjectMergeAdmissionMatrixAudit, missingEvidenceItems, missingEvidenceRouteForSignal, missingEvidenceSignals, prioritizedMissingEvidence };
