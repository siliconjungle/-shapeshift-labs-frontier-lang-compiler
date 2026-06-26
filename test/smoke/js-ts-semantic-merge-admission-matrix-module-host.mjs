import assert from 'node:assert/strict';
import {
  exportTargetsForValue,
  packageConditions,
  packageRuntimeConditionEvidence
} from '../../src/internal/index-impl/projectSymbolGraphPackageConditions.js';

const semanticMergeModuleHostMatrixCells = [
  {
    id: 'module-export-import-graph/dynamic-import-expression-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-dynamic-import-expression-evidence',
    note: 'non-literal dynamic import edges carry static expression kind/text/hash evidence, fail closed as host/runtime unresolved, and make no runtime-resolution claim'
  },
  {
    id: 'module-export-import-graph/import-meta-url-host-dependency-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-import-meta-url-dependency',
    note: 'static new URL(specifier, import.meta.url) dependencies become module graph edges with host dependency hashes and no runtime-resolution claim'
  },
  {
    id: 'module-export-import-graph/static-host-module-dependencies',
    status: 'done',
    evidence: 'project-symbol-graph-import-meta-url-dependency',
    note: 'static Worker, SharedWorker, serviceWorker.register, worklet addModule, and importScripts targets become host dependency module edges without dynamic target guessing'
  },
  {
    id: 'module-export-import-graph/static-template-literal-host-dependency-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-import-meta-url-dependency',
    note: 'TypeScript no-substitution templates and ESTree no-expression TemplateLiteral nodes resolve as static host dependency specifiers while expression templates remain unsupported'
  },
  {
    id: 'module-export-import-graph/dynamic-host-dependency-proof-required-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-import-meta-url-dependency + js-ts-safe-project-merge-output-module-edge-evidence',
    note: 'recognized host dependency APIs with dynamic targets emit <host-dependency> edges with expression hashes and proof-required unresolved evidence'
  },
  {
    id: 'module-export-import-graph/static-resolver-host-dependencies',
    status: 'done',
    evidence: 'project-symbol-graph-import-meta-url-dependency',
    note: 'static import.meta.resolve and require.resolve literal targets become host dependency graph edges without package/runtime resolution claims'
  },
  {
    id: 'module-export-import-graph/package-runtime-condition-edge-kind-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-package-runtime-condition-from-edge-kind',
    note: 'static import/re-export, CommonJS require, literal dynamic import, and static resolver host edges carry package import/require condition evidence with fail-closed conflict candidates'
  },
  {
    id: 'module-export-import-graph/package-runtime-condition-exclusive-admission-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-package-runtime-condition-exclusive-admission',
    note: 'known import/require runtime evidence excludes the opposite package export condition before conditional target admission'
  },
  {
    id: 'module-export-import-graph/commonjs-helper-package-runtime-condition-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-commonjs-helper-package-runtime-condition',
    note: 'TypeScript-style CommonJS helper edges keep binding-level default/namespace/re-export shape while selecting package require branches from the inner require evidence'
  },
  {
    id: 'module-export-import-graph/commonjs-runtime-interop-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-commonjs-runtime-interop-proof-bridge',
    note: 'default/helper-to-module.exports import-target deltas fail closed with a CommonJS runtime interop proof route and are suppressed only by source-bound proof with trace/evidence hashes and false claim flags'
  },
  {
    id: 'module-export-import-graph/global-augmentation-source-bound-compatibility-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-ambient-declarations + js-ts-safe-project-merge-namespace-ambient-export-assignment-shape',
    note: 'global augmentation edits and shape deltas fail closed with a source-bound declaration/consumer diagnostics compatibility proof route and keep semantic/runtime equivalence claims false'
  },
  {
    id: 'module-export-import-graph/package-import-root-scope-blocker',
    status: 'done',
    evidence: 'project-symbol-graph-resolution',
    note: 'top-level package imports resolve only from the configured in-memory packageRoot/root and fail closed as package-import-scope-missing outside that root'
  },
  {
    id: 'module-export-import-graph/manifest-host-package-condition-blocker',
    status: 'done',
    evidence: 'project-symbol-graph-package-manifests',
    note: 'manifest-derived conditional exports prove static import.meta.resolve package targets, while non-resolver host package specifiers fail closed when import/require targets diverge'
  },
  {
    id: 'module-export-import-graph/manifest-duplicate-workspace-package-blocker',
    status: 'done',
    evidence: 'project-symbol-graph-package-manifests',
    note: 'duplicate manifest package names across workspace roots produce package-workspace-root-ambiguous-missing edges instead of choosing one root'
  },
  {
    id: 'module-export-import-graph/package-environment-condition-blocker',
    status: 'done',
    evidence: 'project-symbol-graph-package-manifests',
    note: 'manifest package exports with divergent browser/node environment targets fail closed without explicit environment evidence and resolve deterministically when that evidence is supplied'
  },
  {
    id: 'module-export-import-graph/output-module-unresolved-edge-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-output-module-edge-evidence',
    note: 'output graph unresolved-module conflicts preserve edge-level fail-closed package, host, dynamic import, and import-attribute evidence instead of collapsing to a generic module miss'
  },
  {
    id: 'module-export-import-graph/output-symbol-unresolved-edge-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-output-module-edge-evidence',
    note: 'output graph resolved-module missing-export conflicts preserve edge-level package and import-attribute evidence instead of collapsing to only a missing symbol name'
  },
  {
    id: 'module-export-import-graph/import-attribute-value-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-import-attributes-graph',
    note: 'static imports, re-exports, dynamic imports, graph deltas, and unresolved-edge evidence preserve normalized import attribute key/value records alongside hashes'
  },
  {
    id: 'module-export-import-graph/commonjs-arrow-block-getter-reexport-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-commonjs-export-star',
    note: 'CommonJS Object.defineProperty getter re-export identities recognize block-bodied arrow getters that statically return a require-alias member'
  },
  {
    id: 'module-export-import-graph/commonjs-named-function-getter-reexport-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-commonjs-export-star',
    note: 'CommonJS Object.defineProperty getter re-export identities recognize named function getter descriptors that statically return a require-alias member'
  },
  {
    id: 'module-export-import-graph/estree-static-template-literal-commonjs-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-commonjs-computed-literal',
    note: 'ESTree no-expression TemplateLiteral nodes are normalized as static CommonJS require/export specifiers while dynamic template expressions remain unsupported'
  },
  {
    id: 'module-export-import-graph/static-template-literal-module-specifier-evidence',
    status: 'done',
    evidence: 'project-symbol-graph-dynamic-import-expression-evidence + project-symbol-graph-commonjs-export-star',
    note: 'TypeScript no-substitution dynamic import templates and ESTree no-expression TemplateLiteral require/import helper specifiers resolve as static module edges while expression templates remain proof-required'
  }
];

