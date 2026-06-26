import * as advancedTypes from './projectSymbolGraphCompilerConditionalTypeEquivalence.js';
import * as cls from './projectSymbolGraphCompilerClassShapeEquivalence.js';
import * as enumTypes from './projectSymbolGraphCompilerEnumEquivalence.js';
import * as indexSigs from './projectSymbolGraphCompilerIndexSignatureEquivalence.js';
import * as typeRefs from './projectSymbolGraphCompilerTypeReferenceTargetEquivalence.js';

const GenericTypeEquivalenceProofKind = 'typescript-checker-public-api-generic-parameter-equivalence';
const SignatureAndGenericTypeEquivalenceProofKind = 'typescript-checker-public-api-signature-set-and-generic-parameter-equivalence';
const MemberPropertyTypeEquivalenceProofKind = 'typescript-checker-public-api-member-property-signature-equivalence';
const AssignabilityOracleEquivalenceProofKind = 'typescript-checker-public-api-assignability-oracle-equivalence';

function requiresTypeEquivalenceProof(counts) {
  return counts.overloadSignatureCount > 1 || counts.declarationCount > 1 || counts.typeParameterCount > 0 || counts.propertyCount > 0
    || counts.indexSignatureCount > 0 || counts.constructorSignatureCount > 0 || counts.classHeritageCount > 0 || counts.privateClassMemberCount > 0 || counts.accessorFieldCount > 0 || counts.enumMemberCount > 0 || counts.advancedTypeShapeCount > 0 || counts.typeReferenceTargetCount > 0 || counts.assignabilityOracleCount > 0;
}

function unsupportedTypeEquivalenceReasonCodes(counts, missingSignals = [], value = {}, source = {}) {
  const reasonCodes = [];
  if (counts.overloadSignatureCount > 1) reasonCodes.push('typescript-overload-signature-set-equivalence-unproven');
  if (counts.declarationCount > 1) reasonCodes.push('typescript-exported-declaration-equivalence-unproven');
  if (counts.typeParameterCount > 0) reasonCodes.push('typescript-generic-type-parameter-equivalence-unproven');
  if (counts.typeParameterDefaultCount > 0) reasonCodes.push('typescript-generic-type-parameter-default-equivalence-unproven');
  if (counts.typeParameterConstraintCount > 0) reasonCodes.push('typescript-generic-type-parameter-constraint-equivalence-unproven');
  if (counts.propertyCount > 0) reasonCodes.push('typescript-public-member-property-signature-equivalence-unproven');
  reasonCodes.push(...indexSigs.indexSignatureUnsupportedReasonCodes(counts));
  if (counts.constructorSignatureCount > 0) reasonCodes.push('typescript-public-constructor-signature-equivalence-unproven');
  if (counts.classHeritageCount > 0) reasonCodes.push('typescript-public-class-heritage-equivalence-unproven');
  reasonCodes.push(...cls.classShapeUnsupportedReasonCodes(counts));
  reasonCodes.push(...enumTypes.enumUnsupportedReasonCodes(value, counts, source));
  reasonCodes.push(...advancedTypes.advancedTypeUnsupportedReasonCodes(counts));
  if (counts.typeReferenceTargetCount > 0) reasonCodes.push('typescript-public-api-type-reference-target-proof-unproven');
  if (counts.assignabilityOracleCount > 0) reasonCodes.push('typescript-public-api-assignability-oracle-equivalence-unproven');
  for (const signal of missingSignals) reasonCodes.push(`typescript-${signal}-missing`);
  return reasonCodes;
}

function typeEquivalenceProofKind(counts) {
  const advancedTypeProofKind = advancedTypes.advancedTypeProofKind(counts);
  if (advancedTypeProofKind) return advancedTypeProofKind;
  const enumProofKind = enumTypes.enumProofKind(counts);
  const typeReferenceTargetProofKind = typeRefs.typeReferenceTargetProofKind(counts);
  const indexSignatureProofKind = indexSigs.indexSignatureProofKind(counts);
  const hasSignatureProof = counts.overloadSignatureCount > 1 || counts.declarationCount > 1;
  const hasGenericProof = counts.typeParameterCount > 0;
  const hasPropertyProof = counts.propertyCount > 0;
  const hasClassProof = counts.constructorSignatureCount > 0 || counts.classHeritageCount > 0 || counts.privateClassMemberCount > 0 || counts.accessorFieldCount > 0;
  const hasAssignabilityProof = counts.assignabilityOracleCount > 0;
  if (enumProofKind && !hasSignatureProof && !hasGenericProof && !hasPropertyProof && !indexSignatureProofKind && !hasClassProof) return enumProofKind;
  if (typeReferenceTargetProofKind && !hasSignatureProof && !hasGenericProof && !hasPropertyProof && !indexSignatureProofKind && !hasClassProof && !enumProofKind) return typeReferenceTargetProofKind;
  if (hasSignatureProof && hasGenericProof) return SignatureAndGenericTypeEquivalenceProofKind;
  if (hasGenericProof) return GenericTypeEquivalenceProofKind;
  if (hasClassProof && !hasPropertyProof) return 'typescript-checker-public-api-class-shape-equivalence';
  if (indexSignatureProofKind && !hasPropertyProof) return indexSignatureProofKind;
  if (hasPropertyProof) return MemberPropertyTypeEquivalenceProofKind;
  if (hasAssignabilityProof) return AssignabilityOracleEquivalenceProofKind;
  return 'typescript-checker-public-api-signature-set-equivalence';
}

