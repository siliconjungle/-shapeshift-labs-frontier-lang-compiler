import { compactRecord } from './js-ts-safe-merge-context.js';
import { globalAugmentationCompatibilityAssessment, sourceSpanHash } from './js-ts-safe-project-merge-global-augmentation-compatibility.js';

function projectModuleDeclarationDeltaConflicts(projectGraphDelta, options = {}) {
  return [
    ...changedShapeConflicts({
      code: 'project-module-declaration-shape-delta-conflict',
      label: 'module declaration shape',
      baseRecords: projectGraphDelta?.stages?.base?.projectSymbolGraph?.moduleDeclarationRecords,
      workerRecords: projectGraphDelta?.stages?.worker?.projectSymbolGraph?.moduleDeclarationRecords,
      headRecords: projectGraphDelta?.stages?.head?.projectSymbolGraph?.moduleDeclarationRecords,
      outputRecords: projectGraphDelta?.stages?.output?.projectSymbolGraph?.moduleDeclarationRecords,
      identityKey: moduleDeclarationIdentityKey,
      details: moduleDeclarationDetails,
      proofAssessment: (identityKey, baseRecord, workerRecord, headRecord, outputRecord) => globalAugmentationDeltaProofAssessment(identityKey, baseRecord, workerRecord, headRecord, outputRecord, options)
    }),
    ...changedShapeConflicts({
      code: 'project-export-assignment-shape-delta-conflict',
      label: 'export assignment shape',
      baseRecords: projectGraphDelta?.stages?.base?.projectSymbolGraph?.exportAssignmentRecords,
      workerRecords: projectGraphDelta?.stages?.worker?.projectSymbolGraph?.exportAssignmentRecords,
      headRecords: projectGraphDelta?.stages?.head?.projectSymbolGraph?.exportAssignmentRecords,
      outputRecords: projectGraphDelta?.stages?.output?.projectSymbolGraph?.exportAssignmentRecords,
      identityKey: exportAssignmentIdentityKey,
      details: exportAssignmentDetails
    })
  ];
}

function changedShapeConflicts(input) {
  const base = recordsByIdentityKey(input.baseRecords, input.identityKey);
  const worker = recordsByIdentityKey(input.workerRecords, input.identityKey);
  const head = recordsByIdentityKey(input.headRecords, input.identityKey);
  const output = recordsByIdentityKey(input.outputRecords, input.identityKey);
  const keys = uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]);
  return keys.flatMap((identityKey) => {
    const baseHash = base.get(identityKey)?.shapeHash;
    const workerHash = worker.get(identityKey)?.shapeHash;
    const headHash = head.get(identityKey)?.shapeHash;
    if (baseHash === workerHash || baseHash === headHash || workerHash === headHash) return [];
    const proof = input.proofAssessment?.(identityKey, base.get(identityKey), worker.get(identityKey), head.get(identityKey), output.get(identityKey));
    if (proof?.status === 'passed') return [];
    return [shapeConflict(input, identityKey, base.get(identityKey), worker.get(identityKey), head.get(identityKey), output.get(identityKey), proof)];
  });
}

function shapeConflict(input, identityKey, baseRecord, workerRecord, headRecord, outputRecord, proof = undefined) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  const conflictKey = `project-graph-delta#${input.label.replace(/\s+/g, '-')}#${identityKey}`;
  return {
    code: input.code,
    gateId: 'project-graph-delta',
    message: `Worker and head both changed ${input.label} ${JSON.stringify(identityKey)} with incompatible static shape evidence.`,
    sourcePath,
    details: compactRecord({
      reasonCode: input.code,
      conflictKey,
      identityKey,
      sourcePath,
      base: input.details(baseRecord),
      worker: input.details(workerRecord),
      head: input.details(headRecord),
      output: input.details(outputRecord),
      requiredProof: 'static-shape-evidence',
      routeId: proof?.routeId,
      routeLane: proof?.routeLane,
      routeNext: proof?.routeNext,
      reasonCodes: proof?.reasonCodes,
      globalAugmentationCompatibilityProof: proof?.record,
      semanticEquivalenceClaim: false
    })
  };
}

function globalAugmentationDeltaProofAssessment(identityKey, baseRecord, workerRecord, headRecord, outputRecord, options) {
  const record = outputRecord ?? workerRecord ?? headRecord ?? baseRecord;
  if (record?.surfaceKind !== 'global-augmentation') return undefined;
  return globalAugmentationCompatibilityAssessment({
    identityKey,
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    moduleName: record.moduleName,
    surfaceKind: record.surfaceKind,
    moduleDeclarationRecordId: record.id,
    moduleDeclarationShapeHash: record.shapeHash,
    moduleDeclarationSignatureHash: record.signatureHash,
    sourceSpanHash: sourceSpanHash(record.sourceSpan),
    declarationOutputHash: options.declarationEmitParityProof?.outputDeclarationBoundaryHash,
    ...compatibilityGateContext(options)
  }, options);
}

function compatibilityGateContext(options = {}) {
  return compactRecord({
    consumerDiagnosticsPassed: options.outputDiagnosticsGate ? options.outputDiagnosticsGate.status === 'passed' : undefined
  });
}

function moduleDeclarationIdentityKey(record) {
  return stableKey(['module-declaration', record?.sourcePath, record?.surfaceKind, record?.moduleName]);
}

function exportAssignmentIdentityKey(record) {
  return stableKey(['export-assignment', record?.sourcePath, record?.exportKind, record?.exportedName]);
}

function moduleDeclarationDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    moduleName: record.moduleName,
    surfaceKind: record.surfaceKind,
    declarationOnly: record.declarationOnly,
    runtimeNamespace: record.runtimeNamespace,
    shapeHash: record.shapeHash,
    proofLevel: record.shapeProof?.proofLevel,
    unsupportedSignals: record.shapeProof?.unsupportedSignals,
    semanticEquivalenceClaim: false
  });
}

function exportAssignmentDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    exportedName: record.exportedName,
    localName: record.localName,
    exportKind: record.exportKind,
    shapeHash: record.shapeHash,
    proofLevel: record.shapeProof?.proofLevel,
    unsupportedSignals: record.shapeProof?.unsupportedSignals,
    semanticEquivalenceClaim: false
  });
}

function recordsByIdentityKey(records, identityKey) {
  const result = new Map();
  for (const record of records ?? []) {
    const key = identityKey(record);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { projectModuleDeclarationDeltaConflicts };
