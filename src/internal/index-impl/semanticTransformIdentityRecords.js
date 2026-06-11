import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings as uniqueRawStrings } from '../../native-import-utils.js';
import { semanticEditIdentityFields } from './semanticEditIdentityRecords.js';

export function createSemanticTransformIdentityRecord(input = {}, options = {}) {
  const source = input?.transform ?? input;
  const merged = { ...source, ...options };
  const editIdentity = semanticEditIdentityFields(merged);
  const semanticKey = firstString(merged.semanticKey, editIdentity.semanticKey);
  const transformKey = firstString(merged.transformKey, semanticTransformKey({ ...merged, semanticKey }));
  const sourceLanguage = firstString(merged.sourceLanguage, merged.language);
  const targetLanguage = firstString(merged.targetLanguage, merged.projectedLanguage);
  const sourcePath = firstString(merged.sourcePath, merged.originalSourcePath);
  const targetPath = firstString(merged.targetPath, merged.targetSourcePath, merged.projectedSourcePath);
  const semanticIdentityHash = firstString(merged.semanticIdentityHash, editIdentity.semanticIdentityHash);
  const sourceIdentityHash = firstString(merged.sourceIdentityHash, editIdentity.sourceIdentityHash);
  const transformIdentityHash = firstString(merged.transformIdentityHash, hashSemanticValue(compactRecord({
    transformKey,
    semanticIdentityHash,
    sourceLanguage,
    targetLanguage
  })));
  const projectionIdentityHash = firstString(merged.projectionIdentityHash, hashSemanticValue(compactRecord({
    transformIdentityHash,
    sourceIdentityHash,
    sourcePath,
    targetPath
  })));
  const operationContentHash = firstString(merged.operationContentHash);
  const editContentHash = firstString(merged.editContentHash);
  const transformContentHash = firstString(
    merged.transformContentHash,
    operationContentHash || editContentHash ? hashSemanticValue(compactRecord({ transformIdentityHash, operationContentHash, editContentHash })) : undefined
  );
  const id = merged.id && source.kind === 'frontier.lang.semanticTransformIdentityRecord'
    ? merged.id
    : firstString(merged.id, `semantic_transform_${idFragment(firstString(transformKey, semanticKey, sourcePath, targetPath, 'record'))}`);
  return compactRecord({
    kind: 'frontier.lang.semanticTransformIdentityRecord',
    version: 1,
    schema: 'frontier.lang.semanticTransformIdentityRecord.v1',
    id,
    sourceLanguage,
    targetLanguage,
    sourcePath,
    targetPath,
    baseHash: firstString(merged.baseHash),
    targetHash: firstString(merged.targetHash, merged.projectedHash),
    semanticKey,
    transformKey,
    semanticIdentityHash,
    sourceIdentityHash,
    operationContentHash,
    editContentHash,
    transformIdentityHash,
    projectionIdentityHash,
    transformContentHash,
    readiness: firstString(merged.readiness),
    confidence: typeof merged.confidence === 'number' ? merged.confidence : undefined,
    evidenceIds: uniqueStrings(merged.evidenceIds),
    metadata: compactRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceTransformId: source.kind === 'frontier.lang.semanticTransformIdentityRecord' ? source.id : undefined,
      ...merged.metadata
    })
  });
}

export function semanticTransformIdentityFields(record = {}) {
  return createSemanticTransformIdentityRecord(record);
}

export function normalizeSemanticTransformIdentityRecords(records, context = {}) {
  return array(records).filter(Boolean).map((record) => createSemanticTransformIdentityRecord(record, context));
}

export function semanticTransformInputs(source = {}, options = {}) {
  return [
    ...array(options.semanticTransformIdentities ?? options.semanticTransformIdentity),
    ...array(source.semanticTransformIdentities ?? source.semanticTransformIdentity ?? source.semanticTransforms),
    ...array(source.index?.semanticTransformIdentities)
  ];
}

export function semanticTransformRecordIndex(records, source = {}) {
  const index = source.index ?? {};
  return {
    semanticTransformIds: uniqueStrings([...strings(source.semanticTransformIds), ...strings(index.semanticTransformIds), ...records.map((record) => record.id)]),
    semanticTransformKeys: uniqueStrings([...strings(source.semanticTransformKeys), ...strings(index.semanticTransformKeys), ...records.map((record) => record.transformKey)]),
    semanticTransformIdentityHashes: uniqueStrings([...strings(source.semanticTransformIdentityHashes), ...strings(index.semanticTransformIdentityHashes), ...records.map((record) => record.transformIdentityHash)]),
    semanticTransformContentHashes: uniqueStrings([...strings(source.semanticTransformContentHashes), ...strings(index.semanticTransformContentHashes), ...records.map((record) => record.transformContentHash)]),
    projectionIdentityHashes: uniqueStrings([...strings(source.projectionIdentityHashes), ...strings(index.projectionIdentityHashes), ...records.map((record) => record.projectionIdentityHash)]),
    transformSourceLanguages: uniqueStrings([...strings(source.transformSourceLanguages), ...strings(index.transformSourceLanguages), ...records.map((record) => record.sourceLanguage)]),
    transformTargetLanguages: uniqueStrings([...strings(source.transformTargetLanguages), ...strings(index.transformTargetLanguages), ...records.map((record) => record.targetLanguage)]),
    transformSourcePaths: uniqueStrings([...strings(source.transformSourcePaths), ...strings(index.transformSourcePaths), ...records.map((record) => record.sourcePath)]),
    transformTargetPaths: uniqueStrings([...strings(source.transformTargetPaths), ...strings(index.transformTargetPaths), ...records.map((record) => record.targetPath)])
  };
}

export function semanticTransformSummary(index) {
  if (!index.semanticTransformIds.length && !index.semanticTransformKeys.length) return undefined;
  return compactRecord({
    ids: index.semanticTransformIds,
    keys: index.semanticTransformKeys,
    identityHashes: index.semanticTransformIdentityHashes,
    contentHashes: index.semanticTransformContentHashes,
    projectionIdentityHashes: index.projectionIdentityHashes,
    sourceLanguages: index.transformSourceLanguages,
    targetLanguages: index.transformTargetLanguages,
    targetPaths: index.transformTargetPaths
  });
}

function semanticTransformKey(record) {
  const scope = record.semanticKey ?? (record.symbolName
    ? `${record.symbolKind ?? 'symbol'}:${record.symbolName}`
    : record.anchorKey ?? record.regionId ?? record.operationId ?? record.id);
  const route = [record.sourceLanguage ?? record.language, record.targetLanguage ?? record.projectedLanguage].filter(Boolean).join('->');
  return ['semantic-transform', route, scope].filter(Boolean).join(':');
}

function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function firstString(...values) { return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean); }
function uniqueStrings(values) { return uniqueRawStrings((values ?? []).filter((entry) => entry !== undefined && entry !== null && String(entry) !== '')); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
