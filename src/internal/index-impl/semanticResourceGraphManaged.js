import { idFragment, uniqueRecordsById } from '../../native-import-utils.js';

export function managedResourceGraphRecordsFromInput(input = {}) {
  const records = managedBundlesFromInput(input).map(managedRecordsFromBundle);
  return {
    resources: uniqueRecordsById(records.flatMap((record) => record.resources)),
    owners: uniqueRecordsById(records.flatMap((record) => record.owners)),
    aliases: uniqueRecordsById(records.flatMap((record) => record.aliases)),
    drops: uniqueRecordsById(records.flatMap((record) => record.drops)),
    lifetimeRegions: uniqueRecordsById(records.flatMap((record) => record.lifetimeRegions)),
    unsafeBoundaries: uniqueRecordsById(records.flatMap((record) => record.unsafeBoundaries))
  };
}

function managedBundlesFromInput(input) {
  const entries = [input, ...(input.imports ?? [])].filter((entry) => entry && typeof entry === 'object');
  return uniqueBundles(entries
    .map((entry) => ({ entry, language: managedLanguageName(entry) }))
    .filter((item) => managedLanguages().includes(item.language))
    .map(({ entry, language }) => ({
      language,
      sourceText: managedSourceText(entry),
      sourcePath: managedSourcePath(entry),
      sourceHash: managedSourceHash(entry),
      evidenceIds: managedEvidenceIds(entry)
    }))
    .filter((bundle) => typeof bundle.sourceText === 'string' && bundle.sourceText.length > 0));
}

function managedRecordsFromBundle(bundle) {
  const output = emptyManagedRecords();
  const owner = managedOwner(bundle);
  output.owners.push(owner);
  appendTryResources(output, bundle, owner);
  appendUsingResources(output, bundle, owner);
  appendGoDefers(output, bundle, owner);
  appendSwiftDefers(output, bundle, owner);
  appendKotlinUseBlocks(output, bundle, owner);
  appendSwiftUnsafePointers(output, bundle, owner);
  return output;
}

