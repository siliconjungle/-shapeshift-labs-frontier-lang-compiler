import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const AdvancedTypeShapeEquivalenceProofKind = 'typescript-checker-public-api-advanced-type-shape-unsupported';
const AdvancedTypeShapeSetEquivalenceProofKind = 'typescript-checker-public-api-advanced-type-shape-set-equivalence';
const ConditionalTypeEquivalenceProofKind = 'typescript-checker-public-api-conditional-type-shape-equivalence';
const IndexedAccessTypeEquivalenceProofKind = 'typescript-checker-public-api-indexed-access-type-shape-equivalence';
const InferTypeEquivalenceProofKind = 'typescript-checker-public-api-infer-type-shape-equivalence';
const KeyofTypeOperatorEquivalenceProofKind = 'typescript-checker-public-api-keyof-type-operator-shape-equivalence';
const MappedTypeEquivalenceProofKind = 'typescript-checker-public-api-mapped-type-shape-equivalence';
const TemplateLiteralTypeEquivalenceProofKind = 'typescript-checker-public-api-template-literal-type-shape-equivalence';
const UnionTypeEquivalenceProofKind = 'typescript-checker-public-api-union-type-shape-equivalence';
const IntersectionTypeEquivalenceProofKind = 'typescript-checker-public-api-intersection-type-shape-equivalence';
const TupleTypeEquivalenceProofKind = 'typescript-checker-public-api-tuple-type-shape-equivalence';

