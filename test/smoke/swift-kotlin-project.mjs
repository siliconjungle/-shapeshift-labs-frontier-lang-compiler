import { assert, assertExactAdapterOutranksScanner } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  createKotlinPsiNativeImporterAdapter,
  createSwiftSyntaxNativeImporterAdapter,
  createTreeSitterNativeImporterAdapter,
  importNativeProject,
  importNativeSource,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const swiftFixtureSource = 'import Foundation\nstruct Todo { var title: String\n func addTodo(_ title: String) {}\n #if DEBUG\n #endif\n #Observable\n}\n';
const swiftFixture = {
  kind: 'SourceFileSyntax',
  statements: [{
    kind: 'ImportDeclSyntax',
    importPath: [{ name: { text: 'Foundation' } }],
    startLine: 1,
    startColumn: 1
  }, {
    kind: 'StructDeclSyntax',
    identifier: { text: 'Todo' },
    startLine: 2,
    startColumn: 1,
    members: [{
      kind: 'VariableDeclSyntax',
      bindings: [{
        kind: 'PatternBindingSyntax',
        pattern: { identifier: { text: 'title' } },
        typeAnnotation: { type: { name: 'String' } },
        startLine: 2,
        startColumn: 15
      }]
    }, {
      kind: 'FunctionDeclSyntax',
      identifier: { text: 'addTodo' },
      signature: { parameterClause: { parameters: [{ kind: 'FunctionParameterSyntax', firstName: { text: 'title' }, type: { name: 'String' } }] } },
      body: { kind: 'CodeBlockSyntax', statements: [] },
      startLine: 3,
      startColumn: 2
    }, {
      kind: 'IfConfigDeclSyntax',
      startLine: 4,
      startColumn: 2
    }, {
      kind: 'FreestandingMacroExpansionSyntax',
      name: { text: 'Observable' },
      startLine: 6,
      startColumn: 2
    }]
  }, {
    kind: 'EnumDeclSyntax',
    identifier: { text: 'Status' },
    startLine: 8,
    startColumn: 1,
    members: [{
      kind: 'EnumCaseDeclSyntax',
      elements: [{ kind: 'EnumCaseElementSyntax', identifier: { text: 'open' } }]
    }]
  }]
};
export const swiftSyntaxImport = await runNativeImporterAdapter(createSwiftSyntaxNativeImporterAdapter({
  swiftVersion: '6',
  languageMode: 'swift-6'
}), {
  sourcePath: 'src/Todo.swift',
  sourceText: swiftFixtureSource,
  adapterOptions: {
    ast: swiftFixture,
    sourceKitEvidence: { solver: 'sourcekit-lsp', hash: 'swift-sourcekit-fixture', symbols: ['Todo'] },
    macroExpansionEvidence: { hash: 'swift-macro-fixture', macros: ['Observable'] },
    packageResolutionEvidence: { hash: 'swift-package-fixture', packages: ['DemoPackage'] }
  }
});
assert.equal(swiftSyntaxImport.adapter.parser, 'swift-syntax');
assert.equal(swiftSyntaxImport.adapter.coverage.exactness, 'parser-tree');
assert.equal(swiftSyntaxImport.adapter.coverage.tokens, true);
assert.equal(swiftSyntaxImport.adapter.coverage.trivia, true);
assert.equal(swiftSyntaxImport.nativeAst.parser, 'swift-syntax');
assert.equal(swiftSyntaxImport.metadata.astFormat, 'swift-syntax');
assert.equal(swiftSyntaxImport.metadata.swiftVersion, '6');
assert.equal(swiftSyntaxImport.metadata.sourceKitEvidence.hash, 'swift-sourcekit-fixture');
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Foundation' && symbol.kind === 'module'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'struct'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo' && symbol.kind === 'function'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Status' && symbol.kind === 'enum'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'open' && symbol.kind === 'enumMember'), true);
assert.equal(swiftSyntaxImport.losses.some((loss) => loss.kind === 'conditionalCompilation'), true);
assert.equal(swiftSyntaxImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
assert.equal(swiftSyntaxImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const generatedSwiftImport = await runNativeImporterAdapter(createSwiftSyntaxNativeImporterAdapter(), {
  sourcePath: 'src/GeneratedTodo.generated.swift',
  sourceText: 'struct GeneratedTodo {}\n',
  adapterOptions: {
    ast: {
      kind: 'SourceFileSyntax',
      statements: [{ kind: 'StructDeclSyntax', identifier: { text: 'GeneratedTodo' } }]
    }
  }
});
assert.equal(generatedSwiftImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
const missingSwiftImport = await runNativeImporterAdapter(createSwiftSyntaxNativeImporterAdapter(), {
  sourcePath: 'src/missing_swift.swift',
  sourceText: 'struct Missing {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingSwiftImport.nativeAst.nodes[missingSwiftImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingSwiftImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const kotlinFixtureSource = 'package demo\nimport kotlinx.coroutines.flow.Flow\n@Serializable data class Todo(val title: String) { suspend fun addTodo(title: String) {} }\nexpect class PlatformStore\n';
const kotlinFixture = {
  kind: 'KtFile',
  packageDirective: {
    kind: 'KtPackageDirective',
    fqName: 'demo',
    startLine: 1,
    startColumn: 1
  },
  imports: [{
    kind: 'KtImportDirective',
    importedFqName: 'kotlinx.coroutines.flow.Flow',
    startLine: 2,
    startColumn: 1
  }],
  declarations: [{
    kind: 'KtClass',
    name: 'Todo',
    classKind: 'class',
    modifiers: ['data'],
    annotationEntries: [{ kind: 'KtAnnotationEntry', shortName: 'Serializable' }],
    startLine: 3,
    startColumn: 1,
    declarations: [{
      kind: 'KtPrimaryConstructor',
      parameters: [{
        kind: 'KtParameter',
        name: 'title',
        typeReference: { text: 'String' },
        valOrVarKeyword: 'val',
        startLine: 3,
        startColumn: 35
      }]
    }, {
      kind: 'KtNamedFunction',
      name: 'addTodo',
      modifiers: ['suspend'],
      valueParameters: [{ kind: 'KtParameter', name: 'title', typeReference: { text: 'String' } }],
      bodyExpression: { kind: 'KtBlockExpression' },
      startLine: 3,
      startColumn: 56
    }]
  }, {
    kind: 'KtClass',
    name: 'PlatformStore',
    modifiers: ['expect'],
    classKind: 'class',
    startLine: 4,
    startColumn: 1
  }]
};
export const kotlinPsiImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter({
  kotlinVersion: '2.1',
  languageVersion: '2.1',
  apiVersion: '2.1',
  analysisApiEvidence: { hash: 'kotlin-analysis-api-fixture', symbols: ['Todo'] },
  multiplatformEvidence: { hash: 'kotlin-mpp-fixture', targetPlatform: 'common' }
}), {
  sourcePath: 'src/Todo.kt',
  sourceText: kotlinFixtureSource,
  adapterOptions: { ast: kotlinFixture }
});
assert.equal(kotlinPsiImport.adapter.parser, 'kotlin-psi');
assert.equal(kotlinPsiImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(kotlinPsiImport.adapter.coverage.tokens, true);
assert.equal(kotlinPsiImport.adapter.coverage.trivia, true);
assert.equal(kotlinPsiImport.nativeAst.parser, 'kotlin-psi');
assert.equal(kotlinPsiImport.metadata.astFormat, 'kotlin-psi');
assert.equal(kotlinPsiImport.metadata.kotlinVersion, '2.1');
assert.equal(kotlinPsiImport.metadata.analysisApiEvidence.hash, 'kotlin-analysis-api-fixture');
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'demo' && symbol.kind === 'namespace'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'kotlinx.coroutines.flow.Flow' && symbol.kind === 'module'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'class'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo' && symbol.kind === 'method'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'PlatformStore' && symbol.kind === 'class'), true);
assert.equal(kotlinPsiImport.losses.some((loss) => loss.kind === 'metaprogramming'), true);
assert.equal(kotlinPsiImport.losses.some((loss) => loss.kind === 'unsupportedSemantic' && loss.metadata?.feature === 'coroutine'), true);
assert.equal(kotlinPsiImport.losses.some((loss) => loss.kind === 'unsupportedSemantic' && loss.metadata?.feature === 'expect-actual'), true);
assert.equal(kotlinPsiImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const generatedKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter(), {
  sourcePath: 'build/generated/ksp/GeneratedTodo.kt',
  sourceText: 'class GeneratedTodo\n',
  adapterOptions: {
    ast: {
      kind: 'KtFile',
      declarations: [{ kind: 'KtClass', name: 'GeneratedTodo' }]
    }
  }
});
assert.equal(generatedKotlinImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
const scriptKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter(), {
  sourcePath: 'scripts/setup.main.kts',
  sourceText: 'println("setup")\n',
  adapterOptions: {
    ast: {
      kind: 'KtScript',
      statements: [{ kind: 'KtCallExpression', calleeExpression: { text: 'println' } }]
    }
  }
});
assert.equal(scriptKotlinImport.metadata.script, true);
assert.equal(scriptKotlinImport.losses.some((loss) => loss.kind === 'unsupportedSemantic' && loss.metadata?.feature === 'script'), true);
const malformedKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter({
  parse(sourceText) {
    return {
      ast: { kind: 'KtFile', declarations: [{ kind: 'PsiErrorElement', text: sourceText, startLine: 2, startColumn: 1 }] },
      diagnostics: [{ code: 'KOTLIN_PARSE', message: 'expected declaration', loc: { line: 2, column: 1 } }]
    };
  }
}), {
  sourcePath: 'src/Broken.kt',
  sourceText: 'class Broken {\n'
});
assert.equal(malformedKotlinImport.diagnostics.some((diagnostic) => diagnostic.code === 'KOTLIN_PARSE'), true);
assert.equal(malformedKotlinImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(malformedKotlinImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter(), {
  sourcePath: 'src/missing_kotlin.kt',
  sourceText: 'class Missing\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingKotlinImport.nativeAst.nodes[missingKotlinImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingKotlinImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const treeName = {
  type: 'identifier',
  text: 'from_tree',
  startPosition: { row: 0, column: 9 },
  endPosition: { row: 0, column: 18 },
  namedChildren: []
};
const treeRoot = {
  type: 'source_file',
  startPosition: { row: 0, column: 0 },
  endPosition: { row: 0, column: 22 },
  namedChildren: [{
    type: 'function_declaration',
    startPosition: { row: 0, column: 0 },
    endPosition: { row: 0, column: 22 },
    namedChildren: [treeName],
    childForFieldName(field) {
      return field === 'name' ? treeName : null;
    }
  }]
};
const treeFixtureSource = 'function from_tree() {}\n';
export const treeImport = await runNativeImporterAdapter(createTreeSitterNativeImporterAdapter({
  language: 'javascript',
  tree: { rootNode: treeRoot }
}), {
  sourcePath: 'src/tree.js',
  sourceText: treeFixtureSource
});
assert.equal(treeImport.adapter.parser, 'tree-sitter');
assert.equal(treeImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_tree'), true);
const scannedTreeFixtureImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/tree.js',
  sourceText: treeFixtureSource
});
assertExactAdapterOutranksScanner(treeImport, scannedTreeFixtureImport, 'from_tree');
export const projectImport = await importNativeProject({
  id: 'project_smoke',
  projectRoot: 'src',
  adapters: [createEstreeNativeImporterAdapter()],
  sources: [{
    language: 'javascript',
    adapter: 'frontier.estree-native-importer',
    sourcePath: 'src/project.js',
    sourceText: 'export function projectJs() {}\n',
    adapterOptions: {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 30 } },
        body: [{
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'projectJs' },
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 30 } }
        }]
      }
    }
  }, {
    language: 'python',
    sourcePath: 'project.py',
    sourceText: 'def project_py():\n    return True\n'
  }]
});
assert.equal(projectImport.kind, 'frontier.lang.projectImportResult');
assert.equal(projectImport.imports.length, 2);
assert.equal(projectImport.nativeSources.length, 2);
assert.equal(projectImport.semanticIndex.symbols.some((symbol) => symbol.name === 'projectJs'), true);
assert.equal(projectImport.semanticIndex.symbols.some((symbol) => symbol.name === 'project_py'), true);
assert.equal(projectImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(projectImport.metadata.sourcePreservationSummary.total, 2);
assert.equal(projectImport.metadata.sourcePreservationSummary.exactSourceAvailable, 2);
assert.equal(projectImport.metadata.importResultContract.kind, 'frontier.lang.nativeImportResultContract');
assert.equal(projectImport.metadata.importResultContract.sourceCount, 2);
assert.equal(projectImport.metadata.importResultContract.sources.length, 2);
assert.equal(projectImport.metadata.importResultContract.sourcePreservation.exactSourceAvailable, 2);
assert.equal(projectImport.metadata.importResultContract.sourceMaps.total >= 2, true);
assert.equal(projectImport.universalAst.metadata.sourcePreservationSummary.total, 2);
