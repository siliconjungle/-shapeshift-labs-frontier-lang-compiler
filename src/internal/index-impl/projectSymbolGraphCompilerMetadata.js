function compilerClassMemberShapeMetadata(value, source = {}) {
  const privateClassMembers = arrayValue(value.privateClassMembers);
  const accessorFieldMembers = arrayValue(value.accessorFieldMembers);
  const counts = {
    privateClassMemberCount: numberValue(value.privateClassMemberCount) ?? privateClassMembers.length,
    accessorFieldCount: numberValue(value.accessorFieldCount) ?? accessorFieldMembers.length
  };
  const runtimeProof = classPrivateAccessorRuntimeProjection(value, counts, source);
  return {
    counts,
    record: compactRecord({
      privateClassMemberCount: counts.privateClassMemberCount || undefined,
      privateClassMemberShapeHash: value.privateClassMemberShapeHash,
      privateClassMembers: nonEmptyArray(privateClassMembers),
      accessorFieldCount: counts.accessorFieldCount || undefined,
      accessorFieldShapeHash: value.accessorFieldShapeHash,
      accessorFieldMembers: nonEmptyArray(accessorFieldMembers),
      classMemberShapeProof: value.classMemberShapeProof,
      ...runtimeProof.record
    })
  };
}

function compilerAssignabilityOracleMetadata(value) {
  const record = objectRecord(value.assignabilityOracle);
  const directions = arrayValue(record?.directions);
  const counts = {
    assignabilityOracleCount: record ? 1 : 0,
    assignabilityOracleDirectionCount: numberValue(value.assignabilityOracleDirectionCount) ?? directions.length
  };
  return {
    counts,
    record: compactRecord({
      assignabilityOracleCount: counts.assignabilityOracleCount || undefined,
      assignabilityOracleDirectionCount: counts.assignabilityOracleDirectionCount || undefined,
      assignabilityOracleHash: value.assignabilityOracleHash,
      assignabilityOracle: record
    })
  };
}

function compilerDecoratorMetadata(value, source = {}) {
  const records = arrayValue(value.decoratorMetadata);
  const counts = {
    decoratorMetadataCount: numberValue(value.decoratorMetadataCount) ?? records.length,
    classDecoratorCount: numberValue(value.classDecoratorCount) ?? countKind(records, 'class-decorator'),
    memberDecoratorCount: numberValue(value.memberDecoratorCount) ?? countKind(records, 'member-decorator'),
    parameterDecoratorCount: numberValue(value.parameterDecoratorCount) ?? countKind(records, 'parameter-decorator')
  };
  const runtimeExecution = decoratorRuntimeExecutionProjection(value, counts, source);
  return {
    counts,
    record: compactRecord({
      decoratorMetadataCount: counts.decoratorMetadataCount || undefined,
      classDecoratorCount: counts.classDecoratorCount || undefined,
      memberDecoratorCount: counts.memberDecoratorCount || undefined,
      parameterDecoratorCount: counts.parameterDecoratorCount || undefined,
      decoratorMetadataHash: value.decoratorMetadataHash,
      decoratorMetadataProof: value.decoratorMetadataProof,
      ...runtimeExecution.record,
      decoratorMetadata: nonEmptyArray(records)
    })
  };
}

function compilerEnumShapeMetadata(value) {
  const enumMembers = arrayValue(value.enumMembers);
  const counts = {
    enumMemberCount: numberValue(value.enumMemberCount) ?? enumMembers.length,
    enumNumericMemberCount: numberValue(value.enumNumericMemberCount) ?? countKind(enumMembers, 'number', 'valueKind'),
    enumStringMemberCount: numberValue(value.enumStringMemberCount) ?? countKind(enumMembers, 'string', 'valueKind'),
    enumAutoMemberCount: numberValue(value.enumAutoMemberCount) ?? enumMembers.filter((member) => member?.auto === true).length,
    enumComputedMemberCount: numberValue(value.enumComputedMemberCount) ?? enumMembers.filter((member) => member?.computed === true).length
  };
  return {
    counts,
    record: compactRecord({
      enumKind: value.enumKind,
      constEnum: value.constEnum,
      declareEnum: value.declareEnum,
      enumDeclarationCount: value.enumDeclarationCount,
      enumMemberCount: counts.enumMemberCount || undefined,
      enumNumericMemberCount: counts.enumNumericMemberCount || undefined,
      enumStringMemberCount: counts.enumStringMemberCount || undefined,
      enumAutoMemberCount: counts.enumAutoMemberCount || undefined,
      enumComputedMemberCount: counts.enumComputedMemberCount || undefined,
      enumRuntimeShapeHash: value.enumRuntimeShapeHash,
      enumEmittedRuntimeShapeHash: value.enumEmittedRuntimeShapeHash,
      enumRuntimeShapeProof: value.enumRuntimeShapeProof,
      computedEnumRuntimeValueProof: value.computedEnumRuntimeValueProof,
      enumMembers: nonEmptyArray(enumMembers)
    })
  };
}

