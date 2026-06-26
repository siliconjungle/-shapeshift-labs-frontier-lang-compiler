import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const projectAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });

const conditionalPackageResolution = {
  packages: {
    '@pkg/dual': {
      root: 'packages/dual',
      exports: {
        './feature': {
          import: './esm/feature.mjs',
          require: './cjs/feature.cjs',
          default: './esm/feature.mjs'
        },
        './same': {
          import: './shared/feature.mjs',
          require: './shared/feature.mjs'
        }
      }
    }
  },
  packageExportConditions: ['import', 'require', 'default']
};

const ambiguousRuntimePackageProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_ambiguous_fail_closed',
  projectRoot: '.',
  moduleResolution: conditionalPackageResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/consumer.ts',
    sourceText: "import { dual } from '@pkg/dual/feature';\nexport const used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'packages/dual/cjs/feature.cts',
    sourceText: 'export const dual = 1;\n'
  }, {
    language: 'typescript',
    sourcePath: 'packages/dual/esm/feature.mts',
    sourceText: 'export const dual = 2;\n'
  }]
});
const ambiguousRuntimePackageEdge = findEdge(
  ambiguousRuntimePackageProject.projectSymbolGraph.importEdges,
  '@pkg/dual/feature',
  'dual'
);
assert.equal(ambiguousRuntimePackageEdge.packageRuntimeCondition, 'import');
assert.equal(ambiguousRuntimePackageEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(ambiguousRuntimePackageEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-import-evidence');
assert.equal(ambiguousRuntimePackageEdge.packageExportCondition, 'import');
assert.equal(ambiguousRuntimePackageEdge.resolutionKind, 'package-source');
assert.equal(ambiguousRuntimePackageEdge.resolvedModulePath, 'packages/dual/esm/feature.mts');
assert.equal(ambiguousRuntimePackageEdge.resolvedTargetSymbolId, 'symbol:typescript:export:dual');

const commonJsRuntimePackageProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_commonjs_not_ambiguous',
  projectRoot: '.',
  moduleResolution: conditionalPackageResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/consumer.cts',
    sourceText: "import { dual } from '@pkg/dual/feature';\nexport const used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'packages/dual/cjs/feature.cts',
    sourceText: 'export const dual = 1;\n'
  }]
});
const commonJsRuntimePackageEdge = findEdge(
  commonJsRuntimePackageProject.projectSymbolGraph.importEdges,
  '@pkg/dual/feature',
  'dual'
);
assert.equal(commonJsRuntimePackageEdge.packageExportCondition, 'require');
assert.equal(commonJsRuntimePackageEdge.resolutionKind, 'package-source');
assert.equal(commonJsRuntimePackageEdge.resolvedModulePath, 'packages/dual/cjs/feature.cts');
assert.equal(commonJsRuntimePackageEdge.resolvedTargetSymbolId, 'symbol:typescript:export:dual');

const sameTargetRuntimePackageProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_same_target_not_ambiguous',
  projectRoot: '.',
  moduleResolution: conditionalPackageResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/consumer.ts',
    sourceText: "import { dual } from '@pkg/dual/same';\nexport const used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'packages/dual/shared/feature.mts',
    sourceText: 'export const dual = 1;\n'
  }]
});
const sameTargetRuntimePackageEdge = findEdge(
  sameTargetRuntimePackageProject.projectSymbolGraph.importEdges,
  '@pkg/dual/same',
  'dual'
);
assert.equal(sameTargetRuntimePackageEdge.packageExportCondition, 'import');
assert.equal(sameTargetRuntimePackageEdge.resolutionKind, 'package-source');
assert.equal(sameTargetRuntimePackageEdge.resolvedModulePath, 'packages/dual/shared/feature.mts');

const moduleTypedRuntimePackageProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_type_module_disambiguates_js',
  projectRoot: '.',
  moduleResolution: { ...conditionalPackageResolution, packageType: 'module' },
  adapters: [projectAdapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'src/consumer.js',
    sourceText: "import { dual } from '@pkg/dual/feature';\nexport const used = dual;\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/esm/feature.mjs',
    sourceText: 'export const dual = 2;\n'
  }]
});
const moduleTypedRuntimePackageEdge = findEdge(
  moduleTypedRuntimePackageProject.projectSymbolGraph.importEdges,
  '@pkg/dual/feature',
  'dual'
);
assert.equal(moduleTypedRuntimePackageEdge.packageType, 'module');
assert.equal(moduleTypedRuntimePackageEdge.packageRuntimeCondition, 'import');
assert.equal(moduleTypedRuntimePackageEdge.packageExportCondition, 'import');
assert.equal(moduleTypedRuntimePackageEdge.resolutionKind, 'package-source');
assert.equal(moduleTypedRuntimePackageEdge.resolvedModulePath, 'packages/dual/esm/feature.mjs');

const commonJsTypedRuntimePackageProject = await importNativeProject({
  id: 'project_symbol_graph_package_runtime_type_map_commonjs_disambiguates_js',
  projectRoot: '.',
  moduleResolution: {
    ...conditionalPackageResolution,
    packageTypeByRoot: { 'apps/web': 'commonjs' }
  },
  adapters: [projectAdapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'apps/web/consumer.js',
    sourceText: "import { dual } from '@pkg/dual/feature';\nexport const used = dual;\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/cjs/feature.cjs',
    sourceText: 'exports.dual = 1;\n'
  }]
});
const commonJsTypedRuntimePackageEdge = findEdge(
  commonJsTypedRuntimePackageProject.projectSymbolGraph.importEdges,
  '@pkg/dual/feature',
  'dual'
);
assert.equal(commonJsTypedRuntimePackageEdge.packageType, 'commonjs');
assert.equal(commonJsTypedRuntimePackageEdge.packageRuntimeCondition, 'require');
assert.equal(commonJsTypedRuntimePackageEdge.packageExportCondition, 'require');
assert.equal(commonJsTypedRuntimePackageEdge.resolutionKind, 'package-source');
assert.equal(commonJsTypedRuntimePackageEdge.resolvedModulePath, 'packages/dual/cjs/feature.cjs');

