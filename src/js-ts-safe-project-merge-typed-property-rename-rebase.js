import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, createMergeContext, sameStatementText, uniqueStrings } from './js-ts-safe-merge-context.js';
import { scanJsTsTopLevelLedger } from './js-ts-safe-merge-ledger.js';
import { hashText } from './js-ts-safe-project-merge-core.js';
import {
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
} from './js-ts-safe-project-merge-typed-property-rename-rebase-utils.js';

const positiveReasonCode = 'typed-property-rename-rebase-admitted';
const diagnosticsRequiredReasonCode = 'typed-property-rename-rebase-requires-output-diagnostics';
const gateId = 'project-typed-property-rename-rebase';

function maybeMergeTypedPropertyRenameRebaseFile(file, context, blockedResult, input = {}) {
  const analysis = analyzeTypedPropertyRenameRebase(file, input);
  if (!analysis.ok) return undefined;
  const outputSourceText = analysis.outputSourceText;
  const evidence = typedPropertyRenameRebaseEvidence(file, analysis);
  const reasonCodes = uniqueStrings([positiveReasonCode, diagnosticsRequiredReasonCode, ...analysis.reasonCodes]);
  const core = {
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'merged',
    operation: 'merged-typed-property-rename-rebase',
    outputSourceText,
    outputHash: hashText(outputSourceText),
    baseHash: hashText(file.baseSourceText),
    workerHash: hashText(file.workerSourceText),
    headHash: hashText(file.headSourceText),
    result: blockedResult,
    semanticArtifacts: blockedResult?.semanticArtifacts,
    conflicts: [],
    admission: {
      status: 'auto-merge-candidate',
      action: 'apply-typed-property-rename-rebase',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes,
      conflictKeys: [`typed-property-rename-rebase#${file.sourcePath}#${analysis.ownerName}#${analysis.fromName}#${analysis.toName}`],
      evidenceIds: [evidence.id]
    },
    summary: {
      conflicts: 0,
      typedPropertyRenameRebases: 1,
      typedPropertyRenameRebaseAdmissionEvidence: [evidence],
      changedExistingDeclarations: blockedResult?.summary?.changedExistingDeclarations,
      semanticEditOperations: blockedResult?.summary?.semanticEditOperations,
      semanticEditReplayStatus: blockedResult?.summary?.semanticEditReplayStatus
    },
    metadata: {
      typedPropertyRenameRebaseAdmissions: [evidence],
      typedPropertyRenameRebase: compactRecord({
        ownerName: analysis.ownerName,
        ownerKind: analysis.ownerKind,
        fromName: analysis.fromName,
        toName: analysis.toName,
        typeText: analysis.typeText,
        workerAddedMembers: analysis.workerAddedMembers.map((member) => member.name),
        workerAddedDeclarations: analysis.workerAddedDeclarations.map((entry) => entry.names?.[0]).filter(Boolean),
        rebasedDeclarations: analysis.rebasedDeclarations,
        diagnosticsRequired: true,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      })
    },
    conflictKeys: [`source#${file.sourcePath}`]
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function analyzeTypedPropertyRenameRebase(file, input = {}) {
  const baseSourceText = file.baseSourceText;
  const workerSourceText = file.workerSourceText ?? baseSourceText;
  const headSourceText = file.headSourceText ?? baseSourceText;
  if (!file.sourcePath || typeof baseSourceText !== 'string' || typeof workerSourceText !== 'string' || typeof headSourceText !== 'string') {
    return rejected('typed-property-rename-rebase-missing-source-text');
  }
  const ledgers = projectLedgers(file, input, baseSourceText, workerSourceText, headSourceText);
  if (!ledgers.ok) return rejected('typed-property-rename-rebase-ledger-unavailable', ledgers.reasonCodes);
  const rename = findSinglePropertyRename(ledgers);
  if (!rename.ok) return rename;
  const assembled = assembleRebasedSource(ledgers, rename.value);
  if (!assembled.ok) return assembled;
  return {
    ok: true,
    reasonCodes: assembled.reasonCodes,
    outputSourceText: assembled.outputSourceText,
    ...rename.value,
    workerAddedDeclarations: assembled.workerAddedDeclarations,
    rebasedDeclarations: assembled.rebasedDeclarations
  };
}

function projectLedgers(file, input, baseSourceText, workerSourceText, headSourceText) {
  const context = createMergeContext({
    id: `typed_property_rename_rebase_${safeId(file.sourcePath)}`,
    sourcePath: file.sourcePath,
    language: file.language ?? input.language ?? 'typescript'
  });
  const base = scanJsTsTopLevelLedger(baseSourceText, 'base', context);
  const worker = scanJsTsTopLevelLedger(workerSourceText, 'worker', context);
  const head = scanJsTsTopLevelLedger(headSourceText, 'head', context);
  return context.conflicts.length
    ? { ok: false, reasonCodes: context.conflicts.map((conflict) => conflict.code) }
    : { ok: true, base, worker, head };
}

function findSinglePropertyRename(ledgers) {
  const baseObjects = objectDeclarationsByName(ledgers.base);
  const workerObjects = objectDeclarationsByName(ledgers.worker);
  const headObjects = objectDeclarationsByName(ledgers.head);
  const candidates = [];
  for (const [name, baseObject] of baseObjects) {
    const workerObject = workerObjects.get(name);
    const headObject = headObjects.get(name);
    if (!workerObject || !headObject) continue;
    const candidate = propertyRenameCandidate(name, baseObject, workerObject, headObject);
    if (candidate.ok) candidates.push(candidate.value);
    else if (candidate.reasonCodes.some((reason) => reason !== 'typed-property-rename-rebase-no-rename')) return candidate;
  }
  if (candidates.length !== 1) return rejected(candidates.length ? 'typed-property-rename-rebase-ambiguous' : 'typed-property-rename-rebase-no-rename');
  return { ok: true, value: candidates[0] };
}

function propertyRenameCandidate(ownerName, baseObject, workerObject, headObject) {
  const baseMembers = membersByName(baseObject.members);
  const workerMembers = membersByName(workerObject.members);
  const headMembers = membersByName(headObject.members);
  const removedFromHead = [...baseMembers.keys()].filter((name) => !headMembers.has(name));
  const addedToHead = [...headMembers.keys()].filter((name) => !baseMembers.has(name));
  if (removedFromHead.length === 0 && addedToHead.length === 0) return rejected('typed-property-rename-rebase-no-rename');
  if (removedFromHead.length !== 1 || addedToHead.length !== 1) return rejected('typed-property-rename-rebase-not-single-property');
  const fromName = removedFromHead[0];
  const toName = addedToHead[0];
  const baseMember = baseMembers.get(fromName);
  const headMember = headMembers.get(toName);
  if (!workerMembers.has(fromName) || workerMembers.has(toName)) return rejected('typed-property-rename-rebase-worker-shape-changed');
  if (!renameTypesEqual(baseMember, headMember)) return rejected('typed-property-rename-rebase-type-changed');
  const stableReasons = stableMemberReasons(baseMembers, workerMembers, headMembers, fromName, toName);
  if (stableReasons.length) return rejected(stableReasons[0], stableReasons);
  const workerAddedMembers = workerObject.members.filter((member) => !baseMembers.has(member.name));
  const outputObjectText = renderObjectDeclaration(headObject, workerAddedMembers);
  return {
    ok: true,
    value: {
      ownerName,
      ownerKind: baseObject.kind,
      fromName,
      toName,
      typeText: normalizeTypeText(baseMember.typeText),
      baseObject,
      workerObject,
      headObject,
      workerAddedMembers,
      outputObjectText
    }
  };
}

function assembleRebasedSource(ledgers, rename) {
  const baseByKey = entriesByKey(ledgers.base.entries);
  const headByKey = entriesByKey(ledgers.head.entries);
  const outputEntries = [];
  const workerAddedDeclarations = [];
  const rebasedDeclarations = [];
  const reasonCodes = [];
  for (const workerEntry of ledgers.worker.entries) {
    if (isTargetObjectEntry(workerEntry, rename)) {
      outputEntries.push(rename.outputObjectText);
      continue;
    }
    const baseEntry = baseByKey.get(workerEntry.key);
    const headEntry = headByKey.get(workerEntry.key);
    if (!baseEntry) {
      const added = rebaseWorkerEntry(workerEntry, rename);
      if (!added.ok) return added;
      workerAddedDeclarations.push(workerEntry);
      rebasedDeclarations.push(...added.rebasedDeclarations);
      outputEntries.push(added.text);
      continue;
    }
    if (!headEntry) return rejected('typed-property-rename-rebase-head-removed-declaration');
    const merged = mergeExistingEntry(baseEntry, workerEntry, headEntry, rename);
    if (!merged.ok) return merged;
    rebasedDeclarations.push(...merged.rebasedDeclarations);
    outputEntries.push(merged.text);
  }
  for (const headEntry of ledgers.head.entries) {
    if (baseByKey.has(headEntry.key) || ledgers.worker.entries.some((entry) => entry.key === headEntry.key)) continue;
    outputEntries.push(headEntry.text);
  }
  reasonCodes.push(`typed-property-rename-rebase-owner:${rename.ownerName}`);
  return {
    ok: true,
    reasonCodes,
    outputSourceText: `${outputEntries.join('\n')}\n`,
    workerAddedDeclarations,
    rebasedDeclarations: uniqueStrings(rebasedDeclarations)
  };
}

function mergeExistingEntry(baseEntry, workerEntry, headEntry, rename) {
  if (isTargetObjectEntry(baseEntry, rename)) return { ok: true, text: rename.outputObjectText, rebasedDeclarations: [] };
  const headIsRenameOnly = sameStatementText(headEntry.text, rebasePropertyReads(baseEntry.text, rename));
  if (sameStatementText(workerEntry.text, baseEntry.text)) return { ok: true, text: headEntry.text, rebasedDeclarations: [] };
  if (sameStatementText(headEntry.text, baseEntry.text) || headIsRenameOnly) {
    const rebased = rebaseWorkerEntry(workerEntry, rename);
    if (!rebased.ok) return rebased;
    return rebased;
  }
  return rejected('typed-property-rename-rebase-existing-declaration-conflict');
}

function rebaseWorkerEntry(entry, rename) {
  const unsafe = unsafePropertyAccessReasons(entry.text, rename.fromName);
  if (unsafe.length) return rejected(unsafe[0], unsafe);
  const text = rebasePropertyReads(entry.text, rename);
  const remains = stalePropertyAccessReasons(text, rename.fromName);
  if (remains.length) return rejected(remains[0], remains);
  return {
    ok: true,
    text,
    rebasedDeclarations: sameStatementText(text, entry.text) ? [] : [entry.names?.[0] ?? entry.key]
  };
}

function objectDeclarationsByName(ledger) {
  const result = new Map();
  for (const entry of ledger.entries) {
    const info = entry.declarationInfo;
    if (!info || !['interface', 'type'].includes(info.declarationKind) || info.names.length !== 1) continue;
    const object = parseObjectDeclaration(entry);
    if (object) result.set(info.names[0], object);
  }
  return result;
}

function parseObjectDeclaration(entry) {
  const kind = entry.declarationInfo.declarationKind;
  const text = entry.text;
  const open = text.indexOf('{');
  const close = text.lastIndexOf('}');
  if (open < 0 || close <= open) return undefined;
  if (kind === 'type' && !/=\s*\{/.test(text.slice(0, open + 1))) return undefined;
  const body = text.slice(open + 1, close);
  const members = parseObjectMembers(body);
  if (!members.ok) return undefined;
  return { entry, kind, name: entry.declarationInfo.names[0], text, open, close, body, members: members.members };
}

function parseObjectMembers(body) {
  const members = [];
  let offset = 0;
  for (const line of body.split('\n')) {
    const start = offset;
    offset += line.length + 1;
    if (!line.trim()) continue;
    const match = line.match(/^(\s*)(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*([^;,]+)\s*[;,]?\s*$/);
    if (!match) return { ok: false };
    members.push({
      name: match[2],
      optional: Boolean(match[3]),
      typeText: match[4].trim(),
      text: line,
      indent: match[1],
      start,
      end: start + line.length
    });
  }
  return { ok: true, members };
}

function renderObjectDeclaration(object, addedMembers) {
  if (!addedMembers.length) return object.entry.text;
  const insert = addedMembers.map((member) => member.text).join('\n');
  const beforeClose = object.text.slice(0, object.close);
  const afterClose = object.text.slice(object.close);
  const needsNewline = beforeClose.endsWith('\n') ? '' : '\n';
  return `${beforeClose}${needsNewline}${insert}\n${afterClose}`;
}

function stableMemberReasons(baseMembers, workerMembers, headMembers, fromName, toName) {
  const reasons = [];
  for (const [name, baseMember] of baseMembers) {
    if (name === fromName) continue;
    const workerMember = workerMembers.get(name);
    const headMember = headMembers.get(name);
    if (!workerMember || !headMember) reasons.push('typed-property-rename-rebase-stable-member-missing');
    else if (!renameTypesEqual(baseMember, workerMember) || !renameTypesEqual(baseMember, headMember)) {
      reasons.push('typed-property-rename-rebase-stable-member-changed');
    }
  }
  for (const [name] of headMembers) {
    if (!baseMembers.has(name) && name !== toName) reasons.push('typed-property-rename-rebase-head-added-extra-property');
  }
  return uniqueStrings(reasons);
}

function rebasePropertyReads(text, rename) {
  const property = escapeRegExp(rename.fromName);
  return String(text ?? '').replace(new RegExp(`(\\?\\.|\\.)${property}\\b`, 'g'), `$1${rename.toName}`);
}
function isTargetObjectEntry(entry, rename) { return entry.key === rename.baseObject.entry.key; }

export { maybeMergeTypedPropertyRenameRebaseFile };