function typeEquivalenceProofLevel(counts) {
  const levels = [];
  if (counts.overloadSignatureCount > 1 || counts.declarationCount > 1) levels.push('signature-set');
  if (counts.typeParameterCount > 0) levels.push('generic-parameter-set');
  if (counts.propertyCount > 0) levels.push('member-property-set');
  const indexSignatureLevel = indexSigs.indexSignatureProofLevel(counts);
  if (indexSignatureLevel) levels.push(indexSignatureLevel);
  if (counts.constructorSignatureCount > 0) levels.push('constructor-signature-set');
  if (counts.classHeritageCount > 0) levels.push('class-heritage-set');
  const clsLevel = cls.classShapeProofLevel(counts);
  if (clsLevel) levels.push(clsLevel);
  const enumLevel = enumTypes.enumProofLevel(counts);
  if (enumLevel) levels.push(enumLevel);
  const advancedTypeLevel = advancedTypes.advancedTypeProofLevel(counts);
  if (advancedTypeLevel) levels.push(advancedTypeLevel);
  const typeReferenceTargetLevel = typeRefs.typeReferenceTargetProofLevel(counts);
  if (typeReferenceTargetLevel) levels.push(typeReferenceTargetLevel);
  if (counts.assignabilityOracleCount > 0) levels.push('declared-apparent-assignability-oracle');
  return `typescript-checker-public-api-${levels.length ? levels.join('-and-') : 'signature-set'}`;
}

function typeEquivalenceCheckerInvariant(counts, source = {}) {
  const invariants = [];
  if (source.publicContract) invariants.push('public API source path/hash bound');
  if (counts.overloadSignatureCount > 1 || counts.declarationCount > 1) invariants.push('signature/return/parameter texts complete');
  if (counts.typeParameterCount > 0) invariants.push('generic defaults/constraints complete');
  if (counts.propertyCount > 0) invariants.push('member names/types/modifiers complete');
  const indexSignatureInvariant = indexSigs.indexSignatureCheckerInvariant(counts);
  if (indexSignatureInvariant) invariants.push(indexSignatureInvariant);
  if (counts.constructorSignatureCount > 0) invariants.push('constructor signatures complete');
  if (counts.classHeritageCount > 0) invariants.push('heritage type texts complete');
  const clsInvariant = cls.classShapeCheckerInvariant(counts);
  if (clsInvariant) invariants.push(clsInvariant);
  const enumInvariant = enumTypes.enumCheckerInvariant(counts);
  if (enumInvariant) invariants.push(enumInvariant);
  const advancedTypeInvariant = advancedTypes.advancedTypeCheckerInvariant(counts);
  if (advancedTypeInvariant) invariants.push(advancedTypeInvariant);
  const typeReferenceTargetInvariant = typeRefs.typeReferenceTargetCheckerInvariant(counts);
  if (typeReferenceTargetInvariant) invariants.push(typeReferenceTargetInvariant);
  if (counts.assignabilityOracleCount > 0) invariants.push('declared/apparent type texts and bidirectional checker assignability complete');
  return invariants.join('; ');
}