const packageImportProject = await importNativeProject({
  id: 'project_symbol_graph_package_import_runtime_ambiguous_fail_closed',
  projectRoot: '.',
  moduleResolution: {
    packages: {
      '@pkg/app': {
        root: 'packages/app',
        imports: {
          '#feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' }
        }
      }
    },
    packageExportConditions: ['import', 'require', 'default']
  },
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'packages/app/src/consumer.ts',
    sourceText: "import { internal } from '#feature';\nexport const used = internal;\n"
  }, {
    language: 'typescript',
    sourcePath: 'packages/app/cjs/feature.cts',
    sourceText: 'export const internal = 1;\n'
  }, {
    language: 'typescript',
    sourcePath: 'packages/app/esm/feature.mts',
    sourceText: 'export const internal = 2;\n'
  }]
});
const packageImportEdge = findEdge(packageImportProject.projectSymbolGraph.importEdges, '#feature', 'internal');
assert.equal(packageImportEdge.packageName, '@pkg/app');
assert.equal(packageImportEdge.packageImportKey, '#feature');
assert.equal(packageImportEdge.packageRuntimeCondition, 'import');
assert.equal(packageImportEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(packageImportEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-import-evidence');
assert.equal(packageImportEdge.packageImportCondition, 'import');
assert.equal(packageImportEdge.resolutionKind, 'package-import-source');
assert.equal(packageImportEdge.resolvedModulePath, 'packages/app/esm/feature.mts');
assert.equal(packageImportEdge.resolvedTargetSymbolId, 'symbol:typescript:export:internal');

const packageImportTypedProject = await importNativeProject({
  id: 'project_symbol_graph_package_import_type_module_disambiguates_js',
  projectRoot: '.',
  moduleResolution: {
    packages: {
      '@pkg/app': {
        root: 'packages/app',
        type: 'module',
        imports: {
          '#feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' }
        }
      }
    },
    packageExportConditions: ['import', 'require', 'default']
  },
  adapters: [projectAdapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'packages/app/src/consumer.js',
    sourceText: "import { internal } from '#feature';\nexport const used = internal;\n"
  }, {
    language: 'javascript',
    sourcePath: 'packages/app/esm/feature.mjs',
    sourceText: 'export const internal = 2;\n'
  }]
});
const packageImportTypedEdge = findEdge(packageImportTypedProject.projectSymbolGraph.importEdges, '#feature', 'internal');
assert.equal(packageImportTypedEdge.packageType, 'module');
assert.equal(packageImportTypedEdge.packageRuntimeCondition, 'import');
assert.equal(packageImportTypedEdge.packageImportCondition, 'import');
assert.equal(packageImportTypedEdge.resolutionKind, 'package-import-source');
assert.equal(packageImportTypedEdge.resolvedModulePath, 'packages/app/esm/feature.mjs');

const ambiguousRuntimePackageMergeProject = safeMergeJsTsProject({
  id: 'typescript_project_conditional_package_runtime_ambiguous_merge',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  moduleResolution: conditionalPackageResolution,
  baseFiles: {
    'src/consumer.ts': 'export const stable = 1;\n',
    'packages/dual/cjs/feature.cts': 'export const dual = 1;\n',
    'packages/dual/esm/feature.mts': 'export const dual = 2;\n'
  },
  workerFiles: {
    'src/consumer.ts': "import { dual } from '@pkg/dual/feature';\nexport const stable = 1;\nexport const used = dual;\n",
    'packages/dual/cjs/feature.cts': 'export const dual = 1;\n',
    'packages/dual/esm/feature.mts': 'export const dual = 2;\n'
  },
  headFiles: {
    'src/consumer.ts': 'export const stable = 1;\n',
    'packages/dual/cjs/feature.cts': 'export const dual = 1;\n',
    'packages/dual/esm/feature.mts': 'export const dual = 2;\n'
  }
});
const ambiguousRuntimePackageMergeEdge = findEdge(
  ambiguousRuntimePackageMergeProject.outputProjectSymbolGraph.importEdges,
  '@pkg/dual/feature',
  'dual'
);
assert.equal(ambiguousRuntimePackageMergeProject.status, 'merged');
assert.equal(ambiguousRuntimePackageMergeProject.admission.reasonCodes.includes('project-output-module-unresolved'), false);
assert.equal(ambiguousRuntimePackageMergeEdge.packageRuntimeCondition, 'import');
assert.equal(ambiguousRuntimePackageMergeEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(ambiguousRuntimePackageMergeEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-import-evidence');
assert.equal(ambiguousRuntimePackageMergeEdge.packageExportCondition, 'import');
assert.equal(ambiguousRuntimePackageMergeEdge.resolutionKind, 'package-source');
assert.equal(ambiguousRuntimePackageMergeEdge.resolvedTargetSymbolId, 'symbol:typescript:export:dual');

function findEdge(edges, moduleSpecifier, importedName) {
  const edge = edges.find((candidate) => candidate.moduleSpecifier === moduleSpecifier && candidate.importedName === importedName);
  assert.ok(edge, `missing edge ${moduleSpecifier}:${importedName}`);
  return edge;
}
