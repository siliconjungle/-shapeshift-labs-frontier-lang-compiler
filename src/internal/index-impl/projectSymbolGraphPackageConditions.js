import { runtimeAdmittedConditions, runtimeConditionRecord } from './projectSymbolGraphPackageRuntimeConditions.js';

const EnvironmentPackageConditions = Object.freeze([
  'browser',
  'node',
  'development',
  'production',
  'worker',
  'workerd',
  'deno',
  'bun',
  'react-native'
]);

function exportTargetsForValue(value, conditions, condition) {
  if (!value) return [];
  if (typeof value === 'string') return [{ path: value, condition }];
  if (Array.isArray(value)) return value.flatMap((entry) => exportTargetsForValue(entry, conditions, condition));
  if (!isRecord(value)) return [];
  return conditions.flatMap((key) => exportTargetsForValue(value[key], conditions, key));
}

function exportMapMatch(exportsValue, subpath) {
  if (!isRecord(exportsValue) || !Object.keys(exportsValue).some((key) => key.startsWith('.'))) return subpath === '.' ? { key: '.', value: exportsValue } : undefined;
  if (Object.prototype.hasOwnProperty.call(exportsValue, subpath)) return { key: subpath, value: exportsValue[subpath] };
  for (const [pattern, target] of Object.entries(exportsValue)) {
    const capture = patternCapture(subpath, pattern);
    if (capture !== undefined) return { key: pattern, value: replaceTargetCapture(target, capture) };
  }
  return undefined;
}

function packageConditions(moduleResolution = {}, sourcePath, packageContext, edgeMetadata) {
  return prioritizeConditions(
    runtimeAdmittedConditions(
      moduleResolution.packageExportConditions ?? moduleResolution.conditions ?? ['types', 'import', 'module', 'require', 'default'],
      packageRuntimeConditionEvidence(moduleResolution, sourcePath, packageContext, edgeMetadata).packageRuntimeCondition
    ),
    packageConditionPreferences(sourcePath, moduleResolution, packageContext, edgeMetadata)
  );
}

function packageRuntimeConditionAmbiguity(value, moduleResolution, sourcePath, packageContext, edgeMetadata) {
  if (packageRuntimeConditionEvidence(moduleResolution, sourcePath, packageContext, edgeMetadata).packageRuntimeCondition) return undefined;
  const conditions = new Set(packageConditions(moduleResolution, sourcePath, packageContext, edgeMetadata));
  if (!conditions.has('import') || !conditions.has('require')) return undefined;
  const runtimeTargets = packageRuntimeTargetsForValue(value, conditions);
  if (!runtimeTargets.import.size || !runtimeTargets.require.size) return undefined;
  return sameSet(runtimeTargets.import, runtimeTargets.require) ? undefined : 'import|require';
}

function packageEnvironmentConditionAmbiguity(value, moduleResolution, sourcePath, packageContext, edgeMetadata) {
  if (packageEnvironmentConditionEvidence(moduleResolution, edgeMetadata).packageEnvironmentCondition) return undefined;
  const conditions = new Set(packageConditions(moduleResolution, sourcePath, packageContext, edgeMetadata));
  const environmentTargets = packageEnvironmentTargetsForValue(value, conditions);
  const present = Object.entries(environmentTargets).filter(([, targets]) => targets.size);
  if (present.length < 2) return undefined;
  const first = present[0][1];
  return present.every(([, targets]) => sameSet(first, targets))
    ? undefined
    : present.map(([condition]) => condition).join('|');
}

function packageRuntimeConditionEvidence(moduleResolution = {}, sourcePath, packageContext, edgeMetadata) {
  const edgeCondition = packageRuntimeConditionFromEdge(edgeMetadata);
  const extensionCondition = packageRuntimeConditionFromExtension(sourcePath);
  const packageType = packageTypeForSource(moduleResolution, sourcePath, packageContext);
  const packageTypeCondition = packageType === 'module' ? 'import' : packageType === 'commonjs' ? 'require' : undefined;
  if (edgeCondition) {
    const conflict = edgeCondition.conflictsWithSource && (
      extensionCondition && extensionCondition !== edgeCondition.packageRuntimeCondition ||
      packageTypeCondition && packageTypeCondition !== edgeCondition.packageRuntimeCondition
    );
    if (conflict) return compactRecord({
      packageRuntimeConditionEvidenceSource: 'conflict',
      packageRuntimeConditionEdgeKind: edgeCondition.packageRuntimeConditionEdgeKind,
      packageRuntimeConditionCandidates: uniqueStrings([edgeCondition.packageRuntimeCondition, extensionCondition, packageTypeCondition]),
      packageRuntimeConditionReasonCode: 'package-runtime-condition-conflict-missing',
      packageRuntimeConditionConflict: true,
      packageType
    });
    if (edgeCondition.preferred || !extensionCondition && !packageTypeCondition) return compactRecord({ ...edgeCondition, packageType });
  }
  const hostAmbiguity = edgeCondition ? undefined : packageRuntimeHostConditionAmbiguity(edgeMetadata, packageType);
  if (hostAmbiguity) return hostAmbiguity;
  if (extensionCondition) return runtimeConditionRecord({ packageRuntimeCondition: extensionCondition, packageRuntimeConditionEvidenceSource: 'source-extension', packageType });
  if (packageTypeCondition) return runtimeConditionRecord({ packageRuntimeCondition: packageTypeCondition, packageRuntimeConditionEvidenceSource: 'package-type', packageType });
  return {};
}

