import { idFragment, uniqueRecordsById } from '../../native-import-utils.js';

export function cLikeResourceGraphRecordsFromInput(input = {}) {
  const bundles = cLikeBundlesFromInput(input);
  const records = bundles.map(cLikeRecordsFromBundle);
  return {
    resources: uniqueRecordsById(records.flatMap((record) => record.resources)),
    owners: uniqueRecordsById(records.flatMap((record) => record.owners)),
    aliases: uniqueRecordsById(records.flatMap((record) => record.aliases)),
    drops: uniqueRecordsById(records.flatMap((record) => record.drops)),
    lifetimeRegions: uniqueRecordsById(records.flatMap((record) => record.lifetimeRegions)),
    unsafeBoundaries: uniqueRecordsById(records.flatMap((record) => record.unsafeBoundaries))
  };
}

function cLikeBundlesFromInput(input) {
  const entries = [input, ...(input.imports ?? [])].filter((entry) => entry && typeof entry === 'object');
  return uniqueBundles(entries
    .filter(cLikeLanguage)
    .map((entry) => ({
      language: cLikeLanguageName(entry),
      sourceText: cLikeSourceText(entry),
      sourcePath: cLikeSourcePath(entry),
      sourceHash: cLikeSourceHash(entry),
      evidenceIds: cLikeEvidenceIds(entry)
    }))
    .filter((bundle) => typeof bundle.sourceText === 'string' && bundle.sourceText.length > 0));
}

function cLikeRecordsFromBundle(bundle) {
  const output = emptyCLikeRecords();
  const functions = cLikeFunctionRecords(bundle);
  const heapResourcesByName = new Map();
  for (const fn of functions) appendFunction(output, bundle, fn, heapResourcesByName);
  return output;
}

function appendFunction(output, bundle, fn, heapResourcesByName) {
  const fnId = idFragment(`${bundle.sourcePath ?? bundle.language}:${fn.name}:${fn.startLine}`);
  const ownerId = `owner_${bundle.language}_${fnId}`;
  const functionResourceId = `resource_${bundle.language}_${fnId}`;
  const evidenceIds = [`${bundle.language}-source:${bundle.sourceHash ?? fnId}`, ...bundle.evidenceIds];
  output.owners.push({
    id: ownerId,
    name: fn.name,
    ownerKind: `${bundle.language}-function`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    evidenceIds
  });
  output.resources.push({
    id: functionResourceId,
    name: fn.name,
    resourceKind: `${bundle.language}-function-source-region`,
    ownerId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds,
    metadata: { returnTypeText: fn.returnTypeText }
  });
  output.lifetimeRegions.push({
    id: `lifetime_${bundle.language}_${fnId}`,
    name: `${fn.name} function lifetime`,
    lifetimeKind: `${bundle.language}-function-region`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    startLine: fn.startLine,
    endLine: fn.endLine,
    evidenceIds
  });
  for (const [index, param] of fn.parameters.entries()) {
    appendPointerParameter(output, bundle, fn, param, index, { ownerId, fnId, evidenceIds });
  }
  appendHeapAllocations(output, bundle, fn, heapResourcesByName, { ownerId, fnId, evidenceIds });
  appendManualDrops(output, bundle, fn, heapResourcesByName, { ownerId, fnId, evidenceIds });
}

function appendPointerParameter(output, bundle, fn, param, index, context) {
  if (!pointerLike(param)) return;
  const name = cLikeParameterName(param) ?? `param_${index + 1}`;
  const idPart = `${context.fnId}_${idFragment(name)}`;
  const resourceId = `resource_${bundle.language}_pointer_${idPart}`;
  const lifetimeRegionId = `lifetime_${bundle.language}_pointer_${idPart}`;
  output.resources.push({
    id: resourceId,
    name,
    resourceKind: `${bundle.language}-pointer-parameter`,
    ownerId: context.ownerId,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: context.evidenceIds,
    metadata: { parameterText: param, functionName: fn.name }
  });
  output.lifetimeRegions.push({
    id: lifetimeRegionId,
    name: `${name} pointer region`,
    lifetimeKind: `${bundle.language}-pointer-region`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: context.evidenceIds
  });
  output.aliases.push({
    id: `alias_${bundle.language}_pointer_${idPart}`,
    resourceId,
    ownerId: context.ownerId,
    lifetimeRegionId,
    aliasKind: pointerMode(param),
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    evidenceIds: context.evidenceIds,
    metadata: { parameterText: param, functionName: fn.name }
  });
  output.unsafeBoundaries.push({
    id: `unsafe_${bundle.language}_pointer_${idPart}`,
    resourceId,
    proofStatus: 'missing',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: context.evidenceIds,
    metadata: { proofGapCode: `${bundle.language}-pointer-alias-boundary`, parameterText: param, functionName: fn.name }
  });
}

