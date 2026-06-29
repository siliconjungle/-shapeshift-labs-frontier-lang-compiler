import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { runtimeEvidenceMetadataFromProof, runtimeProofBroadClaimFields, validateRuntimeProofAgainstProbe } from './js-ts-safe-project-merge-runtime-proof-capsule.js';
import { createSvgParserEvidence } from './js-ts-safe-project-merge-svg-evidence.js';
import { createSvgReferenceGraphEvidence } from './js-ts-safe-project-merge-svg-reference-evidence.js';
import { createSvgRuntimeBoundaryEvidence, svgRuntimeBoundaryChanges } from './js-ts-safe-project-merge-svg-runtime-boundary-evidence.js';

function attachSvgParserEvidence({ result, id, sourcePath, base, worker, head }) {
  const svgParserEvidence = withSvgSourceEvidenceClaimFlags(createSvgParserEvidence({ base, worker, head }));
  const svgReferenceGraphEvidence = createSvgReferenceGraphEvidence({ base, worker, head, output: result.mergedSourceText });
  const next = compactRecord({ ...result, svgParserEvidence, svgReferenceGraphEvidence });
  if (!svgParserEvidence.parseErrors || result.status !== 'merged') return next;
  const conflict = svgParserEvidenceConflict(id, sourcePath, svgParserEvidence);
  const conflicts = [...(next.conflicts ?? []), conflict];
  const { mergedSourceText, mergedSourceHash, ...rest } = next;
  return compactRecord({
    ...rest,
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedSvgAdmission(next.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false
  });
}

function attachSvgReferenceGraphEvidence({ result, id, sourcePath, base, worker, head }) {
  const evidence = createSvgReferenceGraphEvidence({ base, worker, head, output: result.mergedSourceText });
  const next = compactRecord({ ...result, svgReferenceGraphEvidence: evidence });
  if (!evidence.referenceErrors || result.status !== 'merged') return next;
  const conflict = svgReferenceGraphConflict(id, sourcePath, evidence);
  const conflicts = [...(next.conflicts ?? []), conflict];
  const { mergedSourceText, mergedSourceHash, ...rest } = next;
  return compactRecord({
    ...rest,
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedSvgAdmission(next.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false
  });
}

function attachSvgRuntimeProofs({ result, input, mergeOptions, id, sourcePath, base, worker, head }) {
  const proofs = svgRuntimeProofCandidates(input, sourcePath, mergeOptions);
  if (!proofs.length) return result;
  const invalidProofs = proofs
    .map((proof) => svgRuntimeProofInvalidRecord(proof, sourcePath, { base: hashText(base), worker: hashText(worker), head: hashText(head), output: hashText(result.mergedSourceText) }))
    .filter(Boolean);
  if (invalidProofs.length) return blockInvalidSvgRuntimeProofs({ result, id, sourcePath, invalidProofs });
  const svgRuntimeProofs = proofs.map(svgRuntimeProofRecord);
  return compactRecord({
    ...result,
    svgRuntimeProofs,
    browserRuntimeEquivalenceClaim: true,
    admission: compactRecord({
      ...(result.admission ?? {}),
      browserRuntimeEquivalenceClaim: true,
      svgRuntimeProofs,
      reasonCodes: uniqueStrings([...(result.admission?.reasonCodes ?? []), 'svg-browser-runtime-proof'])
    })
  });
}

function attachSvgMergeEvidence(options) {
  let result = attachSvgParserEvidence(options);
  if (result.status === 'merged') result = attachSvgReferenceGraphEvidence({ ...options, result });
  if (result.status === 'merged') result = attachSvgRuntimeProofs({ ...options, result });
  if (result.status === 'merged') result = attachSvgRuntimeBoundaryEvidence({ ...options, result });
  return result;
}

function attachSvgRuntimeBoundaryEvidence({ result, id, sourcePath, base, worker, head }) {
  const changes = svgRuntimeBoundaryChanges(base, worker, head);
  if (!changes.length) return result;
  const evidence = createSvgRuntimeBoundaryEvidence({ base, worker, head, status: hasValidSvgRuntimeProof(result) ? 'passed' : 'blocked' });
  if (hasValidSvgRuntimeProof(result)) {
    return compactRecord({
      ...result,
      svgRuntimeBoundaryEvidence: evidence,
      admission: compactRecord({
        ...(result.admission ?? {}),
        svgRuntimeBoundaryEvidence: evidence,
        reasonCodes: uniqueStrings([...(result.admission?.reasonCodes ?? []), 'svg-runtime-boundary-evidence-bound'])
      })
    });
  }
  const conflict = svgRuntimeBoundaryConflict(id, sourcePath, changes);
  const conflicts = [...(result.conflicts ?? []), conflict];
  const { mergedSourceText, mergedSourceHash, ...rest } = compactRecord({ ...result, svgRuntimeBoundaryEvidence: evidence });
  return compactRecord({
    ...rest,
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedSvgAdmission(result.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false
  });
}

function blockInvalidSvgRuntimeProofs({ result, id, sourcePath, invalidProofs }) {
  const conflict = svgRuntimeProofConflict(id, sourcePath, invalidProofs);
  const conflicts = [...(result.conflicts ?? []), conflict];
  const { mergedSourceText, mergedSourceHash, ...rest } = result;
  return compactRecord({
    ...rest,
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedSvgAdmission(result.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false
  });
}

function svgParserEvidenceConflict(id, sourcePath, svgParserEvidence) {
  return {
    code: 'svg-parser-source-evidence-blocked',
    gateId: 'svg-semantic-merge',
    sourcePath,
    details: {
      reasonCode: 'svg-parser-source-evidence-failed',
      reasonCodes: svgParserEvidence.parseErrorCodes,
      conflictKey: `svg#${id ?? safeId(sourcePath)}#svg-parser-source-evidence-failed#${sourcePath ?? 'source'}`,
      proofGap: {
        code: 'svg-parser-source-evidence-failed',
        status: 'failed',
        summary: 'SVG source must have one root <svg>, balanced XML-style tags, and source-bound element and attribute spans before structural admission.',
        nextProof: 'Provide valid standalone SVG source or route the change through human review with a source-bound SVG parser evidence object.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    }
  };
}

function svgReferenceGraphConflict(id, sourcePath, evidence) {
  return {
    code: 'svg-reference-graph-blocked',
    gateId: 'svg-semantic-merge',
    sourcePath,
    details: {
      reasonCode: 'svg-reference-graph-invalid',
      reasonCodes: evidence.referenceErrorCodes,
      conflictKey: `svg#${id ?? safeId(sourcePath)}#svg-reference-graph-invalid#${sourcePath ?? 'source'}`,
      missingReferenceRecords: evidence.sides?.output?.missingReferences ?? [],
      duplicateDefinitionRecords: evidence.sides?.output?.duplicateDefinitions ?? [],
      proofGap: {
        code: 'svg-reference-graph-invalid',
        status: 'failed',
        summary: 'SVG local href and url(#id) references must resolve to a unique local id before structural admission.',
        nextProof: 'Fix missing or duplicate SVG reference targets, or route through human review with source-bound SVG reference graph evidence.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    }
  };
}

function svgRuntimeBoundaryConflict(id, sourcePath, changes) {
  const reasonCodes = uniqueStrings(['svg-runtime-boundary-proof-missing', ...changes.map((change) => change.reasonCode)]);
  return {
    code: 'svg-runtime-boundary-blocked',
    gateId: 'svg-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode: 'svg-runtime-boundary-proof-missing',
      reasonCodes,
      conflictKey: `svg#${id ?? safeId(sourcePath)}#svg-runtime-boundary-proof-missing#${sourcePath ?? 'source'}`,
      changedBoundaries: uniqueStrings(changes.map((change) => change.boundary)),
      changedBoundaryAttributes: uniqueStrings(changes.flatMap((change) => change.boundaryAttributes ?? [])),
      runtimeBoundaryChanges: changes,
      proofGap: {
        code: 'svg-runtime-boundary-proof-missing',
        status: 'not-claimed',
        summary: 'Runtime-sensitive standalone SVG changes require source-bound browser runtime proof before structural admission.',
        nextProof: 'Attach svgRuntimeProofsByPath with a source-bound SVG browser runtime proof for base/worker/head/output, or route the change through human review.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    })
  };
}

function svgRuntimeProofCandidates(input = {}, sourcePath, mergeOptions = {}) {
  return [
    input.svgRuntimeProof,
    input.svgRuntimeProofs,
    input.svgRuntimeProofsByPath?.[sourcePath],
    input.svgBrowserRuntimeProof,
    input.svgBrowserRuntimeProofs,
    input.svgBrowserRuntimeProofsByPath?.[sourcePath],
    mergeOptions.svgRuntimeProof,
    mergeOptions.svgRuntimeProofs,
    mergeOptions.svgBrowserRuntimeProof,
    mergeOptions.svgBrowserRuntimeProofs
  ].flatMap(asArray).filter(Boolean);
}

function svgRuntimeProofInvalidRecord(proof, sourcePath, sourceHashes) {
  if (!proof || typeof proof !== 'object') return { proof, reasonCodes: ['svg-runtime-proof-missing'], broadClaimFields: [] };
  const validation = validateRuntimeProofAgainstProbe(proof, {
    id: `svg-runtime-proof#${safeId(sourcePath)}`,
    sourcePath,
    sourceHashes,
    requiredSourceRoles: ['base', 'worker', 'head', 'output'],
    requiredSignals: ['svg-browser-runtime', 'svg-runtime', 'svg-render-runtime'],
    requireRuntimeProofCapsule: true,
    requireSourceBoundProof: true,
    requireTelemetryHash: true,
    requireDomSnapshotHash: true,
    requireComputedStyleHash: true,
    requireLayoutSnapshotHash: true,
    requireEventTraceHash: true,
    requireAccessibilitySnapshotHash: true,
    requireFocusSnapshotHash: true,
    requireLayoutShiftHash: true,
    requireScreenshotHash: true,
    maxCumulativeLayoutShift: typeof proof.maxCumulativeLayoutShift === 'number' ? proof.maxCumulativeLayoutShift : 0.01
  });
  const broadClaimFields = runtimeProofBroadClaimFields(proof);
  const reasonCodes = uniqueStrings([...(validation.ok ? [] : validation.reasonCodes ?? []), ...(broadClaimFields.length ? ['svg-runtime-proof-broad-claim'] : [])]);
  return reasonCodes.length ? { proof, reasonCodes, broadClaimFields } : undefined;
}

function svgRuntimeProofRecord(proof) {
  const metadata = runtimeEvidenceMetadataFromProof(proof);
  return compactRecord({
    ...proof,
    runtimeCommand: proof.runtimeCommand ?? metadata?.command,
    runtimeProbeId: proof.runtimeProbeId ?? metadata?.probeId,
    runtimeEvidenceHash: proof.runtimeEvidenceHash ?? metadata?.evidenceHash,
    runtimeSignals: proof.runtimeSignals ?? metadata?.signals,
    runtimeProofCapsule: metadata?.capsule ?? proof.runtimeProofCapsule,
    runtimeProofCapsuleHash: proof.runtimeProofCapsuleHash ?? metadata?.capsule?.hash,
    runtimeBrowserName: proof.runtimeBrowserName ?? metadata?.capsule?.browserName,
    runtimeBrowserVersion: proof.runtimeBrowserVersion ?? metadata?.capsule?.browserVersion,
    runtimeViewport: proof.runtimeViewport ?? metadata?.capsule?.viewport,
    runtimeTelemetryHash: proof.runtimeTelemetryHash ?? metadata?.capsule?.telemetryHash,
    runtimeDomSnapshotHash: proof.runtimeDomSnapshotHash ?? metadata?.capsule?.domSnapshotHash,
    runtimeComputedStyleHash: proof.runtimeComputedStyleHash ?? metadata?.capsule?.computedStyleHash,
    runtimeLayoutSnapshotHash: proof.runtimeLayoutSnapshotHash ?? metadata?.capsule?.layoutSnapshotHash,
    runtimeEventTraceHash: proof.runtimeEventTraceHash ?? metadata?.capsule?.eventTraceHash,
    runtimeAccessibilitySnapshotHash: proof.runtimeAccessibilitySnapshotHash ?? metadata?.capsule?.accessibilitySnapshotHash,
    runtimeFocusSnapshotHash: proof.runtimeFocusSnapshotHash ?? metadata?.capsule?.focusSnapshotHash,
    runtimeLayoutShiftHash: proof.runtimeLayoutShiftHash ?? metadata?.capsule?.layoutShiftHash,
    runtimeScreenshotHash: proof.runtimeScreenshotHash ?? metadata?.capsule?.screenshotHash,
    runtimeCumulativeLayoutShift: proof.runtimeCumulativeLayoutShift ?? metadata?.capsule?.cumulativeLayoutShift,
    runtimeEvidenceBound: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false
  });
}

function hasValidSvgRuntimeProof(result) { return (result?.svgRuntimeProofs ?? []).some((proof) => proof?.runtimeEvidenceBound === true); }

function svgRuntimeProofConflict(id, sourcePath, invalidProofs) {
  const reasonCodes = uniqueStrings(invalidProofs.flatMap((record) => record.reasonCodes ?? []));
  const broadClaimFields = uniqueStrings(invalidProofs.flatMap((record) => record.broadClaimFields ?? []));
  return {
    code: 'svg-runtime-proof-blocked',
    gateId: 'svg-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode: reasonCodes.length === 1 && reasonCodes[0] === 'svg-runtime-proof-broad-claim' ? 'svg-runtime-proof-broad-claim' : 'svg-runtime-proof-invalid',
      reasonCodes,
      conflictKey: `svg#${id ?? safeId(sourcePath)}#svg-runtime-proof-invalid#${sourcePath ?? 'source'}`,
      invalidRuntimeProofIds: uniqueStrings(invalidProofs.map((record) => record.proof?.id)),
      broadClaimFields,
      proofGap: {
        code: 'svg-runtime-proof-invalid',
        status: 'not-claimed',
        summary: 'SVG runtime proofs must be canonical source-bound runtime proof capsules with command, probe, evidence, source hashes, DOM/style/layout/accessibility/focus/event/layout-shift/screenshot telemetry, acceptable CLS, and no broad self-claims.',
        nextProof: 'Attach svgRuntimeProofsByPath with a source-bound runtime proof for base/worker/head/output and required SVG browser runtime telemetry.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    })
  };
}

function blockedSvgAdmission(admission = {}, conflicts = []) {
  return compactRecord({
    ...admission,
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    reasonCodes: uniqueStrings([...(admission.reasonCodes ?? []), ...conflicts.flatMap((conflict) => [conflict.details?.reasonCode ?? conflict.code, ...(conflict.details?.reasonCodes ?? [])])])
  });
}

function asArray(value) { return Array.isArray(value) ? value : value === undefined ? [] : [value]; }

function withSvgSourceEvidenceClaimFlags(evidence) {
  if (!evidence || typeof evidence !== 'object') return evidence;
  const sides = Object.fromEntries(Object.entries(evidence.sides ?? {}).map(([sideName, side]) => [
    sideName,
    side && typeof side === 'object' ? compactRecord({ ...side, ...SvgSourceEvidenceClaimFlags }) : side
  ]));
  return compactRecord({ ...evidence, ...SvgSourceEvidenceClaimFlags, sides });
}

const SvgSourceEvidenceClaimFlags = Object.freeze({ autoMergeClaim: false, semanticEquivalenceClaim: false, runtimeEquivalenceClaim: false, renderEquivalenceClaim: false, browserRuntimeEquivalenceClaim: false, browserRenderEquivalenceClaim: false });

export { attachSvgMergeEvidence, attachSvgParserEvidence, attachSvgReferenceGraphEvidence, attachSvgRuntimeBoundaryEvidence, attachSvgRuntimeProofs };
