import { JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';
import { uniqueStrings } from './js-ts-safe-merge-context.js';
import { semanticFallbackChangedExistingDeclarations } from './js-ts-safe-merge-semantic-edit-fallback-utils.js';
import {
  enumDeclarationsByName,
  sameEnumMemberText,
  sameEnumShell
} from './js-ts-safe-merge-enum-member-parser.js';

function createEnumMemberSemanticFallbackResult(input, topLevelResult, stagedFallback) {
  const currentSourceText = fallbackCurrentSourceText(input, stagedFallback);
  const merge = mergeEnumMemberSources({
    baseSourceText: input.baseSourceText,
    workerSourceText: input.workerSourceText,
    headSourceText: input.headSourceText,
    currentSourceText
  });
  if (!merge.ok || merge.sourceText === currentSourceText) return undefined;
  const resultBase = stagedFallback?.stagedTopLevelResult ?? topLevelResult;
  const language = input.language ?? topLevelResult.language ?? 'typescript';
  const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.ts';
  const phase = stagedFallback
    ? 'staged-top-level-enum-member-semantic-fallback'
    : 'enum-member-semantic-fallback';
  const artifacts = createJsTsSafeMergeSemanticArtifacts({
    ...input,
    id: `${String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge')}_enum_member`,
    language,
    sourcePath,
    headSourceText: currentSourceText,
    headHash: undefined,
    currentSourceHash: undefined
  }, {
    ...resultBase,
    id: `${String(input.id ?? resultBase.id ?? 'js_ts_safe_merge')}_enum_member`,
    language,
    sourcePath,
    mergedSourceText: merge.sourceText,
    outputSourceText: merge.sourceText
  });
  if (artifacts.status !== 'verified') return undefined;
  const gates = semanticArtifactGates(artifacts);
  return {
    ...resultBase,
    id: String(input.id ?? resultBase.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.merged,
    mergedSourceText: merge.sourceText,
    outputSourceText: merge.sourceText,
    conflicts: [],
    gates,
    admission: {
      status: 'auto-merge-candidate',
      action: 'apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    summary: {
      ...resultBase.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, resultBase, stagedFallback),
      conflicts: 0,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.script.summary.operations,
      semanticEditAppliedOperations: artifacts.replay.summary.applied,
      semanticEditReplayStatus: artifacts.replay.status,
      enumMemberDeclarations: merge.summary.declarations,
      enumMemberEdits: merge.summary.edits,
      enumMemberAdditions: merge.summary.additions,
      composedPhases: 2
    },
    metadata: {
      ...resultBase.metadata,
      composed: {
        phase,
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'enum-member']
          : ['top-level-ledger', 'enum-member'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        enumMemberFallback: merge.summary
      }
    },
    semanticArtifacts: artifacts
  };
}

function fallbackCurrentSourceText(input, stagedFallback) {
  return stagedFallback?.directReplayCurrentSourceText
    ?? stagedFallback?.replayCurrentSourceText
    ?? input.headSourceText;
}

function mergeEnumMemberSources(input) {
  if (![input.baseSourceText, input.workerSourceText, input.headSourceText, input.currentSourceText].every(isString)) {
    return blocked('missing-source-text');
  }
  const base = enumDeclarationsByName(input.baseSourceText);
  const worker = enumDeclarationsByName(input.workerSourceText);
  const head = enumDeclarationsByName(input.headSourceText);
  const current = enumDeclarationsByName(input.currentSourceText);
  if ([base, worker, head, current].some((source) => source.reasonCodes.length)) {
    return blocked('enum-member-parse-blocked');
  }
  const edits = [];
  const summary = { declarations: 0, edits: 0, additions: 0 };
  for (const declaration of base.declarations) {
    const workerDeclaration = worker.byName.get(declaration.name);
    const headDeclaration = head.byName.get(declaration.name);
    const currentDeclaration = current.byName.get(declaration.name);
    if (!workerDeclaration || !headDeclaration || !currentDeclaration) continue;
    const merged = mergeEnumDeclaration(declaration, workerDeclaration, headDeclaration, currentDeclaration);
    if (merged.status === 'blocked') return blocked(...merged.reasonCodes);
    if (!merged.replacement || sameEnumMemberText(merged.replacement, currentDeclaration.text)) continue;
    edits.push({ start: currentDeclaration.start, end: currentDeclaration.end, replacement: merged.replacement });
    summary.declarations += 1;
    summary.edits += 1;
    summary.additions += merged.additions;
  }
  if (!edits.length) return blocked('no-enum-member-merge-candidate');
  const sourceText = edits.sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), input.currentSourceText);
  return { ok: true, sourceText, summary };
}

