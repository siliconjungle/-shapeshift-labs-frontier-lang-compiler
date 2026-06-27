import { compactRecord } from './js-ts-safe-merge-context.js';
import { missingDeclarationEmitParityEvidence } from './js-ts-safe-project-merge-declaration-emit-parity.js';
import { compilerTypeDetails, compilerTypeFingerprint } from './js-ts-safe-project-merge-graph-delta-compiler-details.js';
import { missingSharedCompilerTypeInferenceSyntaxEvidence } from './js-ts-safe-project-merge-graph-delta-inference-syntax.js';

function publicCompilerTypeDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph, options = {}) {
  return changedIdentityConflicts({
    code: 'project-public-compiler-type-delta-conflict',
    label: 'public compiler type',
    baseRecords: publicCompilerTypeRecords(baseGraph.compilerTypeRecords),
    workerRecords: publicCompilerTypeRecords(workerGraph.compilerTypeRecords),
    headRecords: publicCompilerTypeRecords(headGraph.compilerTypeRecords),
    outputRecords: publicCompilerTypeRecords(outputGraph?.compilerTypeRecords),
    identityKey: compilerTypeIdentityKey,
    fingerprint: compilerTypeFingerprint,
    details: compilerTypeDetails,
    declarationEmitParityProof: options.declarationEmitParityProof, requireDeclarationEmitParity: options.requireDeclarationEmitParity === true || Boolean(options.declarationEmitParityProof)
  });
}

function changedIdentityConflicts(input) {
  const base = recordsByIdentityKey(input.baseRecords, input.identityKey);
  const worker = recordsByIdentityKey(input.workerRecords, input.identityKey);
  const head = recordsByIdentityKey(input.headRecords, input.identityKey);
  const output = recordsByIdentityKey(input.outputRecords, input.identityKey);
  const keys = uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]);
  return keys.flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const baseFingerprint = optionalFingerprint(baseRecord, input.fingerprint);
    const workerFingerprint = optionalFingerprint(workerRecord, input.fingerprint);
    const headFingerprint = optionalFingerprint(headRecord, input.fingerprint);
    if (baseFingerprint === workerFingerprint || baseFingerprint === headFingerprint) return [];
    if (workerFingerprint === headFingerprint) {
      const missingTypeEvidence = missingSharedCompilerTypeEquivalenceEvidence(workerRecord, headRecord);
      const missingInferenceSyntaxEvidence = missingSharedCompilerTypeInferenceSyntaxEvidence(workerRecord, headRecord);
      const missingDecoratorRuntimeEvidence = missingSharedDecoratorRuntimeExecutionEvidence(baseRecord, workerRecord, headRecord);
      const missingDeclarationEvidence = missingDeclarationEmitParityEvidence(input.declarationEmitParityProof, input);
      if (!missingTypeEvidence && !missingInferenceSyntaxEvidence && !missingDecoratorRuntimeEvidence && !missingDeclarationEvidence) return [];
      const missingEvidence = missingDeclarationEvidence ?? missingTypeEvidence ?? missingInferenceSyntaxEvidence ?? missingDecoratorRuntimeEvidence;
      return [projectGraphDeltaConflict({
        ...input,
        identityKey,
        baseRecord,
        workerRecord,
        headRecord,
        outputRecord: output.get(identityKey),
        reasonCode: missingEvidence.reasonCode,
        typeEquivalenceEvidence: missingTypeEvidence,
        typeInferenceSyntaxEvidence: missingInferenceSyntaxEvidence,
        decoratorRuntimeExecutionEvidence: missingDecoratorRuntimeEvidence,
        declarationEmitParityEvidence: missingDeclarationEvidence,
        message: `Worker and head both changed ${input.label} ${JSON.stringify(identityKey)} to the same compiler public API fingerprint, but required public API evidence is missing.`
      })];
    }
    return [projectGraphDeltaConflict({ ...input, identityKey, baseRecord, workerRecord, headRecord, outputRecord: output.get(identityKey) })];
  });
}

