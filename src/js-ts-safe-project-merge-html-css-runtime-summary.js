import { HtmlRuntimeBoundaryReasonCodes } from './js-ts-safe-project-merge-html-css-summary-constants.js';

function hasBrowserRuntimeProof(file) {
  return hasAdmittedBrowserRuntimeProof(file) && browserRuntimeProofRecords(file).some(isRuntimeEvidenceBoundProof);
}

function hasHtmlRuntimeBoundaryProof(file) {
  return hasAdmittedBrowserRuntimeProof(file) &&
    htmlRuntimeProofRecords(file).some((proof) => isRuntimeEvidenceBoundProof(proof) && HtmlRuntimeBoundaryReasonCodes.has(proof.reasonCode));
}

function hasBlockedBrowserRuntimeProof(file) {
  return browserRuntimeConflicts(file).some(isBrowserRuntimeProofBlocker);
}

function hasAdmittedBrowserRuntimeProof(file) {
  const admission = file?.result?.admission ?? file?.admission ?? {};
  return admission.browserRuntimeEquivalenceClaim === true ||
    admission.browserCascadeEquivalenceClaim === true ||
    admission.browserRenderEquivalenceClaim === true;
}

function htmlRuntimeProofRecords(file) {
  return [
    ...(file?.result?.runtimeBoundaryProofs ?? []),
    ...(file?.result?.htmlRuntimeProofs ?? []),
    ...(file?.result?.admission?.htmlRuntimeBoundaryProofs ?? file?.admission?.htmlRuntimeBoundaryProofs ?? []),
    ...(file?.result?.admission?.htmlBrowserRuntimeProofs ?? file?.admission?.htmlBrowserRuntimeProofs ?? [])
  ];
}

function browserRuntimeProofRecords(file) {
  return [
    ...htmlRuntimeProofRecords(file),
    ...(file?.result?.svgRuntimeProofs ?? []),
    ...(file?.result?.admission?.svgRuntimeProofs ?? file?.admission?.svgRuntimeProofs ?? []),
    ...(file?.result?.cascadeRuntimeProofs ?? []),
    ...(file?.result?.admission?.cssCascadeRuntimeProofs ?? file?.admission?.cssCascadeRuntimeProofs ?? [])
  ];
}

function isRuntimeEvidenceBoundProof(proof) {
  return proof?.status === 'passed' &&
    proof.runtimeEvidenceBound === true &&
    typeof proof.runtimeCommand === 'string' &&
    typeof proof.runtimeProbeId === 'string' &&
    typeof proof.runtimeEvidenceHash === 'string' &&
    typeof proof.runtimeProofCapsuleHash === 'string' &&
    proof.runtimeProofCapsule && typeof proof.runtimeProofCapsule === 'object' &&
    proof.runtimeProofCapsule.status === 'passed' &&
    sourceBindingComplete(proof) &&
    runtimeTelemetryComplete(proof) &&
    Array.isArray(proof.runtimeSignals) &&
    proof.runtimeSignals.length > 0;
}

function sourceBindingComplete(proof) {
  return ['baseSourceHash', 'workerSourceHash', 'headSourceHash', 'outputSourceHash']
    .every((field) => typeof proof?.[field] === 'string' && proof[field].length > 0);
}

function runtimeTelemetryComplete(proof) {
  return ['runtimeTelemetryHash', 'runtimeDomSnapshotHash', 'runtimeComputedStyleHash', 'runtimeLayoutSnapshotHash', 'runtimeEventTraceHash', 'runtimeAccessibilitySnapshotHash', 'runtimeFocusSnapshotHash', 'runtimeLayoutShiftHash']
    .every((field) => typeof proof?.[field] === 'string' && proof[field].length > 0);
}

function browserRuntimeConflicts(file) {
  return [
    ...(file?.result?.conflicts ?? []),
    ...(file?.conflicts ?? [])
  ];
}

function isBrowserRuntimeProofBlocker(conflict) {
  const codes = [
    conflict?.code,
    conflict?.details?.reasonCode,
    conflict?.details?.proofGap?.code,
    ...(conflict?.details?.reasonCodes ?? [])
  ].map((code) => String(code ?? ''));
  return codes.some((code) => BrowserRuntimeProofBlockerCodes.has(code) || BrowserRuntimeProofBlockerFragments.some((fragment) => code.includes(fragment)));
}

const BrowserRuntimeProofBlockerCodes = new Set([
  'css-cascade-runtime-proof-blocked',
  'css-cascade-runtime-proof-invalid',
  'css-cascade-runtime-proof-broad-claim',
  'runtime-proof-capsule-missing',
  'runtime-proof-telemetry-hash-missing',
  'runtime-proof-source-bound-proof-required',
  'source-bound-runtime-proof-source-hash-missing',
  'source-bound-runtime-proof-source-hash-mismatch',
  'html-runtime-proof-broad-claim',
  'svg-runtime-proof-blocked',
  'svg-runtime-proof-invalid',
  'svg-runtime-proof-broad-claim',
  'svg-runtime-boundary-blocked',
  'svg-runtime-boundary-proof-missing'
]);

const BrowserRuntimeProofBlockerFragments = Object.freeze([
  'runtime-proof',
  'browser-runtime-proof',
  'runtime-boundary-proof'
]);

export { hasBlockedBrowserRuntimeProof, hasBrowserRuntimeProof, hasHtmlRuntimeBoundaryProof };
