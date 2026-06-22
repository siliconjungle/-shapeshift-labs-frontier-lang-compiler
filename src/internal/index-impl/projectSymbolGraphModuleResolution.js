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

function normalizeProjectPath(path) {
  const parts = [];
  for (const part of String(path).split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}
