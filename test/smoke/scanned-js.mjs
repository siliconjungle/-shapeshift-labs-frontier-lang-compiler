import { assert } from './helpers.mjs';
import { createNativeImportResultContract, createNativeSourcePreservation, createSemanticImportSidecar, importNativeSource } from './compiler-api.mjs';

export const scannedJsImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/scanned.js',
  sourceText: '// kept comment\nimport { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\nexport const TODO_LIMIT = 128;\nexport const appRoutes = [\n  { path: "/todos", component: TodoStore },\n  { path: "/settings", component: TodoStore }\n];\nexport const siteContent = {\n  docs: { title: "Docs" },\n  legal: { title: "Terms" },\n  formatTitle: (title) => title.trim()\n};\nexport const runtimeConfig = {\n  limits: { todos: TODO_LIMIT },\n  resolve(id) { return id; }\n};\nexport const helpers = {\n  plain: 1\n};\nexport class TodoStore {\n  save(title) { return addTodo(title); }\n}\n'
});
assert.equal(scannedJsImport.nativeAst.rootId, 'native_root');
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TODO_LIMIT'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore.save'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'appRoutes./todos' && symbol.kind === 'route'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'siteContent.docs'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'runtimeConfig.resolve' && symbol.kind === 'function'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'helpers.plain' && symbol.metadata.ownershipRegionKind === 'property'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.metadata.ownershipRegionKind === 'route'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.metadata.ownershipRegionKind === 'content'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.metadata.ownershipRegionKind === 'config'), true);
assert.equal(scannedJsImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
const scannedSymbolsById = new Map(scannedJsImport.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
assert.equal(scannedJsImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'
  && scannedSymbolsById.get(relation.sourceId)?.name === 'addTodo'
  && scannedSymbolsById.get(relation.targetId)?.name === 'nanoid'), true);
assert.equal(scannedJsImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'
  && scannedSymbolsById.get(relation.sourceId)?.name === 'TodoStore.save'
  && scannedSymbolsById.get(relation.targetId)?.name === 'addTodo'), true);
assert.equal(scannedJsImport.semanticIndex.relations.some((relation) => relation.predicate === 'uses'
  && scannedSymbolsById.get(relation.sourceId)?.name === 'runtimeConfig'
  && scannedSymbolsById.get(relation.targetId)?.name === 'TODO_LIMIT'), true);
assert.equal(scannedJsImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'reference'
  && scannedSymbolsById.get(occurrence.symbolId)?.name === 'addTodo'), true);
