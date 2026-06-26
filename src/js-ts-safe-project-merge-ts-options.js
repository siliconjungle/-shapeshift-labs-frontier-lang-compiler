const trackedCompilerOptionKeys = [
  'allowImportingTsExtensions',
  'allowJs',
  'baseUrl',
  'checkJs',
  'composite',
  'declaration',
  'declarationMap',
  'emitDeclarationOnly',
  'jsx',
  'module',
  'moduleResolution',
  'noEmit',
  'noLib',
  'outDir',
  'paths',
  'rootDir',
  'skipLibCheck',
  'strict',
  'strictNullChecks',
  'target',
  'verbatimModuleSyntax'
];

export function createCompilerOptionState(ts, input, options, projectRoot, normalizeDiagnostic) {
  const defaultCompilerOptions = createDefaultCompilerOptions(ts);
  const sources = compilerOptionSources(input, options);
  const compilerOptions = { ...defaultCompilerOptions };
  const diagnostics = [];
  for (const source of sources) {
    const normalized = normalizeCompilerOptionSource(ts, source.options, projectRoot, normalizeDiagnostic);
    Object.assign(compilerOptions, normalized.options);
    diagnostics.push(...normalized.diagnostics);
  }
  const projectReferences = normalizeProjectReferences(input, options);
  const metadata = compilerInputMetadata(input, options, compilerOptions, sources, projectReferences);
  return { compilerOptions, diagnostics, metadata, projectReferences };
}

export function describeJsTsProjectCompilerInputs(input = {}, options = {}, resolvedCompilerOptions, resolvedSources, resolvedProjectReferences) {
  const sources = resolvedSources ?? compilerOptionSources(input, options);
  const projectReferences = resolvedProjectReferences ?? normalizeProjectReferences(input, options);
  const rawCompilerOptions = resolvedCompilerOptions ?? sources.reduce((merged, source) => Object.assign(merged, source.options), {});
  return compactRecord({
    compilerOptions: trackedCompilerOptions(rawCompilerOptions),
    compilerOptionSources: sources.map((source) => compactRecord({
      source: source.source,
      compilerOptions: trackedCompilerOptions(source.options)
    })),
    projectReferences: projectReferences.map(projectReferenceMetadata),
    projectReferenceCount: projectReferences.length || undefined,
    tsconfigCompilerOptions: trackedCompilerOptions(tsconfigCompilerOptions(input.tsconfig)),
    tsconfigReferences: normalizeProjectReferences({ projectReferences: input.tsconfig?.references }, {}).map(projectReferenceMetadata),
    hasTypescriptCompilerApi: false,
    hasOptionsOverride: isPlainObject(options.compilerOptions) || undefined
  });
}

export function normalizeProjectReferences(input = {}, options = {}) {
  const raw = input.projectReferences
    ?? input.typescriptProjectReferences
    ?? input.references
    ?? input.tsconfigProjectReferences
    ?? input.tsconfig?.references
    ?? options.projectReferences;
  const values = Array.isArray(raw) ? raw : [raw].filter(Boolean);
  return values.map(normalizeProjectReference).filter((reference) => reference.path);
}

function createDefaultCompilerOptions(ts) {
  return {
    noEmit: true,
    noLib: true,
    allowJs: true,
    checkJs: false,
    skipLibCheck: true,
    strict: false,
    target: ts.ScriptTarget?.ESNext ?? ts.ScriptTarget?.Latest ?? 99,
    module: ts.ModuleKind?.ESNext ?? 99,
    moduleResolution: ts.ModuleResolutionKind?.Node10 ?? ts.ModuleResolutionKind?.NodeJs ?? 2,
    jsx: ts.JsxEmit?.ReactJSX ?? ts.JsxEmit?.Preserve ?? 4
  };
}

function compilerOptionSources(input, options = {}) {
  return [
    ['tsconfig.compilerOptions', tsconfigCompilerOptions(input.tsconfig)],
    ['compilerOptions', input.compilerOptions],
    ['typescriptCompilerOptions', input.typescriptCompilerOptions],
    ['diagnostic.compilerOptions', options.compilerOptions]
  ]
    .filter(([, value]) => isPlainObject(value))
    .map(([source, value]) => ({ source, options: { ...value } }));
}

