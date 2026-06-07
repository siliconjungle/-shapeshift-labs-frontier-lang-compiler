import { assert } from './helpers.mjs';
import {
  createTreeSitterNativeImporterAdapter,
  runNativeImporterAdapter
} from './compiler-api.mjs';

function tsNode(type, startColumn, endColumn, options = {}) {
  return {
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
