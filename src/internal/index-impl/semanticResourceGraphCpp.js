import { idFragment, uniqueRecordsById } from '../../native-import-utils.js';
import { appendCppMoveSemantics } from './semanticResourceGraphCppMoves.js';

export function cppResourceGraphRecordsFromInput(input = {}) {
  const records = cppBundlesFromInput(input).map(cppRecordsFromBundle);
  return {
    resources: uniqueRecordsById(records.flatMap((record) => record.resources)),
    owners: uniqueRecordsById(records.flatMap((record) => record.owners)),
    loans: uniqueRecordsById(records.flatMap((record) => record.loans)),
    aliases: uniqueRecordsById(records.flatMap((record) => record.aliases)),
    moves: uniqueRecordsById(records.flatMap((record) => record.moves)),
    drops: uniqueRecordsById(records.flatMap((record) => record.drops)),
    lifetimeRegions: uniqueRecordsById(records.flatMap((record) => record.lifetimeRegions)),
    unsafeBoundaries: uniqueRecordsById(records.flatMap((record) => record.unsafeBoundaries))
  };
}

function cppBundlesFromInput(input) {
  const entries = [input, ...(input.imports ?? [])].filter((entry) => entry && typeof entry === 'object');
  return uniqueBundles(entries
    .filter(cppLanguage)
    .map((entry) => ({
      sourceText: cppSourceText(entry),
      sourcePath: cppSourcePath(entry),
      sourceHash: cppSourceHash(entry),
      evidenceIds: cppEvidenceIds(entry)
    }))
    .filter((bundle) => typeof bundle.sourceText === 'string' && bundle.sourceText.length > 0));
}

function cppRecordsFromBundle(bundle) {
  const output = emptyCppRecords();
  const heapResourcesByName = new Map();
  for (const fn of cppFunctionRecords(bundle)) {
    const bindings = new Map();
    output.owners.push(cppFunctionOwner(bundle, fn));
    appendCppSmartPointers(output, bundle, fn, bindings);
    appendCppRaiiLocals(output, bundle, fn);
    appendCppMoveSemantics(output, bundle, fn, bindings);
    appendCppNewAllocations(output, bundle, fn, heapResourcesByName);
    appendCppDeletes(output, bundle, fn, heapResourcesByName);
  }
  return output;
}

function appendCppSmartPointers(output, bundle, fn, bindings) {
  for (const record of smartPointerRecords(fn)) {
    const base = cppRecordBase(bundle, fn, record.name, `smart_${record.kind}`);
    const kind = record.kind === 'unique_ptr' ? 'unique-owner' : record.kind === 'shared_ptr' ? 'shared-owner' : 'weak-observer';
    output.resources.push(resource(base, record.name, `cpp-${kind}-resource`, { pointerKind: record.kind, pointeeType: record.pointeeType, functionName: fn.name }));
    output.lifetimeRegions.push(lifetime(base, `${record.name} smart pointer lifetime`, 'cpp-smart-pointer-region'));
    output.drops.push(drop(base, `cpp-${record.kind}-destructor`, { automatic: true, pointerKind: record.kind, functionName: fn.name, dropSemantics: 'cpp-smart-pointer-destructor' }));
    bindings.set(record.name, { name: record.name, pointerKind: record.kind, pointeeType: record.pointeeType, resourceId: base.resourceId, ownerId: base.ownerId, lifetimeRegionId: base.lifetimeRegionId });
    if (record.kind === 'unique_ptr') {
      output.loans.push({
        id: `loan_cpp_unique_${base.idPart}`,
        resourceId: base.resourceId,
        ownerId: base.ownerId,
        lifetimeRegionId: base.lifetimeRegionId,
        mode: 'exclusive',
        sourcePath: bundle.sourcePath,
        sourceHash: bundle.sourceHash,
        sourceSpan: fn.span,
        evidenceIds: base.evidenceIds,
        metadata: { pointerKind: record.kind, functionName: fn.name }
      });
    } else {
      output.aliases.push(alias(base, record.kind === 'shared_ptr' ? 'shared-owner' : 'weak-observer', { pointerKind: record.kind, functionName: fn.name }));
    }
  }
}

