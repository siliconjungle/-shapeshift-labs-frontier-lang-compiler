import { assert } from './helpers.mjs';
import { createSemanticImportSidecar, diffNativeSources, importNativeSource } from './compiler-api.mjs';

const copiedDefaultPath = 'agent-worktrees/frontier-swarm-codex/native-import-depth/src/copied-default.ts';
const copiedDefaultBefore = 'export default (value: number): number => {\n  return value + 1;\n}\n';
const copiedDefaultAfter = 'export default (value: number): number => {\n  return value + 2;\n}\n';
const copiedDefaultImport = importNativeSource({
  language: 'typescript',
  sourcePath: copiedDefaultPath,
  sourceText: copiedDefaultBefore
});
const copiedDefaultSidecar = createSemanticImportSidecar(copiedDefaultImport, { generatedAt: 137 });
assert.equal(copiedDefaultSidecar.symbols.some((symbol) => symbol.name === 'default' && symbol.kind === 'function'), true);
assert.equal(copiedDefaultSidecar.ownershipRegions.some((region) => region.symbolName === 'default'
  && region.regionKind === 'body'
  && region.sourcePath === copiedDefaultPath), true);
assert.equal(copiedDefaultSidecar.patchHints.some((hint) => hint.sourcePath === copiedDefaultPath
  && hint.ownershipKey.endsWith('#default')), true);

const copiedDefaultChangeSet = diffNativeSources({
  language: 'typescript',
  sourcePath: copiedDefaultPath,
  beforeSourceText: copiedDefaultBefore,
  afterSourceText: copiedDefaultAfter
});
assert.equal(copiedDefaultChangeSet.changedSymbols.some((symbol) => symbol.name === 'default' && symbol.changeKind === 'modified'), true);
assert.equal(copiedDefaultChangeSet.changedRegions.some((region) => region.symbolName === 'default'
  && region.regionKind === 'body'
  && region.sourcePath === copiedDefaultPath), true);

const copiedCommonJsClassPath = 'agent-worktrees/frontier-swarm-codex/native-import-depth/src/copied-commonjs-class.js';
const copiedCommonJsClassBefore = 'module.exports = class Store {\n  save(value) {\n    return value;\n  }\n}\n';
const copiedCommonJsClassAfter = 'module.exports = class Store {\n  save(value) {\n    return String(value);\n  }\n}\n';
const copiedCommonJsClassImport = importNativeSource({
  language: 'javascript',
  sourcePath: copiedCommonJsClassPath,
  sourceText: copiedCommonJsClassBefore
});
const copiedCommonJsClassSidecar = createSemanticImportSidecar(copiedCommonJsClassImport, { generatedAt: 138 });
assert.equal(copiedCommonJsClassSidecar.symbols.some((symbol) => symbol.name === 'Store' && symbol.kind === 'class'), true);
assert.equal(copiedCommonJsClassSidecar.symbols.some((symbol) => symbol.name === 'Store.save' && symbol.kind === 'method'), true);
assert.equal(copiedCommonJsClassSidecar.ownershipRegions.some((region) => region.symbolName === 'Store.save'
  && region.regionKind === 'body'
  && region.sourcePath === copiedCommonJsClassPath), true);
assert.equal(copiedCommonJsClassSidecar.patchHints.some((hint) => hint.sourcePath === copiedCommonJsClassPath
  && hint.ownershipKey.endsWith('#Store.save')), true);

const copiedCommonJsClassChangeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: copiedCommonJsClassPath,
  beforeSourceText: copiedCommonJsClassBefore,
  afterSourceText: copiedCommonJsClassAfter
});
assert.equal(copiedCommonJsClassChangeSet.changedSymbols.some((symbol) => symbol.name === 'Store.save' && symbol.changeKind === 'modified'), true);
assert.equal(copiedCommonJsClassChangeSet.changedRegions.some((region) => region.symbolName === 'Store.save'
  && region.regionKind === 'body'
  && region.sourcePath === copiedCommonJsClassPath), true);
