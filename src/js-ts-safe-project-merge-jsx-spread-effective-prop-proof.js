import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const JsxSpreadEffectivePropRoute = Object.freeze({
  routeId: 'admit-jsx-spread-effective-prop-commutation',
  routeLane: 'jsx-effective-props',
  routeNext: 'accept-static-jsx-spread-effective-prop-merge'
});

function jsxSpreadEffectivePropMergeProofAssessment(input = {}) {
  const delta = jsxSpreadEffectivePropMergeDelta(input);
  if (!delta) return undefined;
  const reasonCodes = jsxSpreadEffectivePropMergeReasonCodes(delta);
  const status = reasonCodes.length ? 'failed' : 'passed';
  return {
    status,
    ...JsxSpreadEffectivePropRoute,
    reasonCodes,
    record: compactRecord({
      schema: 'frontier.lang.jsxSpreadEffectivePropMergeProofAssessment.v1',
      status,
      ...JsxSpreadEffectivePropRoute,
      reasonCodes,
      delta,
      proofHash: jsxSpreadEffectivePropMergeProofHash(delta),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      effectivePropCommutationClaim: status === 'passed',
      claimScope: 'static-jsx-spread-effective-prop-commutation-only'
    })
  };
}

function jsxSpreadEffectivePropMergeDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => record?.propKind === 'spread' || record?.spread)) return undefined;
  const stages = Object.fromEntries(Object.entries(records).map(([stage, record]) => [stage, spreadStageSummary(record)]));
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const branchMerge = spreadEffectivePropBranchMerge(stages.base, stages.worker, stages.head);
  return compactRecord({
    schema: 'frontier.lang.jsxSpreadEffectivePropMergeDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    propName: firstString(outputRecord?.propName, workerRecord?.propName, headRecord?.propName, baseRecord?.propName),
    spreadOrdinal: firstNumber(outputRecord?.spreadOrdinal, workerRecord?.spreadOrdinal, headRecord?.spreadOrdinal, baseRecord?.spreadOrdinal),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    ...stages,
    branchMerge
  });
}

function jsxSpreadEffectivePropMergeReasonCodes(delta) {
  const reasons = [];
  for (const stage of ['base', 'worker', 'head', 'output']) {
    const record = delta[stage];
    if (!record) reasons.push(`jsx-spread-effective-prop-${stage}-record-missing`);
    if (!delta[`${stage}SourceHash`]) reasons.push(`jsx-spread-effective-prop-${stage}-source-hash-missing`);
    if (record && !record.staticObjectSpread) reasons.push(`jsx-spread-effective-prop-${stage}-static-object-spread-proof-missing`);
    if (record?.dynamicBlockerReasonCode) reasons.push(`jsx-spread-effective-prop-${stage}-dynamic-spread-unsupported`);
    if (record?.duplicatePropNames?.length) reasons.push(`jsx-spread-effective-prop-${stage}-duplicate-props-unsupported`);
  }
  const merge = delta.branchMerge;
  if (!merge) reasons.push('jsx-spread-effective-prop-branch-merge-missing');
  if (merge?.overlappingChangedPropNames?.length) reasons.push('jsx-spread-effective-prop-overlapping-branch-change');
  if (merge && !sameEntryLists(merge.expectedOutputEffectivePropEntries, delta.output?.effectivePropEntries)) {
    reasons.push('jsx-spread-effective-prop-output-effective-props-mismatch');
  }
  return uniqueStrings(reasons);
}

