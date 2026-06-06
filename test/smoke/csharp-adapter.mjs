import { assert } from './helpers.mjs';
import { createCSharpRoslynNativeImporterAdapter, importNativeSource, runNativeImporterAdapter } from './compiler-api.mjs';

const csharpFixtureSource = 'using System;\nnamespace Demo;\npublic class Todo {\n  private string title;\n  public Todo(string title) { this.title = title; }\n  public void AddTodo(string title) {}\n  public string Title { get; init; }\n  public event EventHandler? Changed;\n}\npublic interface Store { void Save(Todo todo); }\npublic enum Status { Open }\npublic record TodoRecord(string Title);\npublic delegate void TodoChanged(object sender, EventArgs args);\n';
const csharpLineSpan = (line, startColumn, endColumn = startColumn + 1) => ({
  startLinePosition: { line: line - 1, character: startColumn - 1 },
  endLinePosition: { line: line - 1, character: endColumn - 1 }
});
const csharpFixture = {
  kind: 'CompilationUnit',
  usings: [{
    kind: 'UsingDirectiveSyntax',
    name: { qualifiedName: 'System' },
    lineSpan: csharpLineSpan(1, 1, 14)
  }],
  members: [{
    kind: 'FileScopedNamespaceDeclarationSyntax',
    name: { qualifiedName: 'Demo' },
    lineSpan: csharpLineSpan(2, 1, 16),
    members: [{
      kind: 'ClassDeclarationSyntax',
      identifier: { text: 'Todo' },
      modifiers: ['public'],
      lineSpan: csharpLineSpan(3, 1, 20),
      members: [{
        kind: 'FieldDeclarationSyntax',
        modifiers: ['private'],
        declaration: {
          type: { name: 'string' },
          variables: [{
            kind: 'VariableDeclaratorSyntax',
            identifier: { text: 'title' },
            lineSpan: csharpLineSpan(4, 18, 23)
          }]
        },
        lineSpan: csharpLineSpan(4, 3, 24)
      }, {
        kind: 'ConstructorDeclarationSyntax',
        identifier: { text: 'Todo' },
        parameterList: {
          parameters: [{
            kind: 'ParameterSyntax',
            identifier: { text: 'title' },
            type: { name: 'string' }
          }]
        },
        body: { kind: 'BlockSyntax', statements: [] },
        lineSpan: csharpLineSpan(5, 3, 52)
      }, {
        kind: 'MethodDeclarationSyntax',
        identifier: { text: 'AddTodo' },
        returnType: { name: 'void' },
        parameterList: {
          parameters: [{
            kind: 'ParameterSyntax',
            identifier: { text: 'title' },
            type: { name: 'string' }
          }]
        },
        body: { kind: 'BlockSyntax', statements: [] },
        lineSpan: csharpLineSpan(6, 3, 42)
      }, {
        kind: 'PropertyDeclarationSyntax',
        identifier: { text: 'Title' },
        type: { name: 'string' },
        accessorList: { kind: 'AccessorListSyntax' },
        lineSpan: csharpLineSpan(7, 3, 37)
      }, {
        kind: 'EventFieldDeclarationSyntax',
        declaration: {
          type: { name: 'EventHandler?' },
          variables: [{
            kind: 'VariableDeclaratorSyntax',
            identifier: { text: 'Changed' },
            lineSpan: csharpLineSpan(8, 30, 37)
          }]
        },
        lineSpan: csharpLineSpan(8, 3, 38)
      }]
    }, {
      kind: 'InterfaceDeclarationSyntax',
      identifier: { text: 'Store' },
      lineSpan: csharpLineSpan(10, 1, 55),
      members: [{
        kind: 'MethodDeclarationSyntax',
        identifier: { text: 'Save' },
        returnType: { name: 'void' },
        parameterList: {
          parameters: [{
            kind: 'ParameterSyntax',
            identifier: { text: 'todo' },
            type: { name: 'Todo' }
          }]
        },
        lineSpan: csharpLineSpan(10, 26, 45)
      }]
    }, {
      kind: 'EnumDeclarationSyntax',
      identifier: { text: 'Status' },
      members: [{
        kind: 'EnumMemberDeclarationSyntax',
        identifier: { text: 'Open' },
        lineSpan: csharpLineSpan(11, 22, 26)
      }],
      lineSpan: csharpLineSpan(11, 1, 28)
    }, {
      kind: 'RecordDeclarationSyntax',
      identifier: { text: 'TodoRecord' },
      parameterList: {
        parameters: [{
          kind: 'ParameterSyntax',
          identifier: { text: 'Title' },
          type: { name: 'string' }
        }]
      },
      lineSpan: csharpLineSpan(12, 1, 39)
    }, {
      kind: 'DelegateDeclarationSyntax',
      identifier: { text: 'TodoChanged' },
      returnType: { name: 'void' },
      lineSpan: csharpLineSpan(13, 1, 64)
    }]
  }]
};
export const csharpRoslynImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter({
  languageVersion: '12',
  nullableContext: 'enabled'
}), {
  sourcePath: 'src/RoslynTodo.cs',
  sourceText: csharpFixtureSource,
  adapterOptions: {
    ast: csharpFixture,
    projectReferences: { hash: 'csharp-projects-fixture', projects: ['Todo.csproj'] },
    analyzerDiagnostics: { diagnostics: [] },
    semanticModelEvidence: { solver: 'roslyn', hash: 'csharp-semantic-fixture', symbols: ['Todo'] },
    sourceGeneratorEvidence: { hash: 'csharp-generators-fixture', generators: [] }
  }
});
assert.equal(csharpRoslynImport.adapter.parser, 'roslyn');
assert.equal(csharpRoslynImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(csharpRoslynImport.adapter.coverage.tokens, true);
assert.equal(csharpRoslynImport.adapter.coverage.trivia, true);
assert.equal(csharpRoslynImport.nativeAst.parser, 'roslyn');
assert.equal(csharpRoslynImport.metadata.astFormat, 'roslyn-csharp');
assert.equal(csharpRoslynImport.metadata.languageVersion, '12');
assert.equal(csharpRoslynImport.metadata.nullableContext, 'enabled');
assert.equal(csharpRoslynImport.metadata.projectReferences.hash, 'csharp-projects-fixture');
assert.equal(csharpRoslynImport.metadata.semanticModelEvidence.hash, 'csharp-semantic-fixture');
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'System' && symbol.kind === 'module'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Demo' && symbol.kind === 'namespace'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'class'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'method'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'AddTodo' && symbol.kind === 'method'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Title' && symbol.kind === 'property'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Changed' && symbol.kind === 'event'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Store' && symbol.kind === 'interface'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Status' && symbol.kind === 'type'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Open' && symbol.kind === 'enumMember'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoRecord' && symbol.kind === 'class'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoChanged' && symbol.kind === 'type'), true);
assert.equal(csharpRoslynImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(csharpRoslynImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
const scannedCSharpFixtureImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'src/RoslynTodo.cs',
  sourceText: csharpFixtureSource
});
assert.equal(csharpRoslynImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(csharpRoslynImport.losses.length, 0);
assert.equal(scannedCSharpFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedCSharpFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(csharpRoslynImport.semanticIndex.symbols.length > scannedCSharpFixtureImport.semanticIndex.symbols.length);
const csharpGeneratedImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter(), {
  sourcePath: 'src/GeneratedTodo.g.cs',
  sourceText: 'using System.CodeDom.Compiler;\n[GeneratedCode("tool", "1")] public class GeneratedTodo {}\n',
  adapterOptions: {
    ast: {
      kind: 'CompilationUnit',
      members: [{
        kind: 'ClassDeclarationSyntax',
        identifier: { text: 'GeneratedTodo' },
        attributeLists: [{ kind: 'AttributeListSyntax', attributes: [{ kind: 'AttributeSyntax', name: { qualifiedName: 'GeneratedCode' } }] }]
      }]
    }
  }
});
assert.equal(csharpGeneratedImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(csharpGeneratedImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const malformedCSharpImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: {
          kind: 'CompilationUnit',
          members: [{ kind: 'SkippedTokensTrivia', containsDiagnostics: true, lineSpan: csharpLineSpan(2, 1, 9) }]
        },
        diagnostics: [{ code: 'CS1513', message: '} expected', loc: { line: 2, column: 8 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_csharp.cs',
  sourceText: 'class Broken\n'
});
assert.equal(malformedCSharpImport.diagnostics.some((diagnostic) => diagnostic.code === 'CS1513'), true);
assert.equal(malformedCSharpImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(malformedCSharpImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingCSharpImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter(), {
  sourcePath: 'src/missing_csharp.cs',
  sourceText: 'class Missing {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingCSharpImport.nativeAst.nodes[missingCSharpImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingCSharpImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
