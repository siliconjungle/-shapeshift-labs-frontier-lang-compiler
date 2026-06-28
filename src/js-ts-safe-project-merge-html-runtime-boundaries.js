import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { changedHtmlRuntimeBoundaryAttributes, htmlRuntimeBoundaryGroups } from './js-ts-safe-project-merge-html-runtime-boundary-records.js';

function htmlRuntimeBoundaryChanges(base, worker, head) {
  const baseBoundaries = htmlRuntimeBoundaryGroups(base);
  return [
    ...htmlRuntimeBoundaryChangesForSide('worker', baseBoundaries, htmlRuntimeBoundaryGroups(worker)),
    ...htmlRuntimeBoundaryChangesForSide('head', baseBoundaries, htmlRuntimeBoundaryGroups(head))
  ];
}

function htmlRuntimeBoundaryChangesForSide(side, baseGroups, currentGroups) {
  return uniqueStrings([...baseGroups.keys(), ...currentGroups.keys()]).flatMap((key) => {
    const before = baseGroups.get(key);
    const after = currentGroups.get(key);
    if ((before?.fingerprint ?? '') === (after?.fingerprint ?? '')) return [];
    const sample = after ?? before;
    return [{
      side,
      reasonCode: sample.reasonCode,
      boundary: sample.boundary,
      boundaryAttributes: changedHtmlRuntimeBoundaryAttributes(before?.records ?? [], after?.records ?? [])
    }];
  });
}

function htmlRuntimeBoundaryProofForChange(proofs, change, binding) {
  return proofs.find((proof) => isHtmlRuntimeBoundaryProofForChange(proof, change, binding));
}

function isHtmlRuntimeBoundaryProofForChange(proof, change, binding) {
  return Boolean(proof && typeof proof === 'object') &&
    HtmlRuntimeBoundaryProofKinds.has(proof.kind) &&
    proof.status === 'passed' &&
    proof.sourcePath === binding.sourcePath &&
    htmlProofCoversValue(proof.reasonCode, proof.reasonCodes, change.reasonCode) &&
    htmlProofCoversValue(proof.side, proof.sides, change.side) &&
    proof.boundary === change.boundary &&
    sameStringSet(proof.boundaryAttributes ?? proof.changedBoundaryAttributes, change.boundaryAttributes) &&
    htmlRuntimeBoundaryProofSourceBound(proof, binding) &&
    !htmlRuntimeBoundaryProofMakesBroadClaims(proof) &&
    htmlRuntimeBoundaryProofEvidenceMetadata(proof, change) !== undefined;
}

function htmlRuntimeBoundaryProofSourceBound(proof, binding) {
  return htmlRuntimeBoundaryProofSourceMatches(proof, 'base', binding.base) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'worker', binding.worker) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'head', binding.head) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'output', binding.output);
}

function htmlRuntimeBoundaryProofSourceMatches(proof, role, sourceText) {
  if (typeof sourceText !== 'string') return false;
  const hash = hashText(sourceText);
  const textFields = role === 'output' ? ['outputSourceText', 'mergedSourceText'] : [`${role}SourceText`];
  const hashFields = role === 'output' ? ['outputSourceHash', 'mergedSourceHash'] : [`${role}SourceHash`];
  const aliases = role === 'output' ? ['output', 'merged'] : [role];
  return textFields.some((field) => proof[field] === sourceText) ||
    aliases.some((alias) => proof.sourceTexts?.[alias] === sourceText || proof.sources?.[alias] === sourceText) ||
    hashFields.some((field) => proof[field] === hash) ||
    aliases.some((alias) => proof.sourceHashes?.[alias] === hash || proof.hashes?.[alias] === hash);
}

function htmlRuntimeBoundaryProofRecord(proof, change, binding) {
  const runtimeEvidence = htmlRuntimeBoundaryProofEvidenceMetadata(proof, change);
  return compactRecord({
    id: proof.id,
    kind: proof.kind,
    status: 'passed',
    proofLevel: proof.proofLevel ?? 'html-runtime-boundary-evidence-bound',
    reasonCode: change.reasonCode,
    side: change.side,
    boundary: change.boundary,
    boundaryAttributes: change.boundaryAttributes,
    sourcePath: binding.sourcePath,
    baseSourceHash: hashText(binding.base),
    workerSourceHash: hashText(binding.worker),
    headSourceHash: hashText(binding.head),
    outputSourceHash: hashText(binding.output),
    runtimeCommand: runtimeEvidence?.command,
    runtimeProbeId: runtimeEvidence?.probeId,
    runtimeEvidenceHash: runtimeEvidence?.evidenceHash,
    runtimeSignals: runtimeEvidence?.signals,
    requiredRuntimeSignals: runtimeEvidence?.requiredSignals,
    runtimeEvidenceBound: runtimeEvidence !== undefined,
    browserRuntimeEquivalenceClaim: true,
    browserRenderEquivalenceClaim: false,
    semanticEquivalenceClaim: false,
    autoMergeClaim: false
  });
}

