import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';

const commonJsHelperPackageProject = await importNativeProject({
  id: 'project_symbol_graph_commonjs_helper_package_runtime_condition',
  projectRoot: '.',
  moduleResolution: {
    packages: {
      '@pkg/dual': {
        root: 'packages/dual',
        exports: {
          './feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs', default: './esm/feature.mjs' }
        }
      }
    },
    packageExportConditions: ['import', 'require', 'default']
  },
  sources: [{
    language: 'javascript',
    sourcePath: 'src/consumer.js',
    sourceText: "const feature = __importDefault(require('@pkg/dual/feature'));\nexports.used = feature.default;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/cjs/feature.cjs',
    sourceText: 'const runtime = {};\nmodule.exports = runtime;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/esm/feature.mjs',
    sourceText: 'export default function esmFeature() { return true; }\n',
    metadata: { semanticImportExpected: true }
  }]
});

const commonJsHelperPackageEdge = commonJsHelperPackageProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === '@pkg/dual/feature' && edge.localName === 'feature');
assert.equal(commonJsHelperPackageEdge.importKind, 'default');
assert.equal(commonJsHelperPackageEdge.commonJs, true);
assert.equal(commonJsHelperPackageEdge.interopHelper, '__importDefault');
assert.equal(commonJsHelperPackageEdge.packageExportCondition, 'require');
assert.equal(commonJsHelperPackageEdge.packageRuntimeCondition, 'require');
assert.equal(commonJsHelperPackageEdge.packageRuntimeConditionEvidenceSource, 'edge-kind');
assert.equal(commonJsHelperPackageEdge.packageRuntimeConditionReasonCode, 'package-runtime-condition-edge-require-evidence');
assert.equal(commonJsHelperPackageEdge.packageRuntimeConditionEdgeKind?.startsWith('commonjs-helper-'), true);
assert.equal(commonJsHelperPackageEdge.resolvedModulePath, 'packages/dual/cjs/feature.cjs');
assert.equal(commonJsHelperPackageEdge.resolutionKind, 'package-source');
assert.equal(commonJsHelperPackageEdge.resolvedTargetSymbolId, 'symbol:javascript:export:module_exports');
