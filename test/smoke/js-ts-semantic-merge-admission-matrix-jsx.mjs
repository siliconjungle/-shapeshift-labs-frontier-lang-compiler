import { strict as assert } from 'node:assert';

const semanticMergeJsxMatrixCells = [
  {
    id: 'jsx-tsx-element-prop-graph/context-provider-static-value-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-values',
    note: 'static reference and call-free object/array context provider values emit typed evidence while call expressions remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/context-provider-reference-binding',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-values',
    note: 'simple identifier/member provider values emit root/member reference-binding evidence while computed and call-expression values fail closed with dynamic blocker metadata'
  },
  {
    id: 'jsx-tsx-element-prop-graph/context-provider-static-optional-value-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-values',
    note: 'simple optional-chain provider values emit optional reference-binding evidence while optional computed members and optional calls fail closed with dynamic blocker metadata'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-prop-value-flow-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-graph',
    note: 'literal, shorthand, and plain reference JSX prop values emit callsite evidence; same-file plain components can emit static prop passthrough evidence while computed/call expressions and arbitrary render flow remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-optional-prop-value-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-prop-values',
    note: 'simple static optional-chain prop values emit optional segment/index evidence while optional computed members and optional calls fail closed with dynamic blocker metadata'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-optional-component-prop-flow-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-prop-values',
    note: 'same-file component prop passthrough can consume static optional-chain callsite evidence while optional computed members remain unsupported and render equivalence stays unproved'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-object-spread-prop-precedence-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-graph',
    note: 'same-file const object and inline object JSX spreads emit bounded prop-entry evidence with explicit prop precedence while call, getter, and computed spreads fail closed'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-class-style-prop-value-evidence',
    status: 'done',
    evidence: 'js-ts-semantic-merge-admission-matrix-jsx',
    note: 'static className template strings and static style object/array literals emit static literal prop-value evidence while computed keys, calls, spreads, references, and template interpolation remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-inline-event-handler-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-event-handlers',
    note: 'handler references, optional handler references, and inline arrow/function handlers emit static evidence while computed handlers and handler factory calls remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/structured-hook-dependency-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-hook-dependencies',
    note: 'hook dependency arrays emit per-item literal/reference/optional-reference records and computed/call dynamic blocker reason codes'
  },
  {
    id: 'jsx-tsx-element-prop-graph/context-consumer-target-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-consumers',
    note: 'useContext targets emit reference/optional-reference identity evidence while computed and call targets carry fail-closed dynamic blocker reason codes'
  },
  {
    id: 'jsx-tsx-element-prop-graph/hook-effect-static-source-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-hook-effects',
    note: 'static effect callbacks and cleanup returns emit source evidence while dynamic effect factories remain unsupported and runtime equivalence stays unproved'
  },
  {
    id: 'jsx-tsx-element-prop-graph/structured-hook-effect-target-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-hook-effects',
    note: 'effect callback references, optional callback references, and dynamic callback/cleanup blockers emit structured target evidence without claiming executable effect equivalence'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-hook-effect-source-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-hook-effects',
    note: 'single static hook-effect deltas accept source-bound callback/cleanup preservation proof while stale hashes, dynamic callbacks, and runtime/render equivalence claims fail closed'
  },
  {
    id: 'jsx-tsx-element-prop-graph/same-file-component-provider-lookup',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-consumers',
    note: 'plain same-file component callsites under a provider can attach static callee useContext evidence while dynamic targets remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/same-file-member-component-provider-lookup',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-consumers',
    note: 'same-file member component callsites backed by a static local object literal such as UI.Child attach static callee useContext evidence while ambiguous member values remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/component-children-provider-flow',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-context-consumers',
    note: 'same-file components that render children/props.children/this.props.children inside a static provider emit bounded provider-flow evidence while arbitrary prop/render flow remains unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/project-import-component-provider-lookup',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-cross-file-context-consumers',
    note: 'project-local named/default component imports, explicit barrel re-exports, unique star-barrel re-exports, and imported provider-wrapper children flow can attach static provider evidence while missing flow or ambiguous star targets remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/project-import-member-component-provider-lookup',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-cross-file-context-consumers',
    note: 'project-local named and explicit barrel-reexported static object-literal member component callsites such as UI.Child can attach static callee useContext evidence while dynamic member objects remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/project-import-component-prop-flow',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-prop-values',
    note: 'resolved project-local named/default component imports and explicit barrel re-export component callsites can attach bounded static prop passthrough evidence while dynamic values remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/project-import-member-component-prop-flow',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-prop-values',
    note: 'project-local named and explicit barrel-reexported static object-literal member component callsites can attach bounded static prop passthrough evidence while parameter-supplied member objects remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/same-file-member-component-prop-flow',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-prop-values',
    note: 'same-file member component callsites backed by static local object literals can attach bounded prop passthrough evidence while parameter-supplied member components remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-component-wrapper-render-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'memo/forwardRef/observer wrapper calls on public components emit static wrapper records and render-risk hashes while render/runtime equivalence remains explicitly unproved'
  },
  {
    id: 'jsx-tsx-element-prop-graph/lazy-component-wrapper-render-risk-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'React.lazy and lazy wrapper callsites emit lazy import-factory evidence and lazy-load/runtime proof gaps on resolved same-file component tags'
  },
  {
    id: 'jsx-tsx-element-prop-graph/implicit-arrow-render-return-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'public const arrow components with implicit JSX expression returns emit static render-return records without being misclassified as branch control flow'
  },
  {
    id: 'jsx-tsx-element-prop-graph/conditional-render-return-branch-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'top-level conditional JSX returns emit static condition/consequent/alternate branch-arm records while broader render equivalence remains unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/logical-render-return-guard-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'top-level logical JSX returns emit static operator/left/right guard records while broader render equivalence remains unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-render-return-branch-arm-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-branch-proof',
    note: 'single top-level conditional/logical render-return deltas accept source-bound branch-arm preservation proof while stale hashes, arm mismatches, and broad render equivalence claims fail closed'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-render-return-conditional-condition-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-branch-proof',
    note: 'single top-level conditional render-return deltas accept source-bound condition-origin plus branch-arm preservation proof while mismatched condition hashes and broad render equivalence claims fail closed'
  },
  {
    id: 'jsx-tsx-element-prop-graph/branch-proof-dynamic-runtime-surface-blocker',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-branch-proof',
    note: 'branch-arm preservation proof refuses to clear admission when any stage also carries non-branch dynamic runtime risk such as an event handler factory'
  },
  {
    id: 'jsx-tsx-element-prop-graph/array-render-return-collection-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'static JSX array returns emit collection kind, item count, item text, and item hash records while broader render equivalence remains unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/static-const-array-map-render-return-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'expression-bodied JSX maps over local const array literals emit source-item and static key identity evidence while dynamic maps and render equivalence remain unsupported'
  },
  {
    id: 'jsx-tsx-element-prop-graph/fragment-render-return-collection-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-jsx-render-returns',
    note: 'static JSX fragment returns emit fragment collection kind, child count, child text, and child hash records while broader render equivalence remains unsupported'
  }
];

