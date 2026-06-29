import { compactRecord } from './js-ts-safe-merge-context.js';
import { safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { runtimeProofBroadClaimFields, validateRuntimeProofAgainstProbe } from './js-ts-safe-project-merge-runtime-proof-capsule.js';

function cssCascadeRuntimeProofGuardedMergeOptions(mergeOptions, sourcePath) {
  const invalidProofs = cssCascadeRuntimeProofCandidates(mergeOptions, sourcePath)
    .map(cssCascadeRuntimeProofInvalidRecord)
    .filter(Boolean);
  if (!invalidProofs.length) return { mergeOptions, invalidProofs };
  const guarded = { ...mergeOptions };
  for (const key of CssCascadeRuntimeProofKeys) {
    if (Object.hasOwn(guarded, key)) setOrDelete(guarded, key, withoutInvalidCssRuntimeProofs(guarded[key]));
  }
  for (const key of CssCascadeRuntimeProofByPathKeys) {
    if (!isPlainObject(guarded[key])) continue;
    const scoped = { ...guarded[key] };
    if (Object.hasOwn(scoped, sourcePath)) setOrDelete(scoped, sourcePath, withoutInvalidCssRuntimeProofs(scoped[sourcePath]));
    setOrDelete(guarded, key, Object.keys(scoped).length ? scoped : undefined);
  }
  return { mergeOptions: guarded, invalidProofs };
}

function blockCssCascadeRuntimeProofBroadClaims({ result, id, sourcePath, invalidProofs = [] }) {
  if (!invalidProofs.length) return undefined;
  const conflict = cssCascadeRuntimeProofBroadClaimConflict(id, sourcePath, invalidProofs);
  const conflicts = [...(result.conflicts ?? []), conflict];
  return compactRecord({
    ...result,
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedCssCascadeRuntimeProofAdmission(result.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false
  });
}

function cssCascadeRuntimeProofCandidates(input = {}, sourcePath) {
  return [
    input.cssCascadeRuntimeProof,
    input.cssCascadeRuntimeProofs,
    input.cssCascadeRuntimeProofsByPath?.[sourcePath],
    input.cssSourceBoundCascadeProof,
    input.cssSourceBoundCascadeProofs,
    input.cssSourceBoundCascadeProofsByPath?.[sourcePath],
    input.cascadeRuntimeProof,
    input.cascadeRuntimeProofs,
    input.cascadeRuntimeProofsByPath?.[sourcePath],
    input.sourceBoundCascadeProof,
    input.sourceBoundCascadeProofs,
    input.sourceBoundCascadeProofsByPath?.[sourcePath]
  ].flatMap(asArray).filter(Boolean);
}

function withoutInvalidCssRuntimeProofs(value) {
  if (Array.isArray(value)) {
    const filtered = value.filter((proof) => !cssCascadeRuntimeProofInvalidRecord(proof));
    return filtered.length ? filtered : undefined;
  }
  return cssCascadeRuntimeProofInvalidRecord(value) ? undefined : value;
}

function cssCascadeRuntimeProofInvalidRecord(proof) {
  if (!proof || typeof proof !== 'object') return undefined;
  const broadClaimFields = runtimeProofBroadClaimFields(proof);
  const validation = validateRuntimeProofAgainstProbe(proof, {
    id: `css-cascade-runtime-proof#${proof.reasonCode ?? 'cascade-runtime'}`,
    requiredSignals: cssCascadeRuntimeRequiredSignals(proof.reasonCode),
    requireRuntimeProofCapsule: true,
    requireTelemetryHash: true,
    requireDomSnapshotHash: true,
    requireComputedStyleHash: true,
    requireLayoutSnapshotHash: true,
    requireEventTraceHash: true,
    requireAccessibilitySnapshotHash: true,
    requireFocusSnapshotHash: true,
    requireLayoutShiftHash: true,
    maxCumulativeLayoutShift: typeof proof.maxCumulativeLayoutShift === 'number' ? proof.maxCumulativeLayoutShift : 0.01
  });
  const reasonCodes = uniqueStrings([
    ...(broadClaimFields.length ? ['css-cascade-runtime-proof-broad-claim'] : []),
    ...(validation.ok ? [] : validation.reasonCodes ?? [])
  ]);
  if (!reasonCodes.length) return undefined;
  return { proof, reasonCodes, broadClaimFields };
}

function cssCascadeRuntimeProofBroadClaimConflict(id, sourcePath, invalidProofs) {
  const reasonCodes = cssCascadeRuntimeProofInvalidReasonCodes(invalidProofs);
  const broadClaimFields = uniqueStrings(invalidProofs.flatMap((record) => record.broadClaimFields ?? []));
  const primaryReasonCode = reasonCodes.length === 1 && reasonCodes[0] === 'css-cascade-runtime-proof-broad-claim'
    ? 'css-cascade-runtime-proof-broad-claim'
    : 'css-cascade-runtime-proof-invalid';
  return {
    code: 'css-cascade-runtime-proof-blocked',
    gateId: 'css-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode: primaryReasonCode,
      reasonCodes,
      conflictKey: `css#${id ?? safeId(sourcePath)}#${primaryReasonCode}#${sourcePath ?? 'source'}`,
      invalidRuntimeProofIds: uniqueStrings(invalidProofs.map((record) => record.proof?.id)),
      broadClaimFields,
      proofGap: {
        code: primaryReasonCode,
        status: 'not-claimed',
        summary: broadClaimFields.length && reasonCodes.length === 1
          ? 'CSS cascade runtime proofs cannot self-assert broad browser, render, semantic, or auto-merge equivalence claims.'
          : 'CSS cascade runtime proofs must provide a valid runtime proof capsule with required command, probe, evidence, telemetry, browser snapshot hashes, acceptable layout shift, and no broad self-claims.',
        nextProof: 'Attach a source-bound cssCascadeRuntimeProof whose runtimeProofCapsule provides command, probe id, evidence hash, required CSS runtime signals, telemetry hashes, DOM/style/layout/event/accessibility/focus/layout-shift hashes, acceptable CLS, and no broad browser/semantic/auto-merge self-claims.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    })
  };
}

function cssCascadeRuntimeProofInvalidReasonCodes(invalidProofs) {
  return uniqueStrings(invalidProofs.flatMap((record) => record.reasonCodes ?? []));
}

function cssCascadeRuntimeRequiredSignals(reasonCode = '') {
  if (reasonCode.includes('keyframes')) return ['css-keyframes-runtime', 'keyframes-runtime', 'animation-runtime'];
  if (reasonCode.includes('font-face')) return ['css-font-face-runtime', 'font-face-runtime', 'font-loading-runtime'];
  if (reasonCode.includes('property')) return ['css-property-registration-runtime', 'property-registration-runtime'];
  if (reasonCode.includes('page')) return ['css-page-runtime', 'page-layout-runtime', 'paged-media-runtime'];
  return ['css-cascade-runtime', 'cascade-runtime', 'browser-cascade-runtime'];
}

function blockedCssCascadeRuntimeProofAdmission(admission = {}, conflicts = []) {
  return compactRecord({
    ...admission,
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false,
    reasonCodes: uniqueStrings([
      ...(admission.reasonCodes ?? []),
      ...conflicts.flatMap((conflict) => [conflict.details?.reasonCode ?? conflict.code, ...(conflict.details?.reasonCodes ?? [])])
    ])
  });
}

function setOrDelete(record, key, value) {
  if (value === undefined) delete record[key];
  else record[key] = value;
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }

const CssCascadeRuntimeProofKeys = Object.freeze([
  'cssCascadeRuntimeProof',
  'cssCascadeRuntimeProofs',
  'cssSourceBoundCascadeProof',
  'cssSourceBoundCascadeProofs',
  'cascadeRuntimeProof',
  'cascadeRuntimeProofs',
  'sourceBoundCascadeProof',
  'sourceBoundCascadeProofs'
]);

const CssCascadeRuntimeProofByPathKeys = Object.freeze([
  'cssCascadeRuntimeProofsByPath',
  'cssSourceBoundCascadeProofsByPath',
  'cascadeRuntimeProofsByPath',
  'sourceBoundCascadeProofsByPath'
]);

export { blockCssCascadeRuntimeProofBroadClaims, cssCascadeRuntimeProofGuardedMergeOptions };
