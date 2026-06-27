function compilerAdvancedTypeMetadata(value, source = {}) {
  const advancedTypeShapes = arrayValue(value.advancedTypeShapes);
  const typeReferenceTargets = arrayValue(value.typeReferenceTargets);
  const counts = {
    advancedTypeShapeCount: numberValue(value.advancedTypeShapeCount) ?? advancedTypeShapes.length,
    typeReferenceTargetCount: numberValue(value.typeReferenceTargetCount) ?? typeReferenceTargets.length,
    conditionalTypeCount: numberValue(value.conditionalTypeCount) ?? countKind(advancedTypeShapes, 'conditional-type'),
    mappedTypeCount: numberValue(value.mappedTypeCount) ?? countKind(advancedTypeShapes, 'mapped-type'),
    indexedAccessTypeCount: numberValue(value.indexedAccessTypeCount) ?? countKind(advancedTypeShapes, 'indexed-access-type'),
    keyofTypeOperatorCount: numberValue(value.keyofTypeOperatorCount) ?? countKind(advancedTypeShapes, 'keyof-type-operator'),
    templateLiteralTypeCount: numberValue(value.templateLiteralTypeCount) ?? countKind(advancedTypeShapes, 'template-literal-type'),
    inferTypeCount: numberValue(value.inferTypeCount) ?? countKind(advancedTypeShapes, 'infer-type'),
    unionTypeCount: numberValue(value.unionTypeCount) ?? countKind(advancedTypeShapes, 'union-type'),
    intersectionTypeCount: numberValue(value.intersectionTypeCount) ?? countKind(advancedTypeShapes, 'intersection-type'),
    tupleTypeCount: numberValue(value.tupleTypeCount) ?? countKind(advancedTypeShapes, 'tuple-type')
  };
  const proofRequirement = advancedTypeProofRequirement(advancedTypeShapes, counts, source);
  return {
    counts,
    record: compactRecord({
      advancedTypeShapeCount: counts.advancedTypeShapeCount || undefined,
      advancedTypeShapeKinds: value.advancedTypeShapeKinds ?? nonEmptyArray(uniqueStrings(advancedTypeShapes.map((shape) => shape.kind))),
      advancedTypeProofRequirement: proofRequirement.requirement,
      advancedTypeSourceBoundProof: proofRequirement.sourceBoundProof,
      advancedTypeMissingProof: proofRequirement.missingProof,
      typeReferenceTargetCount: counts.typeReferenceTargetCount || undefined,
      conditionalTypeCount: counts.conditionalTypeCount || undefined,
      mappedTypeCount: counts.mappedTypeCount || undefined,
      indexedAccessTypeCount: counts.indexedAccessTypeCount || undefined,
      keyofTypeOperatorCount: counts.keyofTypeOperatorCount || undefined,
      templateLiteralTypeCount: counts.templateLiteralTypeCount || undefined,
      inferTypeCount: counts.inferTypeCount || undefined,
      unionTypeCount: counts.unionTypeCount || undefined,
      intersectionTypeCount: counts.intersectionTypeCount || undefined,
      tupleTypeCount: counts.tupleTypeCount || undefined,
      advancedTypeShapes: nonEmptyArray(advancedTypeShapes),
      typeReferenceTargets: nonEmptyArray(typeReferenceTargets)
    })
  };
}