const ShapeSpecs = [
  shapeSpec('conditional-type', 'conditionalType', 'conditionalTypeCount', ConditionalTypeEquivalenceProofKind, 'conditional-type-set', 'conditional branch texts complete', 'conditionalTypeSetHash', 'frontier.lang.typescript.compilerConditionalTypeSetEquivalence.v1', 'conditionalTypes', [
    field('nodeText', 'NodeTexts', 'compiler-conditional-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-conditional-type-type-texts'),
    field('checkTypeText', 'CheckTypeTexts', 'compiler-conditional-type-check-type-texts'),
    field('extendsTypeText', 'ExtendsTypeTexts', 'compiler-conditional-type-extends-type-texts'),
    field('trueTypeText', 'TrueTypeTexts', 'compiler-conditional-type-true-type-texts'),
    field('falseTypeText', 'FalseTypeTexts', 'compiler-conditional-type-false-type-texts')
  ]),
  shapeSpec('indexed-access-type', 'indexedAccessType', 'indexedAccessTypeCount', IndexedAccessTypeEquivalenceProofKind, 'indexed-access-type-set', 'indexed access texts complete', 'indexedAccessTypeSetHash', 'frontier.lang.typescript.compilerIndexedAccessTypeSetEquivalence.v1', 'indexedAccessTypes', [
    field('nodeText', 'NodeTexts', 'compiler-indexed-access-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-indexed-access-type-type-texts'),
    field('objectTypeText', 'ObjectTypeTexts', 'compiler-indexed-access-type-object-type-texts'),
    field('indexTypeText', 'IndexTypeTexts', 'compiler-indexed-access-type-index-type-texts')
  ]),
  shapeSpec('mapped-type', 'mappedType', 'mappedTypeCount', MappedTypeEquivalenceProofKind, 'mapped-type-set', 'mapped type texts complete', 'mappedTypeSetHash', 'frontier.lang.typescript.compilerMappedTypeSetEquivalence.v1', 'mappedTypes', [
    field('nodeText', 'NodeTexts', 'compiler-mapped-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-mapped-type-type-texts'),
    field('mappedConstraintTypeText', 'ConstraintTypeTexts', 'compiler-mapped-type-constraint-type-texts'),
    field('mappedValueTypeText', 'ValueTypeTexts', 'compiler-mapped-type-value-type-texts')
  ]),
  shapeSpec('keyof-type-operator', 'keyofTypeOperator', 'keyofTypeOperatorCount', KeyofTypeOperatorEquivalenceProofKind, 'keyof-type-operator-set', 'keyof target texts complete', 'keyofTypeOperatorSetHash', 'frontier.lang.typescript.compilerKeyofTypeOperatorSetEquivalence.v1', 'keyofTypeOperators', [
    field('nodeText', 'NodeTexts', 'compiler-keyof-type-operator-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-keyof-type-operator-type-texts'),
    field('keyofTargetTypeText', 'TargetTypeTexts', 'compiler-keyof-type-operator-target-type-texts')
  ]),
  shapeSpec('template-literal-type', 'templateLiteralType', 'templateLiteralTypeCount', TemplateLiteralTypeEquivalenceProofKind, 'template-literal-type-set', 'template literal type span texts complete', 'templateLiteralTypeSetHash', 'frontier.lang.typescript.compilerTemplateLiteralTypeSetEquivalence.v1', 'templateLiteralTypes', [
    field('nodeText', 'NodeTexts', 'compiler-template-literal-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-template-literal-type-type-texts'),
    field('templateHeadText', 'HeadTexts', 'compiler-template-literal-type-head-texts'),
    field('templateSpanTexts', 'SpanTexts', 'compiler-template-literal-type-span-texts'),
    field('templateSpanTypeTexts', 'SpanTypeTexts', 'compiler-template-literal-type-span-type-texts'),
    field('templateLiteralTexts', 'LiteralTexts', 'compiler-template-literal-type-literal-texts')
  ]),
  shapeSpec('infer-type', 'inferType', 'inferTypeCount', InferTypeEquivalenceProofKind, 'infer-type-set', 'infer type parameter texts complete', 'inferTypeSetHash', 'frontier.lang.typescript.compilerInferTypeSetEquivalence.v1', 'inferTypes', [
    field('nodeText', 'NodeTexts', 'compiler-infer-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-infer-type-type-texts'),
    field('typeParameterText', 'TypeParameterTexts', 'compiler-infer-type-type-parameter-texts'),
    field('typeParameterName', 'TypeParameterNames', 'compiler-infer-type-type-parameter-names')
  ]),
  shapeSpec('union-type', 'unionType', 'unionTypeCount', UnionTypeEquivalenceProofKind, 'union-type-set', 'union member type texts complete', 'unionTypeSetHash', 'frontier.lang.typescript.compilerUnionTypeSetEquivalence.v1', 'unionTypes', [
    field('nodeText', 'NodeTexts', 'compiler-union-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-union-type-type-texts'),
    field('memberTypeTexts', 'MemberTypeTexts', 'compiler-union-type-member-type-texts')
  ]),
  shapeSpec('intersection-type', 'intersectionType', 'intersectionTypeCount', IntersectionTypeEquivalenceProofKind, 'intersection-type-set', 'intersection member type texts complete', 'intersectionTypeSetHash', 'frontier.lang.typescript.compilerIntersectionTypeSetEquivalence.v1', 'intersectionTypes', [
    field('nodeText', 'NodeTexts', 'compiler-intersection-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-intersection-type-type-texts'),
    field('memberTypeTexts', 'MemberTypeTexts', 'compiler-intersection-type-member-type-texts')
  ]),
  shapeSpec('tuple-type', 'tupleType', 'tupleTypeCount', TupleTypeEquivalenceProofKind, 'tuple-type-set', 'tuple element texts complete', 'tupleTypeSetHash', 'frontier.lang.typescript.compilerTupleTypeSetEquivalence.v1', 'tupleTypes', [
    field('nodeText', 'NodeTexts', 'compiler-tuple-type-node-texts'),
    field('typeText', 'TypeTexts', 'compiler-tuple-type-type-texts'),
    field('tupleElementTexts', 'ElementTexts', 'compiler-tuple-type-element-texts'),
    field('tupleElementTypeTexts', 'ElementTypeTexts', 'compiler-tuple-type-element-type-texts')
  ])
];
const ShapeSpecByKind = new Map(ShapeSpecs.map((spec) => [spec.kind, spec]));