function appendCppRaiiLocals(output, bundle, fn) {
  for (const record of raiiLocalRecords(fn)) {
    const base = cppRecordBase(bundle, fn, record.name, `raii_${record.typeName}`);
    output.resources.push(resource(base, record.name, 'cpp-raii-local-resource', { typeName: record.typeName, functionName: fn.name }));
    output.lifetimeRegions.push(lifetime(base, `${record.name} RAII lifetime`, 'cpp-raii-local-region'));
    output.drops.push(drop(base, 'cpp-automatic-destructor', { automatic: true, typeName: record.typeName, functionName: fn.name, dropSemantics: 'cpp-raii-destructor' }));
  }
}

function appendCppNewAllocations(output, bundle, fn, heapResourcesByName) {
  for (const match of fn.bodyText.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*new\s*(\[\])?\s+([A-Za-z_][A-Za-z0-9_:<>]*)/g)) {
    const [, name, arrayMarker, allocatedType] = match;
    const base = cppRecordBase(bundle, fn, name, `new_${allocatedType}_${arrayMarker ? 'array' : 'single'}`);
    heapResourcesByName.set(`${fn.name}:${name}`, base.resourceId);
    output.resources.push(resource(base, name, arrayMarker ? 'cpp-new-array-allocation' : 'cpp-new-allocation', { allocatedType, functionName: fn.name }));
    output.unsafeBoundaries.push(unsafe(base, 'cpp-new-manual-memory-boundary', { allocatedType, array: Boolean(arrayMarker), functionName: fn.name }));
  }
}

function appendCppDeletes(output, bundle, fn, heapResourcesByName) {
  for (const match of fn.bodyText.matchAll(/\bdelete\s*(\[\])?\s*([A-Za-z_][A-Za-z0-9_]*)\s*;/g)) {
    const [, arrayMarker, name] = match;
    const base = cppRecordBase(bundle, fn, name, `delete_${arrayMarker ? 'array' : 'single'}`);
    const resourceId = heapResourcesByName.get(`${fn.name}:${name}`) ?? base.resourceId;
    output.drops.push({
      ...drop(base, arrayMarker ? 'cpp-delete-array' : 'cpp-delete', { target: name, functionName: fn.name }),
      resourceId
    });
    output.unsafeBoundaries.push({
      ...unsafe(base, 'cpp-delete-manual-memory-boundary', { target: name, array: Boolean(arrayMarker), functionName: fn.name }),
      resourceId
    });
  }
}

function smartPointerRecords(fn) {
  const records = [];
  for (const match of fn.bodyText.matchAll(/\bstd::(unique_ptr|shared_ptr|weak_ptr)\s*<\s*([^>]+?)\s*>\s+([A-Za-z_][A-Za-z0-9_]*)\b/g)) {
    records.push({ kind: match[1], pointeeType: match[2].trim(), name: match[3] });
  }
  for (const match of fn.bodyText.matchAll(/\bauto\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*std::(make_unique|make_shared)\s*<\s*([^>]+?)\s*>/g)) {
    records.push({ kind: match[2] === 'make_unique' ? 'unique_ptr' : 'shared_ptr', pointeeType: match[3].trim(), name: match[1] });
  }
  return uniqueByName(records);
}

function raiiLocalRecords(fn) {
  const records = [];
  const pattern = /\bstd::(lock_guard|unique_lock|scoped_lock|shared_lock|fstream|ifstream|ofstream)\s*(?:<[^;]+?>)?\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
  for (const match of fn.bodyText.matchAll(pattern)) {
    records.push({ typeName: `std::${match[1]}`, name: match[2] });
  }
  return uniqueByName(records);
}

function cppRecordBase(bundle, fn, name, kind) {
  const fnId = idFragment(`${bundle.sourcePath ?? 'cpp'}:${fn.name}:${fn.startLine}`);
  const idPart = `${fnId}_${idFragment(name)}_${idFragment(kind)}`;
  const ownerId = `owner_cpp_${fnId}`;
  return {
    idPart,
    ownerId,
    resourceId: `resource_cpp_${idPart}`,
    lifetimeRegionId: `lifetime_cpp_${idPart}`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: [`cpp-source:${bundle.sourceHash ?? fnId}`, ...bundle.evidenceIds]
  };
}

