import { modulePathCandidates } from './projectSymbolGraphModulePathCandidates.js';
import { exportMapMatch, exportTargetsForValue, packageEnvironmentConditionAmbiguity, packageEnvironmentConditionEvidence, packageConditions, packageRuntimeConditionAmbiguity, packageRuntimeConditionEvidence } from './projectSymbolGraphPackageConditions.js';

const UNKNOWN_DYNAMIC_IMPORT_MODULE_SPECIFIER = '<dynamic-import>';
const UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER = '<host-dependency>';

export function resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath) {
  if (!sourcePath || !moduleSpecifier || !moduleSpecifier.startsWith('.')) return undefined;
  const base = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
  const unresolvedPath = normalizeProjectPath(`${base}/${moduleSpecifier}`);
  const target = moduleTargetDocument(unresolvedPath, documentsByPath);
  return {
    path: target?.path ?? unresolvedPath,
    documentId: target?.id,
    resolutionPathVariant: target?.resolutionPathVariant,
    kind: target ? 'relative-source' : 'relative-missing'
  };
}

export function resolveProjectModule(sourcePath, moduleSpecifier, documentsByPath, moduleResolution, edgeMetadata) {
  if (!sourcePath || !moduleSpecifier) return undefined;
  if (moduleSpecifier === UNKNOWN_DYNAMIC_IMPORT_MODULE_SPECIFIER) return { kind: 'dynamic-import-non-literal-missing' };
  if (moduleSpecifier === UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER) return { kind: 'host-dependency-non-literal-missing' };
  if (String(moduleSpecifier).startsWith('.')) return resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath);
  if (String(moduleSpecifier).startsWith('#')) return resolvePackageImportProjectModule(sourcePath, moduleSpecifier, documentsByPath, moduleResolution, edgeMetadata);
  return resolveConfiguredProjectModule(sourcePath, moduleSpecifier, documentsByPath, moduleResolution, edgeMetadata);
}

export function createProjectModuleSymbolResolver(symbols, documents) {
  const exportedByDocumentAndName = projectExportSymbolMap(symbols, documents);
  return function resolveProjectModuleSymbol(edge) {
    if (!edge?.targetDocumentId) return undefined;
    const targetName = targetExportName(edge);
    if (!targetName) return undefined;
    if (edge.importKind === 'commonjs-require' && targetName === 'default') {
      return exportedByDocumentAndName.get(symbolKey(edge.targetDocumentId, 'module.exports'))?.id;
    }
    const directExport = exportedByDocumentAndName.get(symbolKey(edge.targetDocumentId, targetName));
    if (directExport) return directExport.id;
    if (targetName === 'default') {
      return exportedByDocumentAndName.get(symbolKey(edge.targetDocumentId, 'module.exports'))?.id;
    }
    return undefined;
  };
}

export function createProjectDocumentExportSymbolResolver(symbols, documents) {
  const exportedByDocumentAndName = projectExportSymbolMap(symbols, documents);
  return function resolveDocumentExportSymbol(documentId, name) {
    if (!documentId || !name) return undefined;
    return exportedByDocumentAndName.get(symbolKey(documentId, name))?.id;
  };
}

export function createProjectDocumentExportSymbolsResolver(symbols, documents) {
  const documentsByPath = new Map(documents.filter((document) => document.path).map((document) => [document.path, document]));
  const exportsByDocumentId = new Map();
  for (const symbol of symbols ?? []) {
    if (symbol?.kind !== 'export' || !symbol.name) continue;
    const documentId = symbolDocumentId(symbol, documentsByPath);
    if (!documentId) continue;
    const exports = exportsByDocumentId.get(documentId) ?? [];
    exports.push(symbol);
    exportsByDocumentId.set(documentId, exports);
  }
  return function resolveDocumentExports(documentId) {
    return exportsByDocumentId.get(documentId) ?? [];
  };
}

