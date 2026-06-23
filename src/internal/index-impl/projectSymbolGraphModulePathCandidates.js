export function modulePathCandidates(path) {
  const normalized = String(path ?? '');
  return uniqueCandidates([
    candidate(normalized, 'exact'),
    ...extensionSubstitutionCandidates(normalized),
    ...extensionlessCandidates(normalized),
    ...indexCandidates(normalized)
  ]);
}

function extensionSubstitutionCandidates(path) {
  const entries = [
    ['.js', ['.ts', '.tsx', '.d.ts', '.jsx']],
    ['.jsx', ['.tsx', '.ts', '.d.ts']],
    ['.mjs', ['.mts', '.ts', '.d.mts']],
    ['.cjs', ['.cts', '.ts', '.d.cts']]
  ];
  for (const [from, targets] of entries) {
    if (!path.endsWith(from)) continue;
    const base = path.slice(0, -from.length);
    return targets.map((target) => candidate(`${base}${target}`, 'extension-substitution'));
  }
  return [];
}

function extensionlessCandidates(path) {
  if (hasKnownExtension(path)) return [];
  return ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.mts', '.cjs', '.cts', '.d.ts']
    .map((extension) => candidate(`${path}${extension}`, 'extensionless'));
}

function indexCandidates(path) {
  return ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.mts', '.cjs', '.cts', '.d.ts']
    .map((extension) => candidate(`${path}/index${extension}`, 'index'));
}

function hasKnownExtension(path) {
  return /\.(?:[cm]?[jt]sx?|d\.[cm]?ts)$/.test(path);
}

function candidate(path, variant) {
  return { path, variant };
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((entry) => {
    if (!entry.path || seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
}