function typeEquivalenceRequiredSignals(counts, source = {}) {
  return [
    source.publicContract ? 'compiler-public-api-source-path' : undefined,
    source.publicContract ? 'compiler-public-api-source-hash' : undefined,
    'compiler-symbol-identity-hash', 'compiler-symbol-declaration-count', 'compiler-type-identity-hash', 'compiler-api-signature-hash',
    counts.overloadSignatureCount > 1 || counts.declarationCount > 1 ? 'compiler-overload-signature-count' : undefined,
    counts.typeParameterCount > 0 ? 'compiler-type-parameter-count' : undefined,
    counts.typeParameterCount > 0 ? 'compiler-type-parameter-names' : undefined,
    counts.typeParameterDefaultCount > 0 ? 'compiler-type-parameter-default-type-texts' : undefined,
    counts.typeParameterConstraintCount > 0 ? 'compiler-type-parameter-constraint-type-texts' : undefined,
    counts.propertyCount > 0 ? 'compiler-member-property-count' : undefined,
    counts.propertyCount > 0 ? 'compiler-member-property-names' : undefined,
    counts.propertyCount > 0 ? 'compiler-member-property-type-texts' : undefined,
    counts.propertyCount > 0 ? 'compiler-member-property-optionality' : undefined,
    counts.propertyCount > 0 ? 'compiler-member-property-readonly' : undefined,
    ...indexSigs.indexSignatureRequiredSignals(counts),
    counts.constructorSignatureCount > 0 ? 'compiler-constructor-signature-count' : undefined,
    counts.constructorSignatureCount > 0 ? 'compiler-constructor-signature-texts' : undefined,
    counts.constructorSignatureCount > 0 ? 'compiler-constructor-parameter-type-texts' : undefined,
    counts.classHeritageCount > 0 ? 'compiler-class-heritage-count' : undefined,
    counts.classHeritageCount > 0 ? 'compiler-class-heritage-type-texts' : undefined,
    ...cls.classShapeRequiredSignals(counts),
    ...enumTypes.enumRequiredSignals(counts),
    ...advancedTypes.advancedTypeRequiredSignals(counts),
    ...typeRefs.typeReferenceTargetRequiredSignals(counts),
    counts.advancedTypeShapeCount > 0 ? 'compiler-advanced-type-shape-node-texts' : undefined,
    counts.advancedTypeShapeCount > 0 ? 'compiler-advanced-type-shape-type-texts' : undefined,
    counts.assignabilityOracleCount > 0 ? 'compiler-assignability-oracle-hash' : undefined,
    counts.assignabilityOracleCount > 0 ? 'compiler-assignability-oracle-direction-count' : undefined,
    counts.assignabilityOracleCount > 0 ? 'compiler-assignability-oracle-directions' : undefined,
    counts.assignabilityOracleCount > 0 ? 'compiler-assignability-oracle-type-texts' : undefined,
    counts.assignabilityOracleCount > 0 ? 'compiler-assignability-oracle-result' : undefined,
    counts.assignabilityOracleCount > 0 ? 'compiler-assignability-oracle-unambiguous-result' : undefined,
    'compiler-signature-texts', 'compiler-return-type-texts', 'compiler-parameter-type-texts'
  ].filter(Boolean);
}