function projectExportSymbolMap(symbols, documents) {
  const documentsByPath = new Map(documents.filter((document) => document.path).map((document) => [document.path, document]));
  const exportedByDocumentAndName = new Map();
  for (const symbol of symbols ?? []) {
    if (symbol?.kind !== 'export' || !symbol.name) continue;
    const documentId = symbolDocumentId(symbol, documentsByPath);
    if (documentId) exportedByDocumentAndName.set(symbolKey(documentId, symbol.name), symbol);
  }
  return exportedByDocumentAndName;
}

function symbolDocumentId(symbol, documentsByPath) {
  return symbol?.metadata?.moduleEdge?.sourceDocumentId ?? documentsByPath.get(symbol.definitionSpan?.path)?.id;
}
function resolveConfiguredProjectModule(sourcePath, moduleSpecifier, documentsByPath, moduleResolution, edgeMetadata) {
  const packageInfo = packageSpecifierInfo(moduleSpecifier);
  const candidates = configuredModuleCandidates(sourcePath, moduleSpecifier, moduleResolution, packageInfo, edgeMetadata);
  let firstMissing;
  for (const candidate of candidates) {
    const packageFields = packageResolutionFields(candidate, packageInfo);
    if (candidate.failClosedKind) {
      firstMissing ??= { path: candidate.path, kind: candidate.failClosedKind, ...packageFields };
      continue;
    }
    const target = moduleTargetDocument(candidate.path, documentsByPath);
    if (target) return { path: target.path, documentId: target.id, resolutionPathVariant: target.resolutionPathVariant, kind: `${candidate.kind}-source`, ...packageFields };
    firstMissing ??= { path: candidate.path, kind: `${candidate.kind}-missing`, ...packageFields };
  }
  return firstMissing ?? (packageInfo ? { kind: 'package-external', ...packageInfo } : undefined);
}

function resolvePackageImportProjectModule(sourcePath, moduleSpecifier, documentsByPath, moduleResolution = {}, edgeMetadata) {
  const packageContext = packageImportContext(sourcePath, moduleResolution);
  if (packageContext.packageWorkspaceRootAmbiguous) return { kind: 'package-workspace-root-ambiguous-missing', packageImportKey: moduleSpecifier, packageName: packageContext.packageName, ...packageWorkspaceRootAmbiguityFields(packageContext) };
  if (packageContext.packageImportScopeMismatch) return { kind: 'package-import-scope-missing', packageImportKey: moduleSpecifier };
  const importsValue = packageContext.imports;
  if (!importsValue) return { kind: 'package-import-external', packageImportKey: moduleSpecifier };
  const match = packageImportMapValue(importsValue, moduleSpecifier);
  if (!match) return { kind: 'package-import-external', packageImportKey: moduleSpecifier };
  const runtimeEvidence = packageRuntimeConditionEvidence(moduleResolution, sourcePath, packageContext, edgeMetadata);
  if (runtimeEvidence.packageRuntimeConditionConflict) return {
    kind: 'package-runtime-condition-conflict-missing',
    packageImportKey: match.key,
    packageName: packageContext.packageName,
    ...runtimeEvidence
  };
  if (match.value === null) return { kind: 'package-import-null-target-missing', packageImportKey: match.key, packageName: packageContext.packageName, ...runtimeEvidence };
  const runtimeAmbiguity = packageRuntimeConditionAmbiguity(match.value, moduleResolution, sourcePath, packageContext, edgeMetadata);
  if (runtimeAmbiguity) return { kind: 'package-import-runtime-ambiguous-missing', packageImportKey: match.key, packageImportCondition: runtimeAmbiguity, packageName: packageContext.packageName, ...runtimeEvidence };
  const environmentEvidence = packageEnvironmentConditionEvidence(moduleResolution, edgeMetadata);
  const environmentAmbiguity = packageEnvironmentConditionAmbiguity(match.value, moduleResolution, sourcePath, packageContext, edgeMetadata);
  if (environmentAmbiguity) return { kind: 'package-import-environment-ambiguous-missing', packageImportKey: match.key, packageImportCondition: environmentAmbiguity, packageName: packageContext.packageName, ...environmentAmbiguityFields(environmentAmbiguity), ...runtimeEvidence, ...environmentEvidence };
  const conditions = packageConditions(moduleResolution, sourcePath, packageContext, edgeMetadata);
  const targets = exportTargetsForValue(match.value, conditions);
  if (!targets.length && isRecord(match.value)) {
    return { kind: 'package-import-condition-missing', packageImportKey: match.key, packageName: packageContext.packageName, ...runtimeEvidence };
  }
  let firstMissing;
  for (const target of targets) {
    const packageImportTarget = target.path;
    if (!packageImportTarget || !String(packageImportTarget).startsWith('.')) {
      return { kind: 'package-import-external', packageImportKey: match.key, packageImportCondition: target.condition, packageImportTarget };
    }
    const candidatePath = normalizeProjectPath(joinProjectPath(packageContext.root, packageImportTarget));
    const resolved = moduleTargetDocument(candidatePath, documentsByPath);
    const record = {
      packageImportKey: match.key,
      packageImportCondition: target.condition,
      packageImportTarget,
      packageName: packageContext.packageName,
      ...runtimeEvidence,
      ...environmentEvidence
    };
    if (resolved) return { path: resolved.path, documentId: resolved.id, resolutionPathVariant: resolved.resolutionPathVariant, kind: 'package-import-source', ...record };
    firstMissing ??= { path: candidatePath, kind: 'package-import-missing', ...record };
  }
  return firstMissing ?? { kind: 'package-import-external', packageImportKey: match.key };
}