const AdvancedTypeProofRequirementKind = 'typescript-checker-public-api-advanced-type-shape-equivalence';
const AdvancedTypeProofRequiredEvidence = 'typescript-checker-public-api-type-equivalence';
const AdvancedTypeSourcePathSignal = 'compiler-public-api-advanced-type-source-path';
const AdvancedTypeSourceHashSignal = 'compiler-public-api-advanced-type-source-hash';
const AdvancedTypeSourcePathStaleSignal = 'compiler-public-api-advanced-type-source-path-stale';
const AdvancedTypeSourceHashStaleSignal = 'compiler-public-api-advanced-type-source-hash-stale';
const AdvancedTypeClaimBearingSignal = 'compiler-advanced-type-shape-claim-bearing';
const AdvancedTypeProofShapeSpecs = [
  proofShapeSpec('conditional-type', 'conditionalTypeCount', [
    proofField('nodeText', 'compiler-conditional-type-node-texts'),
    proofField('typeText', 'compiler-conditional-type-type-texts'),
    proofField('checkTypeText', 'compiler-conditional-type-check-type-texts'),
    proofField('extendsTypeText', 'compiler-conditional-type-extends-type-texts'),
    proofField('trueTypeText', 'compiler-conditional-type-true-type-texts'),
    proofField('falseTypeText', 'compiler-conditional-type-false-type-texts')
  ]),
  proofShapeSpec('mapped-type', 'mappedTypeCount', [
    proofField('nodeText', 'compiler-mapped-type-node-texts'),
    proofField('typeText', 'compiler-mapped-type-type-texts'),
    proofField('mappedConstraintTypeText', 'compiler-mapped-type-constraint-type-texts'),
    proofField('mappedValueTypeText', 'compiler-mapped-type-value-type-texts')
  ]),
  proofShapeSpec('indexed-access-type', 'indexedAccessTypeCount', [
    proofField('nodeText', 'compiler-indexed-access-type-node-texts'),
    proofField('typeText', 'compiler-indexed-access-type-type-texts'),
    proofField('objectTypeText', 'compiler-indexed-access-type-object-type-texts'),
    proofField('indexTypeText', 'compiler-indexed-access-type-index-type-texts')
  ]),
  proofShapeSpec('keyof-type-operator', 'keyofTypeOperatorCount', [
    proofField('nodeText', 'compiler-keyof-type-operator-node-texts'),
    proofField('typeText', 'compiler-keyof-type-operator-type-texts'),
    proofField('keyofTargetTypeText', 'compiler-keyof-type-operator-target-type-texts')
  ]),
  proofShapeSpec('template-literal-type', 'templateLiteralTypeCount', [
    proofField('nodeText', 'compiler-template-literal-type-node-texts'),
    proofField('typeText', 'compiler-template-literal-type-type-texts'),
    proofField('templateHeadText', 'compiler-template-literal-type-head-texts'),
    proofField('templateSpanTexts', 'compiler-template-literal-type-span-texts'),
    proofField('templateSpanTypeTexts', 'compiler-template-literal-type-span-type-texts'),
    proofField('templateLiteralTexts', 'compiler-template-literal-type-literal-texts')
  ]),
  proofShapeSpec('infer-type', 'inferTypeCount', [
    proofField('nodeText', 'compiler-infer-type-node-texts'),
    proofField('typeText', 'compiler-infer-type-type-texts'),
    proofField('typeParameterText', 'compiler-infer-type-type-parameter-texts'),
    proofField('typeParameterName', 'compiler-infer-type-type-parameter-names')
  ]),
  proofShapeSpec('union-type', 'unionTypeCount', [
    proofField('nodeText', 'compiler-union-type-node-texts'),
    proofField('typeText', 'compiler-union-type-type-texts'),
    proofField('memberTypeTexts', 'compiler-union-type-member-type-texts')
  ]),
  proofShapeSpec('intersection-type', 'intersectionTypeCount', [
    proofField('nodeText', 'compiler-intersection-type-node-texts'),
    proofField('typeText', 'compiler-intersection-type-type-texts'),
    proofField('memberTypeTexts', 'compiler-intersection-type-member-type-texts')
  ]),
  proofShapeSpec('tuple-type', 'tupleTypeCount', [
    proofField('nodeText', 'compiler-tuple-type-node-texts'),
    proofField('typeText', 'compiler-tuple-type-type-texts'),
    proofField('tupleElementTexts', 'compiler-tuple-type-element-texts'),
    proofField('tupleElementTypeTexts', 'compiler-tuple-type-element-type-texts')
  ])
];

