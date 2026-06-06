import { assert, assertExactAdapterOutranksScanner } from './helpers.mjs';
import {
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeSource,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const estreeFixtureSource = 'export function fromEstree() { return true; }\n';
export const estreeAdapterImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/estree.js',
  sourceText: estreeFixtureSource,
  adapterOptions: {
    ast: {
      type: 'Program',
      sourceType: 'module',
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 45 } },
      body: [{
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'fromEstree', loc: { start: { line: 1, column: 16 }, end: { line: 1, column: 26 } } },
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 45 } },
        body: { type: 'BlockStatement', body: [], loc: { start: { line: 1, column: 29 }, end: { line: 1, column: 45 } } }
      }]
    }
  }
});
assert.equal(estreeAdapterImport.adapter.parser, 'estree');
assert.equal(estreeAdapterImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(estreeAdapterImport.adapter.coverage.exactAst, true);
assert.equal(estreeAdapterImport.adapter.coverage.tokens, false);
assert.equal(estreeAdapterImport.adapter.coverage.trivia, false);
assert.equal(estreeAdapterImport.adapter.coverage.diagnostics, true);
assert.equal(estreeAdapterImport.adapter.coverage.sourceRanges, true);
assert.equal(estreeAdapterImport.adapter.coverage.generatedRanges, false);
assert.equal(estreeAdapterImport.adapter.coverage.semanticCoverage.level, 'declaration-index');
assert.equal(estreeAdapterImport.adapter.coverage.semanticCoverage.symbols, true);
assert.equal(estreeAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromEstree'), true);
assert.equal(estreeAdapterImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('fromestree')), true);
export const scannedEstreeFixtureImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/estree.js',
  sourceText: estreeFixtureSource
});
assertExactAdapterOutranksScanner(estreeAdapterImport, scannedEstreeFixtureImport, 'fromEstree');
const babelFixtureSource = 'export function fromBabel(value: string) { return value; }\n';
export const babelAdapterImport = await runNativeImporterAdapter(createBabelNativeImporterAdapter({
  parserModule: {
    parse(sourceText, options) {
      assert.equal(options.sourceFilename, 'src/babel.ts');
      assert.equal(sourceText.includes('fromBabel'), true);
      return {
        type: 'File',
        program: {
          type: 'Program',
          sourceType: 'module',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } },
          body: [{
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: 'fromBabel' },
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } }
          }]
        },
        errors: []
      };
    }
  }
}), {
  sourcePath: 'src/babel.ts',
  sourceText: babelFixtureSource
});
assert.equal(babelAdapterImport.adapter.parser, 'babel');
assert.equal(babelAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromBabel'), true);
const scannedBabelFixtureImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/babel.ts',
  sourceText: babelFixtureSource
});
assertExactAdapterOutranksScanner(babelAdapterImport, scannedBabelFixtureImport, 'fromBabel');
const malformedBabelImport = await runNativeImporterAdapter(createBabelNativeImporterAdapter({
  parserModule: {
    parse(sourceText, options) {
      assert.equal(options.sourceFilename, 'src/malformed-babel.ts');
      assert.equal(sourceText, 'export function broken( {\n');
      return {
        type: 'File',
        program: {
          type: 'Program',
          sourceType: 'module',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 26 } },
          body: []
        },
        errors: [{
          reasonCode: 'UnexpectedToken',
          message: 'Unexpected token, expected ")"',
          loc: { line: 1, column: 24 }
        }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed-babel.ts',
  sourceText: 'export function broken( {\n'
});
assert.equal(malformedBabelImport.diagnostics.some((diagnostic) => diagnostic.severity === 'error' && diagnostic.code === 'UnexpectedToken'), true);
assert.equal(malformedBabelImport.losses.some((loss) => loss.severity === 'error' && loss.kind === 'unsupportedSyntax' && loss.metadata?.diagnosticCode === 'UnexpectedToken'), true);
assert.equal(malformedBabelImport.evidence.some((record) => record.status === 'failed' && record.metadata?.errors === 1), true);
assert.equal(malformedBabelImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
assert.equal(malformedBabelImport.mergeCandidates[0].readiness, 'blocked');
assert.equal(malformedBabelImport.patch.risk, 'high');
export const tsMock = {
  ScriptTarget: { Latest: 99 },
  ScriptKind: { TS: 3 },
  SyntaxKind: { 0: 'SourceFile', 1: 'FunctionDeclaration', 2: 'Identifier' },
  createSourceFile(fileName, sourceText) {
    const sourceFile = {
      kind: 0,
      fileName,
      pos: 0,
      end: sourceText.length,
      getLineAndCharacterOfPosition(position) {
        return { line: 0, character: position };
      }
    };
    sourceFile.children = [{
      kind: 1,
      pos: 0,
      end: sourceText.length,
      name: { kind: 2, escapedText: 'fromTs' },
      children: []
    }];
    return sourceFile;
  },
  forEachChild(node, visit) {
    for (const child of node.children ?? []) visit(child);
  }
};
const tsFixtureSource = 'export function fromTs(): boolean { return true; }\n';
export const tsAdapterImport = await runNativeImporterAdapter(createTypeScriptCompilerNativeImporterAdapter({ typescript: tsMock }), {
  sourcePath: 'src/ts.ts',
  sourceText: tsFixtureSource
});
assert.equal(tsAdapterImport.adapter.parser, 'typescript-compiler-api');
assert.equal(tsAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromTs'), true);
const scannedTsFixtureImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/ts.ts',
  sourceText: tsFixtureSource
});
assertExactAdapterOutranksScanner(tsAdapterImport, scannedTsFixtureImport, 'fromTs');