function missingTypeEquivalenceSignals(value, compilerSymbol, evidence, counts, source = {}) {
  const missing = [];
  if (source.publicContract && !source.sourcePath) missing.push('compiler-public-api-source-path');
  if (source.publicContract && !source.sourceHash) missing.push('compiler-public-api-source-hash');
  if (!compilerSymbol?.identityHash) missing.push('compiler-symbol-identity-hash');
  if (!Number.isFinite(counts.declarationCount)) missing.push('compiler-symbol-declaration-count');
  if (!value.identityHash) missing.push('compiler-type-identity-hash');
  if (!value.apiSignatureHash) missing.push('compiler-api-signature-hash');
  if (counts.declarationCount > 1 && counts.overloadSignatureCount <= 1) missing.push('compiler-overload-signature-count');
  if (counts.overloadSignatureCount > 1 && evidence.signatureTexts.length !== counts.overloadSignatureCount) missing.push('compiler-overload-signature-count');
  if (evidence.signatureTexts.length !== counts.overloadSignatureCount || evidence.signatureTexts.some((text) => !text)) missing.push('compiler-signature-texts');
  if (evidence.returnTypeTexts.length !== counts.overloadSignatureCount || evidence.returnTypeTexts.some((text) => !text)) missing.push('compiler-return-type-texts');
  if (!compilerSignatureParametersCovered(value.callSignatures) || !compilerSignatureParametersCovered(value.constructSignatures)) missing.push('compiler-parameter-type-texts');
  if (counts.typeParameterCount > 0 && (evidence.typeParameterNames.length !== counts.typeParameterCount || evidence.typeParameterNames.some((text) => !text))) missing.push('compiler-type-parameter-names');
  if (counts.typeParameterDefaultCount > 0 && (evidence.typeParameterDefaultTypeTexts.length !== counts.typeParameterDefaultCount || evidence.typeParameterDefaultTypeTexts.some((text) => !text))) missing.push('compiler-type-parameter-default-type-texts');
  if (counts.typeParameterConstraintCount > 0 && (evidence.typeParameterConstraintTypeTexts.length !== counts.typeParameterConstraintCount || evidence.typeParameterConstraintTypeTexts.some((text) => !text))) missing.push('compiler-type-parameter-constraint-type-texts');
  if (counts.propertyCount > 0 && evidence.propertyNames.length !== counts.propertyCount) missing.push('compiler-member-property-count');
  if (counts.propertyCount > 0 && (evidence.propertyNames.length !== counts.propertyCount || evidence.propertyNames.some((text) => !text))) missing.push('compiler-member-property-names');
  if (counts.propertyCount > 0 && (evidence.propertyTypeTexts.length !== counts.propertyCount || evidence.propertyTypeTexts.some((text) => !text))) missing.push('compiler-member-property-type-texts');
  if (counts.propertyCount > 0 && !compilerBooleanSignalsCovered(evidence.propertyOptionality, counts.propertyCount)) missing.push('compiler-member-property-optionality');
  if (counts.propertyCount > 0 && !compilerBooleanSignalsCovered(evidence.propertyReadonly, counts.propertyCount)) missing.push('compiler-member-property-readonly');
  missing.push(...indexSigs.missingIndexSignatureEquivalenceSignals(value, counts, evidence));
  if (counts.constructorSignatureCount > 0 && evidence.constructorSignatureTexts.length !== counts.constructorSignatureCount) missing.push('compiler-constructor-signature-count');
  if (counts.constructorSignatureCount > 0 && (evidence.constructorSignatureTexts.length !== counts.constructorSignatureCount || evidence.constructorSignatureTexts.some((text) => !text))) missing.push('compiler-constructor-signature-texts');
  if (counts.constructorSignatureCount > 0 && !compilerConstructorParametersCovered(value.constructorSignatures)) missing.push('compiler-constructor-parameter-type-texts');
  if (counts.classHeritageCount > 0 && evidence.classHeritageTypeTexts.length !== counts.classHeritageCount) missing.push('compiler-class-heritage-count');
  if (counts.classHeritageCount > 0 && (evidence.classHeritageTypeTexts.length !== counts.classHeritageCount || evidence.classHeritageTypeTexts.some((text) => !text))) missing.push('compiler-class-heritage-type-texts');
  missing.push(...cls.missingClassShapeEquivalenceSignals(value, counts, evidence));
  missing.push(...enumTypes.missingEnumEquivalenceSignals(value, counts));
  if (counts.advancedTypeShapeCount > 0 && evidence.advancedTypeShapeNodeTexts.length !== counts.advancedTypeShapeCount) missing.push('compiler-advanced-type-shape-node-texts');
  if (counts.advancedTypeShapeCount > 0 && evidence.advancedTypeShapeTypeTexts.length !== counts.advancedTypeShapeCount) missing.push('compiler-advanced-type-shape-type-texts');
  missing.push(...advancedTypes.missingAdvancedTypeEquivalenceSignals(value, counts));
  missing.push(...typeRefs.missingTypeReferenceTargetSignals(value, counts));
  if (counts.assignabilityOracleCount > 0) {
    const oracle = objectValue(value.assignabilityOracle);
    const directions = arrayValue(oracle.directions);
    if (!value.assignabilityOracleHash) missing.push('compiler-assignability-oracle-hash');
    if (directions.length !== counts.assignabilityOracleDirectionCount || directions.length !== 2) missing.push('compiler-assignability-oracle-direction-count');
    if (directions.length !== 2 || directions.some((direction) => !direction.direction || !direction.fromTypeText || !direction.toTypeText)) missing.push('compiler-assignability-oracle-directions');
    if (!oracle.declaredTypeText || !oracle.apparentTypeText) missing.push('compiler-assignability-oracle-type-texts');
    if (directions.some((direction) => typeof direction.assignable !== 'boolean')) missing.push('compiler-assignability-oracle-result');
    if (oracle.ambiguous === true || oracle.equivalentByBidirectionalAssignability !== true) missing.push('compiler-assignability-oracle-unambiguous-result');
  }
  return uniqueStrings(missing);
}

function unsupportedTypeEquivalenceSignals(counts, value = {}, source = {}) {
  return [...enumTypes.enumUnsupportedSignals(value, counts, source), ...advancedTypes.advancedTypeUnsupportedSignals(counts)];
}
function compilerSignatureParametersCovered(signatures) { return arrayValue(signatures).every((signature) => arrayValue(signature.parameters).every((parameter) => Boolean(parameter.typeText))); }
function compilerConstructorParametersCovered(signatures) { return arrayValue(signatures).every((signature) => arrayValue(signature.parameters).every((parameter) => Boolean(parameter.typeText))); }
function compilerBooleanSignalsCovered(values, count) { return Array.isArray(values) && values.length === count && values.every((value) => typeof value === 'boolean'); }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  missingTypeEquivalenceSignals,
  requiresTypeEquivalenceProof,
  typeEquivalenceCheckerInvariant,
  typeEquivalenceProofKind,
  typeEquivalenceProofLevel,
  typeEquivalenceRequiredSignals,
  unsupportedTypeEquivalenceReasonCodes,
  unsupportedTypeEquivalenceSignals
};
