import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { compilerAdvancedTypeMetadata } from './projectSymbolGraphCompilerAdvancedTypeMetadata.js';
import { compilerCallableSignatureEquivalenceRecord } from './projectSymbolGraphCompilerCallableSignatureEquivalence.js';
import {
  compilerAssignabilityOracleMetadata,
  compilerClassMemberShapeMetadata,
  compilerDecoratorMetadata,
  compilerEnumShapeMetadata,
  compilerTypeInferenceSyntaxMetadata
} from './projectSymbolGraphCompilerMetadata.js';
import { compilerTypeEquivalenceRecord } from './projectSymbolGraphCompilerTypeEquivalence.js';

function createProjectCompilerGraphRecords(semanticIndex, symbolsById, documentsById, publicContractRegions) {
  const facts = semanticIndex?.facts ?? [];
  const symbolDocuments = symbolSourceDocuments(semanticIndex?.relations ?? [], documentsById);
  const publicSymbolIds = new Set((publicContractRegions ?? []).map((region) => region.symbolId).filter(Boolean));
  const compilerSymbolBySubject = new Map(facts
    .filter((fact) => fact.predicate === 'compilerSymbol')
    .map((fact) => [fact.subjectId, compilerSymbolRecord(fact, symbolsById.get(fact.subjectId), symbolDocuments.get(fact.subjectId), publicSymbolIds)])
    .filter(([, record]) => Boolean(record)));
  return {
    compilerSymbolRecords: uniqueRecords([...compilerSymbolBySubject.values()]),
    compilerTypeRecords: uniqueRecords(facts
      .filter((fact) => fact.predicate === 'compilerType')
      .map((fact) => compilerTypeRecord(fact, symbolsById.get(fact.subjectId), symbolDocuments.get(fact.subjectId), publicSymbolIds, compilerSymbolBySubject.get(fact.subjectId)))
      .filter(Boolean))
  };
}

function compilerSymbolRecord(fact, symbol, document, publicSymbolIds) {
  const value = objectValue(fact.value);
  return compactRecord({
    id: `compiler_symbol_${idFragment(fact.id)}`,
    symbolId: fact.subjectId,
    sourceDocumentId: document?.id,
    sourcePath: document?.path,
    sourceHash: document?.sourceHash,
    symbolName: symbol?.name,
    symbolKind: symbol?.kind,
    identityHash: value.identityHash,
    localName: value.localName,
    targetName: value.targetName,
    fullyQualifiedName: value.fullyQualifiedName,
    flags: value.flags,
    targetFlags: value.targetFlags,
    declarations: value.declarations,
    aliased: value.aliased,
    publicContract: publicSymbolIds.has(fact.subjectId) || symbol?.metadata?.publicContract || undefined,
    factId: fact.id,
    evidenceIds: fact.evidenceIds
  });
}

