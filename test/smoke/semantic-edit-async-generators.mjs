import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource
} from './compiler-api.mjs';

const asyncGeneratorSource = [
  'export async function load(api) {',
  '  const first = await api.first();',
  '  return first;',
  '}',
  'export function* ids(source) {',
  '  yield source.next();',
  '}',
  ''
].join('\n');
const asyncGeneratorImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/async-generators.ts',
  sourceText: asyncGeneratorSource
});
const loadSymbol = asyncGeneratorImport.semanticIndex.symbols.find((symbol) => symbol.name === 'load');
const idsSymbol = asyncGeneratorImport.semanticIndex.symbols.find((symbol) => symbol.name === 'ids');
const loadEffects = effectFacts(asyncGeneratorImport, loadSymbol).map((fact) => `${fact.value.kind}:${fact.value.line}`);
const idsEffects = effectFacts(asyncGeneratorImport, idsSymbol).map((fact) => `${fact.value.kind}:${fact.value.line}`);
assert.equal(loadEffects.includes('async:1'), true);
assert.equal(loadEffects.includes('async:2'), true);
assert.equal(idsEffects.includes('generator:5'), true);
assert.equal(idsEffects.includes('generator:6'), true);
const asyncGeneratorSidecar = createSemanticImportSidecar(asyncGeneratorImport, { generatedAt: 209 });
assert.equal(asyncGeneratorSidecar.ownershipRegions.some((region) => region.symbolName === 'load:effect:async#2'
  && region.metadata.spanKind === 'async-effect'), true);
assert.equal(asyncGeneratorSidecar.ownershipRegions.some((region) => region.symbolName === 'ids:effect:generator#2'
  && region.metadata.spanKind === 'generator-effect'), true);

const sameLineAwaitSource = [
  'export async function both(api) {',
  '  const first = await api.first(); const second = await api.second();',
  '  return first + second;',
  '}',
  ''
].join('\n');
const sameLineAwaitSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/same-line-await.ts',
  sourceText: sameLineAwaitSource
}), { generatedAt: 210 });
const sameLineAwaitRegions = sameLineAwaitSidecar.ownershipRegions
  .filter((region) => region.regionKind === 'effect' && region.symbolName.startsWith('both:effect:async#'));
assert.equal(sameLineAwaitRegions.length, 3);
assert.equal(sourceTextForSpan(sameLineAwaitSource, sameLineAwaitRegions[1].sourceSpan), 'await api.first();');
assert.equal(sourceTextForSpan(sameLineAwaitSource, sameLineAwaitRegions[2].sourceSpan), 'await api.second();');
assert.equal(sameLineAwaitRegions[1].metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'api.first');
assert.equal(sameLineAwaitRegions[2].metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'api.second');
assert.equal(sameLineAwaitRegions[2].metadata.runtimeOrderEvidence.sameLineAwait, true);

const sameLineYieldSource = [
  'export function* both(source) {',
  '  yield source.first(); yield source.second();',
  '}',
  ''
].join('\n');
const sameLineYieldSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/same-line-yield.ts',
  sourceText: sameLineYieldSource
}), { generatedAt: 211 });
const sameLineYieldRegions = sameLineYieldSidecar.ownershipRegions
  .filter((region) => region.regionKind === 'effect' && region.symbolName.startsWith('both:effect:generator#'));
assert.equal(sameLineYieldRegions.length, 3);
assert.equal(sourceTextForSpan(sameLineYieldSource, sameLineYieldRegions[1].sourceSpan), 'yield source.first();');
assert.equal(sourceTextForSpan(sameLineYieldSource, sameLineYieldRegions[2].sourceSpan), 'yield source.second();');
assert.equal(sameLineYieldRegions[1].metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'source.first');
assert.equal(sameLineYieldRegions[2].metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'source.second');
assert.notEqual(sameLineYieldRegions[1].id, sameLineYieldRegions[2].id);

const asyncOrderBase = [
  'export async function load(api) {',
  '  const first = await api.first();',
  '  const second = await api.second();',
  '  return first + second;',
  '}',
  ''
].join('\n');
const asyncOrderScript = createSemanticEditScript({
  id: 'semantic_async_peer_order_blocked',
  language: 'typescript',
  sourcePath: 'src/async-order.ts',
  baseSourceText: asyncOrderBase,
  workerSourceText: asyncOrderBase.replace('api.first()', 'api.first({ cache: "reload" })'),
  headSourceText: asyncOrderBase.replace('api.second()', 'api.second({ cache: "no-store" })'),
  generatedAt: 210
});
assert.equal(asyncOrderScript.admission.status, 'conflict');
assert.equal(asyncOrderScript.admission.reasonCodes.includes('effect-async-merge-requires-await-order-evidence'), true);
assert.equal(asyncOrderScript.admission.reasonCodes.includes('runtime-order-sensitive-merge-requires-explicit-evidence'), true);

const generatorOrderBase = [
  'export function* ids(source) {',
  '  yield source.first();',
  '  yield source.second();',
  '}',
  ''
].join('\n');
const generatorOrderScript = createSemanticEditScript({
  id: 'semantic_generator_peer_order_blocked',
  language: 'typescript',
  sourcePath: 'src/generator-order.ts',
  baseSourceText: generatorOrderBase,
  workerSourceText: generatorOrderBase.replace('source.first()', 'source.first(true)'),
  headSourceText: generatorOrderBase.replace('source.second()', 'source.second(true)'),
  generatedAt: 211
});
assert.equal(generatorOrderScript.admission.status, 'conflict');
assert.equal(generatorOrderScript.admission.reasonCodes.includes('effect-generator-merge-requires-yield-order-evidence'), true);
assert.equal(generatorOrderScript.admission.reasonCodes.includes('runtime-order-sensitive-merge-requires-explicit-evidence'), true);

function effectFacts(imported, symbol) {
  return imported.semanticIndex.facts.filter((fact) => fact.subjectId === symbol.id && fact.predicate === 'effect');
}

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