function compilerTypeInferenceSyntaxMetadata(value, source = {}) {
  const records = arrayValue(value.typeInferenceSyntax);
  const counts = {
    typeInferenceSyntaxCount: numberValue(value.typeInferenceSyntaxCount) ?? records.length,
    satisfiesExpressionCount: numberValue(value.satisfiesExpressionCount) ?? countKind(records, 'satisfies-expression'),
    asConstAssertionCount: numberValue(value.asConstAssertionCount) ?? countKind(records, 'as-const-assertion'),
    constTypeParameterCount: numberValue(value.constTypeParameterCount) ?? countKind(records, 'const-type-parameter')
  };
  const proof = compilerTypeInferenceSyntaxProof(value, counts, source);
  return {
    counts,
    record: compactRecord({
      typeInferenceSyntaxCount: counts.typeInferenceSyntaxCount || undefined,
      typeInferenceSyntaxKinds: value.typeInferenceSyntaxKinds ?? nonEmptyArray(uniqueStrings(records.map((record) => record.kind))),
      satisfiesExpressionCount: counts.satisfiesExpressionCount || undefined,
      asConstAssertionCount: counts.asConstAssertionCount || undefined,
      constTypeParameterCount: counts.constTypeParameterCount || undefined,
      typeInferenceSyntaxHash: value.typeInferenceSyntaxHash,
      typeInferenceSyntaxProof: proof,
      typeInferenceSyntax: nonEmptyArray(records)
    })
  };
}

function compilerTypeInferenceSyntaxProof(value, counts, source = {}) {
  const proof = objectRecord(value.typeInferenceSyntaxProof);
  if (!proof || counts.typeInferenceSyntaxCount <= 0) return proof;
  const reasonCodes = [];
  const missingSignals = [];
  if (proof.status !== 'passed') reasonCodes.push('typescript-type-inference-syntax-proof-status-not-passed');
  if (proof.kind !== 'typescript-checker-public-api-type-inference-syntax-evidence') reasonCodes.push('typescript-type-inference-syntax-proof-kind-missing');
  if (proof.typeInferenceSyntaxHash !== value.typeInferenceSyntaxHash) reasonCodes.push('typescript-type-inference-syntax-proof-hash-mismatch');
  if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false) reasonCodes.push('typescript-type-inference-syntax-proof-claim-flags-missing');
  if (source.publicContract === true && !source.sourcePath) missingSignals.push('compiler-public-api-source-path');
  if (source.publicContract === true && !source.sourceHash) missingSignals.push('compiler-public-api-source-hash');
  if (proof.sourcePath !== undefined && proof.sourcePath !== source.sourcePath) reasonCodes.push('typescript-type-inference-syntax-proof-source-path-mismatch');
  if (proof.sourceHash !== undefined && proof.sourceHash !== source.sourceHash) reasonCodes.push('typescript-type-inference-syntax-proof-source-hash-mismatch');
  const failed = reasonCodes.length > 0 || missingSignals.length > 0;
  return compactRecord({
    ...proof,
    status: failed ? 'failed' : proof.status,
    sourcePath: proof.sourcePath ?? source.sourcePath,
    sourceHash: proof.sourceHash ?? source.sourceHash,
    sourceBoundPublicApi: source.publicContract === true || undefined,
    requiredSignals: uniqueStrings([
      ...arrayValue(proof.requiredSignals),
      source.publicContract === true ? 'compiler-public-api-source-path' : undefined,
      source.publicContract === true ? 'compiler-public-api-source-hash' : undefined
    ]),
    missingSignals: nonEmptyArray(uniqueStrings([...(proof.missingSignals ?? []), ...missingSignals])),
    reasonCodes: nonEmptyArray(uniqueStrings([...(proof.reasonCodes ?? []), ...reasonCodes])),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function countKind(records, kind, field = 'kind') { return records.filter((record) => record?.[field] === kind).length; }
function objectRecord(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  compilerAssignabilityOracleMetadata,
  compilerClassMemberShapeMetadata,
  compilerDecoratorMetadata,
  compilerEnumShapeMetadata,
  compilerTypeInferenceSyntaxMetadata
};
import { decoratorRuntimeExecutionProjection } from './projectSymbolGraphCompilerDecoratorRuntimeProof.js';
import { classPrivateAccessorRuntimeProjection } from './projectSymbolGraphCompilerClassPrivateAccessorRuntimeProof.js';