function advancedTypeProofRequirement(advancedTypeShapes, counts, source = {}) {
  if (!counts.advancedTypeShapeCount) return {};
  const sourceBinding = advancedTypeSourceBinding(source);
  const requiredSignals = advancedTypeRequiredProofSignals(counts, sourceBinding);
  const missingSignals = uniqueStrings([
    ...missingAdvancedTypeProofSignals(advancedTypeShapes, counts),
    ...missingAdvancedTypeSourceBindingSignals(sourceBinding)
  ]);
  const unsupportedSignals = unsupportedAdvancedTypeProofSignals(advancedTypeShapes, counts, sourceBinding);
  const status = unsupportedSignals.length
    ? 'requires-review'
    : missingSignals.length ? 'missing-compiler-evidence' : 'requires-type-equivalence-proof';
  const requirement = compactRecord({
    kind: AdvancedTypeProofRequirementKind,
    requiredEvidence: AdvancedTypeProofRequiredEvidence,
    status,
    requiredSignals,
    missingSignals: nonEmptyArray(missingSignals),
    unsupportedSignals: nonEmptyArray(unsupportedSignals),
    advancedTypeShapeCount: counts.advancedTypeShapeCount,
    advancedTypeShapeKinds: nonEmptyArray(uniqueStrings(advancedTypeShapes.map((shape) => shape.kind))),
    conditionalTypeCount: counts.conditionalTypeCount || undefined,
    mappedTypeCount: counts.mappedTypeCount || undefined,
    indexedAccessTypeCount: counts.indexedAccessTypeCount || undefined,
    keyofTypeOperatorCount: counts.keyofTypeOperatorCount || undefined,
    templateLiteralTypeCount: counts.templateLiteralTypeCount || undefined,
    inferTypeCount: counts.inferTypeCount || undefined,
    unionTypeCount: counts.unionTypeCount || undefined,
    intersectionTypeCount: counts.intersectionTypeCount || undefined,
    tupleTypeCount: counts.tupleTypeCount || undefined,
    sourcePath: sourceBinding.sourcePath,
    sourceHash: sourceBinding.sourceHash,
    sourceBound: sourceBinding.required ? sourceBinding.bound : undefined,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
  return {
    requirement,
    sourceBoundProof: advancedTypeSourceBoundProof(advancedTypeShapes, counts, sourceBinding, requiredSignals, missingSignals, unsupportedSignals),
    missingProof: status === 'requires-type-equivalence-proof' ? undefined : compactRecord({
      kind: AdvancedTypeProofRequirementKind,
      requiredEvidence: AdvancedTypeProofRequiredEvidence,
      status,
      reasonCode: status === 'missing-compiler-evidence'
        ? 'typescript-public-api-advanced-type-shape-proof-missing'
        : 'typescript-public-api-advanced-type-shape-proof-requires-review',
      missingSignals: nonEmptyArray(missingSignals),
      unsupportedSignals: nonEmptyArray(unsupportedSignals),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function advancedTypeSourceBoundProof(advancedTypeShapes, counts, sourceBinding, requiredSignals, missingSignals, unsupportedSignals) {
  if (!counts.advancedTypeShapeCount) return undefined;
  return compactRecord({
    kind: 'typescript-checker-public-api-advanced-type-source-bound-proof',
    status: missingSignals.length || unsupportedSignals.length ? 'failed' : 'passed',
    proofLevel: 'typescript-checker-public-api-advanced-type-source-bound-shape-evidence',
    requiredEvidence: AdvancedTypeProofRequiredEvidence,
    checkerInvariant: 'advanced type shape texts and public API source path/hash complete',
    requiredSignals,
    missingSignals: nonEmptyArray(missingSignals),
    unsupportedSignals: nonEmptyArray(unsupportedSignals),
    advancedTypeShapeCount: counts.advancedTypeShapeCount,
    advancedTypeShapeKinds: nonEmptyArray(uniqueStrings(advancedTypeShapes.map((shape) => shape.kind))),
    sourcePath: sourceBinding.sourcePath,
    sourceHash: sourceBinding.sourceHash,
    sourceBound: sourceBinding.required ? sourceBinding.bound : undefined,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  });
}

function advancedTypeRequiredProofSignals(counts, sourceBinding) {
  const shapeSignals = AdvancedTypeProofShapeSpecs.flatMap((spec) => (
    counts[spec.countKey] > 0 ? [countSignal(spec.kind), ...spec.fields.map((field) => field.signal)] : []
  ));
  return uniqueStrings([
    ...shapeSignals,
    ...(sourceBinding.required ? [AdvancedTypeSourcePathSignal, AdvancedTypeSourceHashSignal] : [])
  ]);
}

function missingAdvancedTypeProofSignals(advancedTypeShapes, counts) {
  return uniqueStrings(AdvancedTypeProofShapeSpecs.flatMap((spec) => {
    const count = counts[spec.countKey] || 0;
    if (!count) return [];
    const shapes = advancedTypeShapes.filter((shape) => shape?.kind === spec.kind);
    const missing = [];
    if (shapes.length !== count) missing.push(countSignal(spec.kind));
    for (const field of spec.fields) {
      if (shapes.some((shape) => fieldMissing(shape?.[field.key]))) missing.push(field.signal);
    }
    return missing;
  }));
}

function missingAdvancedTypeSourceBindingSignals(sourceBinding) {
  if (!sourceBinding.required) return [];
  return [
    sourceBinding.sourcePath ? undefined : AdvancedTypeSourcePathSignal,
    sourceBinding.sourceHash ? undefined : AdvancedTypeSourceHashSignal
  ].filter(Boolean);
}

function unsupportedAdvancedTypeProofSignals(advancedTypeShapes, counts, sourceBinding) {
  const knownShapeCount = AdvancedTypeProofShapeSpecs.reduce((sum, spec) => sum + (counts[spec.countKey] || 0), 0);
  return [
    counts.advancedTypeShapeCount > knownShapeCount ? 'compiler-unknown-advanced-type-shape' : undefined,
    ...staleAdvancedTypeSourceBindingSignals(advancedTypeShapes, sourceBinding),
    hasClaimBearingAdvancedTypeShape(advancedTypeShapes) ? AdvancedTypeClaimBearingSignal : undefined
  ].filter(Boolean);
}

function staleAdvancedTypeSourceBindingSignals(advancedTypeShapes, sourceBinding) {
  if (!sourceBinding.required) return [];
  const stalePath = sourceBinding.sourcePath
    && advancedTypeShapes.some((shape) => nonBlankString(shape?.sourcePath) && shape.sourcePath !== sourceBinding.sourcePath);
  const staleHash = sourceBinding.sourceHash
    && advancedTypeShapes.some((shape) => nonBlankString(shape?.sourceHash) && shape.sourceHash !== sourceBinding.sourceHash);
  return [
    stalePath ? AdvancedTypeSourcePathStaleSignal : undefined,
    staleHash ? AdvancedTypeSourceHashStaleSignal : undefined
  ].filter(Boolean);
}

function hasClaimBearingAdvancedTypeShape(advancedTypeShapes) {
  return advancedTypeShapes.some((shape) => [
    shape?.proofClaim,
    shape?.autoMergeClaim,
    shape?.semanticEquivalenceClaim,
    shape?.runtimeEquivalenceClaim,
    shape?.proof?.proofClaim,
    shape?.proof?.autoMergeClaim,
    shape?.proof?.semanticEquivalenceClaim,
    shape?.proof?.runtimeEquivalenceClaim
  ].some((value) => value === true));
}

function advancedTypeSourceBinding(source) {
  const required = source?.publicContract === true;
  const sourcePath = nonBlankString(source?.sourcePath) ? source.sourcePath : undefined;
  const sourceHash = nonBlankString(source?.sourceHash) ? source.sourceHash : undefined;
  return {
    required,
    sourcePath,
    sourceHash,
    bound: !required || Boolean(sourcePath && sourceHash)
  };
}

function fieldMissing(value) {
  if (Array.isArray(value)) return !value.length || value.some(arrayFieldEntryMissing);
  if (typeof value === 'string') return value.trim().length === 0;
  return value === undefined || value === null;
}

function arrayFieldEntryMissing(value) {
  if (Array.isArray(value)) return !value.length || value.some(arrayFieldEntryMissing);
  return value === undefined || value === null;
}

function proofShapeSpec(kind, countKey, fields) { return { kind, countKey, fields }; }
function proofField(key, signal) { return { key, signal }; }
function countSignal(kind) { return `compiler-${kind}-count`; }
function countKind(records, kind) { return records.filter((record) => record.kind === kind).length; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function nonBlankString(value) { return typeof value === 'string' && value.trim().length > 0; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { compilerAdvancedTypeMetadata };