assert.equal(scannedJsImport.semanticIndex.metadata.dependencyRelations.calls >= 2, true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.ownershipRegionId), true);
assert.equal(scannedJsImport.losses.some((loss) => loss.kind === 'opaqueNative'), true);
const scannedLossKinds = scannedJsImport.losses.map((loss) => loss.kind);
assert.equal(scannedLossKinds.includes('declarationOnlyCoverage'), true);
assert.equal(scannedLossKinds.includes('partialSemanticIndex'), true);
assert.equal(scannedLossKinds.includes('sourceMapApproximation'), true);
assert.equal(scannedLossKinds.includes('sourcePreservation'), true);
assert.equal(scannedJsImport.mergeCandidates[0].readiness, 'needs-review');
assert.equal(scannedJsImport.metadata.nativeImportLossSummary.categories.includes('sourcePreservation'), true);
assert.equal(scannedJsImport.metadata.sourcePreservation.kind, 'frontier.lang.nativeSourcePreservation');
assert.equal(scannedJsImport.metadata.sourcePreservation.sourceText, scannedJsImport.nativeSource.metadata.sourcePreservation.sourceText);
assert.equal(scannedJsImport.metadata.sourcePreservation.summary.comments >= 1, true);
assert.equal(scannedJsImport.metadata.sourcePreservation.summary.directives >= 1, true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationSummary.total >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationSummary.exact >= 1, true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationRecords.some((record) => record.kind === 'frontier.lang.sourcePreservation'), true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationRecords.some((record) => record.level === 'declaration' || record.level === 'estimated'), true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.preservation === 'declaration' || mapping.preservation === 'estimated'), true);
assert.equal(scannedJsImport.universalAst.proof.obligations.some((obligation) => obligation.status === 'open'), true);
assert.equal(scannedJsImport.universalAst.proof.obligations.some((obligation) => obligation.status === 'external-tool-required'), true);
assert.equal(scannedJsImport.universalAst.paradigmSemantics.bindings.length >= scannedJsImport.semanticIndex.symbols.length, true);
assert.equal(scannedJsImport.universalAst.paradigmSemantics.loweringRecords.length >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsImport.nativeAst.metadata.sourcePreservationSummary.exactSourceAvailable, true);
assert.equal(scannedJsImport.metadata.importResultContract.kind, 'frontier.lang.nativeImportResultContract');
assert.equal(scannedJsImport.metadata.importResultContract.sourceCount, 1);
assert.equal(scannedJsImport.metadata.importResultContract.sourcePreservation.exactSourceAvailable, 1);
assert.equal(scannedJsImport.metadata.importResultContract.regions.total >= 4, true);
assert.equal(scannedJsImport.metadata.importResultContract.regions.taxonomy.presentKinds.includes('import'), true);
assert.equal(scannedJsImport.metadata.importResultContract.sourceMaps.mappingCount >= 4, true);
assert.equal(scannedJsImport.metadata.importResultContract.readiness.semanticMergeReadiness, 'needs-review');
assert.equal(createNativeImportResultContract(scannedJsImport).ids.semanticSidecarIds.length, 1);
const scannedJsSidecar = createSemanticImportSidecar(scannedJsImport);
assert.equal(scannedJsSidecar.dependencies.calls >= 2, true);
assert.equal(scannedJsSidecar.summary.dependencyRelations >= scannedJsSidecar.dependencies.calls, true);
assert.equal(scannedJsSidecar.imports[0].dependencyPredicates.includes('calls'), true);
const scannedEffectImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/effects.ts',
  sourceText: 'export async function loadTodo(api, state) {\n  if (!state.ready) state.ready = true;\n  const res = await fetch(api);\n  state.items.push(await res.json());\n  return state.items;\n}\n'
});
const scannedEffectFacts = scannedEffectImport.semanticIndex.facts;
assert.equal(scannedEffectFacts.some((fact) => fact.predicate === 'controlFlow' && fact.value.kind === 'branch'), true);
assert.equal(scannedEffectFacts.some((fact) => fact.predicate === 'effect' && fact.value.kind === 'network'), true);
assert.equal(scannedEffectFacts.some((fact) => fact.predicate === 'mutation' && fact.value.kind === 'assignment'), true);
assert.equal(scannedEffectFacts.some((fact) => fact.predicate === 'mutation' && fact.value.kind === 'mutating-call'), true);
assert.equal(scannedEffectImport.semanticIndex.metadata.dependencyRelations.controlFlow >= 2, true);
assert.equal(scannedEffectImport.nativeAst.metadata.semanticFactSummary.effects >= 2, true);
const scannedEffectSidecar = createSemanticImportSidecar(scannedEffectImport);
assert.equal(scannedEffectSidecar.imports[0].semanticFactPredicates.includes('controlFlow'), true);
assert.equal(scannedEffectSidecar.imports[0].semanticFactSummary.effect >= 2, true);
const scannedDependencyFactPrecisionImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/dependency-fact-precision.ts',
  sourceText: 'export function classify(repo, value) {\n  const local = repo.fetch(value);\n  const table = { default: local, case: value };\n  switch (value.kind) {\n    case "ready":\n      return table.default;\n    default:\n      return table.case;\n  }\n}\nexport type BranchShape = {\n  default: string;\n  case: string;\n};\n'
});
const dependencyFactPrecisionSymbol = scannedDependencyFactPrecisionImport.semanticIndex.symbols.find((symbol) => symbol.name === 'classify');
const dependencyFactPrecisionFacts = scannedDependencyFactPrecisionImport.semanticIndex.facts.filter((fact) => fact.subjectId === dependencyFactPrecisionSymbol.id);
assert.deepEqual(dependencyFactPrecisionFacts
  .filter((fact) => fact.predicate === 'controlFlow' && fact.value.kind === 'branch')
  .map((fact) => fact.value.line), [4, 5, 7]);
assert.equal(dependencyFactPrecisionFacts.some((fact) => fact.predicate === 'effect' && fact.value.kind === 'network'), false);
assert.equal(dependencyFactPrecisionFacts.some((fact) => fact.predicate === 'mutation' && fact.value.kind === 'assignment'), false);
assert.equal(scannedDependencyFactPrecisionImport.semanticIndex.facts.some((fact) => fact.value?.line >= 10
  && ['controlFlow', 'effect', 'mutation'].includes(fact.predicate)), false);
const scannedDependencyRelationPrecisionImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/dependency-relation-precision.ts',
  sourceText: 'export const actions = { save() { return true; } };\nexport const config = { limit: 1 };\nexport function run(repo) {\n  repo.save();\n  const options = { limit: 2 };\n  return options.limit;\n}\n'
});
const relationPrecisionSymbolsById = new Map(scannedDependencyRelationPrecisionImport.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
const runRelations = scannedDependencyRelationPrecisionImport.semanticIndex.relations.filter((relation) => relationPrecisionSymbolsById.get(relation.sourceId)?.name === 'run');
assert.equal(runRelations.some((relation) => relationPrecisionSymbolsById.get(relation.targetId)?.name === 'actions.save'), false);
assert.equal(runRelations.some((relation) => relationPrecisionSymbolsById.get(relation.targetId)?.name === 'config.limit'), false);
const scannedArrayRiskImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/array-risk.ts',
  sourceText: 'export const entries = [\n  {\n    value: 1,\n    run() { return value; }\n  }\n];\nexport const appRoutes = [\n  {\n    path: "/todos",\n    component: TodoStore,\n    meta: { title: "Todos", path: "/meta" },\n    label: `path: "/template"`\n  }\n];\n'
});
const arrayRiskNames = new Set(scannedArrayRiskImport.semanticIndex.symbols.map((symbol) => symbol.name));
assert.equal(arrayRiskNames.has('entries'), true);
assert.equal(arrayRiskNames.has('entries.value'), false);
assert.equal(arrayRiskNames.has('entries.run'), false);
assert.equal(arrayRiskNames.has('appRoutes./todos'), true);
assert.equal(arrayRiskNames.has('appRoutes.component'), false);
assert.equal(arrayRiskNames.has('appRoutes./meta'), false);
assert.equal(arrayRiskNames.has('appRoutes./template'), false);
const scannedComputedConfigImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/computed-config.ts',
  sourceText: 'export const runtimeConfig = {\n  copy: "{ not a block }",\n  [featureKey]: true,\n  ...defaults,\n  normal: 1,\n  nested: { ready: true }\n};\n'
});
const computedConfigNames = new Set(scannedComputedConfigImport.semanticIndex.symbols.map((symbol) => symbol.name));
assert.equal(computedConfigNames.has('runtimeConfig.normal'), true);
assert.equal(computedConfigNames.has('runtimeConfig.nested.ready'), true);
assert.equal(Array.from(computedConfigNames).some((name) => name.includes('featureKey')), false);
const scannedCommonJsConfigImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/commonjs-config.js',
  sourceText: 'module.exports = {\n  routes: [{ path: "/", component: Home }],\n  runtimeConfig: { enabled: true }\n};\n'
});
assert.equal(scannedCommonJsConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'module.exports.routes' && symbol.metadata.ownershipRegionKind === 'route'), true);
assert.equal(scannedCommonJsConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'module.exports.runtimeConfig' && symbol.metadata.ownershipRegionKind === 'config'), true);
const scannedRichTsImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/rich.tsx',
  sourceText: 'import React, { useMemo as memoize, type ReactNode } from "react";\nimport * as pathTools from "./path-tools.js";\nexport { Widget as ExportedWidget } from "./widgets.js";\nconst localTool = require("./local-tool");\nexport const LIMIT: number = 3;\nexport function formatTitle<T extends string>(title: T): string {\n  return memoize(() => localTool.clean(title), [title]);\n}\nexport class TodoPanel extends React.Component<{ title: ReactNode }> {\n  render(): ReactNode {\n    return formatTitle(this.props.title as string);\n  }\n}\nexport const makeTodo = (title: string): Todo => ({\n  title: pathTools.normalize(title),\n  limit: LIMIT\n});\n'
});
const richSymbolsById = new Map(scannedRichTsImport.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
const richSymbolNames = new Set(scannedRichTsImport.semanticIndex.symbols.map((symbol) => symbol.name));
for (const expectedName of ['React', 'memoize', 'ReactNode', 'pathTools', 'ExportedWidget', 'localTool', 'LIMIT', 'formatTitle', 'TodoPanel', 'TodoPanel.render', 'makeTodo']) {
  assert.equal(richSymbolNames.has(expectedName), true);
}
assert.equal(scannedRichTsImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'
  && richSymbolsById.get(relation.targetId)?.name === 'memoize'), true);
assert.equal(scannedRichTsImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'
  && richSymbolsById.get(relation.sourceId)?.name === 'formatTitle'
  && richSymbolsById.get(relation.targetId)?.name === 'memoize'), true);
