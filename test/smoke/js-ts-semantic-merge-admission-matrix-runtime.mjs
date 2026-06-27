import { assert } from './helpers.mjs';

const semanticMergeRuntimeMatrixCells = [
  {
    id: 'control-flow-effect-graph/runtime-region-conflict-reason-codes',
    status: 'done',
    evidence: 'semantic-effect-runtime-switch-order',
    note: 'project runtime-region delta conflicts expose runtime-order admission reason codes for routers and dashboards'
  },
  {
    id: 'control-flow-effect-graph/logical-assignment-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-order-evidence',
    note: 'logical assignment operators emit short-circuit runtime-order evidence so conditional RHS effects block without explicit order proof'
  },
  {
    id: 'control-flow-effect-graph/throw-expression-order-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-runtime-region-graph',
    note: 'throw regions carry structured same-line throw expression records and route to exception-path evidence requirements'
  },
  {
    id: 'control-flow-effect-graph/top-level-await-module-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-top-level-await',
    note: 'module-scope top-level await emits runtime-scope order evidence and routes await suspension-order conflicts without treating the module as a function'
  },
  {
    id: 'control-flow-effect-graph/dynamic-import-specifier-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-order-evidence',
    note: 'dynamic import async effects carry same-line specifier kind/text evidence with false runtime-resolution and equivalence claims so specifier-sensitive changes require explicit proof'
  },
  {
    id: 'control-flow-effect-graph/dynamic-import-source-bound-occurrence-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-dynamic-import-order',
    note: 'same-line dynamic import async occurrences get source-bound regions for uncovered import() calls and keep dynamic resolution and runtime-equivalence claims false without trace proof'
  },
  {
    id: 'control-flow-effect-graph/class-static-block-order-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-class-static-block-runtime',
    note: 'class static blocks emit public runtime-region records and route divergent static initialization through explicit order evidence'
  },
  {
    id: 'control-flow-effect-graph/import-meta-host-context-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-runtime-region-graph + fixture-corpus',
    note: 'static import.meta member reads emit sidecar/project host-context runtime evidence and a blocked corpus fixture for divergent host-dependent changes'
  },
  {
    id: 'control-flow-effect-graph/import-meta-host-context-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-import-meta-host-runtime',
    note: 'import.meta host-context proofs bind project source hashes, runtime region identity, host-context member hash, host-resolution trace evidence, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/mutation-target-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-mutation-target-order',
    note: 'mutation regions emit target/operator/mutator evidence so target-sensitive writes block without explicit runtime equivalence proof'
  },
  {
    id: 'control-flow-effect-graph/effect-target-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-effect-target-order',
    note: 'effect regions emit direct, receiver, literal-computed, dynamic-computed, constructor, dotted tagged-template, and computed tagged-template target evidence so target-sensitive effects block without runtime equivalence proof'
  },
  {
    id: 'control-flow-effect-graph/bound-computed-effect-target-literal-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-effect-target-order',
    note: 'same-scope const string-literal computed effect targets resolve to static key evidence with binding metadata while mutable and dynamic targets remain dynamic and runtime-equivalence-false'
  },
  {
    id: 'control-flow-effect-graph/effect-target-proof-bridge',
    status: 'done',
    evidence: 'semantic-effect-runtime-effect-target-order',
    note: 'effect-target proofs bind project source hashes, runtime region identity, target-order hash, target-resolution traces, dynamic computed/bound literal/optional/tagged/constructor trace slots, command/trace/evidence hashes, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/literal-computed-mutation-target-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-mutation-target-order',
    note: 'literal computed mutation targets such as state["visible"] carry static key evidence while dynamic computed targets stay marked dynamic and runtime-equivalence-false'
  },
  {
    id: 'control-flow-effect-graph/computed-mutator-method-call-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-mutation-target-order',
    note: 'literal computed mutator calls such as queue["push"](value) carry static method evidence, optional-call boundary evidence, and false runtime-equivalence claims'
  },
  {
    id: 'control-flow-effect-graph/bounded-reachability-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-reachability-order',
    note: 'runtime-sensitive regions after same-block unconditional completion or simple exhaustive if/else and if/else-if/else completion carry static unreachable evidence without claiming full path reachability'
  },
  {
    id: 'control-flow-effect-graph/bounded-nested-path-reachability-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-reachability-order',
    note: 'runtime-sensitive regions after a bounded tail-position nested completion carry static unreachable evidence and route to reachability blockers without claiming executable effect equivalence'
  },
  {
    id: 'control-flow-effect-graph/bounded-switch-reachability-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-reachability-order',
    note: 'runtime-sensitive regions after a switch with default and return/throw completion in every case/default segment carry bounded unreachable evidence without treating break as an exit or claiming effect equivalence'
  },
  {
    id: 'control-flow-effect-graph/bounded-try-finally-reachability-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-reachability-order',
    note: 'runtime-sensitive regions after a try/catch/finally whose finalizer returns or throws carry bounded unreachable evidence while normal or break finalizers fail closed'
  },
  {
    id: 'control-flow-effect-graph/bound-explicit-runtime-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-executable-evidence',
    note: 'explicit runtime-order proof records must bind source hashes, source path, runtime region identity, runtime kind, signature hash, and false equivalence claims before they can unblock an order-sensitive merge'
  },
  {
    id: 'control-flow-effect-graph/resource-management-disposal-proof-bridge',
    status: 'done',
    evidence: 'semantic-effect-runtime-resource-management',
    note: 'resource-management disposal proofs bind project source hashes, runtime region identity, disposal-order hash, async-disposal trace evidence, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/promise-combinator-concurrency-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-order-evidence',
    note: 'Promise.all/allSettled/race/any effects carry combinator method, direct array element position, settlement policy, and false runtime-equivalence claims so concurrent effect merges route to explicit evidence'
  },
  {
    id: 'control-flow-effect-graph/promise-chain-handler-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-order-evidence',
    note: 'then/catch/finally promise chains carry handler order, nested handler-step attribution, rejection/finalizer markers, and false runtime-equivalence claims so chain changes route to explicit evidence'
  },
  {
    id: 'control-flow-effect-graph/promise-runtime-proof-bridge',
    status: 'done',
    evidence: 'semantic-effect-runtime-promise-proof-bridge + semantic-effect-runtime-promise-chain-proof-bridge',
    note: 'promise combinator and promise-chain proofs bind project source hashes, runtime region identity, promise order hashes, concurrency/settlement/handler/rejection/finalizer traces, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/yield-star-delegation-order-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-yield-star-delegation',
    note: 'yield-star exits carry delegated iterable text plus false iterator-protocol and completion-propagation equivalence claims so delegated generator changes route to explicit evidence'
  },
  {
    id: 'control-flow-effect-graph/generator-protocol-proof-bridge',
    status: 'done',
    evidence: 'semantic-effect-runtime-yield-star-delegation',
    note: 'generator protocol proofs bind project source hashes, yield-star runtime region identity, generator protocol order hash, iterator and completion traces, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/async-generator-protocol-proof-bridge',
    status: 'done',
    evidence: 'semantic-effect-runtime-async-generator-protocol',
    note: 'async generator protocol proofs bind source hashes, runtime region identity, generator order hash, async iterator, cancellation, and backpressure traces, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/class-static-block-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-class-static-block-runtime',
    note: 'class static block proofs bind project source hashes, runtime region identity, static initialization order hash, execution trace evidence, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/top-level-await-proof-bridge',
    status: 'done',
    evidence: 'semantic-effect-runtime-top-level-await',
    note: 'top-level await proofs bind project source hashes, runtime region identity, suspension-order hash, module/suspension trace evidence, signature hash, and false equivalence claims before suppressing a runtime-region delta conflict'
  },
  {
    id: 'control-flow-effect-graph/same-line-named-effect-occurrence-evidence',
    status: 'done',
    evidence: 'semantic-effect-runtime-order-evidence + semantic-effect-same-line-occurrences',
    note: 'same-line repeated named network/scheduler calls and storage/host/browser/import.meta token effects split into bounded per-occurrence regions so concurrent or adjacent effects expose distinct source spans and order evidence'
  }
];

assert.equal(semanticMergeRuntimeMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeRuntimeMatrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['done', 'missing'].includes(cell.status), true, `${cell.id}: matrix status`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}