function mergeEnumDeclaration(base, worker, head, current) {
  if (!sameEnumShell(base, worker) || !sameEnumShell(base, head) || !sameEnumShell(base, current)) {
    return blockedDeclaration('enum-member-shell-changed');
  }
  const baseNames = base.members.map((member) => member.name);
  if (![worker, head, current].every((declaration) => containsBaseMembersInOrder(declaration, baseNames))) {
    return blockedDeclaration('enum-member-base-order-changed');
  }
  const memberMaps = [base, worker, head, current].map(membersByName);
  if (memberMaps.some((map) => map.reasonCodes.length)) return blockedDeclaration('duplicate-enum-member-name');
  const [baseMembers, workerMembers, headMembers, currentMembers] = memberMaps.map((map) => map.byName);
  const mergedByName = new Map();
  for (const name of baseNames) {
    const merged = mergeExistingMember(name, baseMembers, workerMembers, headMembers, currentMembers);
    if (merged.status === 'blocked') return merged;
    mergedByName.set(name, merged.text);
  }
  const workerAdditions = new Map();
  for (const member of worker.members.filter((entry) => !baseMembers.has(entry.name))) {
    const currentMember = currentMembers.get(member.name);
    if (currentMember && !sameEnumMemberText(currentMember.text, member.text)) {
      return blockedDeclaration('enum-member-addition-conflict');
    }
    if (!currentMember) workerAdditions.set(member.name, member.text);
  }
  const outputMembers = [];
  for (const member of current.members) outputMembers.push(mergedByName.get(member.name) ?? member.text);
  for (const text of workerAdditions.values()) outputMembers.push(text);
  const replacement = `${current.prefix}${outputMembers.join(',')}${current.tail}${current.suffix}`;
  return {
    status: 'merged',
    replacement,
    additions: workerAdditions.size
  };
}

function mergeExistingMember(name, baseMembers, workerMembers, headMembers, currentMembers) {
  const base = baseMembers.get(name);
  const worker = workerMembers.get(name);
  const head = headMembers.get(name);
  const current = currentMembers.get(name);
  if (!base || !worker || !head || !current) return blockedDeclaration('enum-member-removed');
  const workerChanged = !sameEnumMemberText(base.text, worker.text);
  const headChanged = !sameEnumMemberText(base.text, head.text);
  if (workerChanged && headChanged && !sameEnumMemberText(worker.text, head.text)) {
    return blockedDeclaration('enum-member-conflict');
  }
  if (!sameEnumMemberText(current.text, head.text) && !sameEnumMemberText(current.text, worker.text)) {
    return blockedDeclaration('enum-member-current-diverged');
  }
  return { status: 'merged', text: workerChanged ? worker.text : current.text };
}

function containsBaseMembersInOrder(declaration, baseNames) {
  let index = 0;
  for (const member of declaration.members) {
    if (member.name === baseNames[index]) index += 1;
  }
  return index === baseNames.length;
}

function membersByName(declaration) {
  const byName = new Map();
  const reasonCodes = [];
  for (const member of declaration.members) {
    if (byName.has(member.name)) reasonCodes.push('duplicate-enum-member-name');
    byName.set(member.name, member);
  }
  return { byName, reasonCodes: uniqueStrings(reasonCodes) };
}

function semanticArtifactGates(artifacts) {
  return [
    gate('semantic-edit-script', artifacts.script?.admission?.status === 'auto-merge-candidate', artifacts.script?.admission?.reasonCodes),
    gate('semantic-edit-projection', artifacts.projection?.status === 'projected', artifacts.projection?.admission?.reasonCodes),
    gate('semantic-edit-replay', artifacts.replay?.status === 'accepted-clean', artifacts.replay?.admission?.reasonCodes),
    gate('semantic-edit-already-applied', artifacts.alreadyAppliedReplay?.status === 'already-applied', artifacts.alreadyAppliedReplay?.admission?.reasonCodes)
  ];
}

function gate(id, passed, reasonCodes = []) {
  return { id, status: passed ? 'passed' : 'blocked', reasonCodes: passed ? [] : uniqueStrings(reasonCodes) };
}

function blocked(...reasonCodes) {
  return { ok: false, reasonCodes: uniqueStrings(reasonCodes) };
}

function blockedDeclaration(...reasonCodes) {
  return { status: 'blocked', reasonCodes: uniqueStrings(reasonCodes) };
}

function isString(value) {
  return typeof value === 'string';
}

export { createEnumMemberSemanticFallbackResult };