assert.equal(scannedRichTsImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'
  && richSymbolsById.get(relation.sourceId)?.name === 'TodoPanel.render'
  && richSymbolsById.get(relation.targetId)?.name === 'formatTitle'), true);
assert.equal(scannedRichTsImport.semanticIndex.relations.some((relation) => relation.predicate === 'uses'
  && richSymbolsById.get(relation.sourceId)?.name === 'makeTodo'
  && richSymbolsById.get(relation.targetId)?.name === 'LIMIT'), true);
const formatTitleSymbol = scannedRichTsImport.semanticIndex.symbols.find((symbol) => symbol.name === 'formatTitle');
assert.equal(formatTitleSymbol.definitionSpan.startLine, 6);
assert.equal(formatTitleSymbol.definitionSpan.endLine, 8);
assert.equal(typeof formatTitleSymbol.definitionSpan.endColumn, 'number');
assert.equal(scannedRichTsImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId === formatTitleSymbol.id && mapping.sourceSpan.endLine === 8), true);
const richSidecar = createSemanticImportSidecar(scannedRichTsImport, { generatedAt: 134, targetPath: 'dist/rich.js' });
assert.equal(richSidecar.summary.emptySemanticIndex, false);
assert.equal(richSidecar.summary.symbols >= 10, true);
assert.equal(richSidecar.ownershipRegions.some((region) => region.symbolName === 'TodoPanel.render' && region.regionKind === 'body'), true);
assert.equal(richSidecar.ownershipRegions.some((region) => region.symbolName === 'memoize' && region.regionKind === 'import'), true);
assert.equal(richSidecar.patchHints.some((hint) => hint.ownershipKey.includes('formatTitle') && hint.sourceSpan.endLine === 8), true);
const scannedPrivateClassImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/private-class.js',
  sourceText: 'export class TokenBucket {\n  #tokens = 0;\n  static #capacity = 10;\n  get size() {\n    return this.#tokens;\n  }\n  #refill(amount) {\n    this.#tokens += amount;\n  }\n}\n'
});
const privateClassNames = new Set(scannedPrivateClassImport.semanticIndex.symbols.map((symbol) => symbol.name));
for (const expectedName of ['TokenBucket', 'TokenBucket.#tokens', 'TokenBucket.#capacity', 'TokenBucket.size', 'TokenBucket.#refill']) {
  assert.equal(privateClassNames.has(expectedName), true);
}
const privateFieldSymbol = scannedPrivateClassImport.semanticIndex.symbols.find((symbol) => symbol.name === 'TokenBucket.#tokens');
assert.equal(privateFieldSymbol.kind, 'property');
assert.equal(privateFieldSymbol.definitionSpan.startLine, 2);
assert.equal(privateFieldSymbol.definitionSpan.endLine, 2);
assert.equal(privateFieldSymbol.metadata.ownershipRegionKind, 'property');
const privateMethodSymbol = scannedPrivateClassImport.semanticIndex.symbols.find((symbol) => symbol.name === 'TokenBucket.#refill');
assert.equal(privateMethodSymbol.kind, 'method');
assert.equal(privateMethodSymbol.definitionSpan.startLine, 7);
assert.equal(privateMethodSymbol.definitionSpan.endLine, 9);
const privateClassSidecar = createSemanticImportSidecar(scannedPrivateClassImport, { generatedAt: 136, targetPath: 'dist/private-class.js' });
assert.equal(privateClassSidecar.ownershipRegions.some((region) => region.symbolName === 'TokenBucket.#tokens' && region.regionKind === 'property'), true);
assert.equal(privateClassSidecar.patchHints.some((hint) => hint.ownershipKey.includes('TokenBucket.#refill') && hint.sourceSpan.endLine === 9), true);
const caseSensitiveImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/case-sensitive.ts',
  sourceText: 'import react from "react";\nimport React from "react";\nexport const pair = [react, React];\n'
});
const caseSensitiveSidecar = createSemanticImportSidecar(caseSensitiveImport);
const caseSensitiveSymbols = caseSensitiveImport.semanticIndex.symbols.filter((symbol) => ['react', 'React'].includes(symbol.name));
const caseSensitiveRegions = caseSensitiveSidecar.ownershipRegions.filter((region) => ['react', 'React'].includes(region.symbolName));
assert.equal(new Set(caseSensitiveSymbols.map((symbol) => symbol.id)).size, 2);
assert.equal(new Set(caseSensitiveRegions.map((region) => region.id)).size, 2);
assert.equal(caseSensitiveSidecar.patchHints.some((hint) => hint.ownershipKey.endsWith('#react')), true);
assert.equal(caseSensitiveSidecar.patchHints.some((hint) => hint.ownershipKey.endsWith('#React')), true);
const destructuredRequireImport = importNativeSource({ language: 'typescript', sourcePath: 'src/destructured-require.ts', sourceText: 'const { readFile, writeFile: writeFileAsync } = require("node:fs/promises");\n' });
const destructuredRequireSidecar = createSemanticImportSidecar(destructuredRequireImport);
assert.equal(destructuredRequireSidecar.summary.emptySemanticIndex, false);
assert.equal(destructuredRequireSidecar.symbols.some((symbol) => symbol.name === 'readFile'), true);
assert.equal(destructuredRequireSidecar.ownershipRegions.some((region) => region.symbolName === 'writeFileAsync' && region.regionKind === 'import'), true);
const sideEffectRequireImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/side-effect-require.js',
  sourceText: 'require("source-map-support/register");\nconst fixture = "require(\\"not-a-module\\")";\n'
});
const sideEffectRequireSymbol = sideEffectRequireImport.semanticIndex.symbols.find((symbol) => symbol.name === 'source-map-support/register');
assert.equal(Boolean(sideEffectRequireSymbol), true);
assert.equal(sideEffectRequireImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'
  && relation.targetId === sideEffectRequireSymbol.id), true);
