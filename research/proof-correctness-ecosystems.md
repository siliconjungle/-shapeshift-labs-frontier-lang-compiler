# Proof Correctness Ecosystem Mapping

Date: 2026-06-06

## Scope

This note maps proof- and specification-oriented ecosystems into Frontier Lang `proofSpec` records and semantic merge admission. Frontier should treat these records as source-addressable evidence about a concrete checker run, theorem, model, or specification. The external checker remains the authority; the facade must preserve checker identity, version, command, source hash, declared assumptions, bounded scopes, and failed/open obligations instead of converting them into broad proof claims.

## Frontier Contract

Use this normalization across imported proof/spec sidecars:

| Frontier surface | Meaning |
| --- | --- |
| `contracts` | Named theorem, assertion, pre/postcondition, semantic-preservation theorem, refinement claim, or model assertion being checked. |
| `refinements` | Dependent/refinement types, Liquid Haskell refinements, Dafny/F*/WhyML function contracts, or checker-enforced type constraints. |
| `invariants` | Loop, data-structure, protocol, state, reachability, or model invariants. |
| `termination` | Decreases clauses, well-founded recursion measures, totality checks, or guardedness obligations. |
| `temporal` | TLA+ temporal properties, liveness/fairness obligations, or K reachability claims with temporal/path semantics. |
| `obligations` | Checker-generated VCs, goals, proof obligations, model-check commands, reachability claims, assertion checks, or theorem bodies. |
| `artifacts` | Proof scripts, certificates, `.vo`/compiled proof objects, solver runs, model-check logs, counterexamples, unsat cores, source hashes, and pinned command output. |
| `assumptions` | Axioms, admits, unchecked annotations, trusted libraries, solver/toolchain trust, bounded scopes, external runtimes, preprocessors, assemblers, linkers, and human review gates. |

Admission should follow the weakest observed proof obligation:

| Condition | Frontier admission readiness |
| --- | --- |
| Every relevant obligation is discharged by a pinned checker run, required artifacts are present, and assumptions are declared and acceptable for the target subject. | Eligible for semantic admission, still scoped to the checked subject and source hash. |
| Any obligation is `failed`, `invalid`, `counterexample`, `violated`, or equivalent. | Reject proof-backed admission for that sidecar. |
| Any obligation is open, unknown, timeout, stale, obsolete, pending, admitted, assumed, or backed only by bounded search. | Keep merge admission review-required; preserve the evidence but do not claim proof. |

## Ecosystem Mapping