function htmlRuntimeBoundaryProofEvidenceMetadata(proof, change) {
  const requiredSignals = requiredHtmlRuntimeBoundarySignals(change.reasonCode, change.boundary);
  const signals = htmlRuntimeBoundaryProofSignals(proof);
  const command = firstString(
    proof.runtimeCommand,
    proof.browserCommand,
    proof.command,
    proof.commandId,
    proof.probeCommand,
    proof.evidence?.command,
    proof.runtimeEvidence?.command,
    proof.browserEvidence?.command
  );
  const probeId = firstString(
    proof.runtimeProbeId,
    proof.browserProbeId,
    proof.probeId,
    proof.probe?.id,
    proof.evidence?.probeId,
    proof.runtimeEvidence?.probeId,
    proof.browserEvidence?.probeId
  );
  const evidenceHash = firstString(
    proof.runtimeEvidenceHash,
    proof.browserEvidenceHash,
    proof.evidenceHash,
    proof.domEvidenceHash,
    proof.renderEvidenceHash,
    proof.hydrationEvidenceHash,
    proof.resourceEvidenceHash,
    proof.evidence?.hash,
    proof.evidence?.evidenceHash,
    proof.runtimeEvidence?.hash,
    proof.runtimeEvidence?.evidenceHash,
    proof.browserEvidence?.hash,
    proof.browserEvidence?.evidenceHash
  );
  const hasRequiredSignal = requiredSignals.some((signal) => signals.includes(signal));
  if (!command || !probeId || !evidenceHash || !hasRequiredSignal) return undefined;
  return { command, probeId, evidenceHash, signals, requiredSignals };
}

function htmlRuntimeBoundaryProofSignals(proof) {
  return uniqueStrings([
    ...signalsFromValue(proof.runtimeSignals),
    ...signalsFromValue(proof.browserSignals),
    ...signalsFromValue(proof.evidenceSignals),
    ...signalsFromValue(proof.probeSignals),
    ...signalsFromValue(proof.evidence?.signals),
    ...signalsFromValue(proof.runtimeEvidence?.signals),
    ...signalsFromValue(proof.browserEvidence?.signals)
  ]);
}

function signalsFromValue(value) {
  if (typeof value === 'string' && value.length > 0) return [value];
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.length > 0);
  if (value && typeof value === 'object') return Object.keys(value).filter((key) => value[key] === true || value[key] === 'passed');
  return [];
}

function requiredHtmlRuntimeBoundarySignals(reasonCode, boundary) {
  const text = `${reasonCode ?? ''} ${boundary ?? ''}`.toLowerCase();
  if (text.includes('iframe-srcdoc')) return ['html-iframe-srcdoc-runtime', 'iframe-srcdoc-runtime'];
  if (text.includes('iframe')) return ['html-iframe-runtime', 'iframe-runtime'];
  if (text.includes('event-handler')) return ['html-event-handler-runtime', 'event-handler-runtime'];
  if (text.includes('inline-style') || text.includes('style')) return ['html-inline-style-runtime', 'html-style-runtime', 'css-cascade-runtime'];
  if (text.includes('form-submitter')) return ['html-form-submitter-runtime', 'form-submitter-runtime', 'html-form-runtime'];
  if (text.includes('form-control')) return ['html-form-control-runtime', 'form-control-runtime', 'html-form-runtime'];
  if (text.includes('form')) return ['html-form-runtime', 'form-runtime'];
  if (text.includes('navigation')) return ['html-navigation-runtime', 'navigation-runtime'];
  if (text.includes('document-base')) return ['html-document-base-runtime', 'document-base-runtime'];
  if (text.includes('document-metadata')) return ['html-document-metadata-runtime', 'document-metadata-runtime'];
  if (text.includes('resource-loading')) return ['html-resource-loading-runtime', 'resource-loading-runtime'];
  if (text.includes('template')) return ['html-template-runtime', 'template-runtime'];
  if (text.includes('slot')) return ['html-slot-runtime', 'slot-runtime'];
  if (text.includes('custom-element')) return ['html-custom-element-runtime', 'custom-element-runtime'];
  if (text.includes('framework-directive')) return ['html-framework-directive-runtime', 'framework-directive-runtime'];
  return ['html-browser-runtime', 'browser-runtime'];
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

function htmlRuntimeBoundaryProvenResult(result, runtimeBoundaryProofs) {
  return compactRecord({
    ...result,
    runtimeBoundaryProofs,
    browserRuntimeEquivalenceClaim: true,
    admission: compactRecord({
      ...(result.admission ?? {}),
      browserRuntimeEquivalenceClaim: true,
      htmlRuntimeBoundaryProofs: runtimeBoundaryProofs,
      reasonCodes: uniqueStrings([...(result.admission?.reasonCodes ?? []), 'html-runtime-boundary-evidence-bound'])
    })
  });
}

function htmlRuntimeBoundaryProofMakesBroadClaims(proof) {
  return proof.browserRuntimeEquivalenceClaim === true ||
    proof.browserRenderEquivalenceClaim === true ||
    proof.browserCascadeEquivalenceClaim === true ||
    proof.semanticEquivalenceClaim === true ||
    proof.autoMergeClaim === true;
}

function htmlProofCoversValue(value, values, expected) {
  return value === expected || (Array.isArray(values) && values.includes(expected));
}

function sameStringSet(actual, expected) {
  const actualSet = uniqueStrings(asArray(actual).map((value) => String(value)));
  const expectedSet = uniqueStrings(asArray(expected).map((value) => String(value)));
  return actualSet.length === expectedSet.length && expectedSet.every((value) => actualSet.includes(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

const HtmlRuntimeBoundaryProofKinds = new Set([
  'html-browser-runtime-proof',
  'html-source-bound-browser-runtime-proof',
  'html-source-bound-runtime-proof',
  'html-runtime-boundary-proof',
  'html-source-bound-runtime-boundary-proof'
]);

export { htmlRuntimeBoundaryChanges, htmlRuntimeBoundaryProofForChange, htmlRuntimeBoundaryProofRecord, htmlRuntimeBoundaryProvenResult };
