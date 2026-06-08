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
const scannedDefaultClassImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-class.tsx',
  sourceText: 'export default class RuntimeHost { start() { return true; } }\n'
});
assert.equal(scannedDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RuntimeHost' && symbol.kind === 'class'), true);
assert.equal(scannedDefaultClassImport.sourceMaps[0].mappings.some((mapping) => mapping.ownershipRegionId), true);
const scannedWrapperImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/wrapper.tsx',
  sourceText: 'export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(props, ref) { return props.kind; });\n'
});
assert.equal(scannedWrapperImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Button' && symbol.kind === 'function'), true);
const scannedWrappedRouteImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/wrapped-routes.js',
  sourceText: 'export const appRoutes = defineRoutes([\n  { path: "/todos", component: TodoStore }\n]);\n'
});
assert.equal(scannedWrappedRouteImport.semanticIndex.symbols.some((symbol) => symbol.name === 'appRoutes./todos' && symbol.kind === 'route'), true);
const scannedDefaultConfigImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-config.ts',
  sourceText: 'export default defineConfig({\n  docs: { title: "Docs" },\n  resolve(id) { return id; }\n});\n'
});
assert.equal(scannedDefaultConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default' && symbol.metadata.ownershipRegionKind === 'config'), true);
assert.equal(scannedDefaultConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default.docs' && symbol.metadata.ownershipRegionKind === 'content'), true);
assert.equal(scannedDefaultConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default.resolve' && symbol.kind === 'function'), true);
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
