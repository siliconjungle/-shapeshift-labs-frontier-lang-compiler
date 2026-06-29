import { compactRecord } from './js-ts-safe-merge-context.js';
import { safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';

function cssCascadeRuntimeProofGuardedMergeOptions(mergeOptions, sourcePath) {
  const invalidProofs = cssCascadeRuntimeProofCandidates(mergeOptions, sourcePath).filter(cssCascadeRuntimeProofMakesBroadClaims);
  if (!invalidProofs.length) return { mergeOptions, invalidProofs };
  const guarded = { ...mergeOptions };
  for (const key of CssCascadeRuntimeProofKeys) {
    if (Object.hasOwn(guarded, key)) setOrDelete(guarded, key, withoutBroadCssRuntimeProofClaims(guarded[key]));
  }
  for (const key of CssCascadeRuntimeProofByPathKeys) {
    if (!isPlainObject(guarded[key])) continue;
    const scoped = { ...guarded[key] };
    if (Object.hasOwn(scoped, sourcePath)) setOrDelete(scoped, sourcePath, withoutBroadCssRuntimeProofClaims(scoped[sourcePath]));
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

function withoutBroadCssRuntimeProofClaims(value) {
  if (Array.isArray(value)) {
    const filtered = value.filter((proof) => !cssCascadeRuntimeProofMakesBroadClaims(proof));
    return filtered.length ? filtered : undefined;
  }
  return cssCascadeRuntimeProofMakesBroadClaims(value) ? undefined : value;
}

function cssCascadeRuntimeProofMakesBroadClaims(proof) {
  return proof?.browserRuntimeEquivalenceClaim === true ||
    proof?.browserRenderEquivalenceClaim === true ||
    proof?.browserCascadeEquivalenceClaim === true ||
    proof?.semanticEquivalenceClaim === true ||
    proof?.autoMergeClaim === true;
}

function cssCascadeRuntimeProofBroadClaimConflict(id, sourcePath, invalidProofs) {
  return {
    code: 'css-cascade-runtime-proof-blocked',
    gateId: 'css-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode: 'css-cascade-runtime-proof-broad-claim',
      conflictKey: `css#${id ?? safeId(sourcePath)}#css-cascade-runtime-proof-broad-claim#${sourcePath ?? 'source'}`,
      invalidRuntimeProofIds: uniqueStrings(invalidProofs.map((proof) => proof?.id)),
      broadClaimFields: uniqueStrings(invalidProofs.flatMap(cssCascadeRuntimeProofBroadClaimFields)),
      proofGap: {
        code: 'css-cascade-runtime-proof-broad-claim',
        status: 'not-claimed',
        summary: 'CSS cascade runtime proofs cannot self-assert broad browser, render, semantic, or auto-merge equivalence claims.',
        nextProof: 'Attach a source-bound cssCascadeRuntimeProof whose runtime capsule or runtime fields provide command, probe id, evidence hash, required CSS runtime signals, and no broad browser/semantic/auto-merge self-claims.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    })
  };
}

function cssCascadeRuntimeProofBroadClaimFields(proof) {
  return CssCascadeRuntimeBroadClaimFields.filter((field) => proof?.[field] === true);
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
    reasonCodes: uniqueStrings([...(admission.reasonCodes ?? []), ...conflicts.map((conflict) => conflict.details?.reasonCode ?? conflict.code)])
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

const CssCascadeRuntimeBroadClaimFields = Object.freeze([
  'browserRuntimeEquivalenceClaim',
  'browserRenderEquivalenceClaim',
  'browserCascadeEquivalenceClaim',
  'semanticEquivalenceClaim',
  'autoMergeClaim'
]);

export { blockCssCascadeRuntimeProofBroadClaims, cssCascadeRuntimeProofGuardedMergeOptions };
