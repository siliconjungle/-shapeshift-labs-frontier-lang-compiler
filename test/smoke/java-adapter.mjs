import { assert } from './helpers.mjs';
import { createJavaAstNativeImporterAdapter, importNativeSource, runNativeImporterAdapter } from './compiler-api.mjs';

const javaFixtureSource = 'package demo;\nimport java.util.List;\npublic class Todo {\n  private String title;\n  public Todo(String title) { this.title = title; }\n  public void addTodo(String title) {}\n}\ninterface Store { void save(Todo todo); }\nenum Status { OPEN }\nrecord TodoRecord(String title) {}\n';
const javaRange = (line, startColumn, endColumn = startColumn + 1) => ({
  begin: { line, column: startColumn },
  end: { line, column: endColumn }
});
const javaFixture = {
  kind: 'CompilationUnit',
  packageDeclaration: {
    kind: 'PackageDeclaration',
    name: { qualifiedName: 'demo' },
    range: javaRange(1, 1, 14)
  },
  imports: [{
    kind: 'ImportDeclaration',
    name: { qualifiedName: 'java.util.List' },
    range: javaRange(2, 1, 23)
  }],
  types: [{
    kind: 'ClassDeclaration',
    name: { identifier: 'Todo' },
    modifiers: ['public'],
    range: javaRange(3, 1, 20),
    members: [{
      kind: 'FieldDeclaration',
      modifiers: ['private'],
      type: { name: 'String' },
      range: javaRange(4, 3, 23),
      variables: [{
        kind: 'VariableDeclarator',
        name: { identifier: 'title' },
        type: { name: 'String' },
        range: javaRange(4, 18, 23)
      }]
    }, {
      kind: 'ConstructorDeclaration',
      name: { identifier: 'Todo' },
      parameters: [{
        kind: 'Parameter',
        name: { identifier: 'title' },
        type: { name: 'String' }
      }],
      body: { kind: 'Block' },
      range: javaRange(5, 3, 52)
    }, {
      kind: 'MethodDeclaration',
      name: { identifier: 'addTodo' },
      returnType: { name: 'void' },
      parameters: [{
        kind: 'Parameter',
        name: { identifier: 'title' },
        type: { name: 'String' }
      }],
      body: { kind: 'Block' },
      range: javaRange(6, 3, 42)
    }]
  }, {
    kind: 'InterfaceDeclaration',
    name: { identifier: 'Store' },
    range: javaRange(8, 1, 43),
    members: [{
      kind: 'MethodDeclaration',
      name: { identifier: 'save' },
      parameters: [{
        kind: 'Parameter',
        name: { identifier: 'todo' },
        type: { name: 'Todo' }
      }],
      range: javaRange(8, 19, 39)
    }]
  }, {
    kind: 'EnumDeclaration',
    name: { identifier: 'Status' },
    entries: [{
      kind: 'EnumConstantDeclaration',
      name: { identifier: 'OPEN' },
      range: javaRange(9, 15, 19)
    }],
    range: javaRange(9, 1, 21)
  }, {
    kind: 'RecordDeclaration',
    name: { identifier: 'TodoRecord' },
    parameters: [{
      kind: 'Parameter',
      name: { identifier: 'title' },
      type: { name: 'String' }
    }],
    range: javaRange(10, 1, 34)
  }]
};
export const javaAstImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter({
  javaVersion: '21',
  sourceLevel: '21'
}), {
  sourcePath: 'src/JavaAst.java',
  sourceText: javaFixtureSource,
  adapterOptions: {
    ast: javaFixture,
    classPath: ['target/classes'],
    modulePath: ['mods'],
    bindingEvidence: { solver: 'fixture-symbol-solver', hash: 'java-bindings-fixture', bindings: ['Todo'] }
  }
});
assert.equal(javaAstImport.adapter.parser, 'javac');
assert.equal(javaAstImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(javaAstImport.nativeAst.parser, 'javac');
assert.equal(javaAstImport.metadata.astFormat, 'java-ast');
assert.equal(javaAstImport.metadata.javaVersion, '21');
assert.equal(javaAstImport.metadata.sourceLevel, '21');
assert.equal(javaAstImport.metadata.classPathEvidence.entryCount, 1);
assert.equal(javaAstImport.metadata.modulePathEvidence.entryCount, 1);
assert.equal(javaAstImport.metadata.bindingEvidence.hash, 'java-bindings-fixture');
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'java.util.List' && symbol.kind === 'module'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'class'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'method'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo' && symbol.kind === 'method'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Store' && symbol.kind === 'interface'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Status' && symbol.kind === 'type'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'OPEN' && symbol.kind === 'enumMember'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoRecord' && symbol.kind === 'type'), true);
assert.equal(javaAstImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(javaAstImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
const scannedJavaFixtureImport = importNativeSource({
  language: 'java',
  sourcePath: 'src/JavaAst.java',
  sourceText: javaFixtureSource
});
assert.equal(javaAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(javaAstImport.losses.length, 0);
assert.equal(scannedJavaFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedJavaFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(javaAstImport.semanticIndex.symbols.length > scannedJavaFixtureImport.semanticIndex.symbols.length);
const javaGeneratedImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter(), {
  sourcePath: 'src/GeneratedTodo.java',
  sourceText: 'package demo;\n@Generated public class GeneratedTodo {}\n',
  adapterOptions: {
    ast: {
      kind: 'CompilationUnit',
      generated: true,
      types: [{
        kind: 'ClassDeclaration',
        name: { identifier: 'GeneratedTodo' },
        annotations: [{ kind: 'Annotation', name: { qualifiedName: 'javax.annotation.Generated' } }]
      }]
    }
  }
});
assert.equal(javaGeneratedImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(javaGeneratedImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const malformedJavaImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: {
          kind: 'CompilationUnit',
          types: [{ kind: 'Erroneous', problem: true, range: javaRange(2, 1, 14) }]
        },
        diagnostics: [{ code: 'JavaSyntaxError', message: 'expected class body', loc: { line: 2, column: 13 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_java.java',
  sourceText: 'class Broken\n'
});
assert.equal(malformedJavaImport.diagnostics.some((diagnostic) => diagnostic.code === 'JavaSyntaxError'), true);
assert.equal(malformedJavaImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(malformedJavaImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingJavaImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_java.java',
  sourceText: 'class Missing {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingJavaImport.nativeAst.nodes[missingJavaImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingJavaImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
