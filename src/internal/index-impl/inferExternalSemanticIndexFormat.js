export function inferExternalSemanticIndexFormat(payload) {
  if (payload.kind === 'frontier.lang.semanticIndex') return 'frontier-semantic-index';
  if (Array.isArray(payload) && payload.some((entry) => entry?.type === 'vertex' || entry?.type === 'edge')) return 'lsif';
  if (Array.isArray(payload) && payload.some(isGleanFactEntry)) return 'glean';
  if (Array.isArray(payload.vertices) || Array.isArray(payload.edges)) return 'lsif';
  if (Array.isArray(payload.documents) && payload.documents.some((document) => document?.relative_path ?? document?.relativePath)) return 'scip';
  if (payload.metadata?.project_root || payload.metadata?.projectRoot || payload.external_symbols || payload.externalSymbols) return 'scip';
  if (Array.isArray(payload.documents) && payload.documents.some((document) => document?.symbols && document?.occurrences && (document?.uri || document?.md5 || document?.schema))) return 'semanticdb';
  if (Array.isArray(payload.textDocuments) && payload.textDocuments.some(isSemanticDbDocument)) return 'semanticdb';
  if (payload.glean || payload.schemaId || payload.repo_hash || payload.repoHash || payload.factsByPredicate) return 'glean';
  if (Array.isArray(payload.facts) && payload.facts.some((fact) => fact?.predicate || fact?.predicateName)) return 'glean';
  if (payload.predicates && typeof payload.predicates === 'object') return 'glean';
  if (Array.isArray(payload.documents) && payload.documents.some(isLspDocument)) return 'lsp';
  if (Array.isArray(payload.documentSymbols) || Array.isArray(payload.symbols) || payload.semanticTokens || payload.textDocument || payload.diagnostics || payload.location || payload.range) return 'lsp';
  return 'frontier-semantic-index';
}

function isSemanticDbDocument(document) {
  if (!document || typeof document !== 'object') return false;
  return Boolean(
    (document.symbols || document.occurrences) &&
    (document.uri || document.path || document.md5 || document.schema)
  );
}

function isLspDocument(document) {
  if (!document || typeof document !== 'object') return false;
  return Boolean(
    document.textDocument ||
    document.documentSymbols ||
    document.semanticTokens ||
    document.diagnostics ||
    (document.symbols && !document.occurrences)
  );
}

function isGleanFactEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  const predicate = entry.predicate ?? entry.predicateName ?? entry.name;
  return typeof predicate === 'string' && (
    Array.isArray(entry.facts) ||
    Array.isArray(entry.results) ||
    entry.key ||
    entry.value
  );
}