function tsconfigCompilerOptions(tsconfig) {
  if (!isPlainObject(tsconfig)) return undefined;
  if (isPlainObject(tsconfig.compilerOptions)) return tsconfig.compilerOptions;
  const entries = Object.entries(tsconfig).filter(([key]) => trackedCompilerOptionKeys.includes(key));
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function normalizeCompilerOptionSource(ts, value, projectRoot, normalizeDiagnostic) {
  if (!isPlainObject(value)) return { options: {}, diagnostics: [] };
  if (!ts.convertCompilerOptionsFromJson || !containsStringValue(value)) return { options: { ...value }, diagnostics: [] };
  const { jsonOptions, passthroughOptions } = splitJsonCompilerOptions(value);
  if (!Object.keys(jsonOptions).length) return { options: { ...value }, diagnostics: [] };
  const converted = ts.convertCompilerOptionsFromJson(jsonOptions, projectRoot || '.');
  return {
    options: { ...passthroughOptions, ...(converted.options ?? {}) },
    diagnostics: (converted.errors ?? []).map((diagnostic) => normalizeDiagnostic(ts, diagnostic, 'typescript-compiler-options'))
  };
}

function splitJsonCompilerOptions(value) {
  const jsonOptions = {};
  const passthroughOptions = {};
  for (const [key, optionValue] of Object.entries(value)) {
    if (containsStringValue(optionValue)) jsonOptions[key] = optionValue;
    else passthroughOptions[key] = optionValue;
  }
  return { jsonOptions, passthroughOptions };
}

function containsStringValue(value) {
  if (typeof value === 'string') return true;
  if (Array.isArray(value)) return value.some(containsStringValue);
  if (isPlainObject(value)) return Object.values(value).some(containsStringValue);
  return false;
}

function compilerInputMetadata(input, options, compilerOptions, sources, projectReferences) {
  return compactRecord({
    ...describeJsTsProjectCompilerInputs(input, options, compilerOptions, sources, projectReferences),
    hasTypescriptCompilerApi: true,
    hasOptionsOverride: isPlainObject(options.compilerOptions) || undefined
  });
}

function trackedCompilerOptions(value) {
  if (!isPlainObject(value)) return undefined;
  const entries = trackedCompilerOptionKeys
    .filter((key) => value[key] !== undefined)
    .map((key) => [key, metadataValue(value[key])])
    .filter(([, entry]) => entry !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function metadataValue(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return depth > 3 ? undefined : value.map((entry) => metadataValue(entry, depth + 1)).filter((entry) => entry !== undefined);
  if (isPlainObject(value)) {
    if (depth > 3) return undefined;
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, metadataValue(entry, depth + 1)])
      .filter(([, entry]) => entry !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return String(value);
}

function normalizeProjectReference(value) {
  if (typeof value === 'string') return { path: normalizePath(value) };
  if (!isPlainObject(value)) return {};
  return compactRecord({
    path: normalizePath(value.path ?? value.originalPath ?? value.sourcePath ?? ''),
    originalPath: value.originalPath === undefined ? undefined : normalizePath(value.originalPath),
    prepend: value.prepend === true ? true : undefined,
    circular: value.circular === true ? true : undefined
  });
}

function projectReferenceMetadata(reference) {
  return compactRecord({
    path: reference.path,
    originalPath: reference.originalPath,
    prepend: reference.prepend === true ? true : undefined,
    circular: reference.circular === true ? true : undefined
  });
}

function normalizePath(value) {
  const raw = String(value ?? '').replace(/\\/g, '/').replace(/\/+/g, '/');
  const absolute = raw.startsWith('/');
  const parts = [];
  for (const part of raw.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length && parts[parts.length - 1] !== '..') parts.pop();
      else if (!absolute) parts.push(part);
      continue;
    }
    parts.push(part);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}`;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined));
}
