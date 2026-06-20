import { assert } from './helpers.mjs';
import {
  createJsTsSemanticConflictSidecars,
  JsTsSemanticConflictSidecarClasses,
  summarizeJsTsSemanticConflictSidecars
} from './compiler-api.mjs';

for (const conflictClass of [
  'same-region',
  'delete-modify',
  'duplicate-export',
  'duplicate-member',
  'ordered-list-conflict',
  'parser-ledger-loss',
  'stale-source-hash',
  'unsupported-syntax'
]) {
  assert.equal(JsTsSemanticConflictSidecarClasses.includes(conflictClass), true);
}

const bundle = createJsTsSemanticConflictSidecars({
  id: 'js_ts_conflict_sidecar_fixture',
  language: 'typescript',
  sourcePath: 'src/widget.ts',
  expectedSourceHash: 'hash_base_widget',
  currentSourceHash: 'hash_head_widget',
  changes: [
    {
      id: 'worker_render_body',
      side: 'worker',
      changeKind: 'modify',
      regionKey: 'class:Widget#method:render',
      symbolName: 'Widget.render',
      memberName: 'render',
      sourceSpan: { startLine: 10, startColumn: 3, endLine: 14, endColumn: 4 }
    },
    {
      id: 'head_render_body',
      side: 'head',
      changeKind: 'modify',
      regionKey: 'class:Widget#method:render',
      symbolName: 'Widget.render',
      memberName: 'render',
      sourceSpan: { startLine: 12, startColumn: 3, endLine: 16, endColumn: 4 }
    },
    {
      id: 'worker_value_delete',
      side: 'worker',
      changeKind: 'delete',
      regionKey: 'class:Widget#member:value',
      symbolName: 'Widget.value',
      memberName: 'value',
      sourceSpan: { startLine: 4, startColumn: 3, endLine: 4, endColumn: 18 }
    },
    {
      id: 'head_value_modify',
      side: 'head',
      changeKind: 'modify',
      regionKey: 'class:Widget#member:value',
      symbolName: 'Widget.value',
      memberName: 'value',
      sourceSpan: { startLine: 4, startColumn: 3, endLine: 4, endColumn: 26 }
    }
  ],
  declarations: [
    {
      id: 'worker_render_member',
      kind: 'method',
      name: 'hydrate',
      memberName: 'hydrate',
      containerKey: 'class:Widget',
      sourceSpan: { startLine: 20, startColumn: 3, endLine: 22, endColumn: 4 }
    },
    {
      id: 'head_render_member',
      kind: 'method',
      name: 'hydrate',
      memberName: 'hydrate',
      containerKey: 'class:Widget',
      sourceSpan: { startLine: 24, startColumn: 3, endLine: 26, endColumn: 4 }
    },
    {
      id: 'worker_widget_export',
      kind: 'export',
      name: 'Widget',
      exportName: 'Widget',
      exported: true,
      sourceSpan: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 29 }
    },
    {
      id: 'head_widget_export',
      kind: 'export',
      name: 'Widget',
      exportName: 'Widget',
      exported: true,
      sourceSpan: { startLine: 29, startColumn: 1, endLine: 29, endColumn: 29 }
    }
  ],
  orderedLists: [{
    id: 'widget_members',
    key: 'class:Widget#members',
    changes: [
      {
        id: 'worker_insert_member',
        side: 'worker',
        changeKind: 'insert',
        memberName: 'activate',
        index: 2,
        sourceSpan: { startLine: 30, startColumn: 3, endLine: 32, endColumn: 4 }
      },
      {
        id: 'head_insert_member',
        side: 'head',
        changeKind: 'insert',
        memberName: 'deactivate',
        index: 2,
        sourceSpan: { startLine: 34, startColumn: 3, endLine: 36, endColumn: 4 }
      }
    ]
  }],
  ledgerLosses: [{
    id: 'loss_missing_ledger_anchor',
    kind: 'ledger-loss',
    severity: 'error',
    key: 'class:Widget#method:hydrate',
    sourceSpan: { startLine: 20, startColumn: 3, endLine: 26, endColumn: 4 },
    reasonCode: 'missing-ledger-anchor'
  }],
  unsupportedSyntax: [{
    id: 'unsupported_decorator_metadata',
    kind: 'decorator-metadata',
    sourceSpan: { startLine: 2, startColumn: 1, endLine: 2, endColumn: 18 },
    reasonCode: 'unsupported-decorator-merge-anchor'
  }]
});