function packageEnvironmentConditionEvidence(moduleResolution = {}, edgeMetadata = {}) {
  const condition = stringValue(
    edgeMetadata.packageEnvironmentCondition ??
    moduleResolution.packageEnvironmentCondition ??
    moduleResolution.environmentCondition
  );
  return condition ? {
    packageEnvironmentCondition: condition,
    packageEnvironmentConditionEvidenceSource: edgeMetadata.packageEnvironmentCondition ? 'edge-metadata' : 'module-resolution'
  } : {};
}

function packageRuntimeTargetsForValue(value, conditions) {
  const result = { import: new Set(), require: new Set() };
  collectPackageRuntimeTargets(value, conditions, result);
  return result;
}

function packageEnvironmentTargetsForValue(value, conditions) {
  const result = Object.fromEntries(EnvironmentPackageConditions.map((condition) => [condition, new Set()]));
  collectPackageEnvironmentTargets(value, conditions, result);
  return result;
}

function collectPackageRuntimeTargets(value, conditions, result) {
  if (Array.isArray(value)) {
    for (const entry of value) collectPackageRuntimeTargets(entry, conditions, result);
    return;
  }
  if (!isRecord(value)) return;
  for (const [condition, target] of Object.entries(value)) {
    if (!conditions.has(condition)) continue;
    if (condition === 'import' || condition === 'require') {
      for (const entry of exportTargetsForValue(target, [...conditions], condition)) result[condition].add(entry.path);
    } else {
      collectPackageRuntimeTargets(target, conditions, result);
    }
  }
}

function collectPackageEnvironmentTargets(value, conditions, result) {
  if (Array.isArray(value)) {
    for (const entry of value) collectPackageEnvironmentTargets(entry, conditions, result);
    return;
  }
  if (!isRecord(value)) return;
  for (const [condition, target] of Object.entries(value)) {
    if (!conditions.has(condition)) continue;
    if (result[condition]) {
      for (const entry of exportTargetsForValue(target, [...conditions], condition)) result[condition].add(entry.path);
    } else {
      collectPackageEnvironmentTargets(target, conditions, result);
    }
  }
}

function packageConditionPreferences(sourcePath, moduleResolution, packageContext, edgeMetadata) {
  const environmentCondition = packageEnvironmentConditionEvidence(moduleResolution, edgeMetadata).packageEnvironmentCondition;
  const runtimeCondition = packageRuntimeConditionEvidence(
    moduleResolution,
    sourcePath,
    packageContext,
    edgeMetadata
  ).packageRuntimeCondition;
  const runtimePreferences = runtimeCondition === 'require'
    ? ['require', 'node', 'default']
    : runtimeCondition === 'import'
      ? ['import', 'module', 'default']
      : [];
  return uniqueStrings([environmentCondition, ...runtimePreferences]);
}

function packageRuntimeConditionFromEdge(edgeMetadata = {}) {
  const hostKind = edgeMetadata.hostDependencyKind;
  if (edgeMetadata.importKind === 'import-meta-resolve' || !edgeMetadata.importKind && hostKind === 'import-meta-resolve') return edgeCondition('import', 'host-import-resolve', 'package-runtime-condition-edge-host-resolve-evidence', true, false);
  if (edgeMetadata.importKind === 'require-resolve' || !edgeMetadata.importKind && hostKind === 'require-resolve') return edgeCondition('require', 'host-require-resolve', 'package-runtime-condition-edge-host-resolve-evidence', true, true);
  if (edgeMetadata.importKind === 'commonjs-require' || !edgeMetadata.importKind && edgeMetadata.commonJs) return edgeCondition('require', 'commonjs-require', 'package-runtime-condition-edge-require-evidence', true, true);
  if (edgeMetadata.commonJs && commonJsHelperImportKind(edgeMetadata.importKind)) return edgeCondition('require', commonJsHelperEdgeKind(edgeMetadata), 'package-runtime-condition-edge-require-evidence', true, true);
  if (edgeMetadata.importKind === 'dynamic-import' || !edgeMetadata.importKind && edgeMetadata.dynamicImport) return edgeCondition('import', 'dynamic-import', 'package-runtime-condition-edge-dynamic-import-evidence', true, false);
  if (staticImportKind(edgeMetadata.importKind)) return edgeCondition('import', `static-${edgeMetadata.importKind}`, 'package-runtime-condition-edge-import-evidence', false, false);
  return undefined;
}

