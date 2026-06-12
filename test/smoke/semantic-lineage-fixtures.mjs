export function parserImportFixture({
  id,
  symbolName,
  sourceText,
  sourcePath = 'src/runtime.ts',
  signatureHash = 'fixture_signature_step_body',
  ownershipRegionKind,
  line = 1
}) {
  const sourceHash = `fixture_hash_${id}`;
  const lineText = sourceText.split('\n')[line - 1] ?? sourceText;
  const span = {
    path: sourcePath,
    startLine: line,
    startColumn: 1,
    endLine: line,
    endColumn: lineText.length + 1
  };
  const symbol = {
    id: `symbol_${symbolName}`,
    name: symbolName,
    kind: 'function',
    language: 'typescript',
    nativeAstNodeId: `node_${symbolName}`,
    definitionSpan: span,
    signatureHash,
    metadata: { ownershipRegionKind }
  };
  return {
    kind: 'frontier.lang.importResult',
    version: 1,
    id,
    language: 'typescript',
    sourcePath,
    nativeSource: {
      id: `native_source_${id}`,
      language: 'typescript',
      sourcePath,
      sourceHash,
      metadata: { sourcePreservation: { sourceText } }
    },
    nativeAst: {
      id: `native_ast_${id}`,
      language: 'typescript',
      sourcePath,
      sourceHash,
      nodes: { [`node_${symbolName}`]: { id: `node_${symbolName}`, kind: 'function', name: symbolName, span } },
      metadata: { sourcePreservation: { sourceText } }
    },
    semanticIndex: {
      id: `semantic_index_${id}`,
      symbols: [symbol],
      relations: [],
      occurrences: [],
      facts: []
    },
    sourceMaps: [{
      id: `source_map_${id}`,
      mappings: [{
        id: `mapping_${id}`,
        semanticSymbolId: symbol.id,
        nativeAstNodeId: symbol.nativeAstNodeId,
        sourceSpan: span,
        precision: 'declaration'
      }]
    }],
    evidence: []
  };
}

export function parserImportMultiFixture({ id, sourcePath = 'src/runtime.ts', sourceText, symbols }) {
  const sourceHash = `fixture_hash_${id}`;
  const nativeNodes = {};
  const semanticSymbols = [];
  const mappings = [];
  for (const [index, entry] of symbols.entries()) {
    const symbolName = entry.symbolName;
    const line = entry.line ?? index + 1;
    const lineText = sourceText.split('\n')[line - 1] ?? '';
    const span = entry.span ?? {
      path: sourcePath,
      startLine: line,
      startColumn: 1,
      endLine: line,
      endColumn: lineText.length + 1
    };
    const nodeId = entry.nativeAstNodeId ?? `node_${symbolName}`;
    const symbol = {
      id: entry.symbolId ?? `symbol_${symbolName}`,
      name: symbolName,
      kind: entry.kind ?? 'function',
      language: 'typescript',
      nativeAstNodeId: nodeId,
      definitionSpan: span,
      signatureHash: entry.signatureHash,
      metadata: { ownershipRegionKind: entry.ownershipRegionKind }
    };
    nativeNodes[nodeId] = { id: nodeId, kind: entry.nativeKind ?? 'function', name: symbolName, span };
    semanticSymbols.push(symbol);
    mappings.push({
      id: `mapping_${id}_${index + 1}`,
      semanticSymbolId: symbol.id,
      nativeAstNodeId: nodeId,
      sourceSpan: span,
      precision: 'declaration'
    });
  }
  return {
    kind: 'frontier.lang.importResult',
    version: 1,
    id,
    language: 'typescript',
    sourcePath,
    nativeSource: {
      id: `native_source_${id}`,
      language: 'typescript',
      sourcePath,
      sourceHash,
      metadata: { sourcePreservation: { sourceText } }
    },
    nativeAst: {
      id: `native_ast_${id}`,
      language: 'typescript',
      sourcePath,
      sourceHash,
      nodes: nativeNodes,
      metadata: { sourcePreservation: { sourceText } }
    },
    semanticIndex: {
      id: `semantic_index_${id}`,
      symbols: semanticSymbols,
      relations: [],
      occurrences: [],
      facts: []
    },
    sourceMaps: [{ id: `source_map_${id}`, mappings }],
    evidence: []
  };
}
