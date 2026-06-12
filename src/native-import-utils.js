export function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => value !== undefined && value !== null).map((value) => String(value)).filter(Boolean))];
}

export function uniqueRecordsById(records) {
  const seen = new Set();
  const result = [];
  for (const record of records ?? []) {
    if (!record?.id || seen.has(record.id)) continue;
    seen.add(record.id);
    result.push(record);
  }
  return result;
}

export function uniqueByLossId(values) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const id = value?.id ?? `loss_${result.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(value.id ? value : { ...value, id });
  }
  return result;
}

export function uniqueByEvidenceId(values) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const id = value?.id ?? `evidence_${result.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(value.id ? value : { ...value, id });
  }
  return result;
}

export function normalizeStringList(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [String(value)].filter(Boolean);
}

export function normalizeNativeLanguageId(value) {
  if (!value) return '';
  const text = String(value).trim().toLowerCase();
  if (text === 'js' || text === 'mjs' || text === 'cjs' || text === 'jsx') return 'javascript';
  if (text === 'ts' || text === 'tsx') return 'typescript';
  if (text === 'py' || text === 'pyi') return 'python';
  if (text === 'rs') return 'rust';
  if (text === 'h') return 'c';
  if (text === 'c++' || text === 'cc' || text === 'cxx' || text === 'hpp' || text === 'hh') return 'cpp';
  if (text === 'c#' || text === 'cs') return 'csharp';
  if (text === 'rb' || text === 'rake') return 'ruby';
  if (text === 'kt' || text === 'kts') return 'kotlin';
  if (text === 'sc') return 'scala';
  if (text === 'sh' || text === 'bash' || text === 'zsh') return 'shell';
  if (text === 'postgresql' || text === 'postgres' || text === 'mysql' || text === 'sqlite') return 'sql';
  if (text === 'ex' || text === 'exs') return 'elixir';
  if (text === 'erl' || text === 'hrl') return 'erlang';
  if (text === 'hs' || text === 'lhs') return 'haskell';
  return text;
}

export function upperFirst(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function reserveUniqueId(baseId, usedIds) {
  const safeBase = String(baseId || 'id');
  if (!usedIds.has(safeBase)) {
    usedIds.add(safeBase);
    return safeBase;
  }
  let index = 2;
  while (usedIds.has(`${safeBase}_${index}`)) index += 1;
  const id = `${safeBase}_${index}`;
  usedIds.add(id);
  return id;
}

export function commonGeneratedTargetPath(mappings) {
  const paths = uniqueStrings((mappings ?? [])
    .map((mapping) => mapping.generatedSpan?.targetPath ?? mapping.target?.emitPath)
    .filter(Boolean));
  return paths.length === 1 ? paths[0] : undefined;
}

export function normalizeSourcePreservationLevel(value, context = {}) {
  const explicit = value === undefined || value === null ? '' : String(value).trim();
  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (normalized === 'exact' || normalized === 'declaration' || normalized === 'estimated' || normalized === 'blocked') return normalized;
    if (normalized === 'estimate' || normalized === 'approx' || normalized === 'approximate' || normalized === 'approximated' || normalized === 'line') return 'estimated';
    return explicit;
  }

  const lossIds = new Set(context.lossIds ?? []);
  const linkedLosses = (context.losses ?? []).filter((loss) => lossIds.has(loss.id));
  if (linkedLosses.some((loss) => loss.severity === 'error')) return 'blocked';
  if (context.precision === 'exact') return 'exact';
  if (context.precision === 'declaration') return 'declaration';
  if (context.precision === 'line' || context.precision === 'estimated' || context.precision === 'unknown') return 'estimated';
  if (context.sourcePreservation?.summary?.exactSourceAvailable === true) return 'estimated';
  return 'estimated';
}

export function countBy(values) {
  const counts = {};
  for (const value of values ?? []) {
    const key = String(value ?? 'unknown');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const semanticMergeReadinessRank = Object.freeze({
  ready: 0,
  'ready-with-losses': 1,
  'needs-review': 2,
  blocked: 3
});

export function maxSemanticMergeReadiness(left, right) {
  const leftRank = semanticMergeReadinessRank[left] ?? semanticMergeReadinessRank['needs-review'];
  const rightRank = semanticMergeReadinessRank[right] ?? semanticMergeReadinessRank['needs-review'];
  return leftRank >= rightRank ? left : right;
}

export function normalizeSemanticMergeReadiness(value) {
  const readiness = String(value ?? '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(semanticMergeReadinessRank, readiness) ? readiness : undefined;
}

export function idFragment(value) {
  return String(value ?? 'native')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'native';
}

export function caseSensitiveIdFragment(value) {
  const text = String(value ?? 'native');
  return `${idFragment(text)}_${caseSensitiveHash(text)}`;
}

function caseSensitiveHash(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
