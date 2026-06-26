import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import * as advancedTypes from './projectSymbolGraphCompilerConditionalTypeEquivalence.js';
import * as cls from './projectSymbolGraphCompilerClassShapeEquivalence.js';
import * as enumTypes from './projectSymbolGraphCompilerEnumEquivalence.js';
import * as indexSigs from './projectSymbolGraphCompilerIndexSignatureEquivalence.js';
import * as typeRefs from './projectSymbolGraphCompilerTypeReferenceTargetEquivalence.js';
import {
  missingTypeEquivalenceSignals,
  requiresTypeEquivalenceProof,
  typeEquivalenceCheckerInvariant,
  typeEquivalenceProofKind,
  typeEquivalenceProofLevel,
  typeEquivalenceRequiredSignals,
  unsupportedTypeEquivalenceReasonCodes,
  unsupportedTypeEquivalenceSignals
} from './projectSymbolGraphCompilerTypeEquivalenceProof.js';

function compilerTypeEquivalenceRecord(value, compilerSymbol, counts, source = {}) {
  if (!requiresTypeEquivalenceProof(counts)) return { reasonCodes: [] };
  const evidence = typeEquivalenceCheckerEvidence(value, compilerSymbol, counts);
  const missingSignals = missingTypeEquivalenceSignals(value, compilerSymbol, evidence, counts, source);
  const enumComputedValueProof = enumTypes.computedEnumRuntimeValueProofBinding(value, counts, source);
  const unsupportedSignals = unsupportedTypeEquivalenceSignals(counts, value, source);
  const reasonCodes = unsupportedTypeEquivalenceReasonCodes(counts, missingSignals, value, source);
  const canProve = !missingSignals.length && !unsupportedSignals.length;
  const signatureSetHash = canProve ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerSignatureSetEquivalence.v1', callSignatures: canonicalSignatureRecords(value.callSignatures), constructSignatures: canonicalSignatureRecords(value.constructSignatures), properties: canonicalPropertyRecords(value.properties) }) : undefined;
  const typeParameterSetHash = canProve && counts.typeParameterCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerGenericParameterSetEquivalence.v1', typeParameters: value.typeParameters }) : undefined;
  const propertySetHash = canProve && counts.propertyCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerPublicMemberPropertySetEquivalence.v1', properties: canonicalPropertyRecords(value.properties) }) : undefined;
  const indexSignatureSetHash = canProve ? indexSigs.indexSignatureSetHash(value, counts) : undefined;
  const constructorSetHash = canProve && counts.constructorSignatureCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerConstructorSetEquivalence.v1', constructorSignatures: value.constructorSignatures }) : undefined;
  const classHeritageHash = canProve && counts.classHeritageCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerClassHeritageEquivalence.v1', classHeritage: value.classHeritage }) : undefined;
  const classHashes = canProve ? cls.classShapeSetHashes(value, counts) : {};
  const enumRuntimeShapeHash = canProve ? enumTypes.enumRuntimeShapeHash(value, counts) : undefined;
  const advancedTypeHashes = canProve ? advancedTypes.advancedTypeSetHashes(value, counts) : {};
  const typeReferenceTargetSetHash = canProve ? typeRefs.typeReferenceTargetSetHash(value, counts) : undefined;
  const assignabilityOracleHash = canProve && counts.assignabilityOracleCount > 0 ? value.assignabilityOracleHash : undefined;
  const proof = compactRecord({
    kind: typeEquivalenceProofKind(counts),
    status: canProve ? 'passed' : 'failed',
    proofLevel: typeEquivalenceProofLevel(counts),
    checkerInvariant: typeEquivalenceCheckerInvariant(counts, source),
    requiredSignals: typeEquivalenceRequiredSignals(counts, source),
    missingSignals: nonEmptyArray(missingSignals),
    unsupportedSignals: nonEmptyArray(unsupportedSignals),
    reasonCodes: nonEmptyArray(reasonCodes),
    signatureSetHash,
    typeParameterSetHash,
    propertySetHash,
    indexSignatureSetHash,
    constructorSetHash,
    classHeritageHash,
    ...classHashes,
    enumRuntimeShapeHash,
    enumEmittedRuntimeShapeHash: value.enumEmittedRuntimeShapeHash,
    computedEnumRuntimeValueHash: enumComputedValueProof.computedEnumRuntimeValueHash,
    computedEnumRuntimeValueProof: enumComputedValueProof.proof,
    ...advancedTypeHashes,
    typeReferenceTargetSetHash,
    assignabilityOracleHash,
    assignabilityOracleScope: counts.assignabilityOracleCount > 0 ? 'declared-apparent-type-only' : undefined,
    apiSignatureHash: value.apiSignatureHash,
    compilerSymbolIdentityHash: compilerSymbol?.identityHash,
    typeIdentityHash: value.identityHash,
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    callSignatureCount: counts.callSignatureCount || undefined,
    constructSignatureCount: counts.constructSignatureCount || undefined,
    overloadSignatureCount: counts.overloadSignatureCount || undefined,
    declarationCount: counts.declarationCount,
    typeParameterCount: counts.typeParameterCount || undefined,
    typeParameterDefaultCount: counts.typeParameterDefaultCount || undefined,
    typeParameterConstraintCount: counts.typeParameterConstraintCount || undefined,
    propertyCount: counts.propertyCount || undefined,
    propertyOptionalCount: counts.propertyOptionalCount || undefined,
    propertyReadonlyCount: counts.propertyReadonlyCount || undefined,
    indexSignatureCount: counts.indexSignatureCount || undefined,
    indexSignatureReadonlyCount: counts.indexSignatureReadonlyCount || undefined,
    constructorSignatureCount: counts.constructorSignatureCount || undefined,
    classHeritageCount: counts.classHeritageCount || undefined,
    privateClassMemberCount: counts.privateClassMemberCount || undefined,
    accessorFieldCount: counts.accessorFieldCount || undefined,
    enumMemberCount: counts.enumMemberCount || undefined,
    enumComputedMemberCount: counts.enumComputedMemberCount || undefined,
    advancedTypeShapeCount: counts.advancedTypeShapeCount || undefined,
    typeReferenceTargetCount: counts.typeReferenceTargetCount || undefined,
    conditionalTypeCount: counts.conditionalTypeCount || undefined,
    mappedTypeCount: counts.mappedTypeCount || undefined,
    indexedAccessTypeCount: counts.indexedAccessTypeCount || undefined,
    keyofTypeOperatorCount: counts.keyofTypeOperatorCount || undefined,
    templateLiteralTypeCount: counts.templateLiteralTypeCount || undefined,
    inferTypeCount: counts.inferTypeCount || undefined,
    assignabilityOracleCount: counts.assignabilityOracleCount || undefined,
    assignabilityOracleDirectionCount: counts.assignabilityOracleDirectionCount || undefined,
    evidenceIds: uniqueStrings([...(counts.evidenceIds ?? []), ...enumComputedValueProof.evidenceIds]),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
  return {
    status: canProve ? 'compiler-backed-equivalent' : 'unsupported',
    reasonCodes: canProve ? [] : reasonCodes,
    signatureSetHash,
    typeParameterSetHash,
    propertySetHash,
    indexSignatureSetHash,
    constructorSetHash,
    classHeritageHash,
    ...classHashes,
    enumRuntimeShapeHash,
    enumEmittedRuntimeShapeHash: value.enumEmittedRuntimeShapeHash,
    ...advancedTypeHashes,
    typeReferenceTargetSetHash,
    assignabilityOracleHash,
    proof,
    checkerEvidence: evidence
  };
}

function typeEquivalenceCheckerEvidence(value, compilerSymbol, counts) {
  const signatures = [...arrayValue(value.callSignatures), ...arrayValue(value.constructSignatures)];
  const typeParameters = arrayValue(value.typeParameters);
  const properties = arrayValue(value.properties);
  const constructorSignatures = arrayValue(value.constructorSignatures);
  const classHeritage = arrayValue(value.classHeritage);
  const advancedShapes = arrayValue(value.advancedTypeShapes);
  const typeReferenceTargets = arrayValue(value.typeReferenceTargets);
  const assignabilityOracle = objectValue(value.assignabilityOracle);
  const assignabilityDirections = arrayValue(assignabilityOracle.directions);
  return compactRecord({
    parser: value.parser,
    compilerSymbolIdentityHash: compilerSymbol?.identityHash,
    typeIdentityHash: value.identityHash,
    apiSignatureHash: value.apiSignatureHash,
    declarationCount: counts.declarationCount,
    callSignatureCount: counts.callSignatureCount || undefined,
    constructSignatureCount: counts.constructSignatureCount || undefined,
    overloadSignatureCount: counts.overloadSignatureCount || undefined,
    typeParameterCount: counts.typeParameterCount || undefined,
    typeParameterDefaultCount: counts.typeParameterDefaultCount || undefined,
    typeParameterConstraintCount: counts.typeParameterConstraintCount || undefined,
    propertyCount: counts.propertyCount || undefined,
    propertyOptionalCount: counts.propertyOptionalCount || undefined,
    propertyReadonlyCount: counts.propertyReadonlyCount || undefined,
    ...indexSigs.indexSignatureCheckerEvidence(value, counts),
    constructorSignatureCount: counts.constructorSignatureCount || undefined,
    classHeritageCount: counts.classHeritageCount || undefined,
    ...cls.classShapeCheckerEvidence(value, counts),
    ...enumTypes.enumCheckerEvidence(value, counts),
    advancedTypeShapeCount: counts.advancedTypeShapeCount || undefined,
    advancedTypeShapeKinds: nonEmptyArray(uniqueStrings(advancedShapes.map((shape) => shape.kind))),
    advancedTypeShapeNodeTexts: advancedShapes.map((shape) => shape.nodeText).filter(Boolean),
    advancedTypeShapeTypeTexts: advancedShapes.map((shape) => shape.typeText).filter(Boolean),
    ...advancedTypes.advancedTypeCheckerEvidence(value),
    typeReferenceTargetCount: counts.typeReferenceTargetCount || undefined,
    typeReferenceTargets: nonEmptyArray(typeReferenceTargets),
    ...typeRefs.typeReferenceTargetCheckerEvidence(value, counts),
    assignabilityOracleHash: value.assignabilityOracleHash,
    assignabilityOracleCount: counts.assignabilityOracleCount || undefined,
    assignabilityOracleDirectionCount: counts.assignabilityOracleDirectionCount || undefined,
    assignabilityOracleScope: counts.assignabilityOracleCount > 0 ? 'declared-apparent-type-only' : undefined,
    assignabilityOracleDeclaredTypeText: assignabilityOracle.declaredTypeText,
    assignabilityOracleApparentTypeText: assignabilityOracle.apparentTypeText,
    assignabilityOracleResults: assignabilityDirections.map((direction) => direction.assignable),
    assignabilityOracleDirections: assignabilityDirections,
    assignabilityOracleEquivalentByBidirectionalAssignability: assignabilityOracle.equivalentByBidirectionalAssignability,
    assignabilityOracleAmbiguous: assignabilityOracle.ambiguous,
    assignabilityOracle: counts.assignabilityOracleCount > 0 ? assignabilityOracle : undefined,
    typeParameterNames: typeParameters.map((parameter) => parameter.name),
    typeParameterDefaultTypeTexts: typeParameters.filter((parameter) => parameter.hasDefault).map((parameter) => parameter.defaultTypeText),
    typeParameterConstraintTypeTexts: typeParameters.filter((parameter) => parameter.hasConstraint).map((parameter) => parameter.constraintTypeText),
    propertyNames: properties.map((property) => property.name),
    propertyTypeTexts: properties.map((property) => property.typeText),
    propertyOptionality: properties.map((property) => property.optional),
    propertyReadonly: properties.map((property) => property.readonly),
    propertyDeclarationCounts: properties.map((property) => property.declarations),
    constructorSignatureTexts: constructorSignatures.map((signature) => signature.signatureText),
    constructorParameterTypeTexts: constructorSignatures.map((signature) => (signature.parameters ?? []).map((parameter) => parameter.typeText)),
    classHeritageKinds: classHeritage.map((heritage) => heritage.kind),
    classHeritageTypeTexts: classHeritage.map((heritage) => heritage.typeText),
    classHeritageExpressionTexts: classHeritage.map((heritage) => heritage.expressionText),
    typeParameters: nonEmptyArray(typeParameters),
    properties: nonEmptyArray(properties),
    constructorSignatures: nonEmptyArray(constructorSignatures),
    classHeritage: nonEmptyArray(classHeritage),
    advancedTypeShapes: nonEmptyArray(advancedShapes),
    signatureTexts: signatures.map((signature) => signature.signatureText),
    returnTypeTexts: signatures.map((signature) => signature.returnTypeText),
    parameterTypeTexts: signatures.map((signature) => (signature.parameters ?? []).map((parameter) => parameter.typeText))
  });
}

function canonicalSignatureRecords(signatures) { return arrayValue(signatures).map((signature) => compactRecord({ ...signature, parameters: nonEmptyArray(arrayValue(signature.parameters).map(({ flags: _flags, ...parameter }) => parameter)) })); }
function canonicalPropertyRecords(properties) { return arrayValue(properties).map(({ flags: _flags, ...property }) => property); }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { compilerTypeEquivalenceRecord };
