import { parseRustSemanticTree } from '@shapeshift-labs/frontier-lang-rust';
import { idFragment, uniqueRecordsById } from '../../native-import-utils.js';
import { appendRustLocalOwnership } from './semanticResourceGraphRustOwnership.js';

export function rustResourceGraphRecordsFromInput(input = {}) {
  const bundles = rustEvidenceBundlesFromInput(input);
  const records = bundles.flatMap((bundle, index) => rustResourceGraphRecordsFromBundle(bundle, index));
  return {
    resources: uniqueRecordsById(records.flatMap((record) => record.resources)),
    owners: uniqueRecordsById(records.flatMap((record) => record.owners)),
    loans: uniqueRecordsById(records.flatMap((record) => record.loans)),
    aliases: uniqueRecordsById(records.flatMap((record) => record.aliases)),
    moves: uniqueRecordsById(records.flatMap((record) => record.moves)),
    drops: uniqueRecordsById(records.flatMap((record) => record.drops)),
    escapes: uniqueRecordsById(records.flatMap((record) => record.escapes)),
    lifetimeRegions: uniqueRecordsById(records.flatMap((record) => record.lifetimeRegions)),
    unsafeBoundaries: uniqueRecordsById(records.flatMap((record) => record.unsafeBoundaries))
  };
}

function rustEvidenceBundlesFromInput(input) {
  const entries = [
    input,
    ...(input.imports ?? [])
  ].filter((entry) => entry && typeof entry === 'object');
  const bundles = [];
  for (const entry of entries) {
    bundles.push(...rustTreeCandidates(entry));
    const sourceText = rustSourceText(entry);
    if (sourceText && rustLanguage(entry)) {
      const tree = parseRustSemanticTree(sourceText, { sourcePath: rustSourcePath(entry) });
      bundles.push({ tree, sourceText, sourcePath: tree.sourcePath, sourceHash: tree.sourceHash, evidenceIds: rustEvidenceIds(entry) });
    }
  }
  return uniqueRustBundles(bundles);
}

function rustTreeCandidates(entry) {
  return [
    entry.rustSemanticTree,
    entry.rustSemanticMergeEvidence,
    entry.metadata?.rustSemanticTree,
    entry.metadata?.rustSemanticMergeEvidence,
    entry.universalAst?.metadata?.rustSemanticTree,
    entry.universalAst?.metadata?.rustSemanticMergeEvidence
  ].filter((tree) => Array.isArray(tree?.records)).map((tree) => ({
    tree,
    sourceText: rustSourceText(entry),
    sourcePath: tree.sourcePath ?? rustSourcePath(entry),
    sourceHash: tree.sourceHash ?? rustSourceHash(entry),
    evidenceIds: rustEvidenceIds(entry)
  }));
}

function rustResourceGraphRecordsFromBundle(bundle, bundleIndex) {
  const base = emptyRustRecords();
  for (const record of bundle.tree.records ?? []) {
    appendRustRecord(base, bundle, record, bundleIndex);
  }
  if ((bundle.tree.proofGaps ?? []).some((gap) => gap?.code === 'rust-unsafe-boundary')) {
    base.unsafeBoundaries.push({
      id: `unsafe_rust_source_${idFragment(bundle.sourcePath ?? bundleIndex)}`,
      resourceId: base.resources[0]?.id,
      proofStatus: 'missing',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      evidenceIds: bundle.evidenceIds,
      metadata: { proofGapCode: 'rust-unsafe-boundary', scope: 'source' }
    });
  }
  return base;
}

function appendRustRecord(output, bundle, record, bundleIndex) {
  const recordId = idFragment(record.identityKey ?? record.key ?? `${bundleIndex}:${record.name ?? record.kind}`);
  const resourceId = `resource_rust_${recordId}`;
  const ownerId = `owner_rust_${idFragment(record.parentKey ?? bundle.sourcePath ?? 'module')}`;
  const lifetimeRegionId = `lifetime_rust_${recordId}`;
  const evidenceIds = [`rust-semantic-tree:${bundle.tree.treeHash ?? bundle.sourceHash ?? bundleIndex}`, ...bundle.evidenceIds];
  output.resources.push({
    id: resourceId,
    name: record.name,
    resourceKind: `rust-${record.kind ?? 'record'}-source-region`,
    ownerId,
    sourcePath: bundle.sourcePath ?? record.sourceSpan?.path,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.sourceSpan,
    evidenceIds,
    metadata: { rustKey: record.key, rustIdentityKey: record.identityKey, rustRecordKind: record.kind }
  });
  output.owners.push({
    id: ownerId,
    name: record.parentKey ?? bundle.sourcePath ?? 'rust-module',
    ownerKind: record.parentKey ? 'rust-parent-record' : 'rust-module',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    evidenceIds
  });
  output.lifetimeRegions.push({
    id: lifetimeRegionId,
    name: `${record.name ?? record.kind ?? 'rust'} source lifetime`,
    lifetimeKind: 'rust-source-region',
    sourcePath: bundle.sourcePath,
    sourceHash: bundle.sourceHash,
    sourceSpan: record.bodySpan ?? record.sourceSpan,
    startLine: (record.bodySpan ?? record.sourceSpan)?.startLine,
    endLine: (record.bodySpan ?? record.sourceSpan)?.endLine,
    evidenceIds
  });
  appendRustSignatureLoans(output, bundle, record, { recordId, ownerId, evidenceIds });
  appendRustLocalOwnership(output, bundle, record, { recordId, ownerId, evidenceIds });
  if ((record.proofGaps ?? []).some((gap) => gap?.code === 'rust-unsafe-boundary')) {
    output.unsafeBoundaries.push({
      id: `unsafe_rust_${recordId}`,
      resourceId,
      proofStatus: 'missing',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: record.sourceSpan,
      evidenceIds,
      metadata: { rustKey: record.key, proofGapCode: 'rust-unsafe-boundary', scope: 'record' }
    });
  }
}