function appendHeapAllocations(output, bundle, fn, heapResourcesByName, context) {
  for (const match of fn.bodyText.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:\([^)]*\)\s*)?(malloc|calloc|realloc|aligned_alloc)\s*\(/g)) {
    const name = match[1];
    const allocator = match[2];
    const idPart = `${context.fnId}_${idFragment(name)}_${idFragment(allocator)}`;
    const resourceId = `resource_${bundle.language}_heap_${idPart}`;
    heapResourcesByName.set(`${fn.name}:${name}`, resourceId);
    output.resources.push({
      id: resourceId,
      name,
      resourceKind: `${bundle.language}-heap-allocation`,
      ownerId: context.ownerId,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: fn.span,
      evidenceIds: context.evidenceIds,
      metadata: { allocator, functionName: fn.name }
    });
    output.unsafeBoundaries.push({
      id: `unsafe_${bundle.language}_heap_${idPart}`,
      resourceId,
      proofStatus: 'missing',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: fn.span,
      evidenceIds: context.evidenceIds,
      metadata: { proofGapCode: `${bundle.language}-manual-memory-boundary`, allocator, functionName: fn.name }
    });
  }
}

function appendManualDrops(output, bundle, fn, heapResourcesByName, context) {
  for (const match of fn.bodyText.matchAll(/\bfree\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    const name = match[1];
    const resourceId = heapResourcesByName.get(`${fn.name}:${name}`) ?? `resource_${bundle.language}_pointer_${context.fnId}_${idFragment(name)}`;
    output.drops.push({
      id: `drop_${bundle.language}_${context.fnId}_${idFragment(name)}`,
      resourceId,
      ownerId: context.ownerId,
      dropKind: `${bundle.language}-free`,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: fn.span,
      evidenceIds: context.evidenceIds,
      metadata: { target: name, functionName: fn.name }
    });
  }
}

function cLikeFunctionRecords(bundle) {
  const lines = String(bundle.sourceText).split(/\n/);
  const records = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^\s*((?:[A-Za-z_][\w\s]*|\*|\s)+?)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^;{}]*)\)\s*(\{|;)?/);
    if (!match || controlKeyword(match[2])) continue;
    const startLine = index + 1;
    const endLine = match[4] === '{' ? cLikeFunctionEndLine(lines, index) : startLine;
    records.push({
      name: match[2],
      returnTypeText: match[1].trim(),
      parameters: splitParameters(match[3]),
      bodyText: lines.slice(index, endLine).join('\n'),
      startLine,
      endLine,
      span: { path: bundle.sourcePath, startLine, startColumn: 1, endLine, endColumn: (lines[endLine - 1] ?? '').length + 1 }
    });
  }
  return records;
}

function cLikeFunctionEndLine(lines, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < lines.length; index += 1) {
    for (const char of lines[index]) {
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
    }
    if (depth <= 0 && index > startIndex) return index + 1;
  }
  return startIndex + 1;
}

function splitParameters(raw) {
  return String(raw ?? '').split(',').map((part) => part.trim()).filter((part) => part && part !== 'void');
}

function pointerLike(param) {
  return /[*&]|\[[^\]]*\]/.test(param);
}

function pointerMode(param) {
  if (/&/.test(param) && /\bconst\b/.test(param)) return 'const-reference';
  if (/&/.test(param)) return 'mutable-reference';
  if (/\bconst\b/.test(param)) return 'const-pointer';
  if (/\[[^\]]*\]/.test(param)) return 'array-decay-pointer';
  return 'raw-pointer';
}

function cLikeParameterName(param) {
  const stripped = param.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  const match = stripped.match(/([A-Za-z_][A-Za-z0-9_]*)\s*$/);
  return match?.[1] && !['const', 'volatile', 'restrict'].includes(match[1]) ? match[1] : undefined;
}

function cLikeSourceText(entry) {
  return entry.sourceText
    ?? entry.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? entry.universalAst?.metadata?.sourcePreservation?.sourceText;
}

function cLikeSourcePath(entry) {
  return entry.sourcePath ?? entry.nativeSource?.sourcePath ?? entry.nativeAst?.sourcePath;
}

function cLikeSourceHash(entry) {
  return entry.sourceHash ?? entry.nativeSource?.sourceHash ?? entry.nativeAst?.sourceHash;
}

function cLikeLanguage(entry) {
  return ['c', 'cpp', 'c++'].includes(cLikeLanguageName(entry));
}

function cLikeLanguageName(entry) {
  const language = String(entry.language ?? entry.nativeSource?.language ?? entry.nativeAst?.language ?? '').toLowerCase();
  return language === 'c++' ? 'cpp' : language;
}

function cLikeEvidenceIds(entry) {
  return (entry.evidence ?? []).map((record) => record?.id).filter(Boolean);
}

function controlKeyword(name) {
  return ['if', 'for', 'while', 'switch', 'return', 'sizeof'].includes(name);
}

function uniqueBundles(bundles) {
  const seen = new Set();
  return bundles.filter((bundle) => {
    const key = `${bundle.language}:${bundle.sourceHash ?? bundle.sourcePath ?? bundle.sourceText.length}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function emptyCLikeRecords() {
  return { resources: [], owners: [], aliases: [], drops: [], lifetimeRegions: [], unsafeBoundaries: [] };
}
