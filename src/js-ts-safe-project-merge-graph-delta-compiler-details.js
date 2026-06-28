import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

function compilerTypeFingerprint(record) {
  return hashSemanticValue({
    kind: 'frontier.lang.projectGraphDelta.compilerPublicApiFingerprint',
    compilerSymbolIdentityHash: record.compilerSymbolIdentityHash,
    identityHash: record.identityHash,
    apiSignatureHash: record.apiSignatureHash,
    typeParameters: record.typeParameters,
    typeParameterCount: record.typeParameterCount,
    typeParameterDefaultCount: record.typeParameterDefaultCount,
    typeParameterConstraintCount: record.typeParameterConstraintCount,
    propertyCount: record.propertyCount, propertyOptionalCount: record.propertyOptionalCount,
    propertyReadonlyCount: record.propertyReadonlyCount, indexSignatureCount: record.indexSignatureCount,
    indexSignatureReadonlyCount: record.indexSignatureReadonlyCount,
    constructorSignatureCount: record.constructorSignatureCount,
    classHeritageCount: record.classHeritageCount,
    assignabilityOracleCount: record.assignabilityOracleCount,
    assignabilityOracleDirectionCount: record.assignabilityOracleDirectionCount,
    assignabilityOracleHash: record.assignabilityOracleHash,
    assignabilityOracle: record.assignabilityOracle,
    privateClassMemberCount: record.privateClassMemberCount,
    accessorFieldCount: record.accessorFieldCount,
    privateClassMemberShapeHash: record.privateClassMemberShapeHash,
    accessorFieldShapeHash: record.accessorFieldShapeHash,
    classPrivateAccessorRuntimeMissingSourceHash: classPrivateAccessorRuntimeMissingSourceHash(record),
    classPrivateAccessorRuntimeHash: record.classPrivateAccessorRuntimeHash,
    classPrivateAccessorRuntimeProof: record.classPrivateAccessorRuntimeProof,
    classPrivateAccessorRuntimeProofReasonCodes: record.classPrivateAccessorRuntimeProofReasonCodes,
    decoratorMetadataCount: record.decoratorMetadataCount,
    decoratorMetadataHash: record.decoratorMetadataHash,
    decoratorMetadata: record.decoratorMetadata,
    enumMemberCount: record.enumMemberCount,
    enumComputedMemberCount: record.enumComputedMemberCount,
    enumRuntimeShapeHash: record.enumRuntimeShapeHash,
    enumEmittedRuntimeShapeHash: record.enumEmittedRuntimeShapeHash,
    advancedTypeShapeCount: record.advancedTypeShapeCount,
    advancedTypeShapeKinds: record.advancedTypeShapeKinds,
    typeReferenceTargetCount: record.typeReferenceTargetCount,
    typeInferenceSyntaxCount: record.typeInferenceSyntaxCount,
    typeInferenceSyntaxKinds: record.typeInferenceSyntaxKinds,
    satisfiesExpressionCount: record.satisfiesExpressionCount,
    asConstAssertionCount: record.asConstAssertionCount,
    constTypeParameterCount: record.constTypeParameterCount,
    typeInferenceSyntaxHash: record.typeInferenceSyntaxHash,
    conditionalTypeCount: record.conditionalTypeCount, mappedTypeCount: record.mappedTypeCount,
    indexedAccessTypeCount: record.indexedAccessTypeCount, keyofTypeOperatorCount: record.keyofTypeOperatorCount,
    templateLiteralTypeCount: record.templateLiteralTypeCount, inferTypeCount: record.inferTypeCount,
    unionTypeCount: record.unionTypeCount, intersectionTypeCount: record.intersectionTypeCount, tupleTypeCount: record.tupleTypeCount,
    advancedTypeShapes: record.advancedTypeShapes,
    typeText: record.typeText, apparentTypeText: record.apparentTypeText,
    properties: record.properties, indexSignatures: record.indexSignatures,
    callSignatures: record.callSignatures,
    constructSignatures: record.constructSignatures,
    typeEquivalenceCallSignatureSetHash: record.typeEquivalenceCallSignatureSetHash, typeEquivalenceConstructSignatureSetHash: record.typeEquivalenceConstructSignatureSetHash,
    constructorSignatures: record.constructorSignatures,
    classHeritage: record.classHeritage,
    privateClassMembers: record.privateClassMembers,
    accessorFieldMembers: record.accessorFieldMembers,
    classMemberShapeProof: record.classMemberShapeProof,
    enumMembers: record.enumMembers,
    enumRuntimeShapeProof: record.enumRuntimeShapeProof,
    typeEquivalenceConstructorSetHash: record.typeEquivalenceConstructorSetHash,
    typeEquivalenceClassHeritageHash: record.typeEquivalenceClassHeritageHash,
    typeEquivalenceAssignabilityOracleHash: record.typeEquivalenceAssignabilityOracleHash,
    typeEquivalencePrivateClassMemberSetHash: record.typeEquivalencePrivateClassMemberSetHash,
    typeEquivalenceAccessorFieldSetHash: record.typeEquivalenceAccessorFieldSetHash,
    typeEquivalenceIndexSignatureSetHash: record.typeEquivalenceIndexSignatureSetHash,
    typeEquivalenceEnumRuntimeShapeHash: record.typeEquivalenceEnumRuntimeShapeHash,
    typeEquivalenceEnumEmittedRuntimeShapeHash: record.typeEquivalenceEnumEmittedRuntimeShapeHash,
    typeEquivalenceConditionalTypeSetHash: record.typeEquivalenceConditionalTypeSetHash, typeEquivalenceIndexedAccessTypeSetHash: record.typeEquivalenceIndexedAccessTypeSetHash,
    typeEquivalenceMappedTypeSetHash: record.typeEquivalenceMappedTypeSetHash, typeEquivalenceKeyofTypeOperatorSetHash: record.typeEquivalenceKeyofTypeOperatorSetHash,
    typeEquivalenceTypeReferenceTargetSetHash: record.typeEquivalenceTypeReferenceTargetSetHash,
    typeEquivalenceTemplateLiteralTypeSetHash: record.typeEquivalenceTemplateLiteralTypeSetHash, typeEquivalenceInferTypeSetHash: record.typeEquivalenceInferTypeSetHash,
    typeEquivalenceUnionTypeSetHash: record.typeEquivalenceUnionTypeSetHash, typeEquivalenceIntersectionTypeSetHash: record.typeEquivalenceIntersectionTypeSetHash, typeEquivalenceTupleTypeSetHash: record.typeEquivalenceTupleTypeSetHash,
    typeInferenceSyntax: record.typeInferenceSyntax,
    flags: record.flags,
    objectFlags: record.objectFlags,
    intrinsicName: record.intrinsicName
  });
}

function compilerTypeDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    key: compilerTypeIdentityKey(record),
    symbolId: record.symbolId,
    symbolName: record.symbolName,
    symbolKind: record.symbolKind,
    fullyQualifiedName: record.fullyQualifiedName,
    compilerSymbolIdentityHash: record.compilerSymbolIdentityHash,
    typeIdentityHash: record.identityHash,
    apiSignatureHash: record.apiSignatureHash,
    typeText: record.typeText,
    apparentTypeText: record.apparentTypeText,
    typeParameters: record.typeParameters,
    typeParameterCount: record.typeParameterCount,
    typeParameterDefaultCount: record.typeParameterDefaultCount,
    typeParameterConstraintCount: record.typeParameterConstraintCount,
    propertyCount: record.propertyCount, propertyOptionalCount: record.propertyOptionalCount,
    propertyReadonlyCount: record.propertyReadonlyCount, indexSignatureCount: record.indexSignatureCount,
    indexSignatureReadonlyCount: record.indexSignatureReadonlyCount,
    constructorSignatureCount: record.constructorSignatureCount,
    classHeritageCount: record.classHeritageCount,
    assignabilityOracleCount: record.assignabilityOracleCount,
    assignabilityOracleDirectionCount: record.assignabilityOracleDirectionCount,
    assignabilityOracleHash: record.assignabilityOracleHash,
    assignabilityOracle: record.assignabilityOracle,
    privateClassMemberCount: record.privateClassMemberCount,
    accessorFieldCount: record.accessorFieldCount,
    privateClassMemberShapeHash: record.privateClassMemberShapeHash,
    accessorFieldShapeHash: record.accessorFieldShapeHash,
    classPrivateAccessorRuntimeMissingSourceHash: classPrivateAccessorRuntimeMissingSourceHash(record),
    classPrivateAccessorRuntimeHash: record.classPrivateAccessorRuntimeHash,
    classPrivateAccessorRuntimeProof: record.classPrivateAccessorRuntimeProof,
    classPrivateAccessorRuntimeProofReasonCodes: record.classPrivateAccessorRuntimeProofReasonCodes,
    decoratorMetadataCount: record.decoratorMetadataCount,
    decoratorMetadataHash: record.decoratorMetadataHash,
    decoratorRuntimeExecutionHash: record.decoratorRuntimeExecutionHash,
    decoratorRuntimeExecutionProof: record.decoratorRuntimeExecutionProof,
    decoratorRuntimeExecutionProofReasonCodes: record.decoratorRuntimeExecutionProofReasonCodes,
    enumKind: record.enumKind,
    constEnum: record.constEnum,
    enumMemberCount: record.enumMemberCount,
    enumNumericMemberCount: record.enumNumericMemberCount,
    enumStringMemberCount: record.enumStringMemberCount,
    enumAutoMemberCount: record.enumAutoMemberCount,
    enumComputedMemberCount: record.enumComputedMemberCount,
    enumRuntimeShapeHash: record.enumRuntimeShapeHash,
    enumEmittedRuntimeShapeHash: record.enumEmittedRuntimeShapeHash,
    advancedTypeShapeCount: record.advancedTypeShapeCount,
    advancedTypeShapeKinds: record.advancedTypeShapeKinds,
    typeReferenceTargetCount: record.typeReferenceTargetCount,
    typeReferenceTargets: record.typeReferenceTargets,
    typeInferenceSyntaxCount: record.typeInferenceSyntaxCount,
    typeInferenceSyntaxKinds: record.typeInferenceSyntaxKinds,
    satisfiesExpressionCount: record.satisfiesExpressionCount,
    asConstAssertionCount: record.asConstAssertionCount,
    constTypeParameterCount: record.constTypeParameterCount,
    typeInferenceSyntaxHash: record.typeInferenceSyntaxHash,
    conditionalTypeCount: record.conditionalTypeCount, mappedTypeCount: record.mappedTypeCount,
    indexedAccessTypeCount: record.indexedAccessTypeCount, keyofTypeOperatorCount: record.keyofTypeOperatorCount,
    templateLiteralTypeCount: record.templateLiteralTypeCount, inferTypeCount: record.inferTypeCount,
    unionTypeCount: record.unionTypeCount, intersectionTypeCount: record.intersectionTypeCount, tupleTypeCount: record.tupleTypeCount,
    advancedTypeShapes: record.advancedTypeShapes,
    properties: record.properties, indexSignatures: record.indexSignatures,
    callSignatures: record.callSignatures,
    constructSignatures: record.constructSignatures,
    typeEquivalenceStatus: record.typeEquivalenceStatus,
    typeEquivalenceReasonCodes: record.typeEquivalenceReasonCodes,
    typeEquivalenceSignatureSetHash: record.typeEquivalenceSignatureSetHash,
    typeEquivalenceCallSignatureSetHash: record.typeEquivalenceCallSignatureSetHash, typeEquivalenceConstructSignatureSetHash: record.typeEquivalenceConstructSignatureSetHash,
    typeEquivalenceTypeParameterSetHash: record.typeEquivalenceTypeParameterSetHash,
    typeEquivalencePropertySetHash: record.typeEquivalencePropertySetHash,
    typeEquivalenceConstructorSetHash: record.typeEquivalenceConstructorSetHash,
    typeEquivalenceClassHeritageHash: record.typeEquivalenceClassHeritageHash,
    typeEquivalenceAssignabilityOracleHash: record.typeEquivalenceAssignabilityOracleHash,
    typeEquivalencePrivateClassMemberSetHash: record.typeEquivalencePrivateClassMemberSetHash,
    typeEquivalenceAccessorFieldSetHash: record.typeEquivalenceAccessorFieldSetHash,
    typeEquivalenceIndexSignatureSetHash: record.typeEquivalenceIndexSignatureSetHash,
    typeEquivalenceEnumRuntimeShapeHash: record.typeEquivalenceEnumRuntimeShapeHash,
    typeEquivalenceEnumEmittedRuntimeShapeHash: record.typeEquivalenceEnumEmittedRuntimeShapeHash,
    typeEquivalenceConditionalTypeSetHash: record.typeEquivalenceConditionalTypeSetHash, typeEquivalenceIndexedAccessTypeSetHash: record.typeEquivalenceIndexedAccessTypeSetHash,
    typeEquivalenceMappedTypeSetHash: record.typeEquivalenceMappedTypeSetHash, typeEquivalenceKeyofTypeOperatorSetHash: record.typeEquivalenceKeyofTypeOperatorSetHash,
    typeEquivalenceTypeReferenceTargetSetHash: record.typeEquivalenceTypeReferenceTargetSetHash,
    typeEquivalenceTemplateLiteralTypeSetHash: record.typeEquivalenceTemplateLiteralTypeSetHash, typeEquivalenceInferTypeSetHash: record.typeEquivalenceInferTypeSetHash,
    typeEquivalenceUnionTypeSetHash: record.typeEquivalenceUnionTypeSetHash, typeEquivalenceIntersectionTypeSetHash: record.typeEquivalenceIntersectionTypeSetHash, typeEquivalenceTupleTypeSetHash: record.typeEquivalenceTupleTypeSetHash,
    typeInferenceSyntax: record.typeInferenceSyntax,
    typeInferenceSyntaxProof: record.typeInferenceSyntaxProof,
    enumMembers: record.enumMembers,
    enumRuntimeShapeProof: record.enumRuntimeShapeProof,
    typeEquivalenceProof: record.typeEquivalenceProof,
    typeEquivalenceCheckerEvidence: record.typeEquivalenceCheckerEvidence,
    constructorSignatures: record.constructorSignatures,
    classHeritage: record.classHeritage,
    privateClassMembers: record.privateClassMembers,
    accessorFieldMembers: record.accessorFieldMembers,
    classMemberShapeProof: record.classMemberShapeProof,
    decoratorMetadata: record.decoratorMetadata,
    decoratorMetadataProof: record.decoratorMetadataProof,
    sourceHash: record.sourceHash,
    evidenceIds: record.evidenceIds
  });
}

