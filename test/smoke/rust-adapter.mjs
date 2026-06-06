import { assert, assertExactAdapterOutranksScanner } from './helpers.mjs';
import { createRustSynNativeImporterAdapter, importNativeSource, runNativeImporterAdapter } from './compiler-api.mjs';

const rustSynFixtureSource = 'use std::sync::Arc;\npub struct RustThing;\npub fn from_rust(value: usize) -> usize { value }\nimpl RustThing { pub fn save(&self) {} }\n';
const rustSynFixture = {
  kind: 'File',
  items: [{
    kind: 'ItemUse',
    span: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 19 },
    tree: {
      kind: 'UsePath',
      ident: 'std',
      tree: {
        kind: 'UsePath',
        ident: 'sync',
        tree: { kind: 'UseName', ident: 'Arc' }
      }
    }
  }, {
    kind: 'ItemStruct',
    ident: 'RustThing',
    vis: 'pub',
    span: { startLine: 2, startColumn: 0, endLine: 2, endColumn: 21 },
    fields: { kind: 'FieldsUnit' }
  }, {
    Struct: {
      ident: 'WrappedRustThing',
      vis: 'pub',
      span: { startLine: 2, startColumn: 22, endLine: 2, endColumn: 45 },
      fields: { kind: 'FieldsUnit' }
    }
  }, {
    kind: 'ItemFn',
    vis: 'pub',
    span: { startLine: 3, startColumn: 0, endLine: 3, endColumn: 50 },
    sig: {
      kind: 'Signature',
      ident: 'from_rust',
      inputs: [],
      output: { kind: 'ReturnType', path: 'usize' }
    },
    block: { kind: 'Block', stmts: [] }
  }, {
    kind: 'ItemImpl',
    span: { startLine: 4, startColumn: 0, endLine: 4, endColumn: 39 },
    self_ty: { kind: 'TypePath', path: { segments: [{ ident: 'RustThing' }] } },
    items: [{
      kind: 'ImplItemFn',
      vis: 'pub',
      sig: { kind: 'Signature', ident: 'save', inputs: [] },
      block: { kind: 'Block', stmts: [] }
    }]
  }]
};
export const rustSynImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter({ rustEdition: '2021' }), {
  sourcePath: 'src/rust_syn.rs',
  sourceText: rustSynFixtureSource,
  adapterOptions: { ast: rustSynFixture }
});
assert.equal(rustSynImport.adapter.parser, 'syn');
assert.equal(rustSynImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(rustSynImport.nativeAst.parser, 'syn');
assert.equal(rustSynImport.metadata.astFormat, 'rust-syn');
assert.equal(rustSynImport.metadata.rustEdition, '2021');
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_rust'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RustThing'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'WrappedRustThing'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RustThing.impl'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'save' && symbol.kind === 'method'), true);
assert.equal(rustSynImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(rustSynImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('from_rust')), true);
const scannedRustSynFixtureImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/rust_syn.rs',
  sourceText: rustSynFixtureSource
});
assertExactAdapterOutranksScanner(rustSynImport, scannedRustSynFixtureImport, 'from_rust');
export const rustSynMacroImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter(), {
  sourcePath: 'src/rust_macro.rs',
  sourceText: 'macro_rules! generated { () => {} }\n',
  adapterOptions: {
    ast: {
      kind: 'File',
      items: [{ kind: 'ItemMacro', ident: 'generated', span: { startLine: 1, startColumn: 0 } }]
    }
  }
});
assert.equal(rustSynMacroImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
assert.equal(rustSynMacroImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const malformedRustSynImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        file: { kind: 'File', items: [] },
        errors: [{ code: 'RustSyntaxError', message: 'expected item', loc: { line: 1, column: 4 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_rust.rs',
  sourceText: 'pub fn {\n'
});
assert.equal(malformedRustSynImport.diagnostics.some((diagnostic) => diagnostic.code === 'RustSyntaxError'), true);
assert.equal(malformedRustSynImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingRustSynImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter(), {
  sourcePath: 'src/missing_rust_syn.rs',
  sourceText: 'pub fn missing() {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingRustSynImport.nativeAst.nodes[missingRustSynImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingRustSynImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
