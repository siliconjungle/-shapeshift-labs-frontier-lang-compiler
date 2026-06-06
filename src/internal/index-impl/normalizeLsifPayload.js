import{idFragment}from'../../native-import-utils.js';
import{externalSemanticBase}from'./externalSemanticBase.js';import{normalizeArray}from'./normalizeArray.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{spanFromLspRange}from'./spanFromLspRange.js';import{uriToPath}from'./uriToPath.js';import{withExternalEmptyLoss}from'./withExternalEmptyLoss.js';
export function normalizeLsifPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'lsif' });
  const records = Array.isArray(payload) ? payload : [...normalizeArray(payload.vertices), ...normalizeArray(payload.edges)];
  const vertices = new Map(records.filter((record) => record?.type === 'vertex').map((record) => [record.id, record]));
  const edges = records.filter((record) => record?.type === 'edge');
  const documentByVertex = new Map();
  const documentIdByRange = new Map();
  const resultSetByRange = new Map();
  const monikerByOut = new Map();
  const definitionRangeIds = new Set();
  for (const vertex of vertices.values()) {
    if (vertex.label === 'document') {
      const path = uriToPath(vertex.uri) ?? vertex.uri ?? context.sourcePath ?? `lsif-document-${result.documents.length + 1}`;
      const documentId = `doc_${idFragment(vertex.id ?? path)}`;
      documentByVertex.set(vertex.id, { id: documentId, path, language: normalizeExternalSemanticLanguage(vertex.languageId ?? context.language) });
      result.documents.push({
        id: documentId,
        path,
        language: normalizeExternalSemanticLanguage(vertex.languageId ?? context.language),
        metadata: { format: 'lsif', vertexId: vertex.id, uri: vertex.uri }
      });
    }
    if (vertex.label === 'moniker') monikerByOut.set(vertex.id, vertex);
  }
  for (const edge of edges) {
    if (edge.label === 'next') resultSetByRange.set(edge.outV, edge.inV);
    if (edge.label === 'moniker') monikerByOut.set(edge.outV, vertices.get(edge.inV) ?? edge);
    if (edge.label === 'contains') {
      const document = documentByVertex.get(edge.outV);
      if (document) {
        for (const rangeId of normalizeArray(edge.inVs ?? edge.inV)) {
          documentIdByRange.set(rangeId, document.id);
        }
      }
    }
    if (edge.label === 'item' && (edge.property === 'definitions' || edge.property === 'declarations')) {
      for (const rangeId of normalizeArray(edge.inVs ?? edge.inV)) definitionRangeIds.add(rangeId);
    }
  }
  const documentIds = result.documents.map((document) => document.id);
  const defaultDocument = result.documents[0] ?? {
    id: `doc_${idFragment(context.sourcePath ?? 'lsif')}`,
    path: context.sourcePath ?? 'lsif:memory',
    language: context.language
  };
  if (!result.documents.length) result.documents.push(defaultDocument);
  for (const [vertexId, vertex] of vertices.entries()) {
    if (vertex.label !== 'range') continue;
    const resultSetId = resultSetByRange.get(vertexId);
    const moniker = monikerByOut.get(resultSetId) ?? monikerByOut.get(vertexId);
    const symbolId = moniker?.identifier
      ? `symbol:lsif:${idFragment(moniker.scheme ?? moniker.kind ?? 'moniker')}:${idFragment(moniker.identifier)}`
      : `symbol:lsif:${idFragment(resultSetId ?? vertexId)}`;
    const documentId = documentIdByRange.get(vertexId) ?? documentIds[0] ?? defaultDocument.id;
    const owningDocument = result.documents.find((document) => document.id === documentId) ?? defaultDocument;
    const span = spanFromLspRange(vertex, owningDocument.path, context.sourceHash, 0);
    if (!result.symbols.some((symbol) => symbol.id === symbolId)) {
      result.symbols.push({
        id: symbolId,
        scheme: 'lsif',
        name: moniker?.identifier ?? `range:${vertexId}`,
        kind: moniker?.kind ?? 'symbol',
        language: owningDocument.language,
        definitionSpan: definitionRangeIds.has(vertexId) ? span : undefined,
        metadata: { format: 'lsif', resultSetId, moniker }
      });
    }
    result.occurrences.push({
      id: `occ_${idFragment(vertexId)}`,
      documentId,
      symbolId,
      role: definitionRangeIds.has(vertexId) ? 'definition' : 'reference',
      span,
      metadata: { format: 'lsif', vertexId, resultSetId }
    });
  }
  for (const edge of edges) {
    if (edge.label === 'textDocument/definition' || edge.label === 'textDocument/references' || edge.label === 'textDocument/declaration') {
      result.relations.push({
        id: `rel_${idFragment(edge.id ?? `${edge.outV}_${edge.inV}_${edge.label}`)}`,
        sourceId: `lsif:${edge.outV}`,
        predicate: edge.label,
        targetId: `lsif:${edge.inV}`,
        metadata: { format: 'lsif', edge }
      });
    }
  }
  return withExternalEmptyLoss(result, context);
}
