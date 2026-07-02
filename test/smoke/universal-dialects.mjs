import { assert } from './helpers.mjs';
import {
  createUniversalDialectRegistry,
  importNativeSource,
  summarizeUniversalDialectRegistry,
  UniversalDialectConstructKinds
} from './compiler-api.mjs';
import {
  attachUniversalDialectRegistry as attachUniversalDialectRegistryFromPackage,
  createUniversalDialectRegistry as createUniversalDialectRegistryFromPackage,
  UniversalDialectConstructKinds as UniversalDialectConstructKindsFromPackage
} from '@shapeshift-labs/frontier-lang-dialects';
import {
  attachUniversalDialectRegistry as attachUniversalDialectRegistryFromCompiler
} from '../../dist/index.js';

assert.equal(UniversalDialectConstructKinds.includes('macro'), true);
assert.equal(UniversalDialectConstructKinds.includes('reflection'), true);
assert.equal(UniversalDialectConstructKinds.includes('generator'), true);
assert.equal(UniversalDialectConstructKinds.includes('runtime'), true);
assert.equal(UniversalDialectConstructKinds, UniversalDialectConstructKindsFromPackage);
assert.equal(createUniversalDialectRegistry, createUniversalDialectRegistryFromPackage);
assert.equal(attachUniversalDialectRegistryFromCompiler, attachUniversalDialectRegistryFromPackage);

const evidence = [
  {
    id: 'evidence_rust_macro_expansion',
    kind: 'projection',
    status: 'passed',
    summary: 'rustc expansion hash recorded for route! macro.',
    metadata: { expansionHash: 'hash:rust-route-macro-expanded' }
  },
  {
    id: 'evidence_ts_reflection_metadata',
    kind: 'tool',
    status: 'passed',
    summary: 'TypeScript decorator metadata capture recorded.',
    metadata: { metadataKeysHash: 'hash:design-type-metadata' }
  },
  {
    id: 'evidence_vite_generator_manifest',
    kind: 'generator',
    status: 'passed',
    summary: 'Vite virtual route generator manifest recorded.',
    metadata: { manifestHash: 'hash:vite-virtual-routes' }
  },
  {
    id: 'evidence_node_runtime_contract',
    kind: 'runtime',
    status: 'passed',
    summary: 'Node process.env runtime binding contract recorded.',
    metadata: { runtime: 'node', contractHash: 'hash:node-env-contract' }
  }
];

const losses = [
  {
    id: 'loss_rust_macro_hygiene',
    severity: 'warning',
    kind: 'macroHygiene',
    nodeId: 'native_rust_macro_route',
    evidenceIds: ['evidence_rust_macro_expansion'],
    message: 'Rust macro hygiene requires rustc expansion evidence before target projection.'
  },
  {
    id: 'loss_ts_reflection_metadata',
    severity: 'warning',
    kind: 'reflection',
    nodeId: 'native_ts_reflect_metadata',
    evidenceIds: ['evidence_ts_reflection_metadata'],
    message: 'Decorator reflection metadata is runtime-observed and not portable syntax.'
  },
  {
    id: 'loss_vite_generated_routes',
    severity: 'warning',
    kind: 'generatedCode',
    nodeId: 'native_vite_virtual_routes',
    evidenceIds: ['evidence_vite_generator_manifest'],
    message: 'Virtual route module is produced by a generator outside the source file.'
  },
  {
    id: 'loss_node_runtime_env',
    severity: 'warning',
    kind: 'dynamicRuntime',
    nodeId: 'native_node_process_env',
    evidenceIds: ['evidence_node_runtime_contract'],
    message: 'process.env depends on host runtime state.'
  }
];

