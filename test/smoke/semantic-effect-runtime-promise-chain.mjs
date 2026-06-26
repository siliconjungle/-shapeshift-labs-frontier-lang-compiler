import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const source = 'export function fallback(api, report) {\n  return fetch(api).then(parse).catch(() => fetch(api.backup)).finally(report);\n}\n';
const sidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/promise-chain-handler-order.ts',
  sourceText: source
}), { generatedAt: 211 });
const regions = sidecar.ownershipRegions
  .filter((region) => region.symbolName?.startsWith('fallback:effect:network#'));
assert.equal(regions.length, 2);

const sourcePromise = regions.find((region) => textForSpan(source, region.sourceSpan) === 'fetch(api)');
const catchHandler = regions.find((region) => textForSpan(source, region.sourceSpan) === 'fetch(api.backup)');
assert.ok(sourcePromise);
assert.ok(catchHandler);
assert.equal(sourcePromise.metadata.runtimeOrderEvidence.sameLinePromiseChain[0].regionRole, 'source-promise');
assert.equal(catchHandler.metadata.runtimeOrderEvidence.sameLinePromiseChain[0].regionRole, 'chain-handler');
assert.equal(catchHandler.metadata.runtimeOrderEvidence.sameLinePromiseChain[0].handlerMethodName, 'catch');
assert.equal(catchHandler.metadata.runtimeOrderEvidence.sameLinePromiseChain[0].handlerStepOrdinal, 2);
assert.deepEqual(catchHandler.metadata.runtimeOrderEvidence.sameLinePromiseChain[0].chainMethods, ['then', 'catch', 'finally']);

const merge = safeMergeJsTsSource({
  id: 'semantic_promise_chain_handler_effect_order_blocked',
  language: 'typescript',
  sourcePath: 'src/promise-chain-handler-order.ts',
  baseSourceText: source,
  workerSourceText: source.replace('fetch(api.backup)', 'fetch(api.recovery)'),
  headSourceText: source.replace('.catch(() => fetch(api.backup))', '.catch((error) => fetch(api.backup, { signal: error.signal }))')
});
assert.equal(merge.status, 'blocked');
assert.equal(merge.admission.reasonCodes.includes('runtime-order-promise-chain-merge-requires-handler-order-evidence'), true);
assert.equal(merge.admission.reasonCodes.includes('runtime-order-promise-chain-handler-equivalence-not-proven'), true);

function textForSpan(sourceText, span) {
  const lines = sourceText.split('\n');
  if (!span?.startLine || !span?.endLine) return '';
  if (span.startLine === span.endLine) return lines[span.startLine - 1].slice(span.startColumn - 1, span.endColumn - 1);
  return '';
}