function advancedTypeSetHashes(value, counts) {
  return compactRecord(Object.fromEntries(ShapeSpecs.map((spec) => [spec.hashKey, shapeSetHash(value, counts, spec)])));
}

function advancedTypeProofKind(counts) {
  const spec = soleEligibleSpec(counts);
  if (spec) return spec.proofKind;
  if (counts.advancedTypeShapeCount > 0 && !advancedTypeUnsupportedReasonCodes(counts).length) return AdvancedTypeShapeSetEquivalenceProofKind;
  return counts.advancedTypeShapeCount > 0 ? AdvancedTypeShapeEquivalenceProofKind : undefined;
}

function advancedTypeProofLevel(counts) {
  const spec = soleEligibleSpec(counts);
  if (spec) return spec.proofLevel;
  if (counts.advancedTypeShapeCount > 0 && !advancedTypeUnsupportedReasonCodes(counts).length) return 'advanced-type-shape-set';
  return counts.advancedTypeShapeCount > 0 ? 'advanced-type-shape-fail-closed' : undefined;
}

function advancedTypeCheckerInvariant(counts) {
  const spec = soleEligibleSpec(counts);
  if (spec) return spec.invariant;
  if (counts.advancedTypeShapeCount > 0 && !advancedTypeUnsupportedReasonCodes(counts).length) return 'advanced type shape texts complete';
  return counts.advancedTypeShapeCount > 0 ? 'unsupported shapes fail closed' : undefined;
}

function advancedTypeRequiredSignals(counts) { return ShapeSpecs.flatMap((spec) => shapeRequiredSignals(counts, spec)); }
function missingAdvancedTypeEquivalenceSignals(value, counts) { return uniqueStrings(ShapeSpecs.flatMap((spec) => missingShapeEquivalenceSignals(value, counts, spec))); }
function advancedTypeCheckerEvidence(value) { return compactRecord(Object.assign({}, ...ShapeSpecs.map((spec) => shapeEvidenceForSpec(value, spec)))); }
function advancedTypeUnsupportedReasonCodes(counts) {
  return counts.advancedTypeShapeCount > knownAdvancedTypeShapeCount(counts)
    ? ['typescript-unknown-advanced-type-shape-public-api-equivalence-unsupported']
    : [];
}
function advancedTypeUnsupportedSignals(counts) {
  return advancedTypeUnsupportedReasonCodes(counts).map((reasonCode) => reasonCode.replace(/^typescript-/, '').replace(/-unsupported$/, ''));
}

function isConditionalTypeEquivalenceEligible(counts) { return soleEligibleKind(counts, 'conditional-type'); }
function isIndexedAccessTypeEquivalenceEligible(counts) { return soleEligibleKind(counts, 'indexed-access-type'); }
function isMappedTypeEquivalenceEligible(counts) { return soleEligibleKind(counts, 'mapped-type'); }
function isKeyofTypeOperatorEquivalenceEligible(counts) { return soleEligibleKind(counts, 'keyof-type-operator'); }
function isTemplateLiteralTypeEquivalenceEligible(counts) { return soleEligibleKind(counts, 'template-literal-type'); }
function isInferTypeEquivalenceEligible(counts) { return soleEligibleKind(counts, 'infer-type'); }

function conditionalTypeSetHash(value, counts) { return shapeSetHash(value, counts, specFor('conditional-type')); }
function indexedAccessTypeSetHash(value, counts) { return shapeSetHash(value, counts, specFor('indexed-access-type')); }
function mappedTypeSetHash(value, counts) { return shapeSetHash(value, counts, specFor('mapped-type')); }
function keyofTypeOperatorSetHash(value, counts) { return shapeSetHash(value, counts, specFor('keyof-type-operator')); }
function templateLiteralTypeSetHash(value, counts) { return shapeSetHash(value, counts, specFor('template-literal-type')); }
function inferTypeSetHash(value, counts) { return shapeSetHash(value, counts, specFor('infer-type')); }

