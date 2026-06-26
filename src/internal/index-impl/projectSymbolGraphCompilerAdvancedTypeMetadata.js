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
  return {
    counts,
    record: compactRecord({
      advancedTypeShapeCount: counts.advancedTypeShapeCount || undefined,
      advancedTypeShapeKinds: value.advancedTypeShapeKinds ?? nonEmptyArray(uniqueStrings(advancedTypeShapes.map((shape) => shape.kind))),
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

function countKind(records, kind) { return records.filter((record) => record.kind === kind).length; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { compilerAdvancedTypeMetadata };
