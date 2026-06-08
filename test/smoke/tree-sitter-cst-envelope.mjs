import { assert } from './helpers.mjs';
import {
  createTreeSitterNativeImporterAdapter,
  runNativeImporterAdapter
} from './compiler-api.mjs';

function tsNode(type, startColumn, endColumn, options = {}) {
  const node = {
    type,
    text: options.text,
    isNamed: options.isNamed ?? true,
    isMissing: options.isMissing ?? false,
    isExtra: options.isExtra ?? false,
    hasError: options.hasError ?? false,
    startIndex: startColumn,
    endIndex: endColumn,
    startPosition: { row: 0, column: startColumn },
    endPosition: { row: 0, column: endColumn },
    children: options.children ?? []
  };
  if (options.fieldName) node.fieldName = options.fieldName;
  if (options.fields) node.childForFieldName = (field) => options.fields[field];
  return node;
}

const declarationSource = 'let x = 1;\n';
const declarationTree = tsNode('program', 0, declarationSource.length, {
  children: [
    tsNode('lexical_declaration', 0, 10, {
      children: [
        tsNode('let', 0, 3, { isNamed: false, text: 'let' }),
        tsNode('variable_declarator', 4, 9, {
          children: [
            tsNode('identifier', 4, 5, { text: 'x' }),
            tsNode('=', 6, 7, { isNamed: false, text: '=' }),
            tsNode('number', 8, 9, { text: '1' })
          ]
        }),
        tsNode(';', 9, 10, { isNamed: false, text: ';' })
      ]
    })
  ]
});

const treeSitterDeclarationImport = await runNativeImporterAdapter(createTreeSitterNativeImporterAdapter({
  language: 'javascript',
  parserName: 'tree-sitter-javascript',
  tree: { rootNode: declarationTree }
}), {
  sourcePath: 'src/tree-sitter-declaration.js',
  sourceText: declarationSource
});