assert.equal(semanticMergeJsxMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeJsxMatrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['done', 'missing'].includes(cell.status), true, `${cell.id}: matrix status`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}

const staticClassStylePropValueCell = semanticMergeJsxMatrixCells.find((cell) => cell.id === 'jsx-tsx-element-prop-graph/static-class-style-prop-value-evidence');
assert.equal(staticClassStylePropValueCell.status, 'done');
assert.equal(staticClassStylePropValueCell.evidence, 'js-ts-semantic-merge-admission-matrix-jsx');
assert.match(staticClassStylePropValueCell.note, /static className template strings/);
assert.match(staticClassStylePropValueCell.note, /static style object\/array literals/);
assert.match(staticClassStylePropValueCell.note, /template interpolation remain unsupported/);

const staticObjectSpreadPropPrecedenceCell = semanticMergeJsxMatrixCells.find((cell) => cell.id === 'jsx-tsx-element-prop-graph/static-object-spread-prop-precedence-evidence');
assert.equal(staticObjectSpreadPropPrecedenceCell.status, 'done');
assert.equal(staticObjectSpreadPropPrecedenceCell.evidence, 'js-ts-safe-project-merge-jsx-graph');
assert.match(staticObjectSpreadPropPrecedenceCell.note, /same-file const object/);
assert.match(staticObjectSpreadPropPrecedenceCell.note, /explicit prop precedence/);
assert.match(staticObjectSpreadPropPrecedenceCell.note, /fail closed/);

const conditionalConditionProofCell = semanticMergeJsxMatrixCells.find((cell) => cell.id === 'jsx-tsx-element-prop-graph/static-render-return-conditional-condition-proof-bridge');
assert.equal(conditionalConditionProofCell.status, 'done');
assert.equal(conditionalConditionProofCell.evidence, 'js-ts-safe-project-merge-jsx-render-branch-proof');
assert.match(conditionalConditionProofCell.note, /condition-origin/);
assert.match(conditionalConditionProofCell.note, /mismatched condition hashes/);
assert.match(conditionalConditionProofCell.note, /broad render equivalence claims fail closed/);
