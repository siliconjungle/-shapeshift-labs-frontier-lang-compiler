import{normalizeSemanticMergeReadiness,normalizeStringList,uniqueStrings}from'../../native-import-utils.js';
export function normalizeNativeTargetProjectionAdapterCoverage(value = {}, context = {}) {
  const capabilities = new Set(normalizeStringList(context.capabilities).map((capability) => capability.toLowerCase()));
  const lossKinds = uniqueStrings(value.lossKinds ?? []);
  const handledLossKinds = uniqueStrings([
    ...(value.handledLossKinds ?? []),
    ...(capabilities.has('macros') || capabilities.has('macroexpansion') ? ['macroExpansion', 'macroHygiene'] : []),
    ...(capabilities.has('preprocessor') ? ['preprocessor', 'conditionalCompilation'] : []),
    ...(capabilities.has('dynamicruntime') ? ['dynamicRuntime', 'dynamicDispatch'] : []),
    ...(capabilities.has('typeinference') ? ['typeInference', 'overloadResolution'] : [])
  ]);
  return Object.freeze({
    readiness: normalizeSemanticMergeReadiness(value.readiness) ?? 'needs-review',
    lossKinds,
    handledLossKinds,
    sourceMapPrecision: value.sourceMapPrecision,
    semanticCoverage: value.semanticCoverage ?? {},
    notes: uniqueStrings(value.notes ?? ['Target projection adapter output is host-owned evidence and should be reviewed unless declared ready.'])
  });
}