function projectGraphDeltaConflict(input) {
  const sourcePath = input.workerRecord?.sourcePath ?? input.headRecord?.sourcePath ?? input.baseRecord?.sourcePath;
  const conflictKey = `project-graph-delta#${input.label.replace(/\s+/g, '-')}#${input.identityKey}`;
  return {
    code: input.code,
    gateId: 'project-graph-delta',
    message: input.message ?? `Worker and head both changed ${input.label} ${JSON.stringify(input.identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: input.reasonCode ?? input.code,
      conflictCode: input.reasonCode ? input.code : undefined,
      conflictKey,
      identityKey: input.identityKey,
      sourcePath,
      base: input.details(input.baseRecord),
      worker: input.details(input.workerRecord),
      head: input.details(input.headRecord),
      output: input.details(input.outputRecord),
      typeEquivalenceEvidence: input.typeEquivalenceEvidence,
      typeInferenceSyntaxEvidence: input.typeInferenceSyntaxEvidence,
      decoratorRuntimeExecutionEvidence: input.decoratorRuntimeExecutionEvidence,
      declarationEmitParityEvidence: input.declarationEmitParityEvidence
    })
  };
}

function publicCompilerTypeRecords(records) { return (records ?? []).filter((record) => record?.publicContract); }
function compilerTypeIdentityKey(record) { return stableKey(['compiler-public-type', record?.fullyQualifiedName ?? record?.localName ?? record?.symbolName ?? record?.symbolId]); }

function missingSharedCompilerTypeEquivalenceEvidence(workerRecord, headRecord) {
  const requiringProof = [workerRecord, headRecord].filter(requiresCompilerTypeEquivalenceProof);
  if (!requiringProof.length) return undefined;
  const missing = requiringProof.filter((record) => !hasPassedCompilerTypeEquivalenceProof(record));
  if (!missing.length) return undefined;
  return {
    reasonCode: 'typescript-public-api-type-equivalence-proof-missing',
    requiredEvidence: 'typescript-checker-public-api-type-equivalence',
    missingRecords: missing.map((record) => compactRecord({
      sourcePath: record.sourcePath, sourceHash: record.sourceHash,
      symbolId: record.symbolId,
      symbolName: record.symbolName,
      fullyQualifiedName: record.fullyQualifiedName,
      typeEquivalenceStatus: record.typeEquivalenceStatus,
      typeEquivalenceReasonCodes: record.typeEquivalenceReasonCodes,
      propertyCount: record.propertyCount, propertyOptionalCount: record.propertyOptionalCount,
      propertyReadonlyCount: record.propertyReadonlyCount, indexSignatureCount: record.indexSignatureCount,
      indexSignatureReadonlyCount: record.indexSignatureReadonlyCount,
      constructorSignatureCount: record.constructorSignatureCount,
      classHeritageCount: record.classHeritageCount,
      assignabilityOracleCount: record.assignabilityOracleCount,
      assignabilityOracleDirectionCount: record.assignabilityOracleDirectionCount,
      typeEquivalenceAssignabilityOracleHash: record.typeEquivalenceAssignabilityOracleHash,
      privateClassMemberCount: record.privateClassMemberCount,
      accessorFieldCount: record.accessorFieldCount,
      classPrivateAccessorRuntimeHash: record.classPrivateAccessorRuntimeHash,
      classPrivateAccessorRuntimeProofStatus: record.classPrivateAccessorRuntimeProof?.status,
      classPrivateAccessorRuntimeProofSourcePath: record.classPrivateAccessorRuntimeProof?.sourcePath,
      classPrivateAccessorRuntimeProofSourceHash: record.classPrivateAccessorRuntimeProof?.sourceHash,
      classPrivateAccessorRuntimeProofReasonCodes: record.classPrivateAccessorRuntimeProofReasonCodes,
      enumMemberCount: record.enumMemberCount,
      enumComputedMemberCount: record.enumComputedMemberCount,
      typeEquivalenceEnumRuntimeShapeHash: record.typeEquivalenceEnumRuntimeShapeHash,
      advancedTypeProofRequirement: record.advancedTypeProofRequirement,
      advancedTypeSourceBoundProof: record.advancedTypeSourceBoundProof,
      advancedTypeMissingProof: record.advancedTypeMissingProof,
      typeEquivalenceSignatureSetHash: record.typeEquivalenceSignatureSetHash,
      typeEquivalenceCallSignatureSetHash: record.typeEquivalenceCallSignatureSetHash, typeEquivalenceConstructSignatureSetHash: record.typeEquivalenceConstructSignatureSetHash,
      typeEquivalenceTypeParameterSetHash: record.typeEquivalenceTypeParameterSetHash,
      typeEquivalencePropertySetHash: record.typeEquivalencePropertySetHash,
      typeEquivalenceConstructorSetHash: record.typeEquivalenceConstructorSetHash,
      typeEquivalenceClassHeritageHash: record.typeEquivalenceClassHeritageHash,
      typeEquivalencePrivateClassMemberSetHash: record.typeEquivalencePrivateClassMemberSetHash,
      typeEquivalenceAccessorFieldSetHash: record.typeEquivalenceAccessorFieldSetHash,
      typeEquivalenceIndexSignatureSetHash: record.typeEquivalenceIndexSignatureSetHash,
      typeEquivalenceConditionalTypeSetHash: record.typeEquivalenceConditionalTypeSetHash, typeEquivalenceIndexedAccessTypeSetHash: record.typeEquivalenceIndexedAccessTypeSetHash,
      typeEquivalenceMappedTypeSetHash: record.typeEquivalenceMappedTypeSetHash, typeEquivalenceKeyofTypeOperatorSetHash: record.typeEquivalenceKeyofTypeOperatorSetHash,
      typeReferenceTargetCount: record.typeReferenceTargetCount,
      typeEquivalenceTypeReferenceTargetSetHash: record.typeEquivalenceTypeReferenceTargetSetHash,
      typeEquivalenceTemplateLiteralTypeSetHash: record.typeEquivalenceTemplateLiteralTypeSetHash, typeEquivalenceInferTypeSetHash: record.typeEquivalenceInferTypeSetHash,
      typeEquivalenceUnionTypeSetHash: record.typeEquivalenceUnionTypeSetHash, typeEquivalenceIntersectionTypeSetHash: record.typeEquivalenceIntersectionTypeSetHash, typeEquivalenceTupleTypeSetHash: record.typeEquivalenceTupleTypeSetHash,
      typeEquivalenceProofStatus: record.typeEquivalenceProof?.status, typeEquivalenceProofSourcePath: record.typeEquivalenceProof?.sourcePath, typeEquivalenceProofSourceHash: record.typeEquivalenceProof?.sourceHash,
      semanticEquivalenceClaim: record.typeEquivalenceProof?.semanticEquivalenceClaim,
      assignabilityOracle: record.assignabilityOracle,
      missingSignals: record.typeEquivalenceProof?.missingSignals,
      unsupportedSignals: record.typeEquivalenceProof?.unsupportedSignals,
      checkerEvidence: record.typeEquivalenceCheckerEvidence,
      evidenceIds: record.evidenceIds
    }))
  };
}

function requiresCompilerTypeEquivalenceProof(record) { return Boolean(record && (record.callSignatureCount > 0 || record.constructSignatureCount > 0 || record.overloadSignatureCount > 1 || record.declarationCount > 1 || record.typeParameterCount > 0 || record.propertyCount > 0 || record.indexSignatureCount > 0 || record.constructorSignatureCount > 0 || record.classHeritageCount > 0 || record.assignabilityOracleCount > 0 || record.privateClassMemberCount > 0 || record.accessorFieldCount > 0 || record.enumMemberCount > 0 || record.advancedTypeShapeCount > 0 || record.typeReferenceTargetCount > 0 || record.typeEquivalenceStatus === 'unsupported')); }
function hasPassedCompilerTypeEquivalenceProof(record) {
  const requiredHashes = [
    [record?.callSignatureCount > 0, record?.typeEquivalenceCallSignatureSetHash],
    [record?.constructSignatureCount > 0, record?.typeEquivalenceConstructSignatureSetHash],
    [record?.overloadSignatureCount > 1 || record?.declarationCount > 1, record?.typeEquivalenceSignatureSetHash],
    [record?.typeParameterCount > 0, record?.typeEquivalenceTypeParameterSetHash],
    [record?.propertyCount > 0, record?.typeEquivalencePropertySetHash],
    [record?.indexSignatureCount > 0, record?.typeEquivalenceIndexSignatureSetHash],
    [record?.constructorSignatureCount > 0, record?.typeEquivalenceConstructorSetHash],
    [record?.classHeritageCount > 0, record?.typeEquivalenceClassHeritageHash],
    [record?.assignabilityOracleCount > 0, record?.typeEquivalenceAssignabilityOracleHash],
    [record?.privateClassMemberCount > 0, record?.typeEquivalencePrivateClassMemberSetHash],
    [record?.accessorFieldCount > 0, record?.typeEquivalenceAccessorFieldSetHash],
    [record?.enumMemberCount > 0, record?.typeEquivalenceEnumRuntimeShapeHash],
    [record?.conditionalTypeCount > 0, record?.typeEquivalenceConditionalTypeSetHash],
    [record?.indexedAccessTypeCount > 0, record?.typeEquivalenceIndexedAccessTypeSetHash],
    [record?.mappedTypeCount > 0, record?.typeEquivalenceMappedTypeSetHash],
    [record?.keyofTypeOperatorCount > 0, record?.typeEquivalenceKeyofTypeOperatorSetHash],
    [record?.typeReferenceTargetCount > 0, record?.typeEquivalenceTypeReferenceTargetSetHash],
    [record?.templateLiteralTypeCount > 0, record?.typeEquivalenceTemplateLiteralTypeSetHash],
    [record?.inferTypeCount > 0, record?.typeEquivalenceInferTypeSetHash], [record?.unionTypeCount > 0, record?.typeEquivalenceUnionTypeSetHash],
    [record?.intersectionTypeCount > 0, record?.typeEquivalenceIntersectionTypeSetHash], [record?.tupleTypeCount > 0, record?.typeEquivalenceTupleTypeSetHash]
  ];
  return Boolean(record?.typeEquivalenceStatus === 'compiler-backed-equivalent'
    && record?.typeEquivalenceProof?.status === 'passed'
    && !hasMissingAdvancedTypeProof(record)
    && requiredHashes.every(([required, hash]) => !required || hash)
    && record?.apiSignatureHash);
}
function hasMissingAdvancedTypeProof(record) {
  const status = record?.advancedTypeMissingProof?.status ?? record?.advancedTypeProofRequirement?.status;
  return status === 'missing-compiler-evidence' || status === 'requires-review';
}
function missingSharedDecoratorRuntimeExecutionEvidence(baseRecord, workerRecord, headRecord) {
  const requiringProof = [workerRecord, headRecord].filter((record) => requiresDecoratorRuntimeExecutionProof(baseRecord, record));
  if (!requiringProof.length) return undefined;
  const missing = requiringProof.filter((record) => !hasPassedDecoratorRuntimeExecutionProof(record));
  if (!missing.length) return undefined;
  return {
    reasonCode: 'typescript-public-api-decorator-runtime-execution-proof-missing',
    requiredEvidence: 'frontier.lang.typescript.decoratorRuntimeExecutionProof',
    proofLevel: 'typescript-checker-public-api-decorator-source-bound-runtime-execution',
    routeId: 'prove-decorator-runtime-execution-equivalence',
    routeLane: 'decorator-runtime-boundaries',
    routeNext: 'supply-decorator-runtime-execution-proof',
    failClosed: true,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    missingRecords: missing.map((record) => compactRecord({
      sourcePath: record.sourcePath, sourceHash: record.sourceHash,
      symbolId: record.symbolId,
      symbolName: record.symbolName,
      fullyQualifiedName: record.fullyQualifiedName,
      decoratorMetadataCount: record.decoratorMetadataCount,
      decoratorMetadataHash: record.decoratorMetadataHash,
      decoratorRuntimeExecutionHash: record.decoratorRuntimeExecutionHash,
      decoratorRuntimeExecutionProofStatus: record.decoratorRuntimeExecutionProof?.status,
      decoratorRuntimeExecutionProofSourcePath: record.decoratorRuntimeExecutionProof?.sourcePath,
      decoratorRuntimeExecutionProofSourceHash: record.decoratorRuntimeExecutionProof?.sourceHash,
      decoratorRuntimeExecutionProofReasonCodes: record.decoratorRuntimeExecutionProofReasonCodes,
      missingSignals: decoratorRuntimeExecutionMissingSignals(record),
      runtimeExecutionEquivalenceGap: record.decoratorMetadataProof?.runtimeExecutionEquivalenceGap,
      conflictRouting: record.decoratorMetadataProof?.conflictRouting,
      semanticEquivalenceClaim: record.decoratorRuntimeExecutionProof?.semanticEquivalenceClaim ?? false,
      runtimeEquivalenceClaim: record.decoratorRuntimeExecutionProof?.runtimeEquivalenceClaim ?? false,
      decoratorExecutionEquivalenceClaim: record.decoratorRuntimeExecutionProof?.decoratorExecutionEquivalenceClaim ?? false
    }))
  };
}
function requiresDecoratorRuntimeExecutionProof(baseRecord, record) {
  if (!record?.decoratorMetadataCount || !record.decoratorMetadataHash) return false;
  return !baseRecord || baseRecord.decoratorMetadataHash !== record.decoratorMetadataHash;
}
function hasPassedDecoratorRuntimeExecutionProof(record) {
  const proof = record?.decoratorRuntimeExecutionProof;
  return Boolean(proof
    && proof.status === 'passed'
    && record.decoratorRuntimeExecutionHash
    && proof.decoratorRuntimeExecutionHash === record.decoratorRuntimeExecutionHash
    && proof.sourcePath === record.sourcePath
    && proof.sourceHash === record.sourceHash
    && proof.autoMergeClaim === false
    && proof.semanticEquivalenceClaim === false
    && proof.runtimeEquivalenceClaim === false
    && proof.decoratorExecutionEquivalenceClaim === false
    && proof.decoratorEmitRuntimeEquivalenceClaim === false
    && !(record.decoratorRuntimeExecutionProofReasonCodes?.length));
}
function decoratorRuntimeExecutionMissingSignals(record) {
  return uniqueStrings(record?.decoratorRuntimeExecutionProofReasonCodes?.length
    ? record.decoratorRuntimeExecutionProofReasonCodes
    : ['typescript-decorator-runtime-execution-proof-missing']);
}
function recordsByIdentityKey(records, identityKey) { const result = new Map(); for (const record of records ?? []) { const key = identityKey(record); if (!key || result.has(key)) continue; result.set(key, record); } return result; }
function optionalFingerprint(record, fingerprint) { return record ? fingerprint(record) : undefined; }
function stableKey(parts) { const values = parts.map((part) => part === undefined || part === null ? '' : String(part)); return values.some(Boolean) ? values.join('#') : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
export { publicCompilerTypeDeltaConflicts };
