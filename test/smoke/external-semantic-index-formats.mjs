import { assert } from './helpers.mjs';
import { importExternalSemanticIndex } from './compiler-api.mjs';

const scipExternalSymbolsImport = importExternalSemanticIndex({
  payload: {
    metadata: { project_root: '/repo' },
    external_symbols: [{
      symbol: 'scip-typescript npm shared 1.0.0 src/shared.ts/ SharedService#',
      display_name: 'SharedService',
      kind: 5,
      signature_documentation: 'class SharedService'
    }],
    documents: [{
      relative_path: 'src/use-shared.ts',
      language: 'typescript',
      occurrences: [{
        symbol: 'scip-typescript npm shared 1.0.0 src/shared.ts/ SharedService#',
        range: [2, 9, 22],
        symbol_roles: 8,
        syntax_kind: 5
      }]
    }]
  }
});
const scipExternalSymbol = scipExternalSymbolsImport.semanticIndex.symbols.find((symbol) => symbol.name === 'SharedService');
assert.equal(scipExternalSymbolsImport.format, 'scip');
assert.equal(scipExternalSymbol.metadata.external, true);
assert.equal(scipExternalSymbolsImport.semanticIndex.facts.some((fact) => fact.predicate === 'signature' && fact.subjectId === scipExternalSymbol.id), true);
assert.equal(scipExternalSymbolsImport.semanticIndex.occurrences[0].symbolId, scipExternalSymbol.id);
const lspMissingSeverityImport = importExternalSemanticIndex({
  format: 'lsp',
  payload: {
    uri: 'file:///repo/src/strict.ts',
    diagnostics: [{ message: 'Severity omitted by upstream indexer.' }]
  }
});
assert.equal(lspMissingSeverityImport.losses.some((loss) => loss.severity === 'error'), true);
assert.equal(lspMissingSeverityImport.readiness.readiness, 'blocked');
const lspWorkspaceImport = importExternalSemanticIndex({
  language: 'typescript',
  payload: {
    documents: [{
      uri: 'file:///repo/src/workspace.ts',
      languageId: 'typescript',
      documentSymbols: [{
        name: 'Controller',
        kind: 5,
        range: { start: { line: 0, character: 0 }, end: { line: 3, character: 1 } },
        selectionRange: { start: { line: 0, character: 7 }, end: { line: 0, character: 17 } },
        children: [{
          name: 'handle',
          kind: 6,
          range: { start: { line: 1, character: 2 }, end: { line: 2, character: 3 } },
          selectionRange: { start: { line: 1, character: 8 }, end: { line: 1, character: 14 } }
        }]
      }],
      semanticTokens: {
        legend: { tokenTypes: ['class', 'method'], tokenModifiers: ['declaration', 'async'] },
        data: [0, 7, 10, 0, 1, 1, 2, 6, 1, 3]
      }
    }]
  }
});
const lspSemanticTokenFacts = lspWorkspaceImport.semanticIndex.facts.filter((fact) => fact.predicate === 'semanticToken');
assert.equal(lspWorkspaceImport.format, 'lsp');
assert.equal(lspWorkspaceImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Controller'), true);
assert.equal(lspWorkspaceImport.semanticIndex.symbols.some((symbol) => symbol.name === 'handle' && symbol.metadata.parentName === 'Controller'), true);
assert.equal(lspSemanticTokenFacts.length, 2);
assert.equal(lspSemanticTokenFacts[0].value.tokenType, 'class');
assert.equal(lspSemanticTokenFacts[0].value.tokenModifiers.includes('declaration'), true);
assert.equal(lspSemanticTokenFacts[1].value.tokenType, 'method');
assert.equal(lspSemanticTokenFacts[1].value.tokenModifiers.includes('async'), true);
assert.equal(lspSemanticTokenFacts[1].value.span.startLine, 2);
assert.equal(lspWorkspaceImport.summary.sourceMapMappings, 2);
const lsifArrayImport = importExternalSemanticIndex([
  { id: 'doc', type: 'vertex', label: 'document', uri: 'file:///repo/src/lib.rs', languageId: 'rust' },
  { id: 'range', type: 'vertex', label: 'range', start: { line: 2, character: 4 }, end: { line: 2, character: 10 } },
  { id: 'resultSet', type: 'vertex', label: 'resultSet' },
  { id: 'moniker', type: 'vertex', label: 'moniker', scheme: 'cargo', identifier: 'crate::run', kind: 'function' },
  { id: 'contains', type: 'edge', label: 'contains', outV: 'doc', inVs: ['range'] },
  { id: 'next', type: 'edge', label: 'next', outV: 'range', inV: 'resultSet' },
  { id: 'monikerEdge', type: 'edge', label: 'moniker', outV: 'resultSet', inV: 'moniker' },
  { id: 'declarationItem', type: 'edge', label: 'item', outV: 'resultSet', inVs: ['range'], property: 'declarations' },
  { id: 'referencesEdge', type: 'edge', label: 'textDocument/references', outV: 'range', inV: 'range' }
]);
assert.equal(lsifArrayImport.format, 'lsif');
assert.equal(lsifArrayImport.semanticIndex.symbols[0].name, 'crate::run');
assert.equal(lsifArrayImport.semanticIndex.symbols[0].kind, 'function');
assert.equal(lsifArrayImport.semanticIndex.occurrences[0].role, 'definition');
assert.equal(lsifArrayImport.semanticIndex.relations.some((relation) => relation.predicate === 'textDocument/references'), true);
const semanticDbTextDocumentsImport = importExternalSemanticIndex({
  textDocuments: [{
    uri: 'file:///repo/src/Main.scala',
    language: 'scala',
    md5: 'main-md5',
    symbols: [{
      symbol: '_empty_/Main#',
      display_name: 'Main',
      kind: 'CLASS',
      annotations: ['@main']
    }],
    occurrences: [{
      symbol: '_empty_/Main#',
      role: 2,
      range: { startLine: 0, startCharacter: 7, endLine: 0, endCharacter: 11 }
    }]
  }]
});
assert.equal(semanticDbTextDocumentsImport.format, 'semanticdb');
assert.equal(semanticDbTextDocumentsImport.semanticIndex.documents[0].path, '/repo/src/Main.scala');
assert.equal(semanticDbTextDocumentsImport.semanticIndex.symbols[0].name, 'Main');
assert.equal(semanticDbTextDocumentsImport.semanticIndex.facts.some((fact) => fact.predicate === 'annotations'), true);
assert.equal(semanticDbTextDocumentsImport.summary.sourceMapMappings, 1);