function cppFunctionOwner(bundle, fn) {
  const fnId = idFragment(`${bundle.sourcePath ?? 'cpp'}:${fn.name}:${fn.startLine}`);
  return {
    id: `owner_cpp_${fnId}`,
    name: fn.name,
    ownerKind: 'cpp-function',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: fn.span,
    evidenceIds: [`cpp-source:${bundle.sourceHash ?? fnId}`, ...bundle.evidenceIds]
  };
}

function resource(base, name, resourceKind, metadata) {
  return { id: base.resourceId, name, resourceKind, ownerId: base.ownerId, sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds, metadata };
}

function lifetime(base, name, lifetimeKind) {
  return { id: base.lifetimeRegionId, name, lifetimeKind, sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds };
}

function drop(base, dropKind, metadata) {
  return { id: `drop_${base.idPart}`, resourceId: base.resourceId, ownerId: base.ownerId, lifetimeRegionId: base.lifetimeRegionId, dropKind, sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds, metadata };
}

function alias(base, aliasKind, metadata) {
  return { id: `alias_cpp_${base.idPart}`, resourceId: base.resourceId, ownerId: base.ownerId, lifetimeRegionId: base.lifetimeRegionId, aliasKind, sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds, metadata };
}

function unsafe(base, proofGapCode, metadata) {
  return { id: `unsafe_cpp_${base.idPart}_${idFragment(proofGapCode)}`, resourceId: base.resourceId, proofStatus: 'missing', sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds, metadata: { proofGapCode, ...metadata } };
}

function cppFunctionRecords(bundle) {
  const lines = String(bundle.sourceText).split(/\n/);
  const records = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*[\w:<>~*&,\s]+\s+([A-Za-z_][A-Za-z0-9_:]*)\s*\(([^;{}]*)\)\s*(\{|;)?/);
    if (!match || cppControlKeyword(match[1])) continue;
    const startLine = index + 1;
    const endLine = match[3] === '{' ? cppFunctionEndLine(lines, index) : startLine;
    records.push({
      name: match[1],
      parameters: splitParameters(match[2]),
      bodyText: lines.slice(index, endLine).join('\n'),
      startLine,
      endLine,
      span: { path: bundle.sourcePath, startLine, startColumn: 1, endLine, endColumn: (lines[endLine - 1] ?? '').length + 1 }
    });
  }
  return records;
}

function cppFunctionEndLine(lines, startIndex) {
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
  return String(raw ?? '').split(',').map((part) => part.trim()).filter(Boolean);
}

function cppSourceText(entry) {
  return entry.sourceText
    ?? entry.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? entry.universalAst?.metadata?.sourcePreservation?.sourceText;
}

function cppSourcePath(entry) {
  return entry.sourcePath ?? entry.nativeSource?.sourcePath ?? entry.nativeAst?.sourcePath;
}

function cppSourceHash(entry) {
  return entry.sourceHash ?? entry.nativeSource?.sourceHash ?? entry.nativeAst?.sourceHash;
}

function cppLanguage(entry) {
  return ['cpp', 'c++'].includes(String(entry.language ?? entry.nativeSource?.language ?? entry.nativeAst?.language ?? '').toLowerCase());
}

function cppEvidenceIds(entry) {
  return (entry.evidence ?? []).map((record) => record?.id).filter(Boolean);
}

function cppControlKeyword(name) {
  return ['if', 'for', 'while', 'switch', 'catch'].includes(name);
}

function uniqueByName(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = `${record.name}:${record.kind ?? record.typeName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueBundles(bundles) {
  const seen = new Set();
  return bundles.filter((bundle) => {
    const key = `cpp:${bundle.sourceHash ?? bundle.sourcePath ?? bundle.sourceText.length}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function emptyCppRecords() {
  return { resources: [], owners: [], loans: [], aliases: [], moves: [], drops: [], lifetimeRegions: [], unsafeBoundaries: [] };
}
