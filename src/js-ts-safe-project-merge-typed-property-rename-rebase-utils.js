import { uniqueStrings } from './js-ts-safe-merge-context.js';

function typedPropertyRenameRebaseEvidence(file, analysis) {
  return {
    id: `typed_property_rename_rebase_${safeId(file.sourcePath)}_${safeId(analysis.ownerName)}_${safeId(analysis.fromName)}_${safeId(analysis.toName)}`,
    kind: 'js-ts-project-typed-property-rename-rebase',
    status: 'passed',
    level: 'diagnostics-required-project-rebase',
    scope: 'source-file',
    summary: `Rebased worker changes from ${analysis.ownerName}.${analysis.fromName} to ${analysis.ownerName}.${analysis.toName}; project output diagnostics must still pass.`,
    metadata: {
      sourcePath: file.sourcePath,
      ownerName: analysis.ownerName,
      ownerKind: analysis.ownerKind,
      fromName: analysis.fromName,
      toName: analysis.toName,
      typeText: analysis.typeText,
      workerAddedMembers: analysis.workerAddedMembers.map((member) => member.name),
      workerAddedDeclarations: analysis.workerAddedDeclarations.map((entry) => entry.names?.[0]).filter(Boolean),
      rebasedDeclarations: analysis.rebasedDeclarations,
      requiresOutputDiagnostics: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

function unsafePropertyAccessReasons(text, fromName) {
  const property = escapeRegExp(fromName);
  const reasons = [];
  if (new RegExp(`\\[\\s*['"]${property}['"]\\s*\\]`).test(text)) reasons.push('typed-property-rename-rebase-bracket-access-unsupported');
  if (new RegExp(`\\{[^}]*\\b${property}\\b[^}]*\\}`).test(text) && /\b(const|let|var|function)\b/.test(text)) {
    reasons.push('typed-property-rename-rebase-destructuring-unsupported');
  }
  return uniqueStrings(reasons);
}

function stalePropertyAccessReasons(text, fromName) {
  const property = escapeRegExp(fromName);
  return new RegExp(`(\\?\\.|\\.)${property}\\b|\\[\\s*['"]${property}['"]\\s*\\]`).test(text)
    ? ['typed-property-rename-rebase-stale-property-access']
    : [];
}

function renameTypesEqual(left, right) {
  return Boolean(left && right)
    && left.optional === right.optional
    && normalizeTypeText(left.typeText) === normalizeTypeText(right.typeText);
}

function membersByName(members) { return new Map(members.map((member) => [member.name, member])); }
function entriesByKey(entries) { return new Map(entries.map((entry) => [entry.key, entry])); }
function normalizeTypeText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function rejected(reasonCode, reasonCodes = [reasonCode]) { return { ok: false, reasonCodes: uniqueStrings(reasonCodes) }; }
function safeId(value) { return String(value ?? 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown'; }
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export {
  entriesByKey,
  escapeRegExp,
  membersByName,
  normalizeTypeText,
  rejected,
  renameTypesEqual,
  safeId,
  stalePropertyAccessReasons,
  typedPropertyRenameRebaseEvidence,
  unsafePropertyAccessReasons
};