function compilerTypeRecord(fact, symbol, document, publicSymbolIds, compilerSymbol) {
  const value = objectValue(fact.value);
  const publicContract = publicSymbolIds.has(fact.subjectId) || symbol?.metadata?.publicContract || undefined;
  const sourceBinding = { sourcePath: document?.path, sourceHash: document?.sourceHash, publicContract: publicContract === true };
  const callSignatureCount = arrayLength(value.callSignatures);
  const constructSignatureCount = arrayLength(value.constructSignatures);
  const overloadSignatureCount = callSignatureCount + constructSignatureCount;
  const declarationCount = numberValue(compilerSymbol?.declarations);
  const typeParameterCount = numberValue(value.typeParameterCount) ?? arrayLength(value.typeParameters);
  const typeParameterDefaultCount = numberValue(value.typeParameterDefaultCount) ?? compilerTypeParameterDefaultCount(value.typeParameters);
  const typeParameterConstraintCount = numberValue(value.typeParameterConstraintCount) ?? compilerTypeParameterConstraintCount(value.typeParameters);
  const propertyCount = arrayLength(value.properties);
  const propertyOptionalCount = compilerPropertyOptionalCount(value.properties);
  const propertyReadonlyCount = compilerPropertyReadonlyCount(value.properties);
  const indexSignatureCount = numberValue(value.indexSignatureCount) ?? arrayLength(value.indexSignatures);
  const indexSignatureReadonlyCount = numberValue(value.indexSignatureReadonlyCount) ?? compilerIndexSignatureReadonlyCount(value.indexSignatures);
  const constructorSignatureCount = numberValue(value.constructorSignatureCount) ?? arrayLength(value.constructorSignatures);
  const classHeritageCount = numberValue(value.classHeritageCount) ?? arrayLength(value.classHeritage);
  const advancedType = compilerAdvancedTypeMetadata(value, sourceBinding);
  const enumShape = compilerEnumShapeMetadata(value);
  const typeInferenceSyntax = compilerTypeInferenceSyntaxMetadata(value, sourceBinding);
  const classMemberShape = compilerClassMemberShapeMetadata(value, sourceBinding);
  const decoratorMetadata = compilerDecoratorMetadata(value, sourceBinding);
  const assignabilityOracle = compilerAssignabilityOracleMetadata(value);
  const callableEquivalence = compilerCallableSignatureEquivalenceRecord(value, { callSignatureCount, constructSignatureCount, evidenceIds: fact.evidenceIds }, sourceBinding);
  const typeEquivalence = compilerTypeEquivalenceRecord(value, compilerSymbol, {
    overloadSignatureCount,
    callSignatureCount,
    constructSignatureCount,
    declarationCount,
    typeParameterCount,
    typeParameterDefaultCount,
    typeParameterConstraintCount,
    propertyCount,
    propertyOptionalCount,
    propertyReadonlyCount,
    indexSignatureCount,
    indexSignatureReadonlyCount,
    constructorSignatureCount,
    classHeritageCount,
    ...assignabilityOracle.counts,
    ...classMemberShape.counts,
    ...decoratorMetadata.counts, ...enumShape.counts, ...advancedType.counts, evidenceIds: fact.evidenceIds
  }, sourceBinding);
  const typeEquivalenceStatus = typeEquivalence.status ?? callableEquivalence.status;
  const typeEquivalenceProof = typeEquivalence.proof ?? callableEquivalence.proof;
  const typeEquivalenceCheckerEvidence = typeEquivalence.checkerEvidence ?? callableEquivalence.checkerEvidence;
  return compactRecord({
    id: `compiler_type_${idFragment(fact.id)}`,
    symbolId: fact.subjectId,
    sourceDocumentId: document?.id,
    sourcePath: document?.path,
    sourceHash: document?.sourceHash,
    symbolName: symbol?.name,
    symbolKind: symbol?.kind,
    compilerSymbolIdentityHash: compilerSymbol?.identityHash,
    fullyQualifiedName: compilerSymbol?.fullyQualifiedName,
    localName: compilerSymbol?.localName,
    declarationCount,
    identityHash: value.identityHash,
    typeText: value.typeText,
    apparentTypeText: value.apparentTypeText,
    apiSignatureHash: value.apiSignatureHash,
    callSignatureCount: callSignatureCount || undefined,
    constructSignatureCount: constructSignatureCount || undefined,
    overloadSignatureCount: overloadSignatureCount > 1 ? overloadSignatureCount : undefined,
    typeParameterCount: typeParameterCount || undefined,
    typeParameterDefaultCount: typeParameterDefaultCount || undefined,
    typeParameterConstraintCount: typeParameterConstraintCount || undefined,
    propertyCount: propertyCount || undefined,
    propertyOptionalCount: propertyOptionalCount || undefined,
    propertyReadonlyCount: propertyReadonlyCount || undefined,
    indexSignatureCount: indexSignatureCount || undefined,
    indexSignatureReadonlyCount: indexSignatureReadonlyCount || undefined,
    constructorSignatureCount: constructorSignatureCount || undefined,
    classHeritageCount: classHeritageCount || undefined,
    ...assignabilityOracle.record,
    ...classMemberShape.record,
    ...decoratorMetadata.record,
    ...enumShape.record,
    ...advancedType.record,
    ...typeInferenceSyntax.record,
    typeEquivalenceStatus,
    typeEquivalenceReasonCodes: nonEmptyArray(uniqueStrings([...(typeEquivalence.reasonCodes ?? []), ...(callableEquivalence.reasonCodes ?? [])])),
    typeEquivalenceCallSignatureSetHash: callableEquivalence.callSignatureSetHash,
    typeEquivalenceConstructSignatureSetHash: callableEquivalence.constructSignatureSetHash,
    typeEquivalenceSignatureSetHash: typeEquivalence.signatureSetHash,
    typeEquivalenceTypeParameterSetHash: typeEquivalence.typeParameterSetHash,
    typeEquivalencePropertySetHash: typeEquivalence.propertySetHash,
    typeEquivalenceIndexSignatureSetHash: typeEquivalence.indexSignatureSetHash,
    typeEquivalenceConstructorSetHash: typeEquivalence.constructorSetHash,
    typeEquivalenceClassHeritageHash: typeEquivalence.classHeritageHash,
    typeEquivalenceAssignabilityOracleHash: typeEquivalence.assignabilityOracleHash,
    typeEquivalencePrivateClassMemberSetHash: typeEquivalence.privateClassMemberSetHash,
    typeEquivalenceAccessorFieldSetHash: typeEquivalence.accessorFieldSetHash,
    classPrivateAccessorRuntimeHash: classMemberShape.record.classPrivateAccessorRuntimeHash,
    classPrivateAccessorRuntimeProof: classMemberShape.record.classPrivateAccessorRuntimeProof,
    classPrivateAccessorRuntimeProofReasonCodes: classMemberShape.record.classPrivateAccessorRuntimeProofReasonCodes,
    typeEquivalenceEnumRuntimeShapeHash: typeEquivalence.enumRuntimeShapeHash,
    typeEquivalenceEnumEmittedRuntimeShapeHash: typeEquivalence.enumEmittedRuntimeShapeHash,
    typeEquivalenceConditionalTypeSetHash: typeEquivalence.conditionalTypeSetHash,
    typeEquivalenceIndexedAccessTypeSetHash: typeEquivalence.indexedAccessTypeSetHash,
    typeEquivalenceMappedTypeSetHash: typeEquivalence.mappedTypeSetHash,
    typeEquivalenceKeyofTypeOperatorSetHash: typeEquivalence.keyofTypeOperatorSetHash,
    typeEquivalenceTypeReferenceTargetSetHash: typeEquivalence.typeReferenceTargetSetHash,
    typeEquivalenceTemplateLiteralTypeSetHash: typeEquivalence.templateLiteralTypeSetHash,
    typeEquivalenceInferTypeSetHash: typeEquivalence.inferTypeSetHash,
    typeEquivalenceUnionTypeSetHash: typeEquivalence.unionTypeSetHash,
    typeEquivalenceIntersectionTypeSetHash: typeEquivalence.intersectionTypeSetHash,
    typeEquivalenceTupleTypeSetHash: typeEquivalence.tupleTypeSetHash,
    typeEquivalenceProof,
    typeEquivalenceCheckerEvidence,
    callableSignatureEquivalenceProof: callableEquivalence.proof,
    typeParameters: value.typeParameters,
    properties: value.properties,
    indexSignatures: value.indexSignatures,
    assignabilityOracle: value.assignabilityOracle,
    callSignatures: value.callSignatures,
    constructSignatures: value.constructSignatures,
    constructorSignatures: value.constructorSignatures,
    classHeritage: value.classHeritage,
    privateClassMembers: value.privateClassMembers,
    accessorFieldMembers: value.accessorFieldMembers,
    classMemberShapeProof: classMemberShape.record.classMemberShapeProof,
    decoratorMetadata: decoratorMetadata.record.decoratorMetadata,
    decoratorMetadataProof: decoratorMetadata.record.decoratorMetadataProof,
    decoratorRuntimeExecutionHash: decoratorMetadata.record.decoratorRuntimeExecutionHash,
    decoratorRuntimeExecutionProof: decoratorMetadata.record.decoratorRuntimeExecutionProof,
    decoratorRuntimeExecutionProofReasonCodes: decoratorMetadata.record.decoratorRuntimeExecutionProofReasonCodes,
    enumMembers: value.enumMembers,
    enumEmittedRuntimeShapeHash: value.enumEmittedRuntimeShapeHash,
    enumRuntimeShapeProof: value.enumRuntimeShapeProof,
    typeInferenceSyntax: value.typeInferenceSyntax,
    typeInferenceSyntaxProof: typeInferenceSyntax.record.typeInferenceSyntaxProof,
    typeReferenceTargets: value.typeReferenceTargets,
    flags: value.flags,
    objectFlags: value.objectFlags,
    intrinsicName: value.intrinsicName,
    publicContract,
    factId: fact.id,
    evidenceIds: fact.evidenceIds
  });
}

function compilerTypeParameterDefaultCount(typeParameters) {
  return arrayValue(typeParameters).filter((parameter) => parameter?.hasDefault).length;
}

function compilerTypeParameterConstraintCount(typeParameters) {
  return arrayValue(typeParameters).filter((parameter) => parameter?.hasConstraint).length;
}

function compilerPropertyOptionalCount(properties) {
  return arrayValue(properties).filter((property) => property?.optional === true).length;
}

function compilerPropertyReadonlyCount(properties) {
  return arrayValue(properties).filter((property) => property?.readonly === true).length;
}

function compilerIndexSignatureReadonlyCount(signatures) {
  return arrayValue(signatures).filter((signature) => signature?.readonly === true).length;
}

function symbolSourceDocuments(relations, documentsById) {
  const result = new Map();
  for (const relation of relations) {
    if (!relation?.targetId || result.has(relation.targetId)) continue;
    const document = documentsById.get(relation.sourceId);
    if (document) result.set(relation.targetId, document);
  }
  return result;
}

function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function arrayLength(value) { return Array.isArray(value) ? value.length : 0; }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { createProjectCompilerGraphRecords };