function compilerTypeIdentityKey(record) { return stableKey(['compiler-public-type', record?.fullyQualifiedName ?? record?.localName ?? record?.symbolName ?? record?.symbolId]); }
function classPrivateAccessorRuntimeMissingSourceHash(record) {
  if (!requiresClassPrivateAccessorRuntimeProof(record) || hasPassedClassPrivateAccessorRuntimeProof(record)) return undefined;
  return record?.sourceHash;
}
function requiresClassPrivateAccessorRuntimeProof(record) {
  return Boolean(record && (record.privateClassMemberCount > 0 || record.accessorFieldCount > 0));
}
function hasPassedClassPrivateAccessorRuntimeProof(record) {
  const proof = record?.classPrivateAccessorRuntimeProof;
  return Boolean(proof
    && proof.status === 'passed'
    && record.classPrivateAccessorRuntimeHash
    && proof.classPrivateAccessorRuntimeHash === record.classPrivateAccessorRuntimeHash
    && proof.sourcePath === record.sourcePath
    && proof.sourceHash === record.sourceHash
    && proof.autoMergeClaim === false
    && proof.semanticEquivalenceClaim === false
    && proof.runtimeEquivalenceClaim === false
    && proof.privateMemberRuntimeEquivalenceClaim === false
    && proof.accessorRuntimeEquivalenceClaim === false
    && !(record.classPrivateAccessorRuntimeProofReasonCodes?.length));
}
function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

export { compilerTypeDetails, compilerTypeFingerprint };