function spreadStageSummary(record) {
  if (!record) return undefined;
  return compactRecord({
    propKind: record.propKind,
    spread: record.spread,
    spreadOrdinal: record.spreadOrdinal,
    proofStatus: record.propValueProofStatus,
    staticObjectSpread: record.propValueProofStatus === 'static-object-spread-jsx-prop-value-evidence',
    sourceKind: record.propValueStaticSpreadSourceKind,
    sourceName: record.propValueStaticSpreadSourceName,
    effectivePropEntries: normalizeEntries(record.propValueStaticSpreadEffectivePropEntries),
    effectivePropNames: normalizeEntries(record.propValueStaticSpreadEffectivePropEntries).map((entry) => entry.propName),
    duplicatePropNames: strings(record.propValueStaticSpreadDuplicatePropNames),
    precedenceStatus: record.propValueStaticSpreadPrecedenceStatus,
    dynamicBlockerReasonCode: record.propValueDynamicBlockerReasonCode,
    expressionHash: record.propValueExpressionHash,
    signatureHash: record.propValueSignatureHash
  });
}

function spreadEffectivePropBranchMerge(base, worker, head) {
  if (!base || !worker || !head) return undefined;
  const baseMap = entryMap(base.effectivePropEntries);
  const workerMap = entryMap(worker.effectivePropEntries);
  const headMap = entryMap(head.effectivePropEntries);
  const workerChanged = changedPropNames(baseMap, workerMap);
  const headChanged = changedPropNames(baseMap, headMap);
  const overlappingChangedPropNames = workerChanged.filter((name) => headChanged.includes(name) && !sameEntry(workerMap.get(name), headMap.get(name)));
  const expected = new Map(baseMap);
  for (const name of workerChanged) applyEntryChange(expected, name, workerMap.get(name));
  for (const name of headChanged) applyEntryChange(expected, name, headMap.get(name));
  return compactRecord({
    workerChangedPropNames: workerChanged,
    headChangedPropNames: headChanged,
    overlappingChangedPropNames,
    expectedOutputEffectivePropEntries: [...expected.values()].sort(compareEntries),
    mergeHash: hashSemanticValue({
      kind: 'frontier.lang.jsxSpreadEffectivePropBranchMerge.v1',
      base: base.effectivePropEntries,
      worker: worker.effectivePropEntries,
      head: head.effectivePropEntries,
      workerChanged,
      headChanged,
      overlappingChangedPropNames
    })
  });
}

function changedPropNames(baseMap, branchMap) {
  return uniqueStrings([...baseMap.keys(), ...branchMap.keys()].filter((name) => !sameEntry(baseMap.get(name), branchMap.get(name)))).sort();
}

function normalizeEntries(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => compactRecord({
    propName: stringValue(entry.propName),
    keyText: stringValue(entry.keyText),
    valueKind: stringValue(entry.valueKind),
    valueText: stringValue(entry.valueText),
    entryHash: stringValue(entry.entryHash)
  })).filter((entry) => entry.propName).sort(compareEntries);
}

function entryMap(entries) {
  return new Map((entries ?? []).map((entry) => [entry.propName, entry]));
}

function applyEntryChange(map, name, entry) {
  if (entry) map.set(name, entry);
  else map.delete(name);
}

function sameEntry(left, right) {
  if (!left || !right) return left === right;
  return left.propName === right.propName && left.keyText === right.keyText && left.valueKind === right.valueKind
    && left.valueText === right.valueText && left.entryHash === right.entryHash;
}

function sameEntryLists(left, right) {
  const leftValues = normalizeEntries(left);
  const rightValues = normalizeEntries(right);
  return leftValues.length === rightValues.length && leftValues.every((entry, index) => sameEntry(entry, rightValues[index]));
}

function jsxSpreadEffectivePropMergeProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxSpreadEffectivePropMergeProof.expected.v1',
    identityKey: delta.identityKey,
    sourcePath: delta.sourcePath,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    branchMerge: delta.branchMerge,
    output: delta.output
  });
}

function compareEntries(left, right) { return left.propName.localeCompare(right.propName); }
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function firstNumber(...values) { return values.find((value) => Number.isFinite(value)); }
function stringValue(value) { return value === undefined || value === null ? undefined : String(value); }
function strings(values) { return (Array.isArray(values) ? values : []).map(stringValue).filter(Boolean); }
function uniqueStrings(values) { return [...new Set(strings(values))]; }

export { jsxSpreadEffectivePropMergeDelta, jsxSpreadEffectivePropMergeProofAssessment };