const registry = createUniversalDialectRegistry({
  id: 'dialect_registry_all_language_constructs',
  language: 'mixed',
  dialects: [
    {
      id: 'dialect_rust_macro_route',
      language: 'rust',
      dialect: 'rust.macro_rules',
      constructKind: 'macro',
      name: 'route!',
      nativeAstNodeId: 'native_rust_macro_route',
      lossIds: ['loss_rust_macro_hygiene'],
      evidenceIds: ['evidence_rust_macro_expansion'],
      projection: {
        disposition: 'review-required',
        targets: ['typescript', 'python'],
        lossIds: ['loss_rust_macro_hygiene'],
        evidenceIds: ['evidence_rust_macro_expansion'],
        notes: ['Keep macro identity as a dialect record; do not project as a generic function stub.']
      },
      payload: { matcher: '($path:literal => $handler:path)', expansionHash: 'hash:rust-route-macro-expanded' }
    },
    {
      id: 'dialect_ts_reflect_metadata',
      language: 'typescript',
      dialect: 'typescript.decorators.metadata',
      constructKind: 'reflection',
      name: 'Reflect.metadata',
      nativeAstNodeId: 'native_ts_reflect_metadata',
      lossIds: ['loss_ts_reflection_metadata'],
      evidenceIds: ['evidence_ts_reflection_metadata'],
      projection: {
        disposition: 'opaque',
        targets: ['rust', 'c'],
        lossIds: ['loss_ts_reflection_metadata'],
        evidenceIds: ['evidence_ts_reflection_metadata']
      },
      payload: { metadataKeys: ['design:type', 'design:paramtypes'] }
    }
  ],
  externs: [
    {
      id: 'extern_vite_virtual_routes',
      language: 'javascript',
      dialect: 'vite.plugin.virtual-module',
      externKind: 'generatorArtifact',
      name: 'virtual:routes',
      nativeAstNodeId: 'native_vite_virtual_routes',
      binding: { module: 'vite', symbol: 'load' },
      lossIds: ['loss_vite_generated_routes'],
      evidenceIds: ['evidence_vite_generator_manifest'],
      projection: {
        disposition: 'lossy',
        targets: ['typescript'],
        lossIds: ['loss_vite_generated_routes'],
        evidenceIds: ['evidence_vite_generator_manifest']
      },
      payload: { generatedModuleId: 'virtual:routes' }
    },
    {
      id: 'extern_node_process_env',
      language: 'javascript',
      dialect: 'node.runtime',
      externKind: 'runtimeBinding',
      name: 'process.env',
      nativeAstNodeId: 'native_node_process_env',
      binding: { module: 'node:process', symbol: 'env' },
      lossIds: ['loss_node_runtime_env'],
      evidenceIds: ['evidence_node_runtime_contract'],
      projection: {
        disposition: 'runtime-required',
        targets: ['browser', 'wasm'],
        lossIds: ['loss_node_runtime_env'],
        evidenceIds: ['evidence_node_runtime_contract']
      }
    }
  ]
});

const summary = summarizeUniversalDialectRegistry(registry);
assert.equal(summary.records, 4);
assert.equal(summary.constructKinds.macro, 1);
assert.equal(summary.constructKinds.reflection, 1);
assert.equal(summary.externKinds.generatorArtifact, 1);
assert.equal(summary.externKinds.runtimeBinding, 1);
assert.equal(summary.lossIds.includes('loss_rust_macro_hygiene'), true);
assert.equal(summary.evidenceIds.includes('evidence_node_runtime_contract'), true);
assert.equal(summary.projectionReadiness, 'needs-review');

const imported = importNativeSource({
  id: 'import_universal_dialects',
  language: 'mixed',
  parser: 'frontier.universal-dialect-fixture',
  sourcePath: 'fixtures/universal-dialects.fixture',
  rootId: 'native_root',
  nodes: {
    native_root: { id: 'native_root', kind: 'Module', languageKind: 'fixture.Module' },
    native_rust_macro_route: { id: 'native_rust_macro_route', kind: 'MacroInvocation', languageKind: 'Rust.MacroInvocation' },
    native_ts_reflect_metadata: { id: 'native_ts_reflect_metadata', kind: 'Decorator', languageKind: 'TypeScript.Decorator' },
    native_vite_virtual_routes: { id: 'native_vite_virtual_routes', kind: 'VirtualModule', languageKind: 'Vite.VirtualModule' },
    native_node_process_env: { id: 'native_node_process_env', kind: 'MemberExpression', languageKind: 'Node.ProcessEnv' }
  },
  losses,
  evidence,
  universalDialectRegistry: registry
});

const attachedRegistry = imported.universalAst.metadata.dialects;
assert.equal(attachedRegistry.kind, 'frontier.lang.universalDialectRegistry');
assert.equal(attachedRegistry.summary.records, 4);
assert.equal(attachedRegistry.dialects.some((record) => record.constructKind === 'macro' && record.payload.matcher), true);
assert.equal(attachedRegistry.dialects.some((record) => record.constructKind === 'reflection' && record.projection.disposition === 'opaque'), true);
assert.equal(attachedRegistry.externs.some((record) => record.externKind === 'generatorArtifact' && record.binding.module === 'vite'), true);
assert.equal(attachedRegistry.externs.some((record) => record.externKind === 'runtimeBinding' && record.projection.disposition === 'runtime-required'), true);
assert.deepEqual(imported.universalAst.metadata.language.externs.map((record) => record.id).sort(), attachedRegistry.externs.map((record) => record.id).sort());

const dialectLayer = imported.universalAst.layers.dialects;
assert.equal(dialectLayer.layer, 'dialects');
assert.equal(dialectLayer.lossIds.includes('loss_ts_reflection_metadata'), true);
assert.equal(dialectLayer.evidenceIds.includes('evidence_vite_generator_manifest'), true);
assert.equal(dialectLayer.nativeAstNodeIds.includes('native_rust_macro_route'), true);
assert.equal(dialectLayer.records[0].summary.projectionReadiness, 'needs-review');
assert.equal(dialectLayer.metadata.note.includes('generic stubs'), true);
