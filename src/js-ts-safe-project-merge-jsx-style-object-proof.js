import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const JsxStyleObjectRoute = Object.freeze({
  routeId: 'admit-jsx-style-object-property-commutation',
  routeLane: 'jsx-style-object-properties',
  routeNext: 'accept-static-jsx-style-object-property-merge'
});

function jsxStyleObjectMergeProofAssessment(input = {}) {
  const delta = jsxStyleObjectMergeDelta(input);
  if (!delta) return undefined;
  const reasonCodes = jsxStyleObjectMergeReasonCodes(delta);
  const status = reasonCodes.length ? 'failed' : 'passed';
  return {
    status,
    ...JsxStyleObjectRoute,
    reasonCodes,
    record: compactRecord({
      schema: 'frontier.lang.jsxStyleObjectMergeProofAssessment.v1',
      status,
      ...JsxStyleObjectRoute,
      reasonCodes,
      delta,
      proofHash: jsxStyleObjectMergeProofHash(delta),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      styleObjectPropertyCommutationClaim: status === 'passed',
      claimScope: 'static-jsx-style-object-property-commutation-only'
    })
  };
}

function jsxStyleObjectMergeDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => record?.propName === 'style')) return undefined;
  const stages = Object.fromEntries(Object.entries(records).map(([stage, record]) => [stage, styleStageSummary(record)]));
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const branchMerge = styleObjectBranchMerge(stages.base, stages.worker, stages.head);
  return compactRecord({
    schema: 'frontier.lang.jsxStyleObjectMergeDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    propName: firstString(outputRecord?.propName, workerRecord?.propName, headRecord?.propName, baseRecord?.propName),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    ...stages,
    branchMerge
  });
}

function jsxStyleObjectMergeReasonCodes(delta) {
  const reasons = [];
  if (delta.propName !== 'style') reasons.push('jsx-style-object-prop-name-not-style');
  for (const stage of ['base', 'worker', 'head', 'output']) {
    const record = delta[stage];
    if (!record) reasons.push(`jsx-style-object-${stage}-record-missing`);
    if (!delta[`${stage}SourceHash`]) reasons.push(`jsx-style-object-${stage}-source-hash-missing`);
    if (record && !record.staticStyleObject) reasons.push(`jsx-style-object-${stage}-static-object-proof-missing`);
    if (record?.dynamicBlockerReasonCode) reasons.push(`jsx-style-object-${stage}-dynamic-style-unsupported`);
    if (record?.duplicatePropertyNames?.length) reasons.push(`jsx-style-object-${stage}-duplicate-properties-unsupported`);
  }
  const merge = delta.branchMerge;
  if (!merge) reasons.push('jsx-style-object-branch-merge-missing');
  if (merge?.overlappingChangedPropertyNames?.length) reasons.push('jsx-style-object-overlapping-branch-change');
  if (merge && !sameEntryLists(merge.expectedOutputStyleObjectEntries, delta.output?.styleObjectEntries)) {
    reasons.push('jsx-style-object-output-properties-mismatch');
  }
  return uniqueStrings(reasons);
}

function styleStageSummary(record) {
  if (!record) return undefined;
  return compactRecord({
    propKind: record.propKind,
    propName: record.propName,
    proofStatus: record.propValueProofStatus,
    styleObjectProofStatus: record.propValueStaticStyleObjectProofStatus,
    staticStyleObject: record.propName === 'style'
      && record.propValueKind === 'object-literal'
      && record.propValueStaticStyleObjectProofStatus === 'static-style-object-jsx-prop-value-evidence',
    styleObjectEntries: normalizeEntries(record.propValueStaticStyleObjectEntries),
    stylePropertyNames: normalizeEntries(record.propValueStaticStyleObjectEntries).map((entry) => entry.stylePropertyName),
    duplicatePropertyNames: strings(record.propValueStaticStyleObjectDuplicatePropertyNames),
    claimScope: record.propValueStaticStyleObjectClaimScope,
    renderEquivalenceClaim: record.propValueStaticStyleObjectRenderEquivalenceClaim,
    dynamicBlockerReasonCode: record.propValueDynamicBlockerReasonCode,
    expressionHash: record.propValueExpressionHash,
    signatureHash: record.propValueSignatureHash
  });
}

function styleObjectBranchMerge(base, worker, head) {
  if (!base || !worker || !head) return undefined;
  const baseMap = entryMap(base.styleObjectEntries);
  const workerMap = entryMap(worker.styleObjectEntries);
  const headMap = entryMap(head.styleObjectEntries);
  const workerChanged = changedPropertyNames(baseMap, workerMap);
  const headChanged = changedPropertyNames(baseMap, headMap);
  const overlappingChangedPropertyNames = workerChanged.filter((name) => headChanged.includes(name) && !sameEntry(workerMap.get(name), headMap.get(name)));
  const expected = new Map(baseMap);
  for (const name of workerChanged) applyEntryChange(expected, name, workerMap.get(name));
  for (const name of headChanged) applyEntryChange(expected, name, headMap.get(name));
  return compactRecord({
    workerChangedPropertyNames: workerChanged,
    headChangedPropertyNames: headChanged,
    overlappingChangedPropertyNames,
    expectedOutputStyleObjectEntries: [...expected.values()].sort(compareEntries),
    mergeHash: hashSemanticValue({
      kind: 'frontier.lang.jsxStyleObjectBranchMerge.v1',
      base: base.styleObjectEntries,
      worker: worker.styleObjectEntries,
      head: head.styleObjectEntries,
      workerChanged,
      headChanged,
      overlappingChangedPropertyNames
    })
  });
}

function changedPropertyNames(baseMap, branchMap) {
  return uniqueStrings([...baseMap.keys(), ...branchMap.keys()].filter((name) => !sameEntry(baseMap.get(name), branchMap.get(name)))).sort();
}

function normalizeEntries(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => compactRecord({
    stylePropertyName: stringValue(entry.stylePropertyName),
    keyText: stringValue(entry.keyText),
    valueKind: stringValue(entry.valueKind),
    valueText: stringValue(entry.valueText),
    entryHash: stringValue(entry.entryHash)
  })).filter((entry) => entry.stylePropertyName).sort(compareEntries);
}

function entryMap(entries) {
  return new Map((entries ?? []).map((entry) => [entry.stylePropertyName, entry]));
}

function applyEntryChange(map, name, entry) {
  if (entry) map.set(name, entry);
  else map.delete(name);
}

function sameEntry(left, right) {
  if (!left || !right) return left === right;
  return left.stylePropertyName === right.stylePropertyName && left.keyText === right.keyText
    && left.valueKind === right.valueKind && left.valueText === right.valueText && left.entryHash === right.entryHash;
}

function sameEntryLists(left, right) {
  const leftValues = normalizeEntries(left);
  const rightValues = normalizeEntries(right);
  return leftValues.length === rightValues.length && leftValues.every((entry, index) => sameEntry(entry, rightValues[index]));
}

function jsxStyleObjectMergeProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxStyleObjectMergeProof.expected.v1',
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

function compareEntries(left, right) { return left.stylePropertyName.localeCompare(right.stylePropertyName); }
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function stringValue(value) { return value === undefined || value === null ? undefined : String(value); }
function strings(values) { return (Array.isArray(values) ? values : []).map(stringValue).filter(Boolean); }
function uniqueStrings(values) { return [...new Set(strings(values))]; }

export { jsxStyleObjectMergeDelta, jsxStyleObjectMergeProofAssessment };
