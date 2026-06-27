import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function effectTargetProofFields(record, options = {}) {
  const orderHash = effectTargetOrderHash(record);
  if (!orderHash) return {};
  return {
    effectTargetOrderHash: orderHash,
    effectTargetResolutionTraceHash: options.traceHash ?? 'fixture-effect-target-resolution-trace-hash',
    ...(effectTargetRecords(record).some((item) => item.computedPropertyDynamic)
      ? { effectTargetComputedKeyTraceHash: options.computedKeyTraceHash ?? 'fixture-effect-target-computed-key-trace-hash' }
      : {}),
    ...(effectTargetRecords(record).some((item) => item.computedPropertyBoundLiteral)
      ? { effectTargetBoundComputedLiteralTraceHash: options.boundComputedLiteralTraceHash ?? 'fixture-effect-target-bound-computed-literal-trace-hash' }
      : {}),
    ...(effectTargetRecords(record).some((item) => item.optionalCall)
      ? { effectTargetNullishBoundaryTraceHash: options.nullishBoundaryTraceHash ?? 'fixture-effect-target-nullish-boundary-trace-hash' }
      : {}),
    ...(effectTargetRecords(record).some((item) => item.taggedTemplate)
      ? { effectTargetTaggedTemplateTraceHash: options.taggedTemplateTraceHash ?? 'fixture-effect-target-tagged-template-trace-hash' }
      : {}),
    ...(effectTargetRecords(record).some((item) => item.constructorCall)
      ? { effectTargetConstructorTraceHash: options.constructorTraceHash ?? 'fixture-effect-target-constructor-trace-hash' }
      : {}),
    effectTargetRuntimeEquivalenceClaim: false,
    effectTargetOrderEquivalenceClaim: false,
    effectTargetResolutionEquivalenceClaim: false,
    ...(effectTargetRecords(record).some((item) => item.computedPropertyDynamic)
      ? { computedPropertyRuntimeEquivalenceClaim: false }
      : {}),
    ...(effectTargetRecords(record).some((item) => item.optionalCall)
      ? { optionalCallRuntimeEquivalenceClaim: false }
      : {}),
    ...(effectTargetRecords(record).some((item) => item.taggedTemplate)
      ? { taggedTemplateTargetEquivalenceClaim: false }
      : {})
  };
}

function effectTargetOrderHash(record) {
  const records = effectTargetRecords(record);
  return records.length ? hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.effectTargetOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
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

function effectTargetRecords(record) {
  return array(record?.runtimeOrderEvidence?.effectTargetOrder ?? record?.metadata?.runtimeOrderEvidence?.effectTargetOrder);
}

function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }

export { effectTargetOrderHash, effectTargetProofFields };