function appendRustSignatureLoans(output, bundle, record, context) {
  if (!['fn', 'method'].includes(record.kind) || !bundle.sourceText) return;
  const signature = rustRecordSignature(bundle.sourceText, record);
  const params = rustParameterTexts(signature);
  for (const [index, param] of params.entries()) {
    const name = rustParameterName(param) ?? `param_${index + 1}`;
    const mode = /\&\s*mut\b/.test(param) ? 'mutable' : /\&/.test(param) ? 'shared' : /\*\s*(?:const|mut)\b/.test(param) ? 'raw' : undefined;
    if (!mode) continue;
    const idPart = `${context.recordId}_${idFragment(name)}`;
    const resourceId = `resource_rust_param_${idPart}`;
    const lifetimeRegionId = `lifetime_rust_param_${idPart}`;
    output.resources.push({
      id: resourceId,
      name,
      resourceKind: mode === 'raw' ? 'rust-raw-pointer-parameter' : 'rust-reference-parameter',
      ownerId: context.ownerId,
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      evidenceIds: context.evidenceIds,
      metadata: { parameterText: param, rustKey: record.key }
    });
    output.lifetimeRegions.push({
      id: lifetimeRegionId,
      name: `${name} parameter lifetime`,
      lifetimeKind: mode === 'raw' ? 'rust-raw-pointer-region' : 'rust-reference-region',
      sourcePath: bundle.sourcePath,
      sourceHash: bundle.sourceHash,
      sourceSpan: record.sourceSpan,
      evidenceIds: context.evidenceIds
    });
    if (mode === 'raw') {
      output.aliases.push({
        id: `alias_rust_raw_${idPart}`,
        resourceId,
        ownerId: context.ownerId,
        lifetimeRegionId,
        aliasKind: 'raw-pointer',
        sourcePath: bundle.sourcePath,
        sourceHash: bundle.sourceHash,
        evidenceIds: context.evidenceIds,
        metadata: { parameterText: param, rustKey: record.key }
      });
      output.unsafeBoundaries.push({
        id: `unsafe_rust_raw_${idPart}`,
        resourceId,
        proofStatus: 'missing',
        sourcePath: bundle.sourcePath,
        sourceHash: bundle.sourceHash,
        sourceSpan: record.sourceSpan,
        evidenceIds: context.evidenceIds,
        metadata: { parameterText: param, proofGapCode: 'rust-raw-pointer-boundary', rustKey: record.key }
      });
    } else {
      output.loans.push({
        id: `loan_rust_${mode}_${idPart}`,
        resourceId,
        ownerId: context.ownerId,
        lifetimeRegionId,
        mode,
        sourcePath: bundle.sourcePath,
        sourceHash: bundle.sourceHash,
        evidenceIds: context.evidenceIds,
        metadata: { parameterText: param, rustKey: record.key }
      });
    }
  }
}

function rustRecordSignature(sourceText, record) {
  const start = record.sourceSpan?.startOffset ?? 0;
  const bodyStart = record.bodySpan?.startOffset ?? record.sourceSpan?.endOffset ?? sourceText.length;
  return sourceText.slice(start, bodyStart);
}

function rustParameterTexts(signature) {
  const match = String(signature ?? '').match(/\(([^)]*)\)/s);
  return match ? match[1].split(',').map((part) => part.trim()).filter(Boolean) : [];
}

function rustParameterName(text) {
  if (text === 'self' || text === '&self' || text === '&mut self') return 'self';
  const match = text.match(/^(?:mut\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*:/);
  return match?.[1];
}

function rustSourceText(entry) {
  return entry.sourceText
    ?? entry.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? entry.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? entry.universalAst?.metadata?.sourcePreservation?.sourceText;
}

function rustSourcePath(entry) {
  return entry.sourcePath ?? entry.nativeSource?.sourcePath ?? entry.nativeAst?.sourcePath;
}

function rustSourceHash(entry) {
  return entry.sourceHash ?? entry.nativeSource?.sourceHash ?? entry.nativeAst?.sourceHash;
}

function rustLanguage(entry) {
  return String(entry.language ?? entry.nativeSource?.language ?? entry.nativeAst?.language ?? '').toLowerCase() === 'rust';
}

function rustEvidenceIds(entry) {
  return (entry.evidence ?? []).map((record) => record?.id).filter(Boolean);
}

function uniqueRustBundles(bundles) {
  const seen = new Set();
  return bundles.filter((bundle) => {
    const key = bundle.tree.treeHash ?? bundle.sourceHash ?? `${bundle.sourcePath}:${bundle.tree.records?.length ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function emptyRustRecords() {
  return { resources: [], owners: [], loans: [], aliases: [], moves: [], drops: [], escapes: [], lifetimeRegions: [], unsafeBoundaries: [] };
}
