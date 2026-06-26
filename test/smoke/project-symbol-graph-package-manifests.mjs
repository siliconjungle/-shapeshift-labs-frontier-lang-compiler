import { assert } from './helpers.mjs';
import {
  createNativeProjectModuleResolutionFromPackageManifests,
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const projectAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });

const manifestResolution = createNativeProjectModuleResolutionFromPackageManifests({
  packageExportConditions: ['import', 'require', 'default', 'browser', 'node'],
  manifests: [{
    sourcePath: 'packages/app/package.json',
    packageJson: {
      name: '@pkg/app',
      type: 'module',
      exports: {
        './feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' },
        './array': [{ import: './esm/array.mjs' }, './fallback/array.cjs'],
        './features/*': { import: './esm/features/*.mjs', require: './cjs/features/*.cjs' },
        './worker-entry': { import: './esm/worker.mjs', require: './cjs/worker.cjs' },
        './env': { browser: './browser/env.js', node: './node/env.js' },
        './blocked': null
      },
      imports: {
        '#feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' },
        '#blocked': null
      }
    }
  }]
});

assert.equal(manifestResolution.ok, true);
assert.equal(manifestResolution.packageCount, 1);
assert.equal(manifestResolution.packages[0].root, 'packages/app');
assert.equal(manifestResolution.packages[0].packageType, 'module');
assert.equal(manifestResolution.moduleResolution.packageTypeByRoot['packages/app'], 'module');
assert.equal(manifestResolution.moduleResolution.packages['@pkg/app'].type, 'module');
assert.equal(manifestResolution.moduleResolution.packages['@pkg/app'].packageType, 'module');

const manifestProject = await importNativeProject({
  id: 'project_symbol_graph_package_manifest_resolution',
  projectRoot: '.',
  moduleResolution: manifestResolution.moduleResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'packages/app/src/consumer.js',
    sourceText: [
      "import { feature } from '@pkg/app/feature';",
      "import { internal } from '#feature';",
      "import { arrayValue } from '@pkg/app/array';",
      "import { Button } from '@pkg/app/features/button';",
      "import { env } from '@pkg/app/env';",
      "import { blockedExport } from '@pkg/app/blocked';",
      "import { blockedImport } from '#blocked';",
      'export const used = feature + internal + arrayValue + Button + env;'
    ].join('\n')
  }, {
    language: 'typescript',
    sourcePath: 'packages/app/src/host.ts',
    sourceText: [
      "export const resolvedFeatureUrl = import.meta.resolve('@pkg/app/feature');",
      "new Worker('@pkg/app/worker-entry', { type: 'module' });"
    ].join('\n')
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/esm/feature.mjs',
    sourceText: 'export const feature = 1;\nexport const internal = 2;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/esm/array.mjs',
    sourceText: 'export const arrayValue = 3;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/esm/features/button.mjs',
    sourceText: 'export const Button = 4;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/esm/worker.mjs',
    sourceText: 'export const worker = 5;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/cjs/worker.cjs',
    sourceText: 'exports.worker = 6;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/browser/env.js',
    sourceText: 'export const env = "browser";\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/node/env.js',
    sourceText: 'export const env = "node";\n'
  }]
});

const packageExportEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '@pkg/app/feature', 'feature');
assert.equal(packageExportEdge.packageType, 'module');
assert.equal(packageExportEdge.packageRuntimeCondition, 'import');
assert.equal(packageExportEdge.packageExportCondition, 'import');
assert.equal(packageExportEdge.resolutionKind, 'package-source');
assert.equal(packageExportEdge.resolvedModulePath, 'packages/app/esm/feature.mjs');

const packageImportEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '#feature', 'internal');
assert.equal(packageImportEdge.packageType, 'module');
assert.equal(packageImportEdge.packageRuntimeCondition, 'import');
assert.equal(packageImportEdge.packageImportCondition, 'import');
assert.equal(packageImportEdge.resolutionKind, 'package-import-source');
assert.equal(packageImportEdge.resolvedModulePath, 'packages/app/esm/feature.mjs');

const arrayEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '@pkg/app/array', 'arrayValue');
assert.equal(arrayEdge.packageExportCondition, 'import');
assert.equal(arrayEdge.resolutionKind, 'package-source');
assert.equal(arrayEdge.resolvedModulePath, 'packages/app/esm/array.mjs');

const patternExportEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '@pkg/app/features/button', 'Button');
assert.equal(patternExportEdge.packageExportKey, './features/*');
assert.equal(patternExportEdge.packageExportCondition, 'import');
assert.equal(patternExportEdge.packageExportTarget, './esm/features/button.mjs');
assert.equal(patternExportEdge.resolutionKind, 'package-source');
assert.equal(patternExportEdge.resolvedModulePath, 'packages/app/esm/features/button.mjs');

const environmentAmbiguousEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '@pkg/app/env', 'env');
assert.equal(environmentAmbiguousEdge.resolutionKind, 'package-export-environment-ambiguous-missing');
assert.equal(environmentAmbiguousEdge.resolvedModulePath, 'packages/app/env');
assert.equal(environmentAmbiguousEdge.targetDocumentId, undefined);
assert.equal(environmentAmbiguousEdge.packageExportCondition, 'browser|node');
assert.deepEqual(environmentAmbiguousEdge.packageEnvironmentConditionCandidates, ['browser', 'node']);
assert.equal(environmentAmbiguousEdge.packageEnvironmentConditionReasonCode, 'package-environment-condition-ambiguous-missing');
assert.equal(environmentAmbiguousEdge.hostDependencyRuntimeResolutionClaim, undefined);

const hostResolverEdge = findEdgeByFields(manifestProject.projectSymbolGraph.importEdges, {
  sourcePath: 'packages/app/src/host.ts',
  moduleSpecifier: '@pkg/app/feature',
  importKind: 'import-meta-resolve',
  hostDependencyKind: 'import-meta-resolve'
});
assert.equal(hostResolverEdge.packageType, 'module');
assert.equal(hostResolverEdge.packageRuntimeCondition, 'import');
assert.equal(hostResolverEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(hostResolverEdge.packageRuntimeConditionEdgeKind, 'host-import-resolve');
assert.equal(hostResolverEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-host-resolve-evidence');
assert.equal(hostResolverEdge.packageExportCondition, 'import');
assert.equal(hostResolverEdge.resolutionKind, 'package-source');
assert.equal(hostResolverEdge.resolvedModulePath, 'packages/app/esm/feature.mjs');
assert.equal(hostResolverEdge.hostDependencyRuntimeResolutionClaim, false);

const hostWorkerEdge = findEdgeByFields(manifestProject.projectSymbolGraph.importEdges, {
  sourcePath: 'packages/app/src/host.ts',
  moduleSpecifier: '@pkg/app/worker-entry',
  importKind: 'worker-constructor',
  hostDependencyKind: 'worker-constructor'
});
assert.equal(hostWorkerEdge.packageType, 'module');
assert.equal(hostWorkerEdge.resolutionKind, 'package-export-runtime-ambiguous-missing');
assert.equal(hostWorkerEdge.resolvedModulePath, 'packages/app/worker-entry');
assert.equal(hostWorkerEdge.targetDocumentId, undefined);
assert.equal(hostWorkerEdge.packageRuntimeCondition, undefined);
assert.equal(hostWorkerEdge.packageRuntimeConditionEvidenceSource, 'host-runtime-ambiguous');
assert.equal(hostWorkerEdge.packageRuntimeConditionEdgeKind, 'host-worker-constructor');
assert.equal(hostWorkerEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-host-ambiguous-missing');
assert.equal(hostWorkerEdge.packageExportCondition, 'import|require');
assert.equal(hostWorkerEdge.hostDependencyRuntimeResolutionClaim, false);

const blockedExportEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '@pkg/app/blocked', 'blockedExport');
assert.equal(blockedExportEdge.resolutionKind, 'package-export-null-target-missing');
assert.equal(blockedExportEdge.resolvedModulePath, 'packages/app/blocked');
assert.equal(blockedExportEdge.targetDocumentId, undefined);

const blockedImportEdge = findEdge(manifestProject.projectSymbolGraph.importEdges, '#blocked', 'blockedImport');
assert.equal(blockedImportEdge.resolutionKind, 'package-import-null-target-missing');
assert.equal(blockedImportEdge.resolvedModulePath, undefined);
assert.equal(blockedImportEdge.targetDocumentId, undefined);

const duplicateWorkspaceResolution = createNativeProjectModuleResolutionFromPackageManifests({
  packageExportConditions: ['import', 'default'],
  manifests: [{
    sourcePath: 'packages/one/package.json',
    packageJson: { name: '@pkg/duplicate', type: 'module', exports: { '.': './src/index.js' } }
  }, {
    sourcePath: 'packages/two/package.json',
    packageJson: { name: '@pkg/duplicate', type: 'module', exports: { '.': './src/index.js' } }
  }]
});
assert.equal(duplicateWorkspaceResolution.ok, false);
assert.equal(duplicateWorkspaceResolution.diagnostics[0].reasonCode, 'ambiguous-package-workspace-root');
assert.deepEqual(duplicateWorkspaceResolution.diagnostics[0].packageWorkspaceRoots, ['packages/one', 'packages/two']);
assert.deepEqual(duplicateWorkspaceResolution.moduleResolution.packageWorkspaceRootAmbiguities['@pkg/duplicate'], ['packages/one', 'packages/two']);

const duplicateWorkspaceProject = await importNativeProject({
  id: 'project_symbol_graph_duplicate_workspace_package_resolution',
  projectRoot: '.',
  moduleResolution: duplicateWorkspaceResolution.moduleResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'packages/app/src/consumer.js',
    sourceText: "import { duplicate } from '@pkg/duplicate';\nexport const used = duplicate;\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/one/src/index.js',
    sourceText: 'export const duplicate = 1;\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/two/src/index.js',
    sourceText: 'export const duplicate = 2;\n'
  }]
});
const duplicateWorkspaceEdge = findEdge(duplicateWorkspaceProject.projectSymbolGraph.importEdges, '@pkg/duplicate', 'duplicate');
assert.equal(duplicateWorkspaceEdge.resolutionKind, 'package-workspace-root-ambiguous-missing');
assert.equal(duplicateWorkspaceEdge.resolvedModulePath, '@pkg/duplicate');
assert.equal(duplicateWorkspaceEdge.targetDocumentId, undefined);
assert.equal(duplicateWorkspaceEdge.packageWorkspaceRootAmbiguous, true);
assert.deepEqual(duplicateWorkspaceEdge.packageWorkspaceRoots, ['packages/one', 'packages/two']);
assert.equal(duplicateWorkspaceEdge.packageResolutionReasonCode, 'package-workspace-root-ambiguous-missing');
assert.equal(duplicateWorkspaceEdge.hostDependencyRuntimeResolutionClaim, undefined);

