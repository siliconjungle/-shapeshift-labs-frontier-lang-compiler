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

export function resolveProjectModule(sourcePath, moduleSpecifier, documentsByPath, moduleResolution) {
  if (!sourcePath || !moduleSpecifier) return undefined;
  if (String(moduleSpecifier).startsWith('.')) return resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath);
  return resolveConfiguredProjectModule(moduleSpecifier, documentsByPath, moduleResolution);
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

function resolveConfiguredProjectModule(moduleSpecifier, documentsByPath, moduleResolution) {
  const candidates = configuredModuleCandidates(moduleSpecifier, moduleResolution);
  let firstMissing;
  for (const candidate of candidates) {
    const target = moduleTargetDocument(candidate.path, documentsByPath);
    if (target) return { path: target.path, documentId: target.id, kind: `${candidate.kind}-source` };
    firstMissing ??= { path: candidate.path, kind: `${candidate.kind}-missing` };
  }
  return firstMissing;
}

function configuredModuleCandidates(moduleSpecifier, moduleResolution = {}) {
  const compilerOptions = moduleResolution.compilerOptions ?? {};
  const baseUrl = normalizeProjectPath(moduleResolution.baseUrl ?? compilerOptions.baseUrl ?? '');
  return uniquePaths([
    ...aliasCandidates(moduleSpecifier, moduleResolution.aliases, 'alias', baseUrl),
    ...aliasCandidates(moduleSpecifier, moduleResolution.paths ?? compilerOptions.paths, 'path-alias', baseUrl),
    ...baseUrlCandidates(moduleSpecifier, baseUrl)
  ]);
}

function aliasCandidates(moduleSpecifier, aliases, kind, baseUrl) {
  return Object.entries(aliases ?? {}).flatMap(([pattern, targetPatterns]) => {
    const capture = patternCapture(moduleSpecifier, pattern);
    if (capture === undefined) return [];
    const targets = Array.isArray(targetPatterns) ? targetPatterns : [targetPatterns];
    return targets.map((targetPattern) => ({
      kind,
      path: normalizeProjectPath(joinProjectPath(baseUrl, String(targetPattern).replace('*', capture)))
    }));
  });
}

function baseUrlCandidates(moduleSpecifier, baseUrl) {
  if (!baseUrl || String(moduleSpecifier).startsWith('@')) return [];
  return [{ kind: 'base-url', path: normalizeProjectPath(joinProjectPath(baseUrl, moduleSpecifier)) }];
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

function patternCapture(value, pattern) {
  if (pattern === value) return '';
  if (!String(pattern).includes('*')) return undefined;
  const [prefix, suffix = ''] = String(pattern).split('*');
  if (!String(value).startsWith(prefix) || !String(value).endsWith(suffix)) return undefined;
  return String(value).slice(prefix.length, String(value).length - suffix.length);
}

function uniquePaths(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate.path || seen.has(candidate.path)) return false;
    seen.add(candidate.path);
    return true;
  });
}

function joinProjectPath(left, right) {
  return left ? `${left}/${right}` : String(right);
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