function appendTryResources(output, bundle, owner) {
  if (!['java', 'kotlin'].includes(bundle.language)) return;
  for (const match of bundle.sourceText.matchAll(/\btry\s*\(\s*(?:final\s+)?([A-Za-z_][\w<>\[\].?]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g)) {
    appendLexicalResource(output, bundle, owner, match, match[2], `${bundle.language}-try-resource`, `${bundle.language}-auto-close`, { typeName: match[1] });
  }
}

function appendUsingResources(output, bundle, owner) {
  if (bundle.language !== 'csharp') return;
  const pattern = /\busing\s*(?:\(\s*)?(?:var|[A-Za-z_][\w<>,.?]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g;
  for (const match of bundle.sourceText.matchAll(pattern)) {
    appendLexicalResource(output, bundle, owner, match, match[1], 'csharp-using-resource', 'csharp-dispose', {});
  }
}

function appendGoDefers(output, bundle, owner) {
  if (bundle.language !== 'go') return;
  for (const match of bundle.sourceText.matchAll(/\bdefer\s+([A-Za-z_][A-Za-z0-9_.]*)\.Close\s*\(/g)) {
    appendLexicalResource(output, bundle, owner, match, match[1], 'go-deferred-close-resource', 'go-defer-close', { deferTarget: match[1] });
  }
}

function appendSwiftDefers(output, bundle, owner) {
  if (bundle.language !== 'swift') return;
  for (const match of bundle.sourceText.matchAll(/\bdefer\s*\{([^}]*)\}/gs)) {
    const body = match[1] ?? '';
    const call = body.match(/\b([A-Za-z_][A-Za-z0-9_.]*)\.(close|invalidate|cancel)\s*\(/);
    if (call) appendLexicalResource(output, bundle, owner, match, call[1], 'swift-deferred-resource', `swift-defer-${call[2]}`, { deferTarget: call[1] });
  }
}

function appendKotlinUseBlocks(output, bundle, owner) {
  if (bundle.language !== 'kotlin') return;
  for (const match of bundle.sourceText.matchAll(/\.use\s*\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*->/g)) {
    appendLexicalResource(output, bundle, owner, match, match[1], 'kotlin-use-resource', 'kotlin-auto-close', {});
  }
}

function appendSwiftUnsafePointers(output, bundle, owner) {
  if (bundle.language !== 'swift') return;
  const pattern = /\b(?:let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(Unsafe(?:Mutable)?(?:Raw)?(?:Buffer)?Pointer)\s*<[^>]+>|\b(withUnsafe(?:Mutable)?(?:Bytes|Pointer|BufferPointer))\b/g;
  for (const match of bundle.sourceText.matchAll(pattern)) {
    const name = match[1] ?? match[3] ?? 'unsafePointer';
    const base = managedBase(bundle, owner, match, name, 'swift_unsafe_pointer');
    output.resources.push(resource(base, name, 'swift-unsafe-pointer-resource', { unsafePointerKind: match[2] ?? match[3] }));
    output.lifetimeRegions.push(lifetime(base, `${name} unsafe pointer region`, 'swift-unsafe-pointer-region'));
    output.aliases.push(alias(base, 'swift-unsafe-pointer', { unsafePointerKind: match[2] ?? match[3] }));
    output.unsafeBoundaries.push(unsafe(base, 'swift-unsafe-pointer-boundary', { unsafePointerKind: match[2] ?? match[3] }));
  }
}

function appendLexicalResource(output, bundle, owner, match, name, resourceKind, dropKind, metadata) {
  const base = managedBase(bundle, owner, match, name, resourceKind);
  output.resources.push(resource(base, name, resourceKind, metadata));
  output.lifetimeRegions.push(lifetime(base, `${name} cleanup lifetime`, `${bundle.language}-cleanup-region`));
  output.drops.push(drop(base, dropKind, { ...metadata, automatic: true }));
}

function managedBase(bundle, owner, match, name, kind) {
  const span = spanForIndex(bundle.sourceText, bundle.sourcePath, match.index ?? 0);
  const idPart = idFragment(`${bundle.language}:${bundle.sourcePath ?? 'source'}:${name}:${kind}:${span.startLine}`);
  return {
    idPart,
    ownerId: owner.id,
    resourceId: `resource_${bundle.language}_${idPart}`,
    lifetimeRegionId: `lifetime_${bundle.language}_${idPart}`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: span,
    evidenceIds: [`${bundle.language}-source:${bundle.sourceHash ?? idPart}`, ...bundle.evidenceIds]
  };
}

function managedOwner(bundle) {
  const idPart = idFragment(`${bundle.language}:${bundle.sourcePath ?? 'source'}`);
  return {
    id: `owner_${bundle.language}_${idPart}`,
    name: bundle.sourcePath ?? `${bundle.language}-source`,
    ownerKind: `${bundle.language}-source-file`,
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    evidenceIds: [`${bundle.language}-source:${bundle.sourceHash ?? idPart}`, ...bundle.evidenceIds]
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
  return { id: `alias_${base.idPart}`, resourceId: base.resourceId, ownerId: base.ownerId, lifetimeRegionId: base.lifetimeRegionId, aliasKind, sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds, metadata };
}

function unsafe(base, proofGapCode, metadata) {
  return { id: `unsafe_${base.idPart}`, resourceId: base.resourceId, proofStatus: 'missing', sourcePath: base.sourcePath, sourceHash: base.sourceHash, sourceSpan: base.sourceSpan, evidenceIds: base.evidenceIds, metadata: { proofGapCode, ...metadata } };
}

function spanForIndex(sourceText, sourcePath, offset) {
  const prefix = sourceText.slice(0, offset);
  const startLine = prefix.split('\n').length;
  const lineText = sourceText.split('\n')[startLine - 1] ?? '';
  return { path: sourcePath, startLine, startColumn: 1, endLine: startLine, endColumn: lineText.length + 1 };
}

function managedSourceText(entry) {
  return entry.sourceText
    ?? entry.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? entry.universalAst?.metadata?.sourcePreservation?.sourceText;
}

function managedSourcePath(entry) {
  return entry.sourcePath ?? entry.nativeSource?.sourcePath ?? entry.nativeAst?.sourcePath;
}

function managedSourceHash(entry) {
  return entry.sourceHash ?? entry.nativeSource?.sourceHash ?? entry.nativeAst?.sourceHash;
}

function managedLanguageName(entry) {
  const language = String(entry.language ?? entry.nativeSource?.language ?? entry.nativeAst?.language ?? '').toLowerCase();
  if (language === 'c#') return 'csharp';
  return language;
}

function managedLanguages() {
  return ['java', 'kotlin', 'csharp', 'go', 'swift'];
}

function managedEvidenceIds(entry) {
  return (entry.evidence ?? []).map((record) => record?.id).filter(Boolean);
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

function emptyManagedRecords() {
  return { resources: [], owners: [], aliases: [], drops: [], lifetimeRegions: [], unsafeBoundaries: [] };
}
