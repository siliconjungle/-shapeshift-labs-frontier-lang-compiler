import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}

function selectorProof({ id, graphHash, base, worker, head, fromSelectors, toSelectors, specificity, specificityProof = false }) {
  return {
    id,
    kind: 'css-source-bound-selector-target-proof',
    status: 'passed',
    sourcePath: 'src/button.css',
    reasonCode: 'css-selector-target-rebase-unproved',
    moveSide: 'worker',
    rebasedSide: 'head',
    fromSelectors,
    toSelectors,
    fromSpecificity: specificity,
    toSpecificity: specificity,
    selectorTargetGraphHash: graphHash,
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    ...(specificityProof ? {
      parserBackedSelectorSpecificity: true,
      selectorsLevel4Specificity: true,
      specificityExact: true,
      specificityAlgorithm: 'selectors-level-4'
    } : {})
  };
}

function scopedProof({ id, sourcePath, graphHash, base, worker, head, output, scope, scopes, shapeKey, cascadeKeys, properties, sides, selectors = ['.button'] }) {
  return {
    id,
    kind: 'css-source-bound-scoped-cascade-proof',
    status: 'passed',
    sourcePath,
    reasonCode: 'css-scoped-cascade-equivalence-unproved',
    sides,
    selectors,
    scopes: scopes ?? [scope],
    cascadeKeys,
    properties,
    scopedCascadeGraphHash: graphHash,
    ...(shapeKey ? { scopedCascadeGraphShapeKey: shapeKey, scopedCascadeGraphHashesByShapeKey: { [shapeKey]: graphHash } } : {}),
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    outputSourceHash: hashSemanticValue(output)
  };
}

function runtimeEvidence(reasonCode, boundary, label) {
  const command = `node test/html-runtime/${label}.mjs`;
  const probeId = `html:${reasonCode}:${boundary}`;
  const evidenceHash = `html-runtime-evidence:${reasonCode}:${boundary}:${label}`;
  const signals = runtimeSignals(reasonCode, boundary);
  return {
    runtimeCommand: command,
    runtimeProbeId: probeId,
    runtimeEvidenceHash: evidenceHash,
    runtimeSignals: signals,
    runtimeProofCapsule: runtimeProofCapsule({ command, probeId, evidenceHash, signals, label })
  };
}

function runtimeProofCapsule({ command, probeId, evidenceHash, signals, label }) {
  return {
    mode: 'isolated-fixture',
    status: 'passed',
    command,
    probeId,
    evidenceHash,
    signals,
    telemetry: {
      hash: `telemetry:${label}`,
      domSnapshotHash: `dom:${label}`,
      computedStyleHash: `style:${label}`,
      layoutSnapshotHash: `layout:${label}`,
      eventTraceHash: `events:${label}`,
      accessibilitySnapshotHash: `accessibility:${label}`,
      focusSnapshotHash: `focus:${label}`,
      layoutShiftHash: `layout-shift:${label}`,
      screenshotHash: `screenshot:${label}`,
      cumulativeLayoutShift: 0
    }
  };
}

function runtimeSignals(reasonCode, boundary) {
  const text = `${reasonCode ?? ''} ${boundary ?? ''}`.toLowerCase();
  if (text.includes('iframe-srcdoc')) return ['html-iframe-srcdoc-runtime'];
  if (text.includes('iframe')) return ['html-iframe-runtime'];
  if (text.includes('event-handler')) return ['html-event-handler-runtime'];
  if (text.includes('inline-style') || text.includes('style')) return ['html-inline-style-runtime'];
  if (text.includes('framework-directive')) return ['html-framework-directive-runtime'];
  if (text.includes('form-submitter')) return ['html-form-submitter-runtime'];
  if (text.includes('form-control')) return ['html-form-control-runtime'];
  if (text.includes('form')) return ['html-form-runtime'];
  if (text.includes('navigation')) return ['html-navigation-runtime'];
  return ['html-browser-runtime'];
}

function sourceHashBinding(base, worker, head, output) {
  return {
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    outputSourceHash: hashSemanticValue(output)
  };
}

export { matrixSurface, runtimeEvidence, runtimeProofCapsule, scopedProof, selectorProof, sourceHashBinding };