assert.equal(sideEffectRequireImport.semanticIndex.symbols.some((symbol) => symbol.name === 'not-a-module'), false);
const scannedTypeShapeImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/type-shape.ts',
  sourceText: 'export interface RuntimeConfig<T> {\n  readonly limit: number;\n  resolve(id: string): T;\n}\nexport type RouteTable<T> = {\n  routes: Array<{ path: string; component: T }>;\n  load?: (path: string) => Promise<T>;\n};\n'
});
const typeShapeNames = new Set(scannedTypeShapeImport.semanticIndex.symbols.map((symbol) => symbol.name));
for (const expectedName of ['RuntimeConfig', 'RuntimeConfig.limit', 'RuntimeConfig.resolve', 'RouteTable', 'RouteTable.routes', 'RouteTable.load']) {
  assert.equal(typeShapeNames.has(expectedName), true);
}
assert.equal(scannedTypeShapeImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RuntimeConfig.resolve' && symbol.kind === 'method'), true);
assert.equal(scannedTypeShapeImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RouteTable.load' && symbol.kind === 'function'), true);
const typeShapeSidecar = createSemanticImportSidecar(scannedTypeShapeImport, { generatedAt: 135, targetPath: 'dist/type-shape.js' });
assert.equal(typeShapeSidecar.regionTaxonomy.presentKinds.includes('type'), true);
assert.equal(typeShapeSidecar.ownershipRegions.some((region) => region.symbolName === 'RuntimeConfig.resolve'), true);
assert.equal(typeShapeSidecar.patchHints.some((hint) => hint.ownershipKey.includes('RouteTable.load')), true);
const standalonePreservation = createNativeSourcePreservation({
  language: 'python',
  sourcePath: 'tools/preserve.py',
  sourceText: '# kept\nfrom sys import path\nvalue = 1\n'
});
assert.equal(standalonePreservation.summary.comments, 1);
assert.equal(standalonePreservation.summary.directives, 1);
assert.equal(standalonePreservation.sourceHash.startsWith('fnv1a32:'), true);
const staleDeclaredPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/stale-declared.js',
  sourceText: 'export const staleDeclared = true;\n',
  sourceHash: 'fnv1a32:not_the_real_hash'
});
assert.notEqual(staleDeclaredPreservation.sourceHash, 'fnv1a32:not_the_real_hash');
assert.equal(staleDeclaredPreservation.metadata.declaredSourceHash, 'fnv1a32:not_the_real_hash');
assert.equal(staleDeclaredPreservation.metadata.sourceHashVerified, false);
const compactPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/compact.js',
  sourceText: '// compact\nimport x from "x";\nexport const y = x;\n',
  includeTokens: false,
  includeTrivia: false,
  maxDirectives: 1
});
assert.equal(compactPreservation.tokens.length, 0);
assert.equal(compactPreservation.trivia.length, 0);
assert.equal(compactPreservation.directives.length, 1);
assert.equal(compactPreservation.summary.truncated, true);
