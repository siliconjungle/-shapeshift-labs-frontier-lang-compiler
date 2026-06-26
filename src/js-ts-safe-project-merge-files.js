export function normalizeProjectFiles(input) {
  if (Array.isArray(input.files)) return input.files.map(normalizeFileRecord).sort(bySourcePath);
  const base = normalizeFileMap(input.baseFiles);
  const worker = normalizeFileMap(input.workerFiles);
  const head = normalizeFileMap(input.headFiles);
  const paths = [...new Set([...base.keys(), ...worker.keys(), ...head.keys()])].sort();
  const field = (entry, name) => entry?.[name];
  return paths.map((sourcePath) => normalizeFileRecord({
    sourcePath,
    baseSourceText: field(base.get(sourcePath), 'sourceText'),
    workerSourceText: field(worker.get(sourcePath), 'sourceText'),
    headSourceText: field(head.get(sourcePath), 'sourceText'),
    baseParserTriviaEvidence: field(base.get(sourcePath), 'parserTriviaEvidence'),
    workerParserTriviaEvidence: field(worker.get(sourcePath), 'parserTriviaEvidence'),
    headParserTriviaEvidence: field(head.get(sourcePath), 'parserTriviaEvidence')
  }));
}

function normalizeFileRecord(record = {}) {
  return {
    sourcePath: record.sourcePath ?? record.path,
    language: record.language,
    baseSourceText: stringOrUndefined(record.baseSourceText ?? record.baseText),
    workerSourceText: stringOrUndefined(record.workerSourceText ?? record.workerText),
    headSourceText: stringOrUndefined(record.headSourceText ?? record.headText),
    workerDeleted: record.workerDeleted === true,
    headDeleted: record.headDeleted === true,
    policy: record.policy,
    mergePolicy: record.mergePolicy,
    parserTriviaEvidence: record.parserTriviaEvidence,
    baseParserTriviaEvidence: record.baseParserTriviaEvidence,
    workerParserTriviaEvidence: record.workerParserTriviaEvidence,
    headParserTriviaEvidence: record.headParserTriviaEvidence,
    outputParserTriviaEvidence: record.outputParserTriviaEvidence
  };
}

function normalizeFileMap(value) {
  const map = new Map();
  if (!value) return map;
  if (value instanceof Map) {
    for (const [sourcePath, entry] of value) map.set(String(sourcePath), normalizeMapFileEntry(entry));
    return map;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry?.sourcePath && !entry?.path) continue;
      map.set(String(entry.sourcePath ?? entry.path), normalizeMapFileEntry(entry));
    }
    return map;
  }
  for (const [sourcePath, entry] of Object.entries(value)) map.set(sourcePath, normalizeMapFileEntry(entry));
  return map;
}

function normalizeMapFileEntry(entry) {
  if (entry && typeof entry === 'object') return {
    sourceText: String(entry.sourceText ?? entry.text ?? ''),
    parserTriviaEvidence: entry.parserTriviaEvidence
  };
  return { sourceText: String(entry ?? '') };
}

function stringOrUndefined(value) {
  return typeof value === 'string' ? value : undefined;
}

function bySourcePath(left, right) {
  return String(left.sourcePath ?? '').localeCompare(String(right.sourcePath ?? ''));
}
