import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const projectAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });

const dualPackageResolution = {
  packages: {
    '@pkg/dual': {
      root: 'packages/dual',
      exports: {
        './feature': {
          import: './esm/feature.mjs',
          require: './cjs/feature.cjs'
        }
      }
    }
  },
  packageExportConditions: ['import', 'require', 'default']
};

const edgeKindProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_condition_from_edge_kind',
  projectRoot: '.',
  moduleResolution: dualPackageResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/static-import.ts',
    sourceText: "import { dual } from '@pkg/dual/feature';\nexport const used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'src/import-equals.ts',
    sourceText: "import dual = require('@pkg/dual/feature');\nexport const used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'src/dynamic-import.ts',
    sourceText: "export const load = () => import('@pkg/dual/feature');\n"
  }, {
    language: 'javascript',
    sourcePath: 'src/commonjs.cjs',
    sourceText: "const { dual } = require('@pkg/dual/feature');\nexports.used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'src/host-resolvers.ts',
    sourceText: "export const importResolved = import.meta.resolve('@pkg/dual/feature');\nexport const requireResolved = require.resolve('@pkg/dual/feature');\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/esm/feature.mjs',
    sourceText: 'export const dual = 2;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/cjs/feature.cjs',
    sourceText: 'exports.dual = 1;\n'
  }]
});

const staticImportEdge = findEdge(edgeKindProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/static-import.ts',
  moduleSpecifier: '@pkg/dual/feature'
});
assert.equal(staticImportEdge.packageRuntimeCondition, 'import');
assert.equal(staticImportEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(staticImportEdge.packageRuntimeConditionEdgeKind, 'static-module');
assert.equal(staticImportEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-import-evidence');
assert.equal(staticImportEdge.packageExportCondition, 'import');
assert.equal(staticImportEdge.resolutionKind, 'package-source');
assert.equal(staticImportEdge.resolvedModulePath, 'packages/dual/esm/feature.mjs');

const importEqualsEdge = findEdge(edgeKindProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/import-equals.ts',
  moduleSpecifier: '@pkg/dual/feature',
  importKind: 'commonjs-require'
});
assert.equal(importEqualsEdge.packageRuntimeCondition, 'require');
assert.equal(importEqualsEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(importEqualsEdge.packageRuntimeConditionEdgeKind, 'commonjs-require');
assert.equal(importEqualsEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-require-evidence');
assert.equal(importEqualsEdge.packageExportCondition, 'require');
assert.equal(importEqualsEdge.resolvedModulePath, 'packages/dual/cjs/feature.cjs');

const dynamicImportEdge = findEdge(edgeKindProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/dynamic-import.ts',
  moduleSpecifier: '@pkg/dual/feature',
  importKind: 'dynamic-import'
});
assert.equal(dynamicImportEdge.packageRuntimeCondition, 'import');
assert.equal(dynamicImportEdge.packageRuntimeConditionEdgeKind, 'dynamic-import');
assert.equal(dynamicImportEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-dynamic-import-evidence');
assert.equal(dynamicImportEdge.resolvedModulePath, 'packages/dual/esm/feature.mjs');

const commonJsEdge = findEdge(edgeKindProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/commonjs.cjs',
  moduleSpecifier: '@pkg/dual/feature',
  importKind: 'commonjs-require'
});
assert.equal(commonJsEdge.packageRuntimeCondition, 'require');
assert.equal(commonJsEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(commonJsEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-require-evidence');
assert.equal(commonJsEdge.packageExportCondition, 'require');
assert.equal(commonJsEdge.resolvedModulePath, 'packages/dual/cjs/feature.cjs');

const importMetaResolveEdge = findEdge(edgeKindProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/host-resolvers.ts',
  moduleSpecifier: '@pkg/dual/feature',
  hostDependencyKind: 'import-meta-resolve'
});
assert.equal(importMetaResolveEdge.packageRuntimeCondition, 'import');
assert.equal(importMetaResolveEdge.packageRuntimeConditionEdgeKind, 'host-import-resolve');
assert.equal(importMetaResolveEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-host-resolve-evidence');
assert.equal(importMetaResolveEdge.hostDependencyRuntimeResolutionClaim, false);
assert.equal(importMetaResolveEdge.resolvedModulePath, 'packages/dual/esm/feature.mjs');

const requireResolveEdge = findEdge(edgeKindProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/host-resolvers.ts',
  moduleSpecifier: '@pkg/dual/feature',
  hostDependencyKind: 'require-resolve'
});
assert.equal(requireResolveEdge.packageRuntimeCondition, 'require');
assert.equal(requireResolveEdge.packageRuntimeConditionEdgeKind, 'host-require-resolve');
assert.equal(requireResolveEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-host-resolve-evidence');
assert.equal(requireResolveEdge.hostDependencyRuntimeResolutionClaim, false);
assert.equal(requireResolveEdge.resolvedModulePath, 'packages/dual/cjs/feature.cjs');

const conflictProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_condition_edge_conflict',
  projectRoot: '.',
  moduleResolution: dualPackageResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/conflict.mts',
    sourceText: "import dual = require('@pkg/dual/feature');\nexport const used = dual;\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/esm/feature.mjs',
    sourceText: 'export const dual = 2;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/cjs/feature.cjs',
    sourceText: 'exports.dual = 1;\n'
  }]
});
const conflictEdge = findEdge(conflictProject.projectSymbolGraph.importEdges, {
  sourcePath: 'src/conflict.mts',
  moduleSpecifier: '@pkg/dual/feature',
  importKind: 'commonjs-require'
});
assert.equal(conflictEdge.resolutionKind, 'package-runtime-condition-conflict-missing');
assert.equal(conflictEdge.packageRuntimeConditionEvidenceSource, 'conflict');
assert.equal(conflictEdge.packageRuntimeConditionEdgeKind, 'commonjs-require');
assert.equal(conflictEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-conflict-missing');
assert.deepEqual(conflictEdge.packageRuntimeConditionCandidates, ['require', 'import']);
assert.equal(conflictEdge.targetDocumentId, undefined);

function findEdge(edges, expected) {
  const edge = edges.find((candidate) =>
    Object.entries(expected).every(([key, value]) => candidate[key] === value)
  );
  assert.ok(edge, `missing edge ${JSON.stringify(expected)}`);
  return edge;
}
