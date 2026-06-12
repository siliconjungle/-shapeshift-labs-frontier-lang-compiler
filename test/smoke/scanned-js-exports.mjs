import { assert } from './helpers.mjs';
import { createSemanticImportSidecar, importNativeSource } from './compiler-api.mjs';

const scannedDefaultClassImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/default-class.tsx',
  sourceText: 'export default class RuntimeHost { start() { return true; } }\n'
});
assert.equal(scannedDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RuntimeHost' && symbol.kind === 'class'), true);
assert.equal(scannedDefaultClassImport.sourceMaps[0].mappings.some((mapping) => mapping.ownershipRegionId), true);

const scannedAnonymousDefaultClassImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/anonymous-default-class.tsx',
  sourceText: 'export default class extends React.Component { render() { return null; } }\n'
});
assert.equal(scannedAnonymousDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default' && symbol.kind === 'class'), true);
assert.equal(scannedAnonymousDefaultClassImport.semanticIndex.symbols.some((symbol) => symbol.name === 'default.render' && symbol.kind === 'method'), true);

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
