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
const estreeReExportFixtureSource = "export { value as publicValue } from './value.js';\nexport * from './barrel.js';\n";
export const estreeReExportAdapterImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/re-export.js',
  sourceText: estreeReExportFixtureSource,
  adapterOptions: {
    ast: {
      type: 'Program',
      sourceType: 'module',
      loc: { start: { line: 1, column: 0 }, end: { line: 2, column: 28 } },
      body: [{
        type: 'ExportNamedDeclaration',
        declaration: null,
        specifiers: [{
          type: 'ExportSpecifier',
          local: { type: 'Identifier', name: 'value' },
          exported: { type: 'Identifier', name: 'publicValue' }
        }],
        source: { type: 'Literal', value: './value.js' },
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } }
      }, {
        type: 'ExportAllDeclaration',
        source: { type: 'Literal', value: './barrel.js' },
        loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 28 } }
      }]
    }
  }
});
const reExportRelations = estreeReExportAdapterImport.semanticIndex.relations.filter((relation) => relation.predicate === 'exports');
const reExportFacts = estreeReExportAdapterImport.semanticIndex.facts.filter((fact) => fact.predicate === 'reExportIdentity');
const publicContractRegionFacts = estreeReExportAdapterImport.semanticIndex.facts.filter((fact) => fact.predicate === 'publicContractRegion');
assert.equal(estreeReExportAdapterImport.semanticIndex.metadata.graphCoverage, 'module-edge-declarations');
assert.equal(estreeReExportAdapterImport.semanticIndex.facts.some((fact) => fact.predicate === 'fileHash'), true);
assert.equal(reExportRelations.length, 3);
assert.equal(reExportRelations.every((relation) => relation.metadata?.moduleEdge?.isReExport === true), true);
assert.deepEqual(reExportRelations.map((relation) => relation.metadata.moduleEdge.moduleSpecifier), ['./value.js', './value.js', './barrel.js']);
assert.equal(reExportRelations.some((relation) => relation.metadata.moduleEdge.exportedName === 'publicValue' && relation.metadata.moduleEdge.importedName === 'value'), true);
assert.equal(reExportRelations.some((relation) => relation.metadata.moduleEdge.exportStar === true), true);
assert.equal(reExportFacts.length, 3);
assert.equal(reExportFacts.every((fact) => fact.value.publicContract === true), true);
assert.equal(publicContractRegionFacts.length, 3);
assert.equal(publicContractRegionFacts.every((fact) => fact.value.regionKind === 'export'), true);
assert.equal(estreeReExportAdapterImport.evidence.some((record) => record.metadata?.graphRecords?.reExportIdentities === 3), true);
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
const tsCreateSourceFileCalls = [];
export const tsMock = {
  ScriptTarget: { Latest: 99 },
  ScriptKind: { JS: 1, JSX: 2, TS: 3, TSX: 4 },
  SyntaxKind: { 0: 'SourceFile', 1: 'FunctionDeclaration', 2: 'Identifier' },
  createSourceFile(fileName, sourceText, scriptTarget, setParentNodes, scriptKind) {
    tsCreateSourceFileCalls.push({ fileName, scriptTarget, setParentNodes, scriptKind });
    const functionName = sourceText.includes('fromTsx') ? 'fromTsx' : 'fromTs';
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
      name: { kind: 2, escapedText: functionName },
      children: []
    }];
    return sourceFile;
  },
  forEachChild(node, visit) {
    for (const child of node.children ?? []) visit(child);
  }
};
const tsSymbolCalls = [];
const tsTypeCheckerMock = {
  getSymbolAtLocation(node) {
    const name = String(node?.escapedText ?? node?.text ?? node?.name ?? 'unknown');
    tsSymbolCalls.push(name);
    return { name, escapedName: name, flags: 7, declarations: [node] };
  },
  getFullyQualifiedName(symbol) {
    return `"project".${symbol.name}`;
  }
};
const tsFixtureSource = 'export function fromTs(): boolean { return true; }\n';
export const tsAdapterImport = await runNativeImporterAdapter(createTypeScriptCompilerNativeImporterAdapter({
  typescript: tsMock,
  typeChecker: tsTypeCheckerMock
}), {
  sourcePath: 'src/ts.ts',
  sourceText: tsFixtureSource
});
assert.equal(tsAdapterImport.adapter.parser, 'typescript-compiler-api');
assert.equal(tsCreateSourceFileCalls.find((call) => call.fileName === 'src/ts.ts')?.scriptKind, tsMock.ScriptKind.TS);
const fromTsSymbol = tsAdapterImport.semanticIndex.symbols.find((symbol) => symbol.name === 'fromTs');
assert.equal(Boolean(fromTsSymbol), true);
assert.equal(fromTsSymbol.id.includes('compiler'), true);
assert.equal(fromTsSymbol.metadata.compilerSymbol.fullyQualifiedName, '"project".fromTs');
assert.equal(fromTsSymbol.metadata.compilerSymbol.flags, 7);
assert.equal(tsSymbolCalls.includes('fromTs'), true);
assert.equal(tsAdapterImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId === fromTsSymbol.id), true);
const scannedTsFixtureImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/ts.ts',
  sourceText: tsFixtureSource
});
assertExactAdapterOutranksScanner(tsAdapterImport, scannedTsFixtureImport, 'fromTs');
const tsxFixtureSource = 'export function fromTsx(): JSX.Element { return <div />; }\n';
export const tsxAdapterImport = await runNativeImporterAdapter(createTypeScriptCompilerNativeImporterAdapter({ typescript: tsMock }), {
  sourcePath: 'src/tsx.tsx',
  sourceText: tsxFixtureSource
});
assert.equal(tsCreateSourceFileCalls.find((call) => call.fileName === 'src/tsx.tsx')?.scriptKind, tsMock.ScriptKind.TSX);
assert.equal(tsxAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromTsx'), true);
const scannedTsxFixtureImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/tsx.tsx',
  sourceText: tsxFixtureSource
});
assertExactAdapterOutranksScanner(tsxAdapterImport, scannedTsxFixtureImport, 'fromTsx');
