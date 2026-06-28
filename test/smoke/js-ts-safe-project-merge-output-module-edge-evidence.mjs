import { assert } from './helpers.mjs';
import { outputProjectGraphConflicts } from '../../src/js-ts-safe-project-merge-graph-conflicts.js';

const conflicts = outputProjectGraphConflicts({
  importEdges: [{
    id: 'edge-env',
    sourcePath: 'packages/app/src/consumer.ts',
    moduleSpecifier: '@pkg/app/env',
    importKind: 'static-import',
    importedName: 'env',
    resolutionKind: 'package-export-environment-ambiguous-missing',
    resolvedModulePath: 'packages/app/env',
    packageName: '@pkg/app',
    packageSubpath: './env',
    packageExportKey: './env',
    packageExportCondition: 'browser|node',
    packageEnvironmentConditionCandidates: ['browser', 'node'],
    packageEnvironmentConditionReasonCode: 'package-environment-condition-ambiguous-missing',
    hasImportAttributes: true,
    importAttributeCount: 1,
    importAttributeKeys: ['type'],
    importAttributeHash: 'hash:json',
    importAttributes: [{ key: 'type', value: 'json' }]
  }, {
    id: 'edge-worker',
    sourcePath: 'packages/app/src/host.ts',
    moduleSpecifier: '@pkg/app/worker-entry',
    importKind: 'worker-constructor',
    resolutionKind: 'package-export-runtime-ambiguous-missing',
    resolvedModulePath: 'packages/app/worker-entry',
    packageName: '@pkg/app',
    packageSubpath: './worker-entry',
    packageExportCondition: 'import|require',
    packageRuntimeConditionEvidenceSource: 'host-runtime-ambiguous',
    packageRuntimeConditionEdgeKind: 'host-worker-constructor',
    packageRuntimeConditionReasonCode: 'package-runtime-condition-host-ambiguous-missing',
    hostDependencyKind: 'worker-constructor',
    hostDependencyRuntimeResolutionClaim: false
  }, {
    id: 'edge-package-import-worker',
    sourcePath: 'packages/app/src/host.ts',
    moduleSpecifier: '#worker-entry',
    importKind: 'worker-constructor',
    resolutionKind: 'package-import-runtime-ambiguous-missing',
    packageName: '@pkg/app',
    packageImportKey: '#worker-entry',
    packageImportCondition: 'import|require',
    packageRuntimeConditionEvidenceSource: 'host-runtime-ambiguous',
    packageRuntimeConditionEdgeKind: 'host-worker-constructor',
    packageRuntimeConditionReasonCode: 'package-runtime-condition-host-ambiguous-missing',
    hostDependencyKind: 'worker-constructor',
    hostDependencyRuntimeResolutionClaim: false
  }, {
    id: 'edge-host-dynamic',
    sourcePath: 'packages/app/src/host-dynamic.ts',
    moduleSpecifier: '<host-dependency>',
    importKind: 'worker-constructor',
    resolutionKind: 'host-dependency-non-literal-missing',
    hostDependencyKind: 'worker-constructor',
    hostDependencyExpressionText: 'new Worker(`./${name}.js`)',
    hostDependencyExpressionHash: 'hash:host-target',
    hostDependencyStaticSpecifierEvidence: false,
    hostDependencyRuntimeResolutionClaim: false,
    hostDependencyResolutionProofRequired: true
  }, {
    id: 'edge-dynamic',
    sourcePath: 'packages/app/src/lazy.ts',
    moduleSpecifier: '<dynamic-import>',
    importKind: 'dynamic-import',
    resolutionKind: 'dynamic-import-non-literal-missing',
    dynamicImport: true,
    dynamicImportSpecifierKind: 'identifier',
    dynamicImportExpressionText: 'target',
    dynamicImportExpressionHash: 'hash:target',
    dynamicImportStaticSpecifierEvidence: false,
    dynamicImportRuntimeResolutionClaim: false,
    dynamicImportResolutionProofRequired: true
  }, {
    id: 'edge-missing-symbol',
    sourcePath: 'packages/app/src/consumer.ts',
    moduleSpecifier: '@pkg/app/api',
    importKind: 'static-import',
    importedName: 'missingApi',
    localName: 'renamedMissingApi',
    resolutionKind: 'package-source',
    resolvedModulePath: 'packages/app/api.ts',
    targetDocumentId: 'doc:api',
    packageName: '@pkg/app',
    packageSubpath: './api',
    packageExportKey: './api',
    packageExportCondition: 'import',
    hasImportAttributes: true,
    importAttributeCount: 1,
    importAttributeKeys: ['type'],
    importAttributeHash: 'hash:ts',
    importAttributes: [{ key: 'type', value: 'typescript' }]
  }, {
    id: 'edge-ambiguous-attribute',
    sourcePath: 'packages/app/src/data.ts',
    sourceHash: 'sha256:attribute-source',
    moduleSpecifier: './data.json',
    importKind: 'side-effect',
    resolutionKind: 'relative-source',
    resolvedModulePath: 'packages/app/src/data.json',
    targetDocumentId: 'doc:data',
    hasImportAttributes: true,
    importAttributeCount: 0,
    importAttributeHash: 'hash:attribute-syntax',
    importAttributes: []
  }]
});