assert.equal(bundle.kind, 'frontier.lang.jsTsSemanticMergeConflictSidecars');
assert.equal(bundle.summary.total, bundle.conflicts.length);
assert.equal(bundle.admission.status, 'blocked');
assert.equal(bundle.admission.autoMergeSafe, false);

for (const record of bundle.conflicts) {
  assert.equal(record.kind, 'frontier.lang.jsTsSemanticMergeConflictSidecar');
  assert.equal(typeof record.class, 'string');
  assert.equal(typeof record.severity, 'string');
  assert.equal(typeof record.risk, 'string');
  assert.equal(record.affected.sourcePaths.includes('src/widget.ts'), true);
  assert.equal(Array.isArray(record.affected.spans), true);
  assert.equal(record.affected.keys.length > 0, true, `expected affected key for ${record.class}`);
  assert.equal(record.reasonCodes.length > 0, true);
  assert.equal(typeof record.suggestedOutcome, 'string');
  assert.deepEqual(record.explanation.affected, record.affected);
  assert.deepEqual(record.explanation.reasonCodes, record.reasonCodes);
}

const recordByClass = (conflictClass) => bundle.conflicts.find((record) => record.class === conflictClass);

const sameRegion = recordByClass('same-region');
assert.ok(sameRegion, 'expected same-region sidecar');
assert.equal(sameRegion.reasonCodes.includes('same-region-concurrent-edit'), true);
assert.equal(sameRegion.affected.keys.includes('class:Widget#method:render'), true);

const deleteModify = recordByClass('delete-modify');
assert.ok(deleteModify, 'expected delete-modify sidecar');
assert.equal(deleteModify.suggestedOutcome, 'choose-delete-or-port-modification');
assert.equal(deleteModify.affected.keys.includes('class:Widget#member:value'), true);

const duplicateMember = recordByClass('duplicate-member');
assert.ok(duplicateMember, 'expected duplicate-member sidecar');
assert.equal(duplicateMember.metadata.duplicateName, 'hydrate');
assert.equal(duplicateMember.affected.memberKeys.includes('class:Widget#hydrate'), true);

const duplicateExport = recordByClass('duplicate-export');
assert.ok(duplicateExport, 'expected duplicate-export sidecar');
assert.equal(duplicateExport.affected.exportNames.includes('Widget'), true);

const orderedList = recordByClass('ordered-list-conflict');
assert.ok(orderedList, 'expected ordered-list sidecar');
assert.equal(orderedList.affected.orderedListKeys.includes('class:Widget#members'), true);
assert.equal(orderedList.reasonCodes.includes('ordered-list-concurrent-position'), true);

const ledgerLoss = recordByClass('parser-ledger-loss');
assert.ok(ledgerLoss, 'expected parser-ledger-loss sidecar');
assert.equal(ledgerLoss.reasonCodes.includes('missing-ledger-anchor'), true);
assert.equal(ledgerLoss.suggestedOutcome, 'rerun-parser-and-ledger-before-merge');

const staleHash = recordByClass('stale-source-hash');
assert.ok(staleHash, 'expected stale-source-hash sidecar');
assert.equal(staleHash.metadata.expectedSourceHash, 'hash_base_widget');
assert.equal(staleHash.metadata.currentSourceHash, 'hash_head_widget');

const unsupportedSyntax = recordByClass('unsupported-syntax');
assert.ok(unsupportedSyntax, 'expected unsupported-syntax sidecar');
assert.equal(unsupportedSyntax.reasonCodes.includes('unsupported-decorator-merge-anchor'), true);

const summary = summarizeJsTsSemanticConflictSidecars(bundle.conflicts, {
  sourcePath: 'src/widget.ts',
  readiness: 'ready'
});
assert.equal(summary.classes.includes('duplicate-member'), true);
assert.equal(summary.classes.includes('ordered-list-conflict'), true);
assert.equal(summary.highestRisk, 'high');
assert.equal(summary.readiness, 'blocked');