function configuredModuleCandidates(sourcePath, moduleSpecifier, moduleResolution = {}, packageInfo, edgeMetadata) {
  const compilerOptions = moduleResolution.compilerOptions ?? {};
  const baseUrl = normalizeProjectPath(moduleResolution.baseUrl ?? compilerOptions.baseUrl ?? '');
  return uniquePaths([
    ...aliasCandidates(moduleSpecifier, moduleResolution.aliases, 'alias', baseUrl),
    ...aliasCandidates(moduleSpecifier, moduleResolution.paths ?? compilerOptions.paths, 'path-alias', baseUrl),
    ...packageCandidates(sourcePath, packageInfo, moduleResolution, edgeMetadata),
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
function packageCandidates(sourcePath, packageInfo, moduleResolution = {}, edgeMetadata) {
  if (!packageInfo) return [];
  const options = moduleResolution.packages?.[packageInfo.packageName];
  if (!options) return [];
  const rootAmbiguity = packageWorkspaceRootAmbiguity(options, packageInfo); if (rootAmbiguity) return [rootAmbiguity];
  const root = normalizeProjectPath(options.root ?? '');
  const subpath = packageInfo.packageSubpath === '.' ? '' : packageInfo.packageSubpath.slice(2);
  const exportMatch = exportMapMatch(options.exports, packageInfo.packageSubpath);
  const exportValue = exportMatch?.value;
  const runtimeEvidence = packageRuntimeConditionEvidence(moduleResolution, sourcePath, undefined, edgeMetadata);
  const environmentEvidence = packageEnvironmentConditionEvidence(moduleResolution, edgeMetadata);
  if (Object.prototype.hasOwnProperty.call(options, 'exports')) {
    const fallbackPath = normalizeProjectPath(joinProjectPath(root, subpath || '.'));
    if (runtimeEvidence.packageRuntimeConditionConflict) return [{ kind: 'package', failClosedKind: 'package-runtime-condition-conflict-missing', path: fallbackPath, packageExportKey: exportMatch?.key, ...runtimeEvidence, ...packageInfo }];
    if (exportValue === undefined || exportValue === null) return [{ kind: 'package', failClosedKind: exportValue === null ? 'package-export-null-target-missing' : 'package-subpath-not-exported-missing', path: fallbackPath, packageExportKey: exportMatch?.key, ...runtimeEvidence, ...packageInfo }];
    const runtimeAmbiguity = packageRuntimeConditionAmbiguity(exportValue, moduleResolution, sourcePath, undefined, edgeMetadata);
    if (runtimeAmbiguity) return [{ kind: 'package', failClosedKind: 'package-export-runtime-ambiguous-missing', path: fallbackPath, packageExportKey: exportMatch?.key, packageExportCondition: runtimeAmbiguity, ...runtimeEvidence, ...packageInfo }];
    const environmentAmbiguity = packageEnvironmentConditionAmbiguity(exportValue, moduleResolution, sourcePath, undefined, edgeMetadata);
    if (environmentAmbiguity) return [{ kind: 'package', failClosedKind: 'package-export-environment-ambiguous-missing', path: fallbackPath, packageExportKey: exportMatch?.key, packageExportCondition: environmentAmbiguity, ...environmentAmbiguityFields(environmentAmbiguity), ...runtimeEvidence, ...environmentEvidence, ...packageInfo }];
    const exportTargets = exportTargetsForValue(exportValue, packageConditions(moduleResolution, sourcePath, undefined, edgeMetadata));
    if (!exportTargets.length) return [{ kind: 'package', failClosedKind: 'package-export-condition-missing', path: fallbackPath, packageExportKey: exportMatch?.key, ...runtimeEvidence, ...packageInfo }];
    return uniquePaths(exportTargets.map((target) => ({ kind: 'package', path: normalizeProjectPath(joinProjectPath(root, target.path)), packageExportKey: exportMatch?.key, packageExportCondition: target.condition, packageExportTarget: target.path, ...runtimeEvidence, ...environmentEvidence, ...packageInfo })));
  }
  return uniquePaths(packageFallbackTargets(options, subpath).map((path) => ({ kind: 'package', path: normalizeProjectPath(joinProjectPath(root, path)), ...packageInfo })));
}
function packageImportMapValue(importsValue, moduleSpecifier) {
  if (!isRecord(importsValue)) return undefined;
  if (Object.prototype.hasOwnProperty.call(importsValue, moduleSpecifier)) return { key: moduleSpecifier, value: importsValue[moduleSpecifier] };
  for (const [pattern, value] of Object.entries(importsValue)) {
    const capture = patternCapture(moduleSpecifier, pattern);
    if (capture !== undefined) return { key: pattern, value: replaceExportTargetCapture(value, capture) };
  }
  return undefined;
}

function packageImportContext(sourcePath, moduleResolution = {}) {
  const packages = Object.entries(moduleResolution.packages ?? {})
    .map(([packageName, options]) => ({
      packageName,
      root: normalizeProjectPath(options.root ?? ''),
      packageType: options.packageType ?? options.type,
      imports: options.imports,
      ...packageWorkspaceRootAmbiguityFields(options)
    }))
    .filter((entry) => entry.imports && packageRootContainsSource(sourcePath, entry))
    .sort((left, right) => right.root.length - left.root.length);
  if (packages[0]) return packages[0];
  const root = normalizeProjectPath(moduleResolution.packageRoot ?? moduleResolution.root ?? '');
  const imports = moduleResolution.imports ?? moduleResolution.packageImports;
  return imports && root && !pathInsideRoot(sourcePath, root)
    ? { root, imports, packageImportScopeMismatch: true }
    : { root, imports };
}
function replaceExportTargetCapture(target, capture) {
  if (typeof target === 'string') return target.replace('*', capture);
  if (Array.isArray(target)) return target.map((entry) => replaceExportTargetCapture(entry, capture));
  if (!isRecord(target)) return target;
  return Object.fromEntries(Object.entries(target).map(([key, value]) => [key, replaceExportTargetCapture(value, capture)]));
}

function packageFallbackTargets(options, subpath) {
  const sourceRoot = normalizeProjectPath(options.sourceRoot ?? 'src');
  if (subpath) return [joinProjectPath(sourceRoot, subpath), subpath];
  return [options.types, options.main, joinProjectPath(sourceRoot, 'index')].filter(Boolean);
}
function packageWorkspaceRootAmbiguity(options, packageInfo) { const fields = packageWorkspaceRootAmbiguityFields(options); return fields.packageWorkspaceRootAmbiguous ? { kind: 'package', failClosedKind: 'package-workspace-root-ambiguous-missing', path: packageSpecifierPath(packageInfo), ...fields, ...packageInfo } : undefined; }
function packageWorkspaceRootAmbiguityFields(options = {}) { const roots = uniquePaths([...(Array.isArray(options.packageWorkspaceRoots) ? options.packageWorkspaceRoots.map((path) => ({ path: normalizeProjectPath(path) })) : []), { path: normalizeProjectPath(options.root ?? '') }]).map((entry) => entry.path); return options.packageWorkspaceRootAmbiguous || roots.length > 1 ? { packageWorkspaceRootAmbiguous: true, packageWorkspaceRoots: roots, packageResolutionReasonCode: 'package-workspace-root-ambiguous-missing' } : {}; }
function packageRootContainsSource(sourcePath, entry) { return (entry.packageWorkspaceRootAmbiguous ? entry.packageWorkspaceRoots : [entry.root]).some((root) => pathInsideRoot(sourcePath, root)); }
function packageSpecifierPath(packageInfo) { return packageInfo.packageSubpath === '.' ? packageInfo.packageName : `${packageInfo.packageName}/${packageInfo.packageSubpath.slice(2)}`; }

function moduleTargetDocument(path, documentsByPath) {
  for (const candidate of modulePathCandidates(path)) {
    const document = documentsByPath.get(candidate.path);
    if (document) return { ...document, resolutionPathVariant: candidate.variant };
  }
  return undefined;
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
  return { packageName: candidate.packageName ?? packageInfo?.packageName, packageSubpath: candidate.packageSubpath ?? packageInfo?.packageSubpath, packageExportKey: candidate.packageExportKey, packageExportCondition: candidate.packageExportCondition, packageExportTarget: candidate.packageExportTarget, packageImportKey: candidate.packageImportKey, packageImportCondition: candidate.packageImportCondition, packageImportTarget: candidate.packageImportTarget, packageRuntimeCondition: candidate.packageRuntimeCondition, packageRuntimeConditionEvidenceSource: candidate.packageRuntimeConditionEvidenceSource, packageRuntimeConditionEdgeKind: candidate.packageRuntimeConditionEdgeKind, packageRuntimeConditionCandidates: candidate.packageRuntimeConditionCandidates, packageRuntimeConditionExcludedConditions: candidate.packageRuntimeConditionExcludedConditions, packageRuntimeConditionReasonCode: candidate.packageRuntimeConditionReasonCode, packageEnvironmentCondition: candidate.packageEnvironmentCondition, packageEnvironmentConditionEvidenceSource: candidate.packageEnvironmentConditionEvidenceSource, packageEnvironmentConditionCandidates: candidate.packageEnvironmentConditionCandidates, packageEnvironmentConditionReasonCode: candidate.packageEnvironmentConditionReasonCode, packageType: candidate.packageType, packageWorkspaceRootAmbiguous: candidate.packageWorkspaceRootAmbiguous, packageWorkspaceRoots: candidate.packageWorkspaceRoots, packageResolutionReasonCode: candidate.packageResolutionReasonCode };
}

function environmentAmbiguityFields(ambiguity) { return { packageEnvironmentConditionCandidates: ambiguity.split('|'), packageEnvironmentConditionReasonCode: 'package-environment-condition-ambiguous-missing' }; }

function isRecord(value) { return value && typeof value === 'object' && !Array.isArray(value); }

function normalizeProjectPath(path) {
  const parts = [];
  for (const part of String(path).split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop(); else parts.push(part);
  }
  return parts.join('/');
}

function pathInsideRoot(sourcePath, root) {
  if (!root) return true;
  const normalized = normalizeProjectPath(sourcePath);
  return normalized === root || normalized.startsWith(`${root}/`);
}