function conditionalTypeRequiredSignals(counts) { return shapeRequiredSignals(counts, specFor('conditional-type')); }
function indexedAccessTypeRequiredSignals(counts) { return shapeRequiredSignals(counts, specFor('indexed-access-type')); }
function mappedTypeRequiredSignals(counts) { return shapeRequiredSignals(counts, specFor('mapped-type')); }
function keyofTypeOperatorRequiredSignals(counts) { return shapeRequiredSignals(counts, specFor('keyof-type-operator')); }
function templateLiteralTypeRequiredSignals(counts) { return shapeRequiredSignals(counts, specFor('template-literal-type')); }
function inferTypeRequiredSignals(counts) { return shapeRequiredSignals(counts, specFor('infer-type')); }

function missingConditionalTypeEquivalenceSignals(value, counts) { return missingShapeEquivalenceSignals(value, counts, specFor('conditional-type')); }
function missingIndexedAccessTypeEquivalenceSignals(value, counts) { return missingShapeEquivalenceSignals(value, counts, specFor('indexed-access-type')); }
function missingMappedTypeEquivalenceSignals(value, counts) { return missingShapeEquivalenceSignals(value, counts, specFor('mapped-type')); }
function missingKeyofTypeOperatorEquivalenceSignals(value, counts) { return missingShapeEquivalenceSignals(value, counts, specFor('keyof-type-operator')); }
function missingTemplateLiteralTypeEquivalenceSignals(value, counts) { return missingShapeEquivalenceSignals(value, counts, specFor('template-literal-type')); }
function missingInferTypeEquivalenceSignals(value, counts) { return missingShapeEquivalenceSignals(value, counts, specFor('infer-type')); }

function conditionalTypeCheckerEvidence(value) { return shapeEvidenceForSpec(value, specFor('conditional-type')); }
function indexedAccessTypeCheckerEvidence(value) { return shapeEvidenceForSpec(value, specFor('indexed-access-type')); }
function mappedTypeCheckerEvidence(value) { return shapeEvidenceForSpec(value, specFor('mapped-type')); }
function keyofTypeOperatorCheckerEvidence(value) { return shapeEvidenceForSpec(value, specFor('keyof-type-operator')); }
function templateLiteralTypeCheckerEvidence(value) { return shapeEvidenceForSpec(value, specFor('template-literal-type')); }
function inferTypeCheckerEvidence(value) { return shapeEvidenceForSpec(value, specFor('infer-type')); }

