import { uniqueStrings } from '../../native-import-utils.js';
import {
  runtimeOrderProofSurfaceReasonCodes,
  runtimeOrderSurfaceExpectations
} from './runtimeOrderProofSurfaces.js';

const RuntimeOrderProofSchema = 'frontier.lang.runtimeOrderProofEvidence.v1';
const RuntimeOrderProofKind = 'frontier.lang.runtimeOrderProofEvidence';
const PassedStatuses = new Set(['passed', 'verified']);

function runtimeOrderEvidenceBinding(input) {
  const candidates = runtimeOrderEvidenceCandidates(input?.scriptInput);
  if (!candidates.length) return { passed: false, evidenceIds: [], reasonCodes: [] };
  const results = candidates.map((candidate) => validateRuntimeOrderEvidence(candidate, input));
  const passed = results.filter((result) => result.passed);
  if (passed.length) {
    return {
      passed: true,
      evidenceIds: uniqueStrings(passed.flatMap((result) => result.evidenceIds)),
      reasonCodes: []
    };
  }
  return {
    passed: false,
    evidenceIds: [],
    reasonCodes: uniqueStrings(results.flatMap((result) => result.reasonCodes))
  };
}

function validateRuntimeOrderEvidence(candidate, input) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return invalid(['runtime-order-explicit-evidence-structured-record-required']);
  }
  const expected = expectedRuntimeOrderBinding(input);
  const reasonCodes = [];
  if (!PassedStatuses.has(String(candidate.status ?? ''))) reasonCodes.push('runtime-order-explicit-evidence-status-not-passed');
  if (candidate.schema !== RuntimeOrderProofSchema && candidate.kind !== RuntimeOrderProofKind) reasonCodes.push('runtime-order-explicit-evidence-schema-missing');
  if (!fieldMatches(candidate.sourcePath, [expected.sourcePath])) reasonCodes.push('runtime-order-explicit-evidence-source-path-mismatch');
  if (!sourceHashMatches(candidate, expected)) reasonCodes.push('runtime-order-explicit-evidence-source-hash-mismatch');
  if (!regionIdentityMatches(candidate, expected)) reasonCodes.push('runtime-order-explicit-evidence-region-identity-mismatch');
  if (!fieldMatches(candidate.regionKind, [expected.regionKind])) reasonCodes.push('runtime-order-explicit-evidence-region-kind-mismatch');
  if (!runtimeKindMatches(candidate, expected)) reasonCodes.push('runtime-order-explicit-evidence-runtime-kind-mismatch');
  if (expected.signatureHashes.length && !fieldMatches(candidate.signatureHash, expected.signatureHashes)) reasonCodes.push('runtime-order-explicit-evidence-signature-hash-mismatch');
  if (candidate.autoMergeClaim !== false || candidate.semanticEquivalenceClaim !== false || candidate.runtimeEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  reasonCodes.push(...runtimeOrderProofSurfaceReasonCodes(candidate, expected));
  if (reasonCodes.length) return invalid(reasonCodes);
  return {
    passed: true,
    evidenceIds: uniqueStrings([candidate.id, candidate.evidenceId, ...(array(candidate.evidenceIds))]),
    reasonCodes: []
  };
}

