import { JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';
import { uniqueStrings } from './js-ts-safe-merge-context.js';
import { semanticFallbackChangedExistingDeclarations } from './js-ts-safe-merge-semantic-edit-fallback-utils.js';
import {
  sameVariableDeclaratorText,
  sameVariableStatementShell,
  variableStatementsByKey
} from './js-ts-safe-merge-variable-declarator-parser.js';

function createVariableDeclaratorSemanticFallbackResult(input, topLevelResult, stagedFallback) {
  const currentSourceText = fallbackCurrentSourceText(input, stagedFallback);
  const merge = mergeVariableDeclaratorSources({
    baseSourceText: input.baseSourceText,
    workerSourceText: input.workerSourceText,
    headSourceText: input.headSourceText,
    currentSourceText
  });
  const resultBase = stagedFallback?.stagedTopLevelResult ?? topLevelResult;
  if (!merge.ok) {
    return merge.sourceShapeBlocked
      ? variableDeclaratorBlockedResult(input, topLevelResult, resultBase, stagedFallback, merge)
      : undefined;
  }
  if (merge.sourceText === currentSourceText) return undefined;
  const language = input.language ?? topLevelResult.language ?? 'typescript';
  const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.ts';
  const phase = stagedFallback
    ? 'staged-top-level-variable-declarator-semantic-fallback'
    : 'variable-declarator-semantic-fallback';
  const artifacts = createJsTsSafeMergeSemanticArtifacts({
    ...input,
    id: `${String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge')}_variable_declarator`,
    language,
    sourcePath,
    headSourceText: currentSourceText,
    headHash: undefined,
    currentSourceHash: undefined
  }, {
    ...resultBase,
    id: `${String(input.id ?? resultBase.id ?? 'js_ts_safe_merge')}_variable_declarator`,
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
      variableDeclaratorStatements: merge.summary.statements,
      variableDeclaratorEdits: merge.summary.edits,
      composedPhases: 2
    },
    metadata: {
      ...resultBase.metadata,
      composed: {
        phase,
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'variable-declarator']
          : ['top-level-ledger', 'variable-declarator'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        variableDeclaratorFallback: merge.summary
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

function mergeVariableDeclaratorSources(input) {
  if (![input.baseSourceText, input.workerSourceText, input.headSourceText, input.currentSourceText].every((text) => typeof text === 'string')) {
    return blocked('missing-source-text');
  }
  const base = variableStatementsByKey(input.baseSourceText);
  const worker = variableStatementsByKey(input.workerSourceText);
  const head = variableStatementsByKey(input.headSourceText);
  const current = variableStatementsByKey(input.currentSourceText);
  if ([base, worker, head, current].some((source) => source.reasonCodes.length)) {
    return blocked('variable-declarator-parse-blocked');
  }
  const edits = [];
  let changedStatements = 0;
  for (const statement of base.statements) {
    const key = statement.names.join('\0');
    const workerStatement = worker.byKey.get(key);
    const headStatement = head.byKey.get(key);
    const currentStatement = current.byKey.get(key);
    if (!workerStatement || !headStatement || !currentStatement) continue;
    const merged = mergeVariableStatement(statement, workerStatement, headStatement, currentStatement);
    if (merged.status === 'blocked') return blocked(...merged.reasonCodes);
    if (!merged.replacement || sameVariableDeclaratorText(merged.replacement, currentStatement.text)) continue;
    edits.push({ start: currentStatement.start, end: currentStatement.end, replacement: merged.replacement });
    changedStatements += 1;
  }
  if (!edits.length) return blocked('no-variable-declarator-merge-candidate');
  const sourceText = edits.sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), input.currentSourceText);
  return {
    ok: true,
    sourceText,
    summary: {
      statements: changedStatements,
      edits: edits.length
    }
  };
}

function mergeVariableStatement(base, worker, head, current) {
  if (!sameVariableStatementShell(base, worker) || !sameVariableStatementShell(base, head) || !sameVariableStatementShell(base, current)) {
    return blockedStatement('variable-declarator-shell-changed');
  }
  const declarators = [];
  let changed = false;
  for (let index = 0; index < base.declarators.length; index += 1) {
    const baseDeclarator = base.declarators[index];
    const workerDeclarator = worker.declarators[index];
    const headDeclarator = head.declarators[index];
    const currentDeclarator = current.declarators[index];
    const bindingPatternReasonCodes = classifyDeclaratorBindingPattern(baseDeclarator, workerDeclarator, headDeclarator, currentDeclarator);
    if (bindingPatternReasonCodes.length) return blockedStatement(...bindingPatternReasonCodes);
    if (![workerDeclarator, headDeclarator, currentDeclarator].every((entry) => entry?.key === baseDeclarator.key)) {
      return blockedStatement(
        ...declaratorKeyChangeReasonCodes(baseDeclarator, workerDeclarator, headDeclarator, currentDeclarator),
        'variable-declarator-name-order-changed'
      );
    }
    const workerChanged = !sameVariableDeclaratorText(baseDeclarator.text, workerDeclarator.text);
    const headChanged = !sameVariableDeclaratorText(baseDeclarator.text, headDeclarator.text);
    if (workerChanged && headChanged && !sameVariableDeclaratorText(workerDeclarator.text, headDeclarator.text)) {
      return blockedStatement(
        ...bindingDeclaratorConflictReasonCodes(baseDeclarator),
        'variable-declarator-conflict'
      );
    }
    if (!sameVariableDeclaratorText(currentDeclarator.text, headDeclarator.text)
      && !sameVariableDeclaratorText(currentDeclarator.text, workerDeclarator.text)) {
      return blockedStatement(
        ...bindingDeclaratorConflictReasonCodes(baseDeclarator),
        'variable-declarator-current-diverged'
      );
    }
    const replacement = workerChanged ? workerDeclarator.text : currentDeclarator.text;
    if (!sameVariableDeclaratorText(replacement, currentDeclarator.text)) changed = true;
    declarators.push(replacement);
  }
  return {
    status: 'merged',
    replacement: changed ? `${current.prefix}${declarators.join(', ')}${current.suffix}` : undefined
  };
}

function classifyDeclaratorBindingPattern(base, worker, head, current) {
  const declarators = [base, worker, head, current].filter(Boolean);
  if (!declarators.some((entry) => entry.binding?.kind === 'binding-pattern')) return [];
  const reasonCodes = uniqueStrings(declarators.flatMap((entry) => entry.binding?.reasonCodes ?? []));
  if (reasonCodes.length) return reasonCodes;
  if (!declarators.every((entry) => entry.binding?.kind === base.binding?.kind && entry.binding?.patternKind === base.binding?.patternKind)) {
    return [
      'binding-pattern-kind-changed',
      'binding-pattern-merge-requires-binding-use-evidence'
    ];
  }
  const patternTexts = declarators.map((entry) => entry.binding?.patternText);
  if (patternTexts.some((text) => !sameVariableDeclaratorText(text, patternTexts[0]))) {
    return [
      'binding-pattern-shape-changed',
      'binding-pattern-merge-requires-binding-use-evidence'
    ];
  }
  const bindingNames = declarators.map((entry) => (entry.binding?.bindingNames ?? []).join('\0'));
  if (bindingNames.some((names) => names !== bindingNames[0])) {
    return [
      'binding-pattern-binding-set-changed',
      'binding-pattern-merge-requires-binding-use-evidence'
    ];
  }
  return [];
}

function declaratorKeyChangeReasonCodes(base, worker, head, current) {
  return [base, worker, head, current].some((entry) => entry?.binding?.kind === 'binding-pattern')
    ? ['binding-pattern-kind-changed', 'binding-pattern-merge-requires-binding-use-evidence']
    : [];
}

function bindingDeclaratorConflictReasonCodes(base) {
  return base?.binding?.kind === 'binding-pattern'
    ? ['binding-pattern-merge-requires-binding-use-evidence']
    : [];
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

function variableDeclaratorBlockedResult(input, topLevelResult, resultBase, stagedFallback, merge) {
  const reasonCodes = merge.reasonCodes;
  const language = input.language ?? topLevelResult.language ?? 'typescript';
  const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.ts';
  return {
    ...resultBase,
    id: String(input.id ?? resultBase.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.blocked,
    mergedSourceText: undefined,
    outputSourceText: undefined,
    conflicts: [{
      code: reasonCodes[0] ?? 'binding-pattern-merge-blocked',
      gateId: 'variable-declarator-binding-pattern',
      message: 'JS/TS variable declarator binding pattern requires binding/use evidence before automatic merge.',
      side: 'worker',
      sourcePath,
      details: {
        reasonCodes,
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? []
      }
    }],
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: {
      ...resultBase.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, resultBase, stagedFallback),
      conflicts: 1,
      variableDeclaratorBindingPatternBlocks: 1,
      composedPhases: stagedFallback ? 2 : 1
    },
    metadata: {
      ...resultBase.metadata,
      composed: {
        phase: stagedFallback
          ? 'staged-top-level-variable-declarator-binding-pattern-classification'
          : 'variable-declarator-binding-pattern-classification',
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'variable-declarator-binding-pattern']
          : ['top-level-ledger', 'variable-declarator-binding-pattern'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        variableDeclaratorFallback: merge.summary,
        language
      }
    }
  };
}

function blocked(...reasonCodes) {
  const normalized = uniqueStrings(reasonCodes);
  return {
    ok: false,
    reasonCodes: normalized,
    sourceShapeBlocked: normalized.some((reasonCode) => reasonCode.startsWith('binding-pattern-')),
    summary: { reasonCodes: normalized }
  };
}

function blockedStatement(...reasonCodes) {
  return { status: 'blocked', reasonCodes: uniqueStrings(reasonCodes) };
}

export { createVariableDeclaratorSemanticFallbackResult };
