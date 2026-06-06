export function normalizeExternalSemanticIndexFormat(format) {
  const normalized = String(format ?? 'frontier-semantic-index').trim().toLowerCase();
  const aliases = {
    frontier: 'frontier-semantic-index',
    'frontier.semantic-index': 'frontier-semantic-index',
    'frontier.lang.semanticindex': 'frontier-semantic-index',
    'frontier.lang.semantic-index': 'frontier-semantic-index',
    'frontier-semanticindex': 'frontier-semantic-index',
    scipindex: 'scip',
    'scip-index': 'scip',
    'sourcegraph-scip': 'scip',
    'sourcegraph.scip': 'scip',
    'sourcegraph-scip-index': 'scip',
    'sourcegraph.scip-index': 'scip',
    'code-intelligence-protocol': 'scip',
    lsp: 'lsp',
    'language-server-protocol': 'lsp',
    'language-server-index-format': 'lsif',
    'language-server-index': 'lsif',
    'lsp-document-symbols': 'lsp',
    'lsp-semantic-tokens': 'lsp',
    semanticdb: 'semanticdb',
    'semantic-db': 'semanticdb',
    'scala-semanticdb': 'semanticdb',
    'metals-semanticdb': 'semanticdb',
    'scalameta-semanticdb': 'semanticdb',
    'glean-db': 'glean',
    'glean-facts': 'glean',
    'glean-schema': 'glean',
    'glean-predicates': 'glean',
    'facebook-glean': 'glean'
  };
  return aliases[normalized] ?? normalized;
}
