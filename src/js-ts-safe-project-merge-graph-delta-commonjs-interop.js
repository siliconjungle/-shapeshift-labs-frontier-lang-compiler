import { compactRecord } from './js-ts-safe-merge-context.js';

function commonJsRuntimeInteropDelta(identityKey, edge, workerEdge, outputGraph) {
  if (!isDefaultModuleExportsTarget(edge)) return undefined;
  const exportShape = (outputGraph?.exportAssignmentRecords ?? [])
    .find((record) => record.sourcePath === edge.resolvedModulePath && record.exportedName === 'module.exports');
  return compactRecord({
    schema: 'frontier.lang.commonJsRuntimeInteropDelta.v1',
    identityKey,
    sourcePath: edge.sourcePath,
    sourceHash: edge.sourceHash,
    moduleSpecifier: edge.moduleSpecifier,
    importedName: edge.importedName,
    localName: edge.localName,
    importKind: edge.importKind,
    commonJs: edge.commonJs,
    interopHelper: edge.interopHelper,
    packageRuntimeCondition: edge.packageRuntimeCondition,
    packageRuntimeConditionEdgeKind: edge.packageRuntimeConditionEdgeKind,
    resolvedModulePath: edge.resolvedModulePath,
    outputTargetSymbolId: edge.resolvedTargetSymbolId,
    workerTargetSymbolId: workerEdge.resolvedTargetSymbolId,
    exportAssignmentShapeHash: exportShape?.shapeHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    runtimeInteropEquivalenceClaim: false
  });
}

function commonJsRuntimeInteropProofAssessment(delta, options = {}) {
  const proof = commonJsRuntimeInteropProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('commonjs-runtime-interop-proof-missing');
  else {
    if (proof.status !== 'passed') reasonCodes.push('commonjs-runtime-interop-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.commonJsRuntimeInteropProof.v1' && proof.kind !== 'frontier.lang.commonJsRuntimeInteropProof') reasonCodes.push('commonjs-runtime-interop-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('commonjs-runtime-interop-proof-source-path-mismatch');
    if (proof.sourceHash !== delta.sourceHash) reasonCodes.push('commonjs-runtime-interop-proof-source-hash-mismatch');
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('commonjs-runtime-interop-proof-import-edge-mismatch');
    if (proof.moduleSpecifier !== delta.moduleSpecifier || proof.importedName !== delta.importedName || proof.localName !== delta.localName || proof.importKind !== delta.importKind) reasonCodes.push('commonjs-runtime-interop-proof-import-edge-mismatch');
    if ((delta.interopHelper || proof.interopHelper) && proof.interopHelper !== delta.interopHelper) reasonCodes.push('commonjs-runtime-interop-proof-helper-identity-mismatch');
    if ((delta.packageRuntimeCondition || proof.packageRuntimeCondition) && proof.packageRuntimeCondition !== delta.packageRuntimeCondition) reasonCodes.push('commonjs-runtime-interop-proof-package-runtime-condition-mismatch');
    if ((delta.packageRuntimeConditionEdgeKind || proof.packageRuntimeConditionEdgeKind) && proof.packageRuntimeConditionEdgeKind !== delta.packageRuntimeConditionEdgeKind) reasonCodes.push('commonjs-runtime-interop-proof-package-runtime-condition-mismatch');
    if (proof.outputTargetSymbolId !== delta.outputTargetSymbolId) reasonCodes.push('commonjs-runtime-interop-proof-resolved-target-symbol-mismatch');
    if ((delta.exportAssignmentShapeHash || proof.exportAssignmentShapeHash) && proof.exportAssignmentShapeHash !== delta.exportAssignmentShapeHash) reasonCodes.push('commonjs-runtime-interop-proof-export-assignment-shape-hash-mismatch');
    if (!proof.runtimeTraceHash && !proof.helperTraceHash) reasonCodes.push('commonjs-runtime-interop-proof-trace-hash-missing');
    if (!proof.evidenceHash) reasonCodes.push('commonjs-runtime-interop-proof-evidence-hash-missing');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false || proof.runtimeInteropEquivalenceClaim !== false) reasonCodes.push('commonjs-runtime-interop-proof-claim-flags-missing');
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    routeId: 'prove-commonjs-runtime-interop-equivalence',
    routeLane: 'module-runtime-interop',
    routeNext: 'supply-commonjs-runtime-interop-proof',
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.commonJsRuntimeInteropProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      routeId: 'prove-commonjs-runtime-interop-equivalence',
      routeLane: 'module-runtime-interop',
      routeNext: 'supply-commonjs-runtime-interop-proof',
      reasonCodes: uniqueStrings(reasonCodes),
      delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      runtimeInteropEquivalenceClaim: false
    })
  };
}

function commonJsRuntimeInteropProofFor(delta, options = {}) {
  const proofs = [
    options.commonJsRuntimeInteropProof,
    ...(Array.isArray(options.commonJsRuntimeInteropProofs) ? options.commonJsRuntimeInteropProofs : [])
  ].filter(Boolean);
  return proofs.find((proof) => (
    proof.identityKey === delta.identityKey
      || proof.sourcePath === delta.sourcePath
        && proof.moduleSpecifier === delta.moduleSpecifier
        && proof.importedName === delta.importedName
        && proof.localName === delta.localName
        && proof.importKind === delta.importKind
  ));
}

function isDefaultModuleExportsTarget(edge) {
  return projectImportTargetName(edge) === 'default'
    && /:export:module_exports$/.test(String(edge?.resolvedTargetSymbolId ?? ''));
}

function projectImportTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  if (!name || name === '*') return undefined;
  return String(name);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { commonJsRuntimeInteropDelta, commonJsRuntimeInteropProofAssessment };