const envConflict = conflictFor('@pkg/app/env');
assert.equal(envConflict.details.moduleEdgeFailureReasonCodes.includes('package-environment-condition-ambiguous-missing'), true);
assert.equal(envConflict.details.moduleEdgeFailureReasonCodes.includes('package-export-environment-ambiguous-missing'), true);
assert.equal(envConflict.details.moduleEdgeEvidence[0].packageName, '@pkg/app');
assert.deepEqual(envConflict.details.moduleEdgeEvidence[0].packageEnvironmentConditionCandidates, ['browser', 'node']);
assert.deepEqual(envConflict.details.moduleEdgeEvidence[0].importAttributes, [{ key: 'type', value: 'json' }]);

const hostConflict = conflictFor('@pkg/app/worker-entry');
assert.equal(hostConflict.details.moduleEdgeFailureReasonCodes.includes('package-runtime-condition-host-ambiguous-missing'), true);
assert.equal(hostConflict.details.moduleEdgeEvidence[0].hostDependencyKind, 'worker-constructor');
assert.equal(hostConflict.details.moduleEdgeEvidence[0].hostDependencyRuntimeResolutionClaim, false);
assert.equal(hostConflict.details.moduleEdgeEvidence[0].packageRuntimeConditionEvidenceSource, 'host-runtime-ambiguous');

const packageImportHostConflict = conflictFor('#worker-entry');
assert.equal(packageImportHostConflict.details.moduleEdgeFailureReasonCodes.includes('package-import-runtime-ambiguous-missing'), true);
assert.equal(packageImportHostConflict.details.moduleEdgeFailureReasonCodes.includes('package-runtime-condition-host-ambiguous-missing'), true);
assert.equal(packageImportHostConflict.details.moduleEdgeEvidence[0].packageName, '@pkg/app');
assert.equal(packageImportHostConflict.details.moduleEdgeEvidence[0].packageImportKey, '#worker-entry');
assert.equal(packageImportHostConflict.details.moduleEdgeEvidence[0].packageImportCondition, 'import|require');
assert.equal(packageImportHostConflict.details.moduleEdgeEvidence[0].hostDependencyRuntimeResolutionClaim, false);
assert.equal(packageImportHostConflict.details.routeId, 'prove-package-import-host-runtime-resolution');
assert.equal(packageImportHostConflict.details.routeLane, 'module-export-import-graph');
assert.equal(packageImportHostConflict.details.routeNext, 'supply-package-import-host-runtime-proof');
assert.equal(packageImportHostConflict.details.autoMergeClaim, false);
assert.equal(packageImportHostConflict.details.semanticEquivalenceClaim, false);
assert.equal(packageImportHostConflict.details.runtimeEquivalenceClaim, false);

const hostDynamicConflict = conflictFor('<host-dependency>');
assert.equal(hostDynamicConflict.details.moduleEdgeFailureReasonCodes.includes('host-dependency-non-literal-missing'), true);
assert.equal(hostDynamicConflict.details.moduleEdgeEvidence[0].hostDependencyKind, 'worker-constructor');
assert.equal(hostDynamicConflict.details.moduleEdgeEvidence[0].hostDependencyStaticSpecifierEvidence, false);
assert.equal(hostDynamicConflict.details.moduleEdgeEvidence[0].hostDependencyRuntimeResolutionClaim, false);
assert.equal(hostDynamicConflict.details.moduleEdgeEvidence[0].hostDependencyResolutionProofRequired, true);

