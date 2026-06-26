import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const TypeReferenceTargetProofKind = 'typescript-checker-public-api-type-reference-target-proof';

const RequiredFields = [
  field('typeReferenceName', 'Names', 'compiler-type-reference-target-names'),
  field('targetSymbolName', 'SymbolNames', 'compiler-type-reference-target-symbol-names'),
  field('targetFullyQualifiedName', 'FullyQualifiedNames', 'compiler-type-reference-target-fully-qualified-names'),
  field('targetDeclarationSourcePath', 'DeclarationSourcePaths', 'compiler-type-reference-target-declaration-source-paths'),
  field('targetDeclarationSpan', 'DeclarationSpans', 'compiler-type-reference-target-declaration-spans'),
  field('targetDeclarationTextHash', 'DeclarationTextHashes', 'compiler-type-reference-target-declaration-text-hashes'),
  field('targetSymbolIdentityHash', 'SymbolIdentityHashes', 'compiler-type-reference-target-symbol-identity-hashes'),
  field('typeReferenceTargetProofHash', 'ProofHashes', 'compiler-type-reference-target-proof-hashes')
];

function typeReferenceTargetSetHash(value, counts) {
  if (!counts.typeReferenceTargetCount || missingTypeReferenceTargetSignals(value, counts).length) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.compilerTypeReferenceTargetSetEquivalence.v1',
    typeReferenceTargets: typeReferenceTargets(value).map(canonicalTypeReferenceTarget)
  });
}

function typeReferenceTargetRequiredSignals(counts) {
  return counts.typeReferenceTargetCount > 0
    ? ['compiler-type-reference-target-count', ...RequiredFields.map((item) => item.signal)]
    : [];
}

function missingTypeReferenceTargetSignals(value, counts) {
  if (!counts.typeReferenceTargetCount) return [];
  const targets = typeReferenceTargets(value);
  const missing = [];
  if (targets.length !== counts.typeReferenceTargetCount) missing.push('compiler-type-reference-target-count');
  for (const item of RequiredFields) if (targets.some((target) => fieldMissing(target?.[item.key]))) missing.push(item.signal);
  return uniqueStrings(missing);
}

function typeReferenceTargetCheckerEvidence(value, counts) {
  if (!counts.typeReferenceTargetCount) return {};
  const targets = typeReferenceTargets(value);
  return compactRecord({
    typeReferenceTargetCount: counts.typeReferenceTargetCount,
    typeReferenceTargets: targets,
    ...Object.fromEntries(RequiredFields.map((item) => [
      `typeReferenceTarget${item.evidenceSuffix}`,
      targets.map((target) => target[item.key]).filter((fieldValue) => fieldValue !== undefined && fieldValue !== null)
    ]))
  });
}

function typeReferenceTargetCheckerInvariant(counts) {
  return counts.typeReferenceTargetCount > 0
    ? 'type reference targets resolve to compiler symbols, declaration spans, and declaration source hashes'
    : undefined;
}

function typeReferenceTargetProofLevel(counts) {
  return counts.typeReferenceTargetCount > 0 ? 'type-reference-target-set' : undefined;
}

function typeReferenceTargetProofKind(counts) {
  return counts.typeReferenceTargetCount > 0 ? TypeReferenceTargetProofKind : undefined;
}

function canonicalTypeReferenceTarget(target) {
  return compactRecord({
    kind: target.kind,
    typeReferenceName: target.typeReferenceName,
    targetSymbolName: target.targetSymbolName,
    targetFullyQualifiedName: target.targetFullyQualifiedName,
    targetDeclarationSourcePath: target.targetDeclarationSourcePath,
    targetDeclarationSpan: target.targetDeclarationSpan,
    targetDeclarationTextHash: target.targetDeclarationTextHash,
    targetSymbolIdentityHash: target.targetSymbolIdentityHash,
    typeReferenceTargetProofHash: target.typeReferenceTargetProofHash
  });
}

function typeReferenceTargets(value) { return arrayValue(value.typeReferenceTargets); }
function field(key, evidenceSuffix, signal) { return { key, evidenceSuffix, signal }; }
function fieldMissing(value) {
  if (Array.isArray(value)) return !value.length || value.some((item) => item === undefined || item === null);
  return value === undefined || value === null;
}
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  TypeReferenceTargetProofKind,
  missingTypeReferenceTargetSignals,
  typeReferenceTargetCheckerEvidence,
  typeReferenceTargetCheckerInvariant,
  typeReferenceTargetProofKind,
  typeReferenceTargetProofLevel,
  typeReferenceTargetRequiredSignals,
  typeReferenceTargetSetHash
};