const syntaxEvidence = treeSitterDeclarationImport.nativeAst.metadata.nativeSyntaxEvidence;
assert.equal(syntaxEvidence.kind, 'frontier.lang.nativeSyntaxEvidence');
assert.equal(syntaxEvidence.syntaxKind, 'tree-sitter-cst');
assert.equal(syntaxEvidence.parser.name, 'tree-sitter-javascript');
assert.equal(syntaxEvidence.parser.tolerant, true);
assert.equal(syntaxEvidence.parser.status, 'ok');
assert.equal(syntaxEvidence.losslessSource, true);
assert.equal(syntaxEvidence.cst.totalNodes >= 8, true);
assert.equal(syntaxEvidence.cst.anonymousNodes >= 3, true);
assert.equal(syntaxEvidence.semantic.symbols, 1);
assert.equal(syntaxEvidence.semantic.declarationSourceMapMappings, 1);
assert.equal(syntaxEvidence.semantic.exactness, 'declaration-linked');
assert.equal(treeSitterDeclarationImport.semanticIndex.symbols[0].name, 'x');
assert.equal(treeSitterDeclarationImport.semanticIndex.symbols[0].kind, 'variable');
assert.equal(treeSitterDeclarationImport.losses.some((loss) => loss.kind === 'partialSemanticIndex' && loss.metadata?.reason === 'tree-sitter-cst-syntax-only'), false);
assert.equal(treeSitterDeclarationImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(treeSitterDeclarationImport.adapter.coverage.observed.semanticSymbols, 1);
assert.equal(treeSitterDeclarationImport.adapter.coverage.semanticCoverage.symbols, true);

const jsDeclarationSource = 'import dep from "pkg"; const answer = () => 42; function add() {} class Store { save() {} }\n';
const jsDeclarationTree = tsNode('program', 0, jsDeclarationSource.length, {
  children: [
    tsNode('import_statement', 0, 22, {
      children: [
        tsNode('import', 0, 6, { isNamed: false, text: 'import' }),
        tsNode('import_clause', 7, 10, {
          text: 'dep',
          children: [tsNode('identifier', 7, 10, { text: 'dep' })]
        }),
        tsNode('from', 11, 15, { isNamed: false, text: 'from' }),
        tsNode('string', 16, 21, { text: '"pkg"', fieldName: 'source' }),
        tsNode(';', 21, 22, { isNamed: false, text: ';' })
      ]
    }),
    tsNode('lexical_declaration', 23, 47, {
      children: [
        tsNode('const', 23, 28, { isNamed: false, text: 'const' }),
        tsNode('variable_declarator', 29, 46, {
          children: [
            tsNode('identifier', 29, 35, { text: 'answer', fieldName: 'name' }),
            tsNode('=', 36, 37, { isNamed: false, text: '=' }),
            tsNode('arrow_function', 38, 46, { fieldName: 'value' })
          ]
        }),
        tsNode(';', 46, 47, { isNamed: false, text: ';' })
      ]
    }),
    tsNode('function_declaration', 48, 65, {
      children: [
        tsNode('function', 48, 56, { isNamed: false, text: 'function' }),
        tsNode('identifier', 57, 60, { text: 'add', fieldName: 'name' }),
        tsNode('formal_parameters', 60, 62, { text: '()' }),
        tsNode('statement_block', 63, 65, { text: '{}' })
      ]
    }),
    tsNode('class_declaration', 66, 91, {
      children: [
        tsNode('class', 66, 71, { isNamed: false, text: 'class' }),
        tsNode('identifier', 72, 77, { text: 'Store', fieldName: 'name' }),
        tsNode('class_body', 78, 91, {
          children: [
            tsNode('{', 78, 79, { isNamed: false, text: '{' }),
            tsNode('method_definition', 80, 89, {
              children: [
                tsNode('property_identifier', 80, 84, { text: 'save', fieldName: 'name' }),
                tsNode('formal_parameters', 84, 86, { text: '()' }),
                tsNode('statement_block', 87, 89, { text: '{}' })
              ]
            }),
            tsNode('}', 90, 91, { isNamed: false, text: '}' })
          ]
        })
      ]
    })
  ]
});

const treeSitterJsDeclarationImport = await runNativeImporterAdapter(createTreeSitterNativeImporterAdapter({
  language: 'javascript',
  parserName: 'tree-sitter-javascript',
  tree: { rootNode: jsDeclarationTree }
}), {
  sourcePath: 'src/tree-sitter-js-declarations.js',
  sourceText: jsDeclarationSource
});

const jsDeclarationEvidence = treeSitterJsDeclarationImport.nativeAst.metadata.nativeSyntaxEvidence;
const jsDeclarationSymbols = treeSitterJsDeclarationImport.semanticIndex.symbols;
const jsDeclarationMappings = treeSitterJsDeclarationImport.sourceMaps.flatMap((sourceMap) => sourceMap.mappings ?? []);
assert.equal(jsDeclarationEvidence.semantic.symbols, 5);
assert.equal(jsDeclarationEvidence.semantic.declarationSourceMapMappings, 5);
assert.equal(jsDeclarationEvidence.semantic.exactness, 'declaration-linked');
assert.equal(jsDeclarationSymbols.some((symbol) => symbol.name === 'pkg' && symbol.kind === 'module'), true);
assert.equal(jsDeclarationSymbols.some((symbol) => symbol.name === 'dep'), false);
assert.equal(jsDeclarationSymbols.some((symbol) => symbol.name === 'answer' && symbol.kind === 'function'), true);
assert.equal(jsDeclarationSymbols.some((symbol) => symbol.name === 'add' && symbol.kind === 'function'), true);
assert.equal(jsDeclarationSymbols.some((symbol) => symbol.name === 'Store' && symbol.kind === 'class'), true);
assert.equal(jsDeclarationSymbols.some((symbol) => symbol.name === 'save' && symbol.kind === 'method'), true);
assert.equal(jsDeclarationMappings.some((mapping) => mapping.semanticSymbolId.includes('answer') && mapping.ownershipRegionId), true);
assert.equal(treeSitterJsDeclarationImport.losses.some((loss) => loss.metadata?.reason === 'tree-sitter-cst-syntax-only'), false);
assert.equal(treeSitterJsDeclarationImport.adapter.coverage.observed.semanticSymbols, 5);

const tolerantErrorSource = 'let = ;\n';
const tolerantErrorTree = tsNode('program', 0, tolerantErrorSource.length, {
  hasError: true,
  children: [
    tsNode('lexical_declaration', 0, 7, {
      hasError: true,
      children: [
        tsNode('let', 0, 3, { isNamed: false, text: 'let' }),
        tsNode('ERROR', 4, 5, { text: '=', hasError: true }),
        tsNode('identifier', 5, 5, { text: '', isMissing: true }),
        tsNode(';', 6, 7, { isNamed: false, text: ';' })
      ]
    })
  ]
});

const treeSitterTolerantErrorImport = await runNativeImporterAdapter(createTreeSitterNativeImporterAdapter({
  language: 'javascript',
  tree: { rootNode: tolerantErrorTree }
}), {
  sourcePath: 'src/tree-sitter-tolerant-error.js',
  sourceText: tolerantErrorSource
});

const errorSyntaxEvidence = treeSitterTolerantErrorImport.nativeAst.metadata.nativeSyntaxEvidence;
assert.equal(errorSyntaxEvidence.parser.status, 'recovered-with-errors');
assert.equal(errorSyntaxEvidence.parser.tolerant, true);
assert.equal(errorSyntaxEvidence.parser.errors >= 1, true);
assert.equal(errorSyntaxEvidence.parser.missingNodes, 1);
assert.equal(errorSyntaxEvidence.cst.containingErrorNodes >= 2, true);
assert.equal(treeSitterTolerantErrorImport.evidence.some((record) => record.kind === 'nativeSyntax' && record.status === 'failed'), true);
assert.equal(treeSitterTolerantErrorImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.metadata?.tolerantParse === true), true);
assert.equal(treeSitterTolerantErrorImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