function shapeSetHash(value, counts, spec) {
  if (!counts[spec.countKey] || missingShapeEquivalenceSignals(value, counts, spec).length) return undefined;
  return hashSemanticValue({ kind: spec.hashKind, [spec.hashArrayKey]: shapesOfKind(value, spec.kind).map((shape) => canonicalShape(shape, spec)) });
}
function shapeRequiredSignals(counts, spec) { return counts[spec.countKey] ? [spec.countSignal, ...spec.fields.map((item) => item.signal)] : []; }
function missingShapeEquivalenceSignals(value, counts, spec) {
  if (!counts[spec.countKey]) return [];
  return missingShapeSignals(shapesOfKind(value, spec.kind), counts[spec.countKey], spec.fields, spec.countSignal);
}
function missingShapeSignals(shapes, count, fields, countSignal) {
  const missing = [];
  if (shapes.length !== count) missing.push(countSignal);
  for (const item of fields) if (shapes.some((shape) => fieldMissing(shape?.[item.key]))) missing.push(item.signal);
  return uniqueStrings(missing);
}
function fieldMissing(value) {
  if (Array.isArray(value)) return !value.length || value.some((item) => item === undefined || item === null);
  return value === undefined || value === null;
}
function shapeEvidenceForSpec(value, spec) {
  const shapes = shapesOfKind(value, spec.kind);
  if (!shapes.length) return {};
  return Object.fromEntries(spec.fields.map((item) => [
    `${spec.evidencePrefix}${item.evidenceSuffix}`,
    shapes.map((shape) => shape[item.key]).filter((fieldValue) => fieldValue !== undefined && fieldValue !== null)
  ]));
}
function canonicalShape(shape, spec) { return Object.fromEntries(['kind', ...spec.fields.map((item) => item.key)].map((key) => [key, shape?.[key]])); }
function soleEligibleSpec(counts) {
  if (!counts.advancedTypeShapeCount) return undefined;
  return ShapeSpecs.find((spec) => counts[spec.countKey] === counts.advancedTypeShapeCount && ShapeSpecs.every((other) => other === spec || !counts[other.countKey]));
}
function soleEligibleKind(counts, kind) { return soleEligibleSpec(counts)?.kind === kind; }
function shapesOfKind(value, kind) { return arrayValue(value.advancedTypeShapes).filter((shape) => shape?.kind === kind); }
function knownAdvancedTypeShapeCount(counts) { return ShapeSpecs.reduce((sum, spec) => sum + (counts[spec.countKey] || 0), 0); }
function specFor(kind) { return ShapeSpecByKind.get(kind); }
function shapeSpec(kind, evidencePrefix, countKey, proofKind, proofLevel, invariant, hashKey, hashKind, hashArrayKey, fields) {
  return { kind, evidencePrefix, countKey, countSignal: countSignal(kind), proofKind, proofLevel, invariant, hashKey, hashKind, hashArrayKey, fields };
}
function countSignal(kind) { return `compiler-${kind}-count`; }
function field(key, evidenceSuffix, signal) { return { key, evidenceSuffix, signal }; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  AdvancedTypeShapeEquivalenceProofKind,
  AdvancedTypeShapeSetEquivalenceProofKind,
  ConditionalTypeEquivalenceProofKind,
  IndexedAccessTypeEquivalenceProofKind,
  InferTypeEquivalenceProofKind,
  KeyofTypeOperatorEquivalenceProofKind,
  MappedTypeEquivalenceProofKind,
  TemplateLiteralTypeEquivalenceProofKind,
  TupleTypeEquivalenceProofKind,
  UnionTypeEquivalenceProofKind,
  IntersectionTypeEquivalenceProofKind,
  advancedTypeCheckerEvidence,
  advancedTypeCheckerInvariant,
  advancedTypeProofKind,
  advancedTypeProofLevel,
  advancedTypeRequiredSignals,
  advancedTypeSetHashes,
  advancedTypeUnsupportedReasonCodes,
  advancedTypeUnsupportedSignals,
  conditionalTypeCheckerEvidence,
  conditionalTypeRequiredSignals,
  conditionalTypeSetHash,
  indexedAccessTypeCheckerEvidence,
  indexedAccessTypeRequiredSignals,
  indexedAccessTypeSetHash,
  inferTypeCheckerEvidence,
  inferTypeRequiredSignals,
  inferTypeSetHash,
  isConditionalTypeEquivalenceEligible,
  isIndexedAccessTypeEquivalenceEligible,
  isInferTypeEquivalenceEligible,
  isKeyofTypeOperatorEquivalenceEligible,
  isMappedTypeEquivalenceEligible,
  isTemplateLiteralTypeEquivalenceEligible,
  keyofTypeOperatorCheckerEvidence,
  keyofTypeOperatorRequiredSignals,
  keyofTypeOperatorSetHash,
  mappedTypeCheckerEvidence,
  mappedTypeRequiredSignals,
  mappedTypeSetHash,
  missingAdvancedTypeEquivalenceSignals,
  missingConditionalTypeEquivalenceSignals,
  missingIndexedAccessTypeEquivalenceSignals,
  missingInferTypeEquivalenceSignals,
  missingKeyofTypeOperatorEquivalenceSignals,
  missingMappedTypeEquivalenceSignals,
  missingTemplateLiteralTypeEquivalenceSignals,
  templateLiteralTypeCheckerEvidence,
  templateLiteralTypeRequiredSignals,
  templateLiteralTypeSetHash
};