const dynamicConflict = conflictFor('<dynamic-import>');
assert.equal(dynamicConflict.details.moduleEdgeFailureReasonCodes.includes('dynamic-import-non-literal-missing'), true);
assert.equal(dynamicConflict.details.moduleEdgeEvidence[0].dynamicImport, true);
assert.equal(dynamicConflict.details.moduleEdgeEvidence[0].dynamicImportSpecifierKind, 'identifier');
assert.equal(dynamicConflict.details.moduleEdgeEvidence[0].dynamicImportExpressionText, 'target');
assert.equal(dynamicConflict.details.moduleEdgeEvidence[0].dynamicImportRuntimeResolutionClaim, false);
assert.equal(dynamicConflict.details.moduleEdgeEvidence[0].dynamicImportResolutionProofRequired, true);

const missingSymbolConflict = symbolConflictFor('@pkg/app/api');
assert.equal(missingSymbolConflict.details.targetDocumentId, 'doc:api');
assert.equal(missingSymbolConflict.details.targetExportName, 'missingApi');
assert.deepEqual(missingSymbolConflict.details.localNames, ['renamedMissingApi']);
assert.equal(missingSymbolConflict.details.moduleEdgeFailureReasonCodes.includes('project-output-symbol-unresolved'), true);
assert.equal(missingSymbolConflict.details.moduleEdgeEvidence[0].packageName, '@pkg/app');
assert.equal(missingSymbolConflict.details.moduleEdgeEvidence[0].targetDocumentId, 'doc:api');
assert.equal(missingSymbolConflict.details.moduleEdgeEvidence[0].importedName, 'missingApi');
assert.equal(missingSymbolConflict.details.moduleEdgeEvidence[0].localName, 'renamedMissingApi');
assert.deepEqual(missingSymbolConflict.details.moduleEdgeEvidence[0].importAttributes, [{ key: 'type', value: 'typescript' }]);
assert.equal(missingSymbolConflict.details.moduleEdgeEvidence[0].resolvedTargetSymbolId, undefined);
assert.equal(missingSymbolConflict.details.autoMergeClaim, false);
assert.equal(missingSymbolConflict.details.semanticEquivalenceClaim, false);
assert.equal(missingSymbolConflict.details.runtimeEquivalenceClaim, false);

const ambiguousAttributeConflict = conflicts.find((candidate) =>
  candidate.code === 'project-output-import-attribute-unresolved'
  && candidate.details.moduleSpecifier === './data.json'
);
assert.ok(ambiguousAttributeConflict, 'missing ambiguous import-attribute conflict');
assert.equal(ambiguousAttributeConflict.details.sourceHash, 'sha256:attribute-source');
assert.equal(ambiguousAttributeConflict.details.moduleEdgeFailureReasonCodes.includes('import-attribute-static-value-missing'), true);
assert.equal(ambiguousAttributeConflict.details.requiredProof, 'import-attribute-static-proof');
assert.equal(ambiguousAttributeConflict.details.routeId, 'prove-import-attribute-static-values');
assert.equal(ambiguousAttributeConflict.details.routeLane, 'module-export-import-graph');
assert.equal(ambiguousAttributeConflict.details.routeNext, 'supply-import-attribute-static-proof');
assert.equal(ambiguousAttributeConflict.details.moduleEdgeEvidence[0].sourceHash, 'sha256:attribute-source');
assert.equal(ambiguousAttributeConflict.details.moduleEdgeEvidence[0].importAttributeHash, 'hash:attribute-syntax');
assert.deepEqual(ambiguousAttributeConflict.details.moduleEdgeEvidence[0].importAttributes, []);
assert.equal(ambiguousAttributeConflict.details.autoMergeClaim, false);
assert.equal(ambiguousAttributeConflict.details.semanticEquivalenceClaim, false);
assert.equal(ambiguousAttributeConflict.details.runtimeEquivalenceClaim, false);

function conflictFor(moduleSpecifier) {
  const conflict = conflicts.find((candidate) =>
    candidate.code === 'project-output-module-unresolved'
    && candidate.details.moduleSpecifier === moduleSpecifier
  );
  assert.ok(conflict, `missing unresolved module conflict for ${moduleSpecifier}`);
  return conflict;
}

function symbolConflictFor(moduleSpecifier) {
  const conflict = conflicts.find((candidate) =>
    candidate.code === 'project-output-symbol-unresolved'
    && candidate.details.moduleSpecifier === moduleSpecifier
  );
  assert.ok(conflict, `missing unresolved symbol conflict for ${moduleSpecifier}`);
  return conflict;
}