| Ecosystem | Native evidence to import | Frontier proofSpec mapping | Assumptions and gaps | Admission readiness |
| --- | --- | --- | --- | --- |
| Lean | `.lean` theorem/definition source, `lake build`/Lean output, proof term/theorem names, `#print axioms` output, source/library hashes. | Theorem statements become `contracts`; tactic or term proofs become `obligations` with `proofScript` or `certificate` artifacts; `#print axioms` output becomes `assumptions`; `sorryAx`/axiom dependencies become assumed obligations. | Lean kernel/toolchain, imported libraries, declared axioms, `sorry`/`admit`, native-evaluation trust where used. | Discharged only for named declarations whose source hash, Lean version, dependencies, and axiom audit match. Any `sorryAx` or undeclared axiom forces review. |
| Coq/Rocq | `.v` sources, theorem/lemma statements, `coqc`/`rocq compile` output, `coqchk` where available, proof obligations from Program, `Print Assumptions`. | Theorems and lemmas become `contracts`; goals and Program obligations become `obligations`; compiled proof objects and scripts become `artifacts`; axioms/admitted proofs become `assumptions`. | Kernel/toolchain trust, opaque proof handling, plugins/tactics, `Admitted`, local axioms, extraction/runtime assumptions. | Ready only when compilation/checking succeeds and assumptions are explicitly acceptable. Admitted/axiomatic dependencies stay review-required. |
| Dafny | `.dfy` specs, `requires`/`ensures`/`assert`/loop invariants/decreases, verification command output, Boogie/Z3 logs if exposed. | Method/function contracts become `contracts`/`refinements`; assertions, loop invariants, frame checks, and termination metrics become `obligations`; solver output becomes `solverRun` artifacts. | SMT/toolchain trust, extern/opaque methods, included modules not verified by the command, axioms, ghost/spec-code modeling assumptions. | Passing `dafny verify` can discharge the scoped VCs. Unverified includes, externs, or failed assertions require review/reject depending on status. |
| F* | `.fst`/`.fsti` sources, dependent type signatures, lemmas, refinement types, VC/tactic output, SMT queries/logs, extraction metadata. | Lemmas and signatures become `contracts`; refinements become `refinements`; totality and termination checks become `termination`; VCs become `obligations`; Z3/tactic traces become artifacts. | `assume val`, admitted/trusted modules, SMT incompleteness/heuristics, extraction backends such as OCaml/C/Wasm, runtime model assumptions. | Ready for the checked F* subject when typechecking/VC discharge succeeds with pinned deps. Trusted declarations and extraction claims must remain assumptions. |
| Why3 | WhyML contracts, generated goals, proof sessions (`why3session.xml`), prover results, replay/bench output. | WhyML pre/postconditions and theories become `contracts`; generated goals become `obligations`; prover attempts and replay output become `solverRun` artifacts; obsolete proof attempts become stale obligations. | External prover trust, driver mappings, theory realizations, session freshness, transformations, interactive proof assistant dependencies. | `valid` goals replayed against the current session can be discharged. Obsolete, timeout, unknown, or transformed-but-unreplayed goals stay review-required. |
| Liquid Haskell | Refinement annotations, reflected functions, measures, proof combinator code, Liquid checker output, SMT logs. | Refinement types become `refinements`; reflected theorem functions and proof combinators become `contracts`; termination and measure checks become `termination`; generated SMT checks become `obligations`. | Unchecked `assume`, deprecated unchecked invariants, trusted reflected primitives, GHC/runtime behavior outside refinements, solver trust. | Passing Liquid checks discharge refinement obligations only for the annotated module. `Admit`/unchecked assumptions block proof admission unless explicitly accepted. |
| CompCert | Compiler version, source/target AST hashes, compilation command, proof development reference, semantic-preservation theorem, manual limits. | Semantic preservation is a `contract`; per-pass preservation is `obligations`; compiler run and proof/certificate references are `artifacts`; verified source-level properties can link to compiler-preservation assumptions. | C subset, compiler may refuse input, preprocessing/elaboration/assembling/linking boundaries, external libraries, target architecture semantics. | Can carry source-level safety properties through verified compilation only for supported inputs and verified phases. It does not prove the source program itself. |
| K Framework | K definition, generated semantics, claims, `kprove`/backend output, all-path/one-path annotations, counterexample traces. | Language semantics become contracts/artifacts; reachability claims become `temporal` or `invariant` obligations; proof results and traces become `modelCheck`/`solverRun` artifacts. | Correctness of the K semantics, backend choice, claim mode, trusted lemmas, symbolic execution limits, environmental models. | A proved claim can discharge the scoped reachability obligation. Executable semantics or tests alone are evidence, not proof-backed admission. |
| TLA+ and TLAPS/TLC | `.tla` specs, `.cfg` configs, invariants/properties, TLC runs and traces, TLAPS proof obligations/backend results. | Invariants become `invariants`; liveness/fairness/refinement properties become `temporal`; TLC commands and TLAPS obligations become `obligations`; traces and proof-manager outputs become artifacts. | TLC is finite/model-bounded by config/constants; fairness and symmetry choices matter; TLAPS depends on backend provers and decomposed obligations. | TLC passing is strong bounded design evidence but not global proof. TLAPS-discharged obligations can support proof admission if all assumptions and backends are recorded. |
| Alloy | `.als` model, signatures/facts/assertions, `run`/`check` commands, solver/scope/bitwidth, SAT instances, counterexamples, unsat cores. | Assertions become `contracts`; `check` commands become bounded `obligations`; SAT/counterexample/unsat-core output becomes artifacts; scope/bitwidth/recursion depth are assumptions. | All models are bounded by scope; SAT solver/Kodkod trust; integer bitwidth and recursion depth can change results. | Absence of a counterexample under a recorded scope is bounded evidence requiring review for global claims. Counterexamples fail the obligation. |

## Implementation Hook

This pass adds a dependency-free proof obligation status normalization in `src/semantic-import-layers.js`. The summary now folds common external checker statuses into Frontier buckets:

- discharged: `valid`, `proved`, `verified`, `qed`, `passed`, `ok`, `accepted`
- failed: `counterexample`, `cex`, `invalid`, `violated`, `falsified`, `rejected`, `error`
- open/stale/assumed: `pending`, `unproved`, `obsolete`, `outdated`, `admit`, `admitted`, `assume`, `axiom`, `trusted`, `unchecked`
- unknown: any unrecognized status such as a timeout without a stronger checker result

The normalizer only changes summary counts used by sidecar quality/admission. It does not mutate the original proof records.

## Sources

- Lean Language Reference: https://lean-lang.org/doc/reference/latest/
- Lean axioms and `#print axioms`: https://lean-lang.org/doc/reference/latest/Axioms/
- Rocq/Coq reference manual: https://rocq-prover.org/doc/v9.1/refman/
- Rocq proof mode: https://rocq-prover.org/doc/master/refman/proofs/writing-proofs/proof-mode.html
- Dafny reference manual: https://dafny.org/dafny/DafnyRef/DafnyRef
- F* overview: https://fstar-lang.org/
- F* proof-oriented programming book: https://fstar-lang.org/tutorial/book/index.html
- Why3 overview: https://why3.org/
- Why3 manual/tools: https://why3.org/doc/
- Liquid Haskell specification reference: https://ucsd-progsys.github.io/liquidhaskell/specifications/
- CompCert project and manual: https://compcert.org/ and https://compcert.org/man/
- K Framework user manual: https://kframework.org/docs/user_manual/
- TLA+ wiki and TLC overview: https://docs.tlapl.us/
- TLA+ Proof System tutorial: https://proofs.tlapl.us/doc/web/content/Documentation/Tutorial/Hierarchical_proofs.html
- Alloy commands and analyzer docs: https://alloydocs-fork.readthedocs.io/en/latest/language/commands.html and https://alloy.readthedocs.io/en/latest/tooling/analyzer.html
