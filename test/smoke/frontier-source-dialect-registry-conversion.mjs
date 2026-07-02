import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  createUniversalAstFromDocument,
  createUniversalConversionPlanFromFrontierSource,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const source = `
module DialectRegistryConversion @id("mod_dialect_registry_conversion")

type User @id("type_user") {
  name: Text
}

conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
}

dialectRegistry RuntimeDialects @id("dialect_registry_runtime") {
  language javascript
  sourcePath src/runtime.ts
  dialect nodeProcess @id("dialect_registry_node_process") dialect node.runtime kind runtime name process.env target rust disposition unsupported readiness blocked loss loss_node_process_projection evidence evidence_node_runtime sourceMap sourcemap_runtime
  extern viteRoutes @id("dialect_registry_vite_routes") dialect vite.plugin.virtual-module externKind generatorArtifact target rust disposition runtime-required readiness needs-review evidence evidence_vite_routes_manifest bindingSymbol virtual:routes module vite
}
`;

const compiled = compileFrontierSource(source, { target: 'javascript' });
assert.equal(compiled.ok, true);
assert.equal(compiled.document.metadata.dialects.id, 'dialect_registry_runtime');
assert.equal(compiled.document.metadata.dialects.summary.records, 2);

const universalAst = createUniversalAstFromDocument(compiled.document);
assert.equal(universalAst.metadata.dialects.id, 'dialect_registry_runtime');
assert.deepEqual(universalAst.metadata.language.externs.map((record) => record.id), ['dialect_registry_vite_routes']);
assert.equal(universalAst.layers.dialects.metadata.registryId, 'dialect_registry_runtime');
assert.equal(universalAst.layers.dialects.lossIds.includes('loss_node_process_projection'), true);
assert.equal(universalAst.layers.dialects.evidenceIds.includes('evidence_node_runtime'), true);

const plan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'dialect-registry-conversion.frontier',
  generatedAt: 904,
  universalCapabilityMatrix: capabilityMatrix('javascript', 'rust'),
  imports: [sourceImport()]
});

assert.equal(plan.metadata.authoredFrontierSource.dialectRegistryId, 'dialect_registry_runtime');
assert.equal(plan.metadata.authoredFrontierSource.dialectRegistryRecordIds[0], 'dialect_registry_node_process');
assert.equal(plan.metadata.authoredFrontierSource.dialectRegistryExternIds[0], 'dialect_registry_vite_routes');

const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  dialectRegistryId: 'dialect_registry_runtime',
  dialectRecordId: 'dialect_registry_node_process',
  dialectDisposition: 'unsupported',
  dialectLossId: 'loss_node_process_projection'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.dialect.readiness, 'blocked');
assert.equal(route.dialect.recordIds.includes('dialect_registry_node_process'), true);
assert.equal(route.blockers.some((blocker) => blocker.includes('node.runtime:process.env')), true);
assert.equal(route.semanticEquivalenceClaim, false);
assert.equal(route.autoMergeClaim, false);

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 904,
    languages: [{
      language,
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } } },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      }
    }],
    metadata: { compileTargets: [target] }
  };
}

function sourceImport() {
  return {
    language: 'javascript',
    nativeAst: { language: 'javascript' },
    summary: { symbols: 1 },
    semanticIndex: { symbols: [{ id: 'symbol_user', name: 'User' }] },
    universalAst: { metadata: { sourceLanguage: 'javascript' } }
  };
}
