import { normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';

export const UniversalLanguageCoverageSurfaceIds = Object.freeze([
  'parserSourceSpanTrivia',
  'scopeUseDefGraph',
  'moduleExportImportGraph',
  'typePublicApiGraph',
  'controlFlowEffectGraph',
  'semanticEditAdmission',
  'targetLowering',
  'roundtripProjection',
  'runtimeProof',
  'packageBuildGraph',
  'crossLanguageConversion'
]);

export const UniversalLanguageCoverageStatuses = Object.freeze([
  'high',
  'bounded-evidence',
  'partial',
  'adapter-only',
  'planned',
  'missing',
  'blocked',
  'not-applicable'
]);

export const UniversalLanguageCoverageReadinessStatuses = Object.freeze([
  'high',
  'bounded-evidence',
  'partial',
  'planned',
  'blocked'
]);

export const UniversalLanguageCoverageStatusScores = Object.freeze({
  high: 1,
  'bounded-evidence': 0.78,
  partial: 0.48,
  'adapter-only': 0.34,
  planned: 0.18,
  blocked: 0.08,
  missing: 0,
  'not-applicable': undefined
});

export const UniversalLanguageCoverageSurfaceWeights = Object.freeze({
  parserSourceSpanTrivia: 1.2,
  scopeUseDefGraph: 1.1,
  moduleExportImportGraph: 1,
  typePublicApiGraph: 1,
  controlFlowEffectGraph: 1,
  semanticEditAdmission: 1.2,
  targetLowering: 0.9,
  roundtripProjection: 0.9,
  runtimeProof: 1,
  packageBuildGraph: 0.8,
  crossLanguageConversion: 0.8
});

export const KnownSemanticSurfacePackages = Object.freeze({
  html: surfacePackage('@shapeshift-labs/frontier-lang-html', '0.1.29'),
  css: surfacePackage('@shapeshift-labs/frontier-lang-css', '0.1.40'),
  jsx: surfacePackage('@shapeshift-labs/frontier-lang-jsx', '0.1.0'),
  tsx: surfacePackage('@shapeshift-labs/frontier-lang-jsx', '0.1.0'),
  svg: surfacePackage('@shapeshift-labs/frontier-lang-svg', '0.1.0'),
  'css-modules': surfacePackage('@shapeshift-labs/frontier-lang-css', '0.1.40'),
  'package-json': surfacePackage('@shapeshift-labs/frontier-lang-package', '0.1.0'),
  canvas: surfacePackage('@shapeshift-labs/frontier-runtime-proof', '0.1.6')
});

export const DefaultCoverageRows = Object.freeze([
  coverageRow('jsx', {
    language: 'javascript',
    rowKind: 'dialect',
    aliases: ['jsx'],
    extensions: ['.jsx'],
    surfaces: rowSurfaces('bounded-evidence', {
      scopeUseDefGraph: 'high',
      moduleExportImportGraph: 'high',
      semanticEditAdmission: 'high'
    }),
    notes: ['JSX tracks element identity, props, keys, and runtime-proof evidence.']
  }),
  coverageRow('tsx', {
    language: 'typescript',
    rowKind: 'dialect',
    aliases: ['tsx'],
    extensions: ['.tsx'],
    surfaces: rowSurfaces('bounded-evidence', {
      scopeUseDefGraph: 'high',
      moduleExportImportGraph: 'high',
      typePublicApiGraph: 'high',
      semanticEditAdmission: 'high'
    }),
    notes: ['TSX combines TypeScript public API evidence with JSX element evidence.']
  }),
  coverageRow('svg', {
    rowKind: 'language',
    aliases: ['svg'],
    extensions: ['.svg'],
    surfaces: rowSurfaces('partial', {
      parserSourceSpanTrivia: 'bounded-evidence',
      scopeUseDefGraph: 'not-applicable',
      typePublicApiGraph: 'not-applicable',
      controlFlowEffectGraph: 'not-applicable',
      semanticEditAdmission: 'bounded-evidence',
      runtimeProof: 'bounded-evidence'
    }),
    notes: ['SVG coverage is reference graph, element identity, resource, and render-proof oriented.']
  }),
  coverageRow('css-modules', {
    language: 'css',
    rowKind: 'dialect',
    aliases: ['module.css', 'css-module'],
    extensions: ['.module.css'],
    surfaces: rowSurfaces('partial', {
      parserSourceSpanTrivia: 'bounded-evidence',
      scopeUseDefGraph: 'bounded-evidence',
      moduleExportImportGraph: 'bounded-evidence',
      semanticEditAdmission: 'bounded-evidence',
      runtimeProof: 'bounded-evidence',
      controlFlowEffectGraph: 'not-applicable'
    }),
    notes: ['CSS Modules require class-map, ICSS, generated-name, source-map, and use-site evidence.']
  }),
  coverageRow('package-json', {
    language: 'json',
    rowKind: 'artifact',
    aliases: ['package', 'package-lock', 'lockfile'],
    extensions: ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'],
    surfaces: rowSurfaces('not-applicable', {
      parserSourceSpanTrivia: 'bounded-evidence',
      moduleExportImportGraph: 'bounded-evidence',
      semanticEditAdmission: 'bounded-evidence',
      roundtripProjection: 'partial',
      runtimeProof: 'partial',
      packageBuildGraph: 'bounded-evidence'
    }),
    notes: ['Package coverage is dependency graph, script, lock integrity, and build evidence oriented.']
  }),
  coverageRow('canvas', {
    language: 'javascript',
    rowKind: 'runtime-surface',
    aliases: ['2d-canvas', 'webgl', 'webgpu'],
    surfaces: rowSurfaces('partial', {
      targetLowering: 'not-applicable',
      roundtripProjection: 'not-applicable',
      runtimeProof: 'bounded-evidence',
      crossLanguageConversion: 'blocked'
    }),
    notes: ['Canvas coverage is command-trace and bitmap/runtime-proof oriented.']
  })
]);

export const CoverageBaselines = Object.freeze({
  javascript: baseline({
    parserSourceSpanTrivia: 'high',
    scopeUseDefGraph: 'high',
    moduleExportImportGraph: 'high',
    typePublicApiGraph: 'partial',
    controlFlowEffectGraph: 'bounded-evidence',
    semanticEditAdmission: 'high',
    targetLowering: 'high',
    roundtripProjection: 'bounded-evidence',
    runtimeProof: 'bounded-evidence',
    packageBuildGraph: 'partial',
    crossLanguageConversion: 'partial'
  }),
  typescript: baseline({
    parserSourceSpanTrivia: 'high',
    scopeUseDefGraph: 'high',
    moduleExportImportGraph: 'high',
    typePublicApiGraph: 'high',
    controlFlowEffectGraph: 'bounded-evidence',
    semanticEditAdmission: 'high',
    targetLowering: 'high',
    roundtripProjection: 'bounded-evidence',
    runtimeProof: 'bounded-evidence',
    packageBuildGraph: 'partial',
    crossLanguageConversion: 'partial'
  }),
  html: baseline(rowSurfaces('partial', {
    parserSourceSpanTrivia: 'bounded-evidence',
    scopeUseDefGraph: 'not-applicable',
    typePublicApiGraph: 'not-applicable',
    controlFlowEffectGraph: 'not-applicable',
    semanticEditAdmission: 'bounded-evidence',
    runtimeProof: 'bounded-evidence'
  })),
  css: baseline(rowSurfaces('partial', {
    parserSourceSpanTrivia: 'bounded-evidence',
    scopeUseDefGraph: 'bounded-evidence',
    typePublicApiGraph: 'not-applicable',
    controlFlowEffectGraph: 'not-applicable',
    semanticEditAdmission: 'bounded-evidence',
    runtimeProof: 'bounded-evidence'
  })),
  rust: baseline(rowSurfaces('partial', { targetLowering: 'bounded-evidence' })),
  python: baseline(rowSurfaces('partial', { targetLowering: 'bounded-evidence' })),
  c: baseline(rowSurfaces('partial', { targetLowering: 'bounded-evidence' }))
});

export function rowSurfaces(defaultStatus, overrides = {}) {
  const surfaces = {};
  for (const surface of UniversalLanguageCoverageSurfaceIds) {
    surfaces[surface] = overrides[surface] ?? defaultStatus;
  }
  return surfaces;
}

export function coverageRow(id, input = {}) {
  return Object.freeze({
    id: normalizeCoverageId(id),
    language: input.language ?? id,
    rowKind: input.rowKind ?? 'language',
    aliases: uniqueStrings(input.aliases ?? []),
    extensions: uniqueStrings(input.extensions ?? []),
    parserAdapters: uniqueStrings(input.parserAdapters ?? []),
    knownLossKinds: uniqueStrings(input.knownLossKinds ?? input.lossKinds ?? []),
    defaultReadiness: input.defaultReadiness,
    surfaces: input.surfaces,
    notes: uniqueStrings(input.notes ?? [])
  });
}

export function normalizeCoverageId(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return '';
  if (text === 'jsx') return 'jsx';
  if (text === 'tsx') return 'tsx';
  if (text === 'svg') return 'svg';
  if (text === 'css-module' || text === 'cssmodules' || text === 'module.css') return 'css-modules';
  if (text === 'package' || text === 'package.json' || text === 'lockfile') return 'package-json';
  if (text === '2d-canvas' || text === 'webgl' || text === 'webgpu') return 'canvas';
  return normalizeNativeLanguageId(text) || text;
}

function baseline(surfaces) {
  return Object.freeze({ ...surfaces });
}

function surfacePackage(packageName, packageVersion) {
  return Object.freeze({
    packageName,
    packageVersion,
    status: 'dependency-only',
    targetProjectionSupported: false
  });
}
