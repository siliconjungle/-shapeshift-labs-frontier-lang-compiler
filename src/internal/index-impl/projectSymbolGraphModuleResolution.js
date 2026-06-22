export function resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath) {
  if (!sourcePath || !moduleSpecifier || !moduleSpecifier.startsWith('.')) return undefined;
  const base = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
  const unresolvedPath = normalizeProjectPath(`${base}/${moduleSpecifier}`);
  const target = moduleTargetDocument(unresolvedPath, documentsByPath);
  return {
    path: target?.path ?? unresolvedPath,
    documentId: target?.id,
    kind: target ? 'relative-source' : 'relative-missing'
  };
}

export function createProjectModuleSymbolResolver(symbols, documents) {
  const documentsByPath = new Map(documents.filter((document) => document.path).map((document) => [document.path, document]));
  const exportedByDocumentAndName = new Map();
  for (const symbol of symbols ?? []) {
    if (symbol?.kind !== 'export' || !symbol.name) continue;
    const document = documentsByPath.get(symbol.definitionSpan?.path);
    if (!document) continue;
    exportedByDocumentAndName.set(symbolKey(document.id, symbol.name), symbol);
  }
  return function resolveProjectModuleSymbol(edge) {
    if (!edge?.targetDocumentId) return undefined;
    const targetName = targetExportName(edge);
    if (!targetName) return undefined;
    return exportedByDocumentAndName.get(symbolKey(edge.targetDocumentId, targetName))?.id;
  };
}

function moduleTargetDocument(path, documentsByPath) {
  for (const candidate of modulePathCandidates(path)) {
    const document = documentsByPath.get(candidate);
    if (document) return document;
  }
  return undefined;
}

function modulePathCandidates(path) {
  return [path, `${path}.js`, `${path}.ts`, `${path}.tsx`, `${path}.jsx`, `${path}/index.js`, `${path}/index.ts`];
}

function targetExportName(edge) {
  const name = edge.importedName ?? edge.localName ?? edge.exportedName;
  if (!name || name === '*') return undefined;
  return String(name);
}

function symbolKey(documentId, name) {
  return `${documentId}\u0000${name}`;
}

function normalizeProjectPath(path) {
  const parts = [];
  for (const part of String(path).split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}
