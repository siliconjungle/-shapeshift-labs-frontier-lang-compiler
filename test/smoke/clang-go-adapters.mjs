import { assert } from './helpers.mjs';
import {
  createClangAstNativeImporterAdapter,
  createGoAstNativeImporterAdapter,
  importNativeSource,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const clangFixtureSource = '#include <stdint.h>\ntypedef struct CThing { int value; } CThing;\nint from_c(CThing thing) { return thing.value; }\n';
const clangFixture = {
  kind: 'TranslationUnitDecl',
  inner: [{
    kind: 'IncludeDirective',
    file: 'stdint.h',
    loc: { line: 1, col: 1 }
  }, {
    kind: 'TypedefDecl',
    name: 'CThing',
    type: { qualType: 'struct CThing' },
    range: { begin: { line: 2, col: 1 }, end: { line: 2, col: 48 } },
    inner: [{
      kind: 'RecordDecl',
      name: 'CThing',
      tagUsed: 'struct',
      completeDefinition: true,
      range: { begin: { line: 2, col: 9 }, end: { line: 2, col: 36 } },
      inner: [{
        kind: 'FieldDecl',
        name: 'value',
        type: { qualType: 'int' },
        range: { begin: { line: 2, col: 25 }, end: { line: 2, col: 33 } }
      }]
    }]
  }, {
    kind: 'FunctionDecl',
    name: 'from_c',
    type: { qualType: 'int (CThing)' },
    isThisDeclarationADefinition: true,
    range: { begin: { line: 3, col: 1 }, end: { line: 3, col: 47 } },
    inner: [{
      kind: 'ParmVarDecl',
      name: 'thing',
      type: { qualType: 'CThing' },
      range: { begin: { line: 3, col: 12 }, end: { line: 3, col: 24 } }
    }, {
      kind: 'CompoundStmt',
      range: { begin: { line: 3, col: 25 }, end: { line: 3, col: 47 } },
      inner: [{
        kind: 'ReturnStmt',
        range: { begin: { line: 3, col: 27 }, end: { line: 3, col: 45 } }
      }]
    }]
  }]
};
export const clangImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter({ cStandard: 'c11' }), {
  sourcePath: 'src/clang_ast.c',
  sourceText: clangFixtureSource,
  adapterOptions: { ast: clangFixture, compileFlags: ['-std=c11'] }
});
assert.equal(clangImport.adapter.parser, 'clang');
assert.equal(clangImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(clangImport.nativeAst.parser, 'clang');
assert.equal(clangImport.metadata.astFormat, 'clang-ast-json');
assert.equal(clangImport.metadata.cStandard, 'c11');
assert.equal(clangImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_c' && symbol.kind === 'function'), true);
assert.equal(clangImport.semanticIndex.symbols.some((symbol) => symbol.name === 'CThing'), true);
assert.equal(clangImport.semanticIndex.symbols.some((symbol) => symbol.name === 'value' && symbol.kind === 'property'), true);
assert.equal(clangImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(clangImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('from_c')), true);
const scannedClangFixtureImport = importNativeSource({
  language: 'c',
  sourcePath: 'src/clang_ast.c',
  sourceText: clangFixtureSource
});
assert.equal(clangImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(clangImport.losses.length, 0);
assert.equal(scannedClangFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedClangFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(clangImport.semanticIndex.symbols.length > scannedClangFixtureImport.semanticIndex.symbols.length);
const clangMacroImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter(), {
  sourcePath: 'src/clang_macro.c',
  sourceText: '#define GENERATED 1\nint generated(void) { return GENERATED; }\n',
  adapterOptions: {
    ast: {
      kind: 'TranslationUnitDecl',
      inner: []
    },
    preprocessorRecords: [{ kind: 'MacroDefinitionRecord', name: 'GENERATED', loc: { line: 1, col: 1 } }],
    includeGraph: { hash: 'fixture-include-graph', edges: [] }
  }
});
assert.equal(clangMacroImport.losses.some((loss) => loss.kind === 'preprocessor'), true);
assert.equal(clangMacroImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(clangMacroImport.metadata.preprocessorRecordCount, 1);
assert.equal(clangMacroImport.metadata.includeGraph.hash, 'fixture-include-graph');
const malformedClangImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: { kind: 'TranslationUnitDecl', inner: [] },
        diagnostics: [{ code: 'ClangSyntaxError', message: 'expected identifier', loc: { line: 1, column: 5 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_clang.c',
  sourceText: 'int {\n'
});
assert.equal(malformedClangImport.diagnostics.some((diagnostic) => diagnostic.code === 'ClangSyntaxError'), true);
assert.equal(malformedClangImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingClangImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_clang.c',
  sourceText: 'int missing(void) { return 0; }\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingClangImport.nativeAst.nodes[missingClangImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingClangImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const goFixtureSource = 'package todo\n\nimport "fmt"\n\ntype Todo struct { Title string }\nconst DefaultTitle = "todo"\nvar Count, Total int\nfunc NewTodo(title string) Todo { return Todo{Title: title} }\nfunc (t *Todo) Save() error { return nil }\n';
const goPos = (line, column) => ({ Line: line, Column: column, Filename: 'src/go_ast.go' });
const goFixture = {
  kind: 'File',
  Name: { kind: 'Ident', Name: 'todo', NamePos: goPos(1, 9) },
  Pos: goPos(1, 1),
  End: goPos(9, 1),
  Decls: [{
    kind: 'GenDecl',
    Tok: 'IMPORT',
    Pos: goPos(3, 1),
    Specs: [{
      kind: 'ImportSpec',
      Path: { kind: 'BasicLit', Value: '"fmt"', Pos: goPos(3, 8), End: goPos(3, 13) }
    }]
  }, {
    kind: 'GenDecl',
    Tok: 'TYPE',
    Pos: goPos(5, 1),
    Specs: [{
      kind: 'TypeSpec',
      Name: { kind: 'Ident', Name: 'Todo', NamePos: goPos(5, 6) },
      Type: {
        kind: 'StructType',
        Pos: goPos(5, 11),
        Fields: {
          kind: 'FieldList',
          List: [{
            kind: 'Field',
            Names: [{ kind: 'Ident', Name: 'Title', NamePos: goPos(5, 20) }],
            Type: { kind: 'Ident', Name: 'string', NamePos: goPos(5, 26) },
            Pos: goPos(5, 20),
            End: goPos(5, 32)
          }]
        }
      }
    }]
  }, {
    kind: 'GenDecl',
    Tok: 'CONST',
    Pos: goPos(6, 1),
    Specs: [{
      kind: 'ValueSpec',
      Names: [{ kind: 'Ident', Name: 'DefaultTitle', NamePos: goPos(6, 7) }],
      Type: { kind: 'Ident', Name: 'string', NamePos: goPos(6, 20) },
      Values: [{ kind: 'BasicLit', Value: '"todo"', Pos: goPos(6, 29) }]
    }]
  }, {
    kind: 'GenDecl',
    Tok: 'VAR',
    Pos: goPos(7, 1),
    Specs: [{
      kind: 'ValueSpec',
      Names: [{ kind: 'Ident', Name: 'Count', NamePos: goPos(7, 5) }, { kind: 'Ident', Name: 'Total', NamePos: goPos(7, 12) }],
      Type: { kind: 'Ident', Name: 'int', NamePos: goPos(7, 11) }
    }]
  }, {
    kind: 'FuncDecl',
    Name: { kind: 'Ident', Name: 'NewTodo', NamePos: goPos(8, 6) },
    Type: { kind: 'FuncType', Pos: goPos(8, 1) },
    Body: { kind: 'BlockStmt', Pos: goPos(8, 34), End: goPos(8, 63) },
    Pos: goPos(8, 1),
    End: goPos(8, 63)
  }, {
    kind: 'FuncDecl',
    Recv: {
      kind: 'FieldList',
      List: [{
        kind: 'Field',
        Names: [{ kind: 'Ident', Name: 't', NamePos: goPos(9, 7) }],
        Type: { kind: 'StarExpr', X: { kind: 'Ident', Name: 'Todo', NamePos: goPos(9, 10) } }
      }]
    },
    Name: { kind: 'Ident', Name: 'Save', NamePos: goPos(9, 16) },
    Type: { kind: 'FuncType', Pos: goPos(9, 1) },
    Body: { kind: 'BlockStmt', Pos: goPos(9, 29), End: goPos(9, 43) },
    Pos: goPos(9, 1),
    End: goPos(9, 43)
  }]
};
export const goAstImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter({ goVersion: '1.22' }), {
  sourcePath: 'src/go_ast.go',
  sourceText: goFixtureSource,
  adapterOptions: {
    ast: goFixture,
    buildTags: ['frontier'],
    typeEvidence: { packagePath: 'example.com/frontier/todo', hash: 'go-types-fixture', types: ['Todo'], references: ['NewTodo'] }
  }
});
assert.equal(goAstImport.adapter.parser, 'go/parser');
assert.equal(goAstImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(goAstImport.nativeAst.parser, 'go/parser');
assert.equal(goAstImport.metadata.astFormat, 'go-ast');
assert.equal(goAstImport.metadata.goVersion, '1.22');
assert.equal(goAstImport.metadata.packageName, 'todo');
assert.equal(goAstImport.metadata.typeEvidence.hash, 'go-types-fixture');
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fmt' && symbol.kind === 'module'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Title' && symbol.kind === 'property'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'DefaultTitle' && symbol.kind === 'constant'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Count' && symbol.kind === 'variable'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Total' && symbol.kind === 'variable'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'NewTodo' && symbol.kind === 'function'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === '*Todo.Save' && symbol.kind === 'method'), true);
assert.equal(goAstImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(goAstImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('newtodo')), true);
const scannedGoFixtureImport = importNativeSource({
  language: 'go',
  sourcePath: 'src/go_ast.go',
  sourceText: goFixtureSource
});
assert.equal(goAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(goAstImport.losses.length, 0);
assert.equal(scannedGoFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedGoFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(goAstImport.semanticIndex.symbols.length > scannedGoFixtureImport.semanticIndex.symbols.length);
const goGeneratedImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter(), {
  sourcePath: 'src/generated_go_ast.go',
  sourceText: 'package todo\n// Code generated by fixture; DO NOT EDIT.\n',
  adapterOptions: {
    ast: {
      kind: 'File',
      Generated: true,
      Name: { kind: 'Ident', Name: 'todo', NamePos: goPos(1, 9) }
    }
  }
});
assert.equal(goGeneratedImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(goGeneratedImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const goBadNodeImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter(), {
  sourcePath: 'src/bad_go_ast.go',
  sourceText: 'package todo\nfunc broken(\n',
  adapterOptions: {
    ast: {
      kind: 'File',
      Name: { kind: 'Ident', Name: 'todo', NamePos: goPos(1, 9) },
      Decls: [{ kind: 'BadDecl', Pos: goPos(2, 1), End: goPos(2, 13) }]
    }
  }
});
assert.equal(goBadNodeImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(goBadNodeImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const malformedGoImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        file: { kind: 'File', Name: { kind: 'Ident', Name: 'todo' }, Decls: [] },
        diagnostics: [{ code: 'GoSyntaxError', message: 'expected declaration', loc: { line: 2, column: 1 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_go.go',
  sourceText: 'package todo\nfunc {\n'
});
assert.equal(malformedGoImport.diagnostics.some((diagnostic) => diagnostic.code === 'GoSyntaxError'), true);
assert.equal(malformedGoImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingGoImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_go.go',
  sourceText: 'package todo\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingGoImport.nativeAst.nodes[missingGoImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingGoImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
