import { assert, assertExactAdapterOutranksScanner } from './helpers.mjs';
import { createPythonAstNativeImporterAdapter, importNativeSource, runNativeImporterAdapter } from './compiler-api.mjs';

const pythonAstFixtureSource = 'import os\nasync def from_py(value):\n    return value\nclass PyThing:\n    pass\n';
const pythonAstFixture = {
  _type: 'Module',
  body: [{
    _type: 'Import',
    lineno: 1,
    col_offset: 0,
    end_lineno: 1,
    end_col_offset: 9,
    names: [{ _type: 'alias', name: 'os', asname: null }]
  }, {
    _type: 'AsyncFunctionDef',
    name: 'from_py',
    lineno: 2,
    col_offset: 0,
    end_lineno: 3,
    end_col_offset: 16,
    args: {
      _type: 'arguments',
      args: [{ _type: 'arg', arg: 'value', lineno: 2, col_offset: 18 }],
      defaults: []
    },
    body: [{
      _type: 'Return',
      lineno: 3,
      col_offset: 4,
      end_lineno: 3,
      end_col_offset: 16,
      value: { _type: 'Name', id: 'value', lineno: 3, col_offset: 11, ctx: { _type: 'Load' } }
    }],
    decorator_list: []
  }, {
    _type: 'ClassDef',
    name: 'PyThing',
    lineno: 4,
    col_offset: 0,
    end_lineno: 5,
    end_col_offset: 8,
    bases: [],
    keywords: [],
    body: [{ _type: 'Pass', lineno: 5, col_offset: 4 }],
    decorator_list: []
  }],
  type_ignores: []
};
export const pythonAstImport = await runNativeImporterAdapter(createPythonAstNativeImporterAdapter({ pythonVersion: '3.12' }), {
  sourcePath: 'src/python_ast.py',
  sourceText: pythonAstFixtureSource,
  adapterOptions: { ast: pythonAstFixture, includeAttributes: true }
});
assert.equal(pythonAstImport.adapter.parser, 'python-ast');
assert.equal(pythonAstImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(pythonAstImport.nativeAst.parser, 'python-ast');
assert.equal(pythonAstImport.metadata.astFormat, 'python-ast');
assert.equal(pythonAstImport.metadata.pythonVersion, '3.12');
assert.equal(pythonAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_py'), true);
assert.equal(pythonAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'PyThing'), true);
assert.equal(pythonAstImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(pythonAstImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('from_py')), true);
const scannedPythonAstFixtureImport = importNativeSource({
  language: 'python',
  sourcePath: 'src/python_ast.py',
  sourceText: pythonAstFixtureSource
});
assertExactAdapterOutranksScanner(pythonAstImport, scannedPythonAstFixtureImport, 'from_py');
const malformedPythonImport = await runNativeImporterAdapter(createPythonAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: { _type: 'Module', body: [], type_ignores: [] },
        errors: [{ code: 'SyntaxError', message: 'invalid syntax', loc: { line: 1, column: 4 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_python.py',
  sourceText: 'def broken(:\n'
});
assert.equal(malformedPythonImport.diagnostics.some((diagnostic) => diagnostic.code === 'SyntaxError'), true);
assert.equal(malformedPythonImport.losses.some((loss) => loss.severity === 'error' && loss.kind === 'unsupportedSyntax'), true);
assert.equal(malformedPythonImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
assert.equal(malformedPythonImport.mergeCandidates[0].readiness, 'blocked');
assert.equal(malformedPythonImport.patch.risk, 'high');
const missingPythonAstImport = await runNativeImporterAdapter(createPythonAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_python_ast.py',
  sourceText: 'def missing_ast():\n    return None\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingPythonAstImport.nativeAst.nodes[missingPythonAstImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingPythonAstImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
assert.equal(missingPythonAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
