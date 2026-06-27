import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function effectTargetSurfaceExpectation(region) {
  const records = effectTargetOrderRecords(region);
  return {
    effectTargetOrderHash: effectTargetOrderHash(region, records),
    effectTargetNeedsDynamicComputedKeyTrace: records.some((record) => record.computedPropertyDynamic),
    effectTargetNeedsBoundComputedLiteralTrace: records.some((record) => record.computedPropertyBoundLiteral),
    effectTargetNeedsOptionalCallTrace: records.some((record) => record.optionalCall),
    effectTargetNeedsTaggedTemplateTrace: records.some((record) => record.taggedTemplate),
    effectTargetNeedsConstructorTrace: records.some((record) => record.constructorCall)
  };
}

function effectTargetProofReasonCodes(candidate, expected) {
  if (!expected.effectTargetOrderHash) return [];
  const reasonCodes = [];
  if (candidate.effectTargetRuntimeEquivalenceClaim !== false || candidate.effectTargetOrderEquivalenceClaim !== false || candidate.effectTargetResolutionEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  if (expected.effectTargetNeedsDynamicComputedKeyTrace && candidate.computedPropertyRuntimeEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  if (expected.effectTargetNeedsOptionalCallTrace && candidate.optionalCallRuntimeEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  if (expected.effectTargetNeedsTaggedTemplateTrace && candidate.taggedTemplateTargetEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.effectTargetOrderHash, candidate.effectTargetResolutionHash);
  if (!orderHash) reasonCodes.push('runtime-order-explicit-evidence-effect-target-order-hash-missing');
  else if (orderHash !== expected.effectTargetOrderHash) reasonCodes.push('runtime-order-explicit-evidence-effect-target-order-hash-mismatch');
  if (!firstString(candidate.effectTargetResolutionTraceHash, candidate.effectTargetTraceHash, candidate.targetResolutionTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-effect-target-resolution-trace-missing');
  if (expected.effectTargetNeedsDynamicComputedKeyTrace && !firstString(candidate.effectTargetComputedKeyTraceHash, candidate.computedPropertyResolutionTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-effect-target-computed-key-trace-missing');
  if (expected.effectTargetNeedsBoundComputedLiteralTrace && !firstString(candidate.effectTargetBoundComputedLiteralTraceHash, candidate.computedPropertyBindingTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-effect-target-bound-computed-literal-trace-missing');
  if (expected.effectTargetNeedsOptionalCallTrace && !firstString(candidate.effectTargetNullishBoundaryTraceHash, candidate.optionalCallTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-effect-target-nullish-boundary-trace-missing');
  if (expected.effectTargetNeedsTaggedTemplateTrace && !firstString(candidate.effectTargetTaggedTemplateTraceHash, candidate.taggedTemplateTargetTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-effect-target-tagged-template-trace-missing');
  if (expected.effectTargetNeedsConstructorTrace && !firstString(candidate.effectTargetConstructorTraceHash, candidate.constructorCallTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-effect-target-constructor-trace-missing');
  return reasonCodes;
}

function effectTargetOrderHash(region, records = effectTargetOrderRecords(region)) {
  return records.length ? hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.effectTargetOrder',
    sourcePath: region?.sourcePath,
    regionKind: runtimeRegionKind(region),
    runtimeKind: region?.runtimeKind,
    symbolName: region?.symbolName,
    ordinal: region?.ordinal,
    records: records.map(effectTargetOrderRecordForHash)
  }) : undefined;
}

function effectTargetOrderRecordForHash(record) {
  return {
    kind: record?.kind,
    effectKind: record?.effectKind,
    line: record?.line,
    targetText: record?.targetText,
    targetRoot: record?.targetRoot,
    receiverText: record?.receiverText,
    calleeName: record?.calleeName,
    constructorCall: record?.constructorCall === true,
    optionalCall: record?.optionalCall === true,
    taggedTemplate: record?.taggedTemplate === true,
    computedPropertyStatic: record?.computedPropertyStatic === true,
    computedPropertyDynamic: record?.computedPropertyDynamic === true,
    computedPropertyBoundLiteral: record?.computedPropertyBoundLiteral === true,
    computedPropertyKeys: array(record?.computedPropertyKeys),
    computedPropertyBindingNames: array(record?.computedPropertyBindingNames),
    computedPropertyBindingKinds: array(record?.computedPropertyBindingKinds),
    computedPropertyCount: record?.computedPropertyCount,
    staticEffectTargetEvidence: record?.staticEffectTargetEvidence === true,
    computedPropertyRuntimeEquivalenceClaim: record?.computedPropertyRuntimeEquivalenceClaim,
    runtimeEquivalenceClaim: record?.runtimeEquivalenceClaim,
    semanticEquivalenceClaim: record?.semanticEquivalenceClaim
  };
}

function effectTargetOrderRecords(region) {
  return array(region?.metadata?.runtimeOrderEvidence?.effectTargetOrder ?? region?.runtimeOrderEvidence?.effectTargetOrder);
}

function runtimeRegionKind(region) { return String(region?.regionKind ?? ''); }
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }

export { effectTargetProofReasonCodes, effectTargetSurfaceExpectation };