function expectedRuntimeOrderBinding(input) {
  const region = input?.region ?? {};
  const regionKey = region.key ?? stripRegionPrefix(region.conflictKey) ?? input?.anchorKey;
  const sourcePath = region.sourcePath ?? region.sourceSpan?.path ?? input?.context?.workerChangeSet?.sourcePath;
  return {
    sourcePath,
    sourceHashes: uniqueStrings([input?.context?.workerChangeSet?.afterHash, input?.context?.headChangeSet?.afterHash]),
    stageHashes: {
      baseSourceHash: input?.context?.workerChangeSet?.beforeHash,
      workerSourceHash: input?.context?.workerChangeSet?.afterHash,
      headSourceHash: input?.context?.headChangeSet?.afterHash
    },
    regionKeys: uniqueStrings([regionKey, region.key, stripRegionPrefix(region.conflictKey), input?.anchorKey, region.id]),
    conflictKeys: uniqueStrings([region.conflictKey, regionKey ? `region:${regionKey}` : undefined]),
    runtimeIdentityKeys: uniqueStrings([runtimeIdentityKey(region)]),
    regionKind: runtimeRegionKind(region, input?.baseSymbol),
    runtimeKinds: runtimeKinds(region),
    ...runtimeOrderSurfaceExpectations(region),
    signatureHashes: uniqueStrings([
      region.signatureHash,
      input?.baseSymbol?.signatureHash,
      input?.baseSymbol?.beforeSignatureHash,
      input?.baseSymbol?.afterSignatureHash,
      input?.workerSymbol?.signatureHash,
      input?.workerSymbol?.beforeSignatureHash,
      input?.workerSymbol?.afterSignatureHash,
      input?.headSymbol?.signatureHash
    ])
  };
}

function runtimeOrderEvidenceCandidates(input = {}) {
  return [
    ...array(input.runtimeOrderEvidence),
    ...array(input.effectOrderEvidence),
    ...array(input.metadata?.runtimeOrderEvidence),
    ...array(input.metadata?.effectOrderEvidence),
    ...array(input.evidence).filter(isRuntimeProofLike)
  ];
}

function isRuntimeProofLike(value) {
  return value === true || value?.schema === RuntimeOrderProofSchema || value?.kind === RuntimeOrderProofKind;
}

function sourceHashMatches(candidate, expected) {
  const stageEntries = Object.entries(expected.stageHashes).filter(([, value]) => value);
  const hasStageHashProof = stageEntries.length && stageEntries.every(([field, value]) => candidate[field] === value);
  return hasStageHashProof || fieldMatches(candidate.sourceHash, expected.sourceHashes);
}

function regionIdentityMatches(candidate, expected) {
  return fieldMatches(candidate.regionKey, expected.regionKeys)
    || fieldMatches(stripRegionPrefix(candidate.conflictKey), expected.regionKeys)
    || fieldMatches(candidate.conflictKey, expected.conflictKeys)
    || fieldMatches(candidate.runtimeIdentityKey, expected.runtimeIdentityKeys);
}

function runtimeKindMatches(candidate, expected) {
  const candidateKinds = uniqueStrings([candidate.runtimeKind, ...array(candidate.runtimeKinds)]);
  return candidateKinds.length > 0 && candidateKinds.some((kind) => expected.runtimeKinds.includes(kind));
}

function runtimeKinds(region) {
  return uniqueStrings([
    ...array(region?.runtimeKinds),
    ...array(region?.runtimeKind),
    ...array(region?.metadata?.factKinds),
    ...array(region?.metadata?.factKind),
    ...array(factSignatureFromSymbolName(region?.symbolName, runtimeRegionKind(region)))
  ].flatMap((kind) => String(kind ?? '').split('+')).filter(Boolean));
}

function runtimeIdentityKey(region) {
  return stableKey(['runtime-region', region?.sourcePath, region?.symbolName, region?.regionKind, region?.runtimeKind, region?.ordinal]);
}

function runtimeRegionKind(region, symbol) { return String(region?.regionKind ?? symbol?.ownershipRegionKind ?? ''); }
function factSignatureFromSymbolName(symbolName, regionKind) {
  const marker = `:${regionKind}:`;
  const text = String(symbolName ?? '');
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return undefined;
  return text.slice(markerIndex + marker.length).replace(/#\d+$/, '') || undefined;
}
function fieldMatches(value, expectedValues) { return value !== undefined && value !== null && expectedValues.includes(String(value)); }
function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function stripRegionPrefix(value) {
  const text = String(value ?? '');
  return text.startsWith('region:') ? text.slice('region:'.length) : text || undefined;
}
function invalid(reasonCodes) { return { passed: false, evidenceIds: [], reasonCodes }; }
function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }

export { runtimeOrderEvidenceBinding };
