# Source Map Backprojection For Semantic Merging

Date: 2026-06-09

## Sources

- TC39 Source Map draft: https://tc39.es/source-map/
- ECMA-426 Source Map standard: https://tc39.es/ecma426/
- TC39-TG4 charter/context: https://ecma-international.org/task-groups/tc39-tg4/
- Quotient Lenses, Foster/Pierce et al.: https://repository.upenn.edu/entities/publication/c695b604-e1d3-4ccd-8a87-5a46fe9bb99e
- Bidirectional Programming Languages, Foster: https://repository.upenn.edu/entities/publication/f4f1dcde-e8e5-4c62-850e-e9333462aa0a
- Boomerang string lenses: https://www.cis.upenn.edu/~bcpierce/papers/boomerang-tr.pdf
- Coccinelle in Linux kernel docs: https://kernel.org/doc/html/latest/dev-tools/coccinelle.html
- GumTree AST differencing: https://github.com/GumTreeDiff/gumtree

## Takeaways

- Source maps are the right transport for generated-to-source anchors, but they are not proof that a target edit is semantically equivalent to a source edit. Frontier should use them as merge-admission evidence with explicit review status.
- Lens literature is the right long-term model for bidirectional projection. Frontier can eventually encode get/put laws and proof obligations, but the immediate useful step is a conservative backprojection record that says which source anchor a target edit probably touches.
- Semantic patch systems such as Coccinelle point toward reviewable, pattern-level edits rather than raw text hunks. Frontier's semantic patch bundle should keep source-map links, ownership keys, and evidence IDs so swarm coordinators can sort and reject candidates mechanically.
- AST differencing systems such as GumTree reinforce that move/rename/update classification is useful, but those classifications must stay evidence records unless backed by language-specific parser/compiler facts.

## Local Decision

Accepted now: `createBidirectionalTargetChangeRecord` accepts generated-output source maps and maps target changed regions back to source anchors by generated span or generated name. The resulting record keeps `autoMergeClaim: false` and `semanticEquivalenceClaim: false`, and adds `sourceMapLinks` plus `sourceMapBackedMatches` so swarm collectors can score/query the evidence.

Deferred: well-behaved lens laws, target-language verified compilation, refactoring-aware merge proofs, and AST edit-script scoring across every language. Those need target adapters and proof/checker packages rather than a compiler facade shortcut.
