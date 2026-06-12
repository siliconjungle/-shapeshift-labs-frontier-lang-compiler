import { assert } from './helpers.mjs';
import { createSemanticImportSidecar, importNativeSource } from './compiler-api.mjs';

function scannedSymbol(importResult, name, kind) {
  const symbol = importResult.semanticIndex.symbols.find((entry) => entry.name === name && entry.kind === kind);
  assert.ok(symbol, `expected scanned ${kind} symbol ${name}`);
  return symbol;
}

function assertSourceMappedSymbol(importResult, symbol) {
  assert.equal(symbol.definitionSpan?.startLine >= 1, true);
  assert.equal(symbol.definitionSpan?.endLine >= symbol.definitionSpan?.startLine, true);
  assert.equal(importResult.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId === symbol.id
    && mapping.sourceSpan?.startLine === symbol.definitionSpan.startLine
    && mapping.sourceSpan?.endLine === symbol.definitionSpan.endLine), true);
}

const scannedDefaultClassImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-class.tsx',
  sourceText: 'export default class RuntimeHost { start() { return true; } }\n'
});
assert.equal(scannedDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RuntimeHost' && symbol.kind === 'class'), true);
assert.equal(scannedDefaultClassImport.sourceMaps[0].mappings.some((mapping) => mapping.ownershipRegionId), true);
assertSourceMappedSymbol(scannedDefaultClassImport, scannedSymbol(scannedDefaultClassImport, 'RuntimeHost', 'class'));

const scannedAnonymousDefaultClassImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/anonymous-default-class.tsx',
  sourceText: 'export default class extends React.Component { render() { return null; } }\n'
});
assert.equal(scannedAnonymousDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default' && symbol.kind === 'class'), true);
assert.equal(scannedAnonymousDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default.render' && symbol.kind === 'method'), true);
assertSourceMappedSymbol(scannedAnonymousDefaultClassImport, scannedSymbol(scannedAnonymousDefaultClassImport, 'default', 'class'));

const scannedNamedDefaultFunctionImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-function.ts',
  sourceText: 'export default async function loadUser(id: string) { return id; }\n'
});
assertSourceMappedSymbol(scannedNamedDefaultFunctionImport, scannedSymbol(scannedNamedDefaultFunctionImport, 'loadUser', 'function'));

const scannedAnonymousDefaultFunctionImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/anonymous-default-function.ts',
  sourceText: 'export default function (props: Props) { return props.title; }\n'
});
assertSourceMappedSymbol(scannedAnonymousDefaultFunctionImport, scannedSymbol(scannedAnonymousDefaultFunctionImport, 'default', 'function'));

const scannedWrapperImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/wrapper.tsx',
  sourceText: 'export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(props, ref) { return props.kind; });\n'
});
assert.equal(scannedWrapperImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Button' && symbol.kind === 'function'), true);

const scannedDefaultWrapperImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-wrapper.tsx',
  sourceText: 'export default React.memo(function Card(props: Props) { return props.title; });\n'
});
assert.equal(scannedDefaultWrapperImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Card' && symbol.kind === 'function'), true);
assert.equal(scannedDefaultWrapperImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Card' && symbol.metadata.ownershipRegionKind === 'body'), true);

const scannedDefaultForwardRefImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-forward-ref.tsx',
  sourceText: 'export default forwardRef<HTMLButtonElement, Props>((props, ref) => props.kind);\n'
});
assert.equal(scannedDefaultForwardRefImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default' && symbol.kind === 'function'), true);

const scannedDefaultClassWrapperImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-class-wrapper.tsx',
  sourceText: 'export default React.memo(class Card extends React.Component { render() { return null; } });\n'
});
assertSourceMappedSymbol(scannedDefaultClassWrapperImport, scannedSymbol(scannedDefaultClassWrapperImport, 'Card', 'class'));
assert.equal(scannedDefaultClassWrapperImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Card'
  && symbol.metadata.ownershipRegionKind === 'type'), true);

const scannedDefaultObjectFunctionWrapperImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-object-function-wrapper.ts',
  sourceText: 'export default Object.freeze(function makePlugin(input: PluginInput) { return input; });\n'
});
assertSourceMappedSymbol(
  scannedDefaultObjectFunctionWrapperImport,
  scannedSymbol(scannedDefaultObjectFunctionWrapperImport, 'makePlugin', 'function')
);

const scannedDefaultAliasImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-alias.tsx',
  sourceText: 'const Card = () => null;\nexport default Card;\n'
});
const defaultAliasSymbolsById = new Map(scannedDefaultAliasImport.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
assert.equal(scannedDefaultAliasImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default' && symbol.kind === 'variable'), true);
assert.equal(scannedDefaultAliasImport.semanticIndex.relations.some((relation) => relation.predicate === 'uses'
  && defaultAliasSymbolsById.get(relation.sourceId)?.name === 'default'
  && defaultAliasSymbolsById.get(relation.targetId)?.name === 'Card'), true);

const scannedCommonJsAliasImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/commonjs-alias.js',
  sourceText: 'const Component = () => null;\nmodule.exports = Component;\n'
});
const commonJsAliasSymbolsById = new Map(scannedCommonJsAliasImport.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
assert.equal(scannedCommonJsAliasImport.semanticIndex.symbols.some((symbol) => symbol.name === 'module.exports' && symbol.kind === 'variable'), true);
assert.equal(scannedCommonJsAliasImport.semanticIndex.relations.some((relation) => relation.predicate === 'uses'
  && commonJsAliasSymbolsById.get(relation.sourceId)?.name === 'module.exports'
  && commonJsAliasSymbolsById.get(relation.targetId)?.name === 'Component'), true);

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

const scannedNestedConfigImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/nested-config.ts',
  sourceText: 'export const adminSettings = {\n  quota: { limit: 5, refill: { intervalMs: 1000 } },\n  roles: {\n    owner: { canEdit: true }\n  }\n};\nexport const websiteContent = {\n  docs: { title: "Docs", hero: { cta: "Start" } }\n};\n'
});
const nestedConfigSymbols = new Set(scannedNestedConfigImport.semanticIndex.symbols.map((symbol) => symbol.name));
for (const expectedName of ['adminSettings.quota.limit', 'adminSettings.quota.refill.intervalMs', 'adminSettings.roles.owner.canEdit', 'websiteContent.docs.title', 'websiteContent.docs.hero.cta']) {
  assert.equal(nestedConfigSymbols.has(expectedName), true);
}
assert.equal(scannedNestedConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'adminSettings.quota.limit' && symbol.metadata.ownershipRegionKind === 'config'), true);
assert.equal(scannedNestedConfigImport.semanticIndex.symbols.some((symbol) => symbol.name === 'websiteContent.docs.title' && symbol.metadata.ownershipRegionKind === 'content'), true);
const nestedConfigSidecar = createSemanticImportSidecar(scannedNestedConfigImport);
assert.equal(nestedConfigSidecar.ownershipRegions.some((region) => region.symbolName === 'adminSettings.quota.refill.intervalMs'), true);
assert.equal(nestedConfigSidecar.patchHints.some((hint) => hint.ownershipKey.includes('websiteContent.docs.hero.cta')), true);

const scannedCommonJsAssignmentImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'cjs-assignment.js',
  sourceText: 'module.exports.runtimeConfig = {\n  limits: { todos: 5 }\n};\nmodule.exports.appRoutes = [\n  { path: "/todos", component: TodoStore }\n];\nexports.docsContent = {\n  docs: { title: "Docs" }\n};\n'
});
assert.equal(scannedCommonJsAssignmentImport.semanticIndex.symbols.some((symbol) => symbol.name === 'module.exports.runtimeConfig' && symbol.metadata.ownershipRegionKind === 'config'), true);
assert.equal(scannedCommonJsAssignmentImport.semanticIndex.symbols.some((symbol) => symbol.name === 'module.exports.runtimeConfig.limits.todos' && symbol.metadata.ownershipRegionKind === 'config'), true);
assert.equal(scannedCommonJsAssignmentImport.semanticIndex.symbols.some((symbol) => symbol.name === 'module.exports.appRoutes./todos' && symbol.kind === 'route'), true);
assert.equal(scannedCommonJsAssignmentImport.semanticIndex.symbols.some((symbol) => symbol.name === 'exports.docsContent.docs.title' && symbol.metadata.ownershipRegionKind === 'content'), true);
const commonJsAssignmentSidecar = createSemanticImportSidecar(scannedCommonJsAssignmentImport);
assert.equal(commonJsAssignmentSidecar.ownershipRegions.some((region) => region.symbolName === 'module.exports.runtimeConfig.limits.todos' && region.key.includes('#config#module.exports.runtimeConfig.limits.todos')), true);
assert.equal(commonJsAssignmentSidecar.patchHints.some((hint) => hint.ownershipKey.includes('#route#module.exports.appRoutes./todos')), true);
assert.equal(commonJsAssignmentSidecar.patchHints.some((hint) => hint.ownershipKey.includes('#content#exports.docsContent.docs.title')), true);

const scannedExportRegionImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/export-regions.ts',
  sourceText: 'import { helper } from "./helper.js";\nexport { helper as publicHelper };\nexport * from "./more.js";\nexport function run() { return helper(); }\nexport default run;\n'
});
const exportRegionSymbols = scannedExportRegionImport.semanticIndex.symbols;
const exportRegionSymbolIds = exportRegionSymbols.map((symbol) => symbol.id);
assert.equal(exportRegionSymbolIds.length, new Set(exportRegionSymbolIds).size);
assert.equal(exportRegionSymbols.some((symbol) => symbol.name === 'publicHelper' && symbol.kind === 'export' && symbol.metadata.ownershipRegionKind === 'export'), true);
assert.equal(exportRegionSymbols.some((symbol) => symbol.name === '* from ./more.js' && symbol.kind === 'module' && symbol.metadata.ownershipRegionKind === 'export'), true);
assert.equal(exportRegionSymbols.some((symbol) => symbol.name === 'run' && symbol.kind === 'export' && symbol.metadata.ownershipRegionKind === 'export'), true);
assert.equal(exportRegionSymbols.some((symbol) => symbol.name === 'run' && symbol.kind === 'function' && symbol.metadata.ownershipRegionKind === 'body'), true);
assert.equal(exportRegionSymbols.some((symbol) => symbol.name === 'default' && symbol.kind === 'export' && symbol.metadata.ownershipRegionKind === 'export'), true);
const exportRegionSidecar = createSemanticImportSidecar(scannedExportRegionImport);
assert.equal(exportRegionSidecar.ownershipRegions.some((region) => region.symbolName === 'publicHelper' && region.regionKind === 'export'), true);
assert.equal(exportRegionSidecar.ownershipRegions.some((region) => region.symbolName === 'run' && region.regionKind === 'body'), true);
assert.equal(exportRegionSidecar.patchHints.some((hint) => hint.ownershipKey.includes('#export#publicHelper') && hint.supportedOperations.includes('replace-export')), true);
assert.equal(exportRegionSidecar.patchHints.some((hint) => hint.ownershipKey.includes('#export#default') && hint.supportedOperations.includes('replace-export')), true);
assert.equal(exportRegionSidecar.patchHints.some((hint) => hint.ownershipKey.includes('#body#run') && hint.supportedOperations.includes('replace-body')), true);
