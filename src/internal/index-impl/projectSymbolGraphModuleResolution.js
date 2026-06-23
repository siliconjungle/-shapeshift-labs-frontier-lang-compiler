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
  const exportedByDocumentAndName = projectExportSymbolMap(symbols, documents);
  return function resolveProjectModuleSymbol(edge) {
    if (!edge?.targetDocumentId) return undefined;
    const targetName = targetExportName(edge);
    if (!targetName) return undefined;
    return exportedByDocumentAndName.get(symbolKey(edge.targetDocumentId, targetName))?.id;
  };
}

export function createProjectDocumentExportSymbolResolver(symbols, documents) {
  const exportedByDocumentAndName = projectExportSymbolMap(symbols, documents);
  return function resolveDocumentExportSymbol(documentId, name) {
    if (!documentId || !name) return undefined;
    return exportedByDocumentAndName.get(symbolKey(documentId, name))?.id;
  };
}

function projectExportSymbolMap(symbols, documents) {
  const documentsByPath = new Map(documents.filter((document) => document.path).map((document) => [document.path, document]));
  const exportedByDocumentAndName = new Map();
  for (const symbol of symbols ?? []) {
    if (symbol?.kind !== 'export' || !symbol.name) continue;
    const document = documentsByPath.get(symbol.definitionSpan?.path);
    if (document) exportedByDocumentAndName.set(symbolKey(document.id, symbol.name), symbol);
  }
  return exportedByDocumentAndName;
}

function resolveConfiguredProjectModule(moduleSpecifier, documentsByPath, moduleResolution) {
  const packageInfo = packageSpecifierInfo(moduleSpecifier);
  const candidates = configuredModuleCandidates(moduleSpecifier, moduleResolution, packageInfo);
  let firstMissing;
  for (const candidate of candidates) {
    const target = moduleTargetDocument(candidate.path, documentsByPath);
    const packageFields = packageResolutionFields(candidate, packageInfo);
    if (target) return { path: target.path, documentId: target.id, kind: `${candidate.kind}-source`, ...packageFields };
    firstMissing ??= { path: candidate.path, kind: `${candidate.kind}-missing`, ...packageFields };
  }
  return firstMissing ?? (packageInfo ? { kind: 'package-external', ...packageInfo } : undefined);
}

function configuredModuleCandidates(moduleSpecifier, moduleResolution = {}, packageInfo) {
  const compilerOptions = moduleResolution.compilerOptions ?? {};
  const baseUrl = normalizeProjectPath(moduleResolution.baseUrl ?? compilerOptions.baseUrl ?? '');
  return uniquePaths([
    ...aliasCandidates(moduleSpecifier, moduleResolution.aliases, 'alias', baseUrl),
    ...aliasCandidates(moduleSpecifier, moduleResolution.paths ?? compilerOptions.paths, 'path-alias', baseUrl),
    ...packageCandidates(packageInfo, moduleResolution),
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

function packageCandidates(packageInfo, moduleResolution = {}) {
  if (!packageInfo) return [];
  const options = moduleResolution.packages?.[packageInfo.packageName];
  if (!options) return [];
  const root = normalizeProjectPath(options.root ?? '');
  const subpath = packageInfo.packageSubpath === '.' ? '' : packageInfo.packageSubpath.slice(2);
  return uniquePaths([
    ...packageExportCandidates(packageInfo, options, moduleResolution).map((candidate) => ({
      ...candidate,
      path: normalizeProjectPath(joinProjectPath(root, candidate.path))
    })),
    ...packageFallbackTargets(options, subpath).map((path) => ({
      kind: 'package',
      path: normalizeProjectPath(joinProjectPath(root, path)),
      ...packageInfo
    }))
  ]);
}

function packageExportCandidates(packageInfo, options, moduleResolution) {
  const targets = packageExportTargets(options.exports, packageInfo.packageSubpath, packageConditions(moduleResolution));
  return targets.map((target) => ({
    kind: 'package',
    path: target.path,
    packageExportCondition: target.condition,
    ...packageInfo
  }));
}

function packageExportTargets(exportsValue, subpath, conditions) {
  if (!exportsValue) return [];
  return exportTargetsForValue(exportMapValue(exportsValue, subpath), conditions);
}

function exportMapValue(exportsValue, subpath) {
  if (!isRecord(exportsValue) || !Object.keys(exportsValue).some((key) => key.startsWith('.'))) return subpath === '.' ? exportsValue : undefined;
  return exportsValue[subpath] ?? patternExportMapValue(exportsValue, subpath);
}

function patternExportMapValue(exportsValue, subpath) {
  for (const [pattern, target] of Object.entries(exportsValue)) {
    const capture = patternCapture(subpath, pattern);
    if (capture !== undefined) return replaceExportTargetCapture(target, capture);
  }
  return undefined;
}

function replaceExportTargetCapture(target, capture) {
  if (typeof target === 'string') return target.replace('*', capture);
  if (Array.isArray(target)) return target.map((entry) => replaceExportTargetCapture(entry, capture));
  if (!isRecord(target)) return target;
  return Object.fromEntries(Object.entries(target).map(([key, value]) => [key, replaceExportTargetCapture(value, capture)]));
}

function exportTargetsForValue(value, conditions, condition) {
  if (!value) return [];
  if (typeof value === 'string') return [{ path: value, condition }];
  if (Array.isArray(value)) return value.flatMap((entry) => exportTargetsForValue(entry, conditions, condition));
  if (!isRecord(value)) return [];
  return conditions.flatMap((key) => exportTargetsForValue(value[key], conditions, key));
}

function packageFallbackTargets(options, subpath) {
  const sourceRoot = normalizeProjectPath(options.sourceRoot ?? 'src');
  if (subpath) return [joinProjectPath(sourceRoot, subpath), subpath];
  return [options.types, options.main, joinProjectPath(sourceRoot, 'index')].filter(Boolean);
}

function moduleTargetDocument(path, documentsByPath) {
  for (const candidate of modulePathCandidates(path)) {
    const document = documentsByPath.get(candidate);
    if (document) return document;
  }
  return undefined;
}

function modulePathCandidates(path) {
  return [path, `${path}.js`, `${path}.ts`, `${path}.tsx`, `${path}.jsx`, `${path}.d.ts`, `${path}/index.js`, `${path}/index.ts`, `${path}/index.d.ts`];
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

function packageSpecifierInfo(moduleSpecifier) {
  if (!moduleSpecifier || String(moduleSpecifier).startsWith('#')) return undefined;
  const parts = String(moduleSpecifier).split('/');
  if (!parts[0] || parts[0] === '.' || parts[0] === '..') return undefined;
  const scoped = parts[0].startsWith('@');
  if (scoped && parts.length < 2) return undefined;
  const packageName = scoped ? `${parts[0]}/${parts[1]}` : parts[0];
  const rest = parts.slice(scoped ? 2 : 1).join('/');
  return { packageName, packageSubpath: rest ? `./${rest}` : '.' };
}

function packageResolutionFields(candidate, packageInfo) {
  if (!candidate.packageName && candidate.kind !== 'package') return {};
  return {
    packageName: candidate.packageName ?? packageInfo?.packageName,
    packageSubpath: candidate.packageSubpath ?? packageInfo?.packageSubpath,
    packageExportCondition: candidate.packageExportCondition
  };
}

function packageConditions(moduleResolution = {}) {
  return moduleResolution.packageExportConditions ?? moduleResolution.conditions ?? ['types', 'import', 'module', 'require', 'default'];
}

function isRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
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