function packageRuntimeHostConditionAmbiguity(edgeMetadata = {}, packageType) {
  const hostKind = edgeMetadata.hostDependencyKind;
  if (!hostKind) return undefined;
  return compactRecord({
    packageRuntimeConditionEvidenceSource: 'host-runtime-ambiguous',
    packageRuntimeConditionEdgeKind: `host-${hostKind}`,
    packageRuntimeConditionReasonCode: 'package-runtime-condition-host-ambiguous-missing',
    packageType
  });
}

function edgeCondition(packageRuntimeCondition, packageRuntimeConditionEdgeKind, packageRuntimeConditionReasonCode, preferred, conflictsWithSource) {
  return runtimeConditionRecord({
    packageRuntimeCondition,
    packageRuntimeConditionEvidenceSource: 'edge-kind',
    packageRuntimeConditionEdgeKind,
    packageRuntimeConditionReasonCode,
    preferred,
    conflictsWithSource
  });
}

function staticImportKind(importKind) {
  return importKind === 'module' ||
    importKind === 'side-effect' ||
    importKind === 'reexport' ||
    importKind === 'namespace-reexport' ||
    importKind === 'default' ||
    importKind === 'namespace' ||
    importKind === 'named' ||
    importKind === 'type-named' ||
    importKind === 'type-default' ||
    importKind === 'type-reexport';
}

function commonJsHelperImportKind(importKind) {
  return importKind === 'default' ||
    importKind === 'namespace' ||
    importKind === 'reexport' ||
    importKind === 'namespace-reexport';
}

function commonJsHelperEdgeKind(edgeMetadata) {
  const helper = typeof edgeMetadata.interopHelper === 'string'
    ? edgeMetadata.interopHelper.replace(/^__/, '')
    : edgeMetadata.importKind;
  return `commonjs-helper-${helper}`;
}

function packageRuntimeConditionFromExtension(sourcePath) {
  const path = String(sourcePath ?? '');
  if (/\.(?:cjs|cts)$/.test(path)) return 'require';
  if (/\.(?:mjs|mts)$/.test(path)) return 'import';
  return undefined;
}

function packageTypeForSource(moduleResolution = {}, sourcePath, packageContext) {
  return normalizePackageType(
    packageContext?.packageType ?? packageContext?.type ??
    packageTypeByRoot(moduleResolution.packageTypeByRoot, sourcePath) ??
    packageTypeByRoot(moduleResolution.packageTypes, sourcePath) ??
    moduleResolution.packageType ?? moduleResolution.type
  );
}

function packageTypeByRoot(typeMap, sourcePath) {
  if (!isRecord(typeMap)) return undefined;
  const normalizedSource = normalizeProjectPath(sourcePath);
  return Object.entries(typeMap)
    .map(([root, value]) => ({ root: normalizeProjectPath(root), value }))
    .filter((entry) => pathInsideRoot(normalizedSource, entry.root))
    .sort((left, right) => right.root.length - left.root.length)[0]?.value;
}

function normalizePackageType(value) {
  const type = typeof value === 'string' ? value : value?.type ?? value?.packageType;
  return type === 'module' || type === 'commonjs' ? type : undefined;
}

function sameSet(left, right) {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value))];
}

function stringValue(value) {
  return typeof value === 'string' && value.length ? value : undefined;
}

function prioritizeConditions(conditions, preferred) {
  const entries = Array.isArray(conditions) ? conditions : [conditions];
  const normalized = entries.map((entry) => String(entry)).filter(Boolean);
  if (!preferred.length) return normalized;
  const preferredSet = new Set(preferred);
  return [
    ...preferred.filter((condition) => normalized.includes(condition)),
    ...normalized.filter((condition) => !preferredSet.has(condition))
  ];
}

function isRecord(value) { return value && typeof value === 'object' && !Array.isArray(value); }

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

function replaceTargetCapture(target, capture) {
  if (typeof target === 'string') return target.replace('*', capture);
  if (Array.isArray(target)) return target.map((entry) => replaceTargetCapture(entry, capture));
  if (!isRecord(target)) return target;
  return Object.fromEntries(Object.entries(target).map(([key, value]) => [key, replaceTargetCapture(value, capture)]));
}

function normalizeProjectPath(path) {
  const parts = [];
  for (const part of String(path ?? '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop(); else parts.push(part);
  }
  return parts.join('/');
}

function patternCapture(value, pattern) {
  if (pattern === value) return '';
  if (!String(pattern).includes('*')) return undefined;
  const [prefix, suffix = ''] = String(pattern).split('*');
  if (!String(value).startsWith(prefix) || !String(value).endsWith(suffix)) return undefined;
  return String(value).slice(prefix.length, String(value).length - suffix.length);
}

function pathInsideRoot(sourcePath, root) {
  if (!root) return true;
  return sourcePath === root || sourcePath.startsWith(`${root}/`);
}

export { exportMapMatch, exportTargetsForValue, packageConditions, packageEnvironmentConditionAmbiguity, packageEnvironmentConditionEvidence, packageRuntimeConditionAmbiguity, packageRuntimeConditionEvidence };
