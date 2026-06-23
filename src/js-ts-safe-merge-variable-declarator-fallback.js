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
  if (!merge.ok || merge.sourceText === currentSourceText) return undefined;
  const resultBase = stagedFallback?.stagedTopLevelResult ?? topLevelResult;
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
    if (![workerDeclarator, headDeclarator, currentDeclarator].every((entry) => entry?.name === baseDeclarator.name)) {
      return blockedStatement('variable-declarator-name-order-changed');
    }
    const workerChanged = !sameVariableDeclaratorText(baseDeclarator.text, workerDeclarator.text);
    const headChanged = !sameVariableDeclaratorText(baseDeclarator.text, headDeclarator.text);
    if (workerChanged && headChanged && !sameVariableDeclaratorText(workerDeclarator.text, headDeclarator.text)) {
      return blockedStatement('variable-declarator-conflict');
    }
    if (!sameVariableDeclaratorText(currentDeclarator.text, headDeclarator.text)
      && !sameVariableDeclaratorText(currentDeclarator.text, workerDeclarator.text)) {
      return blockedStatement('variable-declarator-current-diverged');
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

function blockedStatement(...reasonCodes) {
  return { status: 'blocked', reasonCodes: uniqueStrings(reasonCodes) };
}

export { createVariableDeclaratorSemanticFallbackResult };
