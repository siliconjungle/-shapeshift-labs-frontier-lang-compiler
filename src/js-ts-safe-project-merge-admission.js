import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { projectAdmissionRouteFromExactAdmission } from './js-ts-safe-project-merge-admission-routes.js';

function createExactBranchProjectSemanticEditAdmissionFile(options) {
  const {
    fileResult,
    file,
    classifications = [],
    admissionKind,
    action,
    operation,
    summaryKey,
    evidenceKey,
    metadataKey,
    requireOtherBranchUnchanged = true,
    requireBaseForOtherBranchUnchanged = true,
    allowDeletedBranchOutput = false,
    allowExistingExactOutput = false,
    classificationFilter = () => true,
    admissionFields = () => ({}),
    details = (classification) => classification.details
  } = options;
  if (!classifications.length || !classifications.every(classificationFilter)) return undefined;
  const branches = uniqueStrings(classifications.map((classification) => classification.branch));
  if (branches.length !== 1) return undefined;
  const branch = branches[0];
  const admissions = classifications
    .map((classification) => exactBranchProjectSemanticEditAdmission({
      fileResult,
      file,
      classification,
      admissionKind,
      requireOtherBranchUnchanged,
      requireBaseForOtherBranchUnchanged,
      allowDeletedBranchOutput,
      allowExistingExactOutput,
      admissionFields,
      details
    }))
    .filter(Boolean);
  if (admissions.length !== classifications.length) return undefined;
  const branchText = branchSourceText(file, branch);
  const outputHash = hashProjectSourceText(branchText);
  return {
    admissions,
    fileResult: compactRecord({
      ...fileResult,
      status: 'merged',
      operation: typeof operation === 'function' ? operation(fileResult) : operation,
      outputSourceText: branchText,
      outputHash,
      baseHash: hashProjectSourceText(file.baseSourceText),
      workerHash: hashProjectSourceText(branchSourceText(file, 'worker')),
      headHash: hashProjectSourceText(branchSourceText(file, 'head')),
      result: fileResult.status === 'merged' ? fileResult.result : undefined,
      semanticArtifacts: fileResult.status === 'merged' ? fileResult.semanticArtifacts : undefined,
      conflicts: [],
      admission: exactBranchProjectSemanticEditFileAdmission(action),
      summary: compactRecord({
        ...(isPlainObject(fileResult.summary) ? fileResult.summary : {}),
        conflicts: 0,
        [summaryKey]: admissions.length,
        [evidenceKey]: admissions
      }),
      metadata: metadataKey ? compactRecord({
        ...(isPlainObject(fileResult.metadata) ? fileResult.metadata : {}),
        [metadataKey]: admissions
      }) : fileResult.metadata
    })
  };
}

function exactBranchProjectSemanticEditAdmission(options) {
  const { fileResult, file, classification, admissionKind, requireOtherBranchUnchanged, requireBaseForOtherBranchUnchanged, allowDeletedBranchOutput, allowExistingExactOutput, admissionFields, details } = options;
  const branchText = branchSourceText(file, classification.branch);
  if (typeof branchText !== 'string' && !allowDeletedBranchOutput) return undefined;
  const exactMergedOutput = fileResult.status === 'merged' && fileResult.outputSourceText === branchText;
  if (!exactMergedOutput || !allowExistingExactOutput) {
    if (requireOtherBranchUnchanged && !otherProjectBranchUnchanged(file, classification.branch, { requireBase: requireBaseForOtherBranchUnchanged })) return undefined;
  }
  const outputHash = hashProjectSourceText(branchText);
  const admission = {
    id: safeProjectEvidenceId(`${classification.details?.conflictKey ?? classification.code}_${file.sourcePath}`),
    kind: admissionKind,
    status: 'passed',
    branch: classification.branch,
    ...(admissionFields(classification) ?? {}),
    sourcePath: file.sourcePath,
    outputHash,
    sourceHash: outputHash,
    summary: `Project ${classification.branch} semantic edit output matched branch ${typeof branchText === 'string' ? 'source' : 'deletion'} for ${file.sourcePath}.`,
    details: compactRecord({
      ...(details(classification) ?? {}),
      sourcePath: file.sourcePath,
      outputHash,
      exactBranchOutput: true,
      deletedOutput: typeof branchText !== 'string' || undefined,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
  return { ...admission, admissionRoute: projectAdmissionRouteFromExactAdmission(admission, { action: options.action }) };
}

function exactBranchProjectSemanticEditFileAdmission(action) {
  return {
    status: 'auto-merge-candidate',
    action,
    reviewRequired: false,
    autoApplyCandidate: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: []
  };
}

function summarizeProjectSemanticEditAdmissions(admissions = [], fields = {}) {
  const unique = uniqueProjectSemanticEditAdmissions(admissions);
  const summary = { [fields.totalKey ?? 'admissions']: unique.length };
  for (const field of fields.byKind ?? []) {
    summary[field.key] = unique.filter((admission) => admission[field.property] === field.value).length;
  }
  if (fields.evidenceIdsKey) summary[fields.evidenceIdsKey] = unique.map((admission) => admission.id);
  return summary;
}

function uniqueProjectSemanticEditAdmissions(admissions) {
  const seen = new Set();
  return admissions.filter((admission) => {
    const key = admission.details?.conflictKey ?? admission.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function branchSourceText(file, branch) {
  if (branch === 'worker') return file.workerDeleted ? undefined : file.workerSourceText ?? file.baseSourceText;
  return file.headDeleted ? undefined : file.headSourceText ?? file.baseSourceText;
}

function otherProjectBranchUnchanged(file, branch, options = {}) {
  const other = branch === 'worker' ? branchSourceText(file, 'head') : branchSourceText(file, 'worker');
  return (options.requireBase === false || typeof file.baseSourceText === 'string') && other === file.baseSourceText;
}

function hashProjectSourceText(text) { return typeof text === 'string' ? hashSemanticValue(text) : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function safeProjectEvidenceId(value) { return String(value ?? 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'evidence'; }

export {
  branchSourceText,
  createExactBranchProjectSemanticEditAdmissionFile,
  hashProjectSourceText,
  otherProjectBranchUnchanged,
  safeProjectEvidenceId,
  summarizeProjectSemanticEditAdmissions,
  uniqueProjectSemanticEditAdmissions
};
