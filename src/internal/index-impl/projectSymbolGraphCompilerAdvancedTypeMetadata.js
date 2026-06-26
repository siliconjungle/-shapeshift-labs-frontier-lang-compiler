function compilerAdvancedTypeMetadata(value) {
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
  const proofRequirement = advancedTypeProofRequirement(advancedTypeShapes, counts);
  return {
    counts,
    record: compactRecord({
      advancedTypeShapeCount: counts.advancedTypeShapeCount || undefined,
      advancedTypeShapeKinds: value.advancedTypeShapeKinds ?? nonEmptyArray(uniqueStrings(advancedTypeShapes.map((shape) => shape.kind))),
      advancedTypeProofRequirement: proofRequirement.requirement,
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

function advancedTypeProofRequirement(advancedTypeShapes, counts) {
  if (!counts.advancedTypeShapeCount) return {};
  const requiredSignals = advancedTypeRequiredProofSignals(counts);
  const missingSignals = missingAdvancedTypeProofSignals(advancedTypeShapes, counts);
  const unsupportedSignals = unsupportedAdvancedTypeProofSignals(counts);
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
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
  return {
    requirement,
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

function advancedTypeRequiredProofSignals(counts) {
  return uniqueStrings(AdvancedTypeProofShapeSpecs.flatMap((spec) => (
    counts[spec.countKey] > 0 ? [countSignal(spec.kind), ...spec.fields.map((field) => field.signal)] : []
  )));
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

function unsupportedAdvancedTypeProofSignals(counts) {
  const knownShapeCount = AdvancedTypeProofShapeSpecs.reduce((sum, spec) => sum + (counts[spec.countKey] || 0), 0);
  return counts.advancedTypeShapeCount > knownShapeCount ? ['compiler-unknown-advanced-type-shape'] : [];
}

function fieldMissing(value) {
  if (Array.isArray(value)) return !value.length || value.some((item) => item === undefined || item === null);
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
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { compilerAdvancedTypeMetadata };
