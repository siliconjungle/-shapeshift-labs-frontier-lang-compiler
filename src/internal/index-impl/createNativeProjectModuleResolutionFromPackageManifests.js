function createNativeProjectModuleResolutionFromPackageManifests(input = {}) {
  const options = Array.isArray(input) ? { manifests: input } : input;
  const base = options.baseModuleResolution ?? options.moduleResolution ?? {};
  const packages = { ...(base.packages ?? {}) };
  const packageTypeByRoot = { ...(base.packageTypeByRoot ?? {}) };
  const packageWorkspaceRootAmbiguities = { ...(base.packageWorkspaceRootAmbiguities ?? {}) };
  const diagnostics = [];
  const records = [];
  for (const manifestInput of options.manifests ?? []) {
    const parsed = packageJsonValue(manifestInput);
    if (!parsed) {
      diagnostics.push(diagnostic('invalid-package-json', manifestInput));
      continue;
    }
    const root = normalizeProjectPath(manifestInput.root ?? rootFromPackageJsonPath(manifestInput.sourcePath ?? manifestInput.path));
    const packageName = stringValue(manifestInput.packageName ?? parsed.name);
    if (!packageName) {
      diagnostics.push(diagnostic('missing-package-name', manifestInput, { root }));
      continue;
    }
    const packageType = normalizePackageType(manifestInput.packageType ?? manifestInput.type ?? parsed.type);
    const existingRoots = packageWorkspaceRoots(packages[packageName], packageWorkspaceRootAmbiguities[packageName]);
    const workspaceRoots = uniqueStrings([...existingRoots, root]);
    const rootAmbiguous = existingRoots.length > 1 || existingRoots.length > 0 && root && !existingRoots.includes(root);
    if (rootAmbiguous) {
      packageWorkspaceRootAmbiguities[packageName] = workspaceRoots;
      diagnostics.push(diagnostic('ambiguous-package-workspace-root', manifestInput, { root, packageName, existingRoot: existingRoots[0], packageWorkspaceRoots: workspaceRoots }));
    }
    const packageOptions = compactRecord({
      ...(packages[packageName] ?? {}),
      root,
      main: stringValue(parsed.main),
      types: stringValue(parsed.types ?? parsed.typings),
      type: packageType,
      packageType,
      exports: packageMapValue(parsed.exports),
      imports: packageMapValue(parsed.imports),
      packageWorkspaceRootAmbiguous: rootAmbiguous || undefined,
      packageWorkspaceRoots: rootAmbiguous ? workspaceRoots : undefined,
      packageResolutionReasonCode: rootAmbiguous ? 'package-workspace-root-ambiguous-missing' : undefined
    });
    packages[packageName] = packageOptions;
    if (packageType) packageTypeByRoot[root] = packageType;
    records.push(compactRecord({
      packageName,
      root,
      sourcePath: manifestInput.sourcePath ?? manifestInput.path,
      packageType,
      hasExports: Object.prototype.hasOwnProperty.call(packageOptions, 'exports'),
      hasImports: Object.prototype.hasOwnProperty.call(packageOptions, 'imports')
    }));
  }
  return {
    kind: 'frontier.lang.nativeProjectModuleResolutionFromPackageManifests',
    version: 1,
    ok: diagnostics.length === 0,
    moduleResolution: compactRecord({
      ...base,
      packages,
      packageTypeByRoot,
      packageWorkspaceRootAmbiguities: optionalRecord(packageWorkspaceRootAmbiguities),
      packageExportConditions: options.packageExportConditions ?? base.packageExportConditions,
      conditions: options.conditions ?? base.conditions
    }),
    packages: records,
    packageCount: records.length,
    diagnostics
  };
}

function packageJsonValue(input) {
  const value = input.packageJson ?? input.json ?? input.packageJsonText ?? input.text;
  if (isRecord(value)) return value;
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function packageMapValue(value) {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(packageMapValue).filter((entry) => entry !== undefined);
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entry]) => [key, packageMapValue(entry)])
      .filter(([, entry]) => entry !== undefined)
  );
}

function diagnostic(reasonCode, input, metadata = {}) {
  return compactRecord({
    reasonCode,
    sourcePath: input.sourcePath ?? input.path,
    root: input.root,
    packageName: input.packageName,
    ...metadata
  });
}

function stringValue(value) {
  return typeof value === 'string' && value ? value : undefined;
}

function normalizePackageType(value) {
  return value === 'module' || value === 'commonjs' ? value : undefined;
}

function packageWorkspaceRoots(options, ambiguousRoots) {
  return uniqueStrings([...(Array.isArray(ambiguousRoots) ? ambiguousRoots : []), ...(Array.isArray(options?.packageWorkspaceRoots) ? options.packageWorkspaceRoots : []), options?.root]);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value))];
}

function rootFromPackageJsonPath(path) {
  const normalized = normalizeProjectPath(path ?? '');
  return normalized.endsWith('/package.json') ? normalized.slice(0, -'/package.json'.length) : '';
}

function normalizeProjectPath(path) {
  const parts = [];
  for (const part of String(path ?? '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop(); else parts.push(part);
  }
  return parts.join('/');
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function optionalRecord(record) {
  return Object.keys(record).length ? record : undefined;
}

function isRecord(value) { return value && typeof value === 'object' && !Array.isArray(value); }

export { createNativeProjectModuleResolutionFromPackageManifests };