assert.equal(semanticMergeModuleHostMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeModuleHostMatrixCells) {
  assert.equal(typeof cell.id, 'string');
  assert.equal(typeof cell.evidence, 'string');
}

const conditionalRuntimeExportValue = {
  import: './esm.js',
  module: './module.js',
  require: './cjs.cjs',
  default: './fallback.js'
};

const importRuntimeEvidence = packageRuntimeConditionEvidence({}, 'src/consumer.js', undefined, {
  importKind: 'module'
});
assert.equal(importRuntimeEvidence.packageRuntimeCondition, 'import');
assert.deepEqual(importRuntimeEvidence.packageRuntimeConditionExcludedConditions, ['require']);

const importRuntimeConditions = packageConditions({}, 'src/consumer.js', undefined, {
  importKind: 'module'
});
assert.equal(importRuntimeConditions.includes('require'), false);
assert.equal(exportTargetsForValue(conditionalRuntimeExportValue, importRuntimeConditions)
  .some((target) => target.path === './cjs.cjs'), false);

const requireRuntimeEvidence = packageRuntimeConditionEvidence({}, 'src/consumer.js', undefined, {
  importKind: 'commonjs-require',
  commonJs: true
});
assert.equal(requireRuntimeEvidence.packageRuntimeCondition, 'require');
assert.deepEqual(requireRuntimeEvidence.packageRuntimeConditionExcludedConditions, ['import', 'module']);

const requireRuntimeConditions = packageConditions({}, 'src/consumer.js', undefined, {
  importKind: 'commonjs-require',
  commonJs: true
});
assert.equal(requireRuntimeConditions.includes('import'), false);
assert.equal(requireRuntimeConditions.includes('module'), false);
assert.equal(exportTargetsForValue(conditionalRuntimeExportValue, requireRuntimeConditions)
  .some((target) => target.path === './esm.js' || target.path === './module.js'), false);