const browserEnvironmentProject = await importNativeProject({
  id: 'project_symbol_graph_package_browser_environment_resolution',
  projectRoot: '.',
  moduleResolution: {
    ...manifestResolution.moduleResolution,
    packageEnvironmentCondition: 'browser'
  },
  adapters: [projectAdapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'packages/app/src/consumer.js',
    sourceText: "import { env } from '@pkg/app/env';\nexport const used = env;\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/browser/env.js',
    sourceText: 'export const env = "browser";\n'
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/node/env.js',
    sourceText: 'export const env = "node";\n'
  }]
});
const browserEnvironmentEdge = findEdge(browserEnvironmentProject.projectSymbolGraph.importEdges, '@pkg/app/env', 'env');
assert.equal(browserEnvironmentEdge.resolutionKind, 'package-source');
assert.equal(browserEnvironmentEdge.packageEnvironmentCondition, 'browser');
assert.equal(browserEnvironmentEdge.packageEnvironmentConditionEvidenceSource, 'module-resolution');
assert.equal(browserEnvironmentEdge.packageExportCondition, 'browser');
assert.equal(browserEnvironmentEdge.packageExportTarget, './browser/env.js');
assert.equal(browserEnvironmentEdge.resolvedModulePath, 'packages/app/browser/env.js');

const invalidManifestResolution = createNativeProjectModuleResolutionFromPackageManifests({
  manifests: [{ sourcePath: 'packages/bad/package.json', packageJsonText: '{"name":' }]
});
assert.equal(invalidManifestResolution.ok, false);
assert.equal(invalidManifestResolution.diagnostics[0].reasonCode, 'invalid-package-json');

function findEdge(edges, moduleSpecifier, importedName) {
  const edge = edges.find((candidate) => candidate.moduleSpecifier === moduleSpecifier && candidate.importedName === importedName);
  assert.ok(edge, `missing edge ${moduleSpecifier}:${importedName}`);
  return edge;
}

function findEdgeByFields(edges, expected) {
  const edge = edges.find((candidate) =>
    Object.entries(expected).every(([key, value]) => candidate[key] === value)
  );
  assert.ok(edge, `missing edge ${JSON.stringify(expected)}`);
  return edge;
}
