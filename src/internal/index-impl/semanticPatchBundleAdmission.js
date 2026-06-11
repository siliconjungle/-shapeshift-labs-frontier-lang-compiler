import { normalizeSemanticMergeReadiness, uniqueStrings } from '../../native-import-utils.js';

export function createSemanticPatchBundleAdmission(input = {}, context = {}) {
  const transformAdmission = semanticTransformAdmission(context);
  const fallbackReadiness = transformAdmission.readiness === 'ready' ? 'ready' : context.readiness;
  const readiness = normalizeSemanticMergeReadiness(input.readiness ?? fallbackReadiness) ?? input.readiness ?? fallbackReadiness;
  const status = input.status ?? admissionStatusForReadiness(readiness, transformAdmission);
  const autoApplyCandidate = input.autoApplyCandidate ?? (status === 'admitted' && transformAdmission.action === 'admit');
  return compactRecord({
    status,
    readiness,
    reviewRequired: input.reviewRequired ?? status !== 'admitted',
    autoMergeClaim: false,
    autoApplyCandidate,
    transformAdmission,
    reasonCodes: uniqueStrings([
      ...strings(input.reasonCodes),
      ...strings(context.source?.reasons),
      ...strings(context.mergeCandidate?.reasons),
      ...transformAdmission.reasonCodes
    ]),
    conflictKeys: uniqueStrings([...strings(input.conflictKeys), ...context.conflictKeys]),
    admittedAt: input.admittedAt,
    reviewerId: input.reviewerId,
    evidenceIds: uniqueStrings([...strings(input.evidenceIds), ...strings(transformAdmission.evidenceIds)]),
    metadata: input.metadata
  });
}

function semanticTransformAdmission(context) {
  const records = array(context.semanticTransformIdentities);
  const index = context.semanticTransformIndex ?? {};
  if (!records.length && !strings(index.semanticTransformIds).length) {
    return { status: 'none', action: 'none', readiness: 'needs-review', reasonCodes: [] };
  }
  const readinesses = uniqueStrings([...strings(index.semanticTransformReadinesses), ...records.map((record) => record.readiness)]);
  const normalizedReadinesses = uniqueStrings(readinesses.map(transformReadiness).filter(Boolean));
  const blocked = normalizedReadinesses.includes('blocked');
  const complete = strings(index.semanticTransformContentHashes).length > 0 &&
    strings(index.projectionIdentityHashes).length > 0 &&
    strings(index.transformSourceLanguages).length > 0 &&
    strings(index.transformTargetLanguages).length > 0 &&
    strings(index.transformSourcePaths).length > 0 &&
    strings(index.transformTargetPaths).length > 0;
  const ready = !blocked && complete && (normalizedReadinesses.length === 0 || normalizedReadinesses.every((entry) => entry === 'ready'));
  const status = blocked ? 'blocked' : ready ? 'ready' : 'needs-review';
  return compactRecord({
    status,
    action: blocked ? 'block' : ready ? 'admit' : 'review',
    readiness: blocked ? 'blocked' : ready ? 'ready' : 'needs-review',
    crossLanguage: hasCrossLanguageTransform(index),
    reasonCodes: transformReasonCodes({ blocked, complete, ready, readinesses, index }),
    transformIds: strings(index.semanticTransformIds),
    transformKeys: strings(index.semanticTransformKeys),
    contentHashes: strings(index.semanticTransformContentHashes),
    projectionIdentityHashes: strings(index.projectionIdentityHashes),
    sourceLanguages: strings(index.transformSourceLanguages),
    targetLanguages: strings(index.transformTargetLanguages),
    sourcePaths: strings(index.transformSourcePaths),
    targetPaths: strings(index.transformTargetPaths),
    evidenceIds: strings(index.semanticTransformEvidenceIds)
  });
}

function transformReasonCodes(input) {
  return uniqueStrings([
    input.blocked ? 'transform-readiness-blocked' : undefined,
    !input.complete ? 'transform-evidence-incomplete' : undefined,
    input.ready ? 'transform-auto-apply-candidate' : undefined,
    ...input.readinesses.map((readiness) => `transform-readiness:${readiness}`)
  ]);
}

function transformReadiness(value) {
  const normalized = normalizeSemanticMergeReadiness(value);
  if (normalized) return normalized === 'ready-with-losses' ? 'needs-review' : normalized;
  const status = String(value ?? '').toLowerCase();
  if (['auto-merge-candidate', 'portable', 'projected', 'applied'].includes(status)) return 'ready';
  if (['conflict', 'blocked', 'stale', 'rejected'].includes(status)) return 'blocked';
  if (['needs-port', 'review', 'needs-review', 'candidate'].includes(status)) return 'needs-review';
  return undefined;
}

function admissionStatusForReadiness(readiness, transformAdmission) {
  if (readiness === 'blocked') return 'blocked';
  if (transformAdmission.action === 'admit' && readiness === 'ready') return 'admitted';
  return readiness === 'needs-review' ? 'needs-review' : 'proposed';
}

function hasCrossLanguageTransform(index) {
  const source = new Set(strings(index.transformSourceLanguages));
  return strings(index.transformTargetLanguages).some((target) => !source.has(target));
}

function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
