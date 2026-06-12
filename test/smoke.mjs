#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const smokeModules = [
  './smoke/public-api.mjs',
  './smoke/compile-core.mjs',
  './smoke/semantic-index.mjs',
  './smoke/semantic-slice-surgical.mjs',
  './smoke/external-semantic-index-formats.mjs',
  './smoke/glean-semantic-index.mjs',
  './smoke/universal-dialects.mjs',
  './smoke/adapter-contract.mjs',
  './smoke/js-ts-adapters.mjs',
  './smoke/python-adapter.mjs',
  './smoke/rust-adapter.mjs',
  './smoke/clang-go-adapters.mjs',
  './smoke/java-adapter.mjs',
  './smoke/csharp-adapter.mjs',
  './smoke/swift-kotlin-project.mjs',
  './smoke/project-admission.mjs',
  './smoke/tree-sitter-cst-envelope.mjs',
  './smoke/scanned-js.mjs',
  './smoke/semantic-sidecar-scanned-fixture.mjs',
  './smoke/semantic-sidecars.mjs',
  './smoke/semantic-sidecar-proof-paradigm.mjs',
  './smoke/semantic-impact-merge-signals.mjs',
  './smoke/semantic-sidecar-expected.mjs',
  './smoke/semantic-merge-candidates.mjs',
  './smoke/semantic-merge-conflicts.mjs',
  './smoke/semantic-history-records.mjs',
  './smoke/semantic-history-lineage-resolution.mjs',
  './smoke/semantic-lineage-inference.mjs',
  './smoke/semantic-callsite-regions.mjs',
  './smoke/semantic-edit-insertions.mjs',
  './smoke/semantic-edit-rename-move.mjs',
  './smoke/semantic-edit-script.mjs',
  './smoke/semantic-edit-script-reanchor.mjs',
  './smoke/semantic-edit-replay-diagnostics.mjs',
  './smoke/semantic-edit-sibling-merge.mjs',
  './smoke/semantic-edit-bundle-auto-merge.mjs',
  './smoke/semantic-edit-bundle-admission.mjs',
  './smoke/semantic-edit-bundle-admission-replay-required.mjs',
  './smoke/semantic-patch-bundles.mjs',
  './smoke/semantic-patch-bundle-overlaps.mjs',
  './smoke/semantic-patch-bundle-overlaps-same-file.mjs',
  './smoke/bidirectional-target-change.mjs',
  './smoke/native-projection.mjs',
  './smoke-workbench.mjs',
  './smoke/roundtrip.mjs',
  './smoke/scanned-languages.mjs',
  './smoke/matrices-final.mjs',
  './smoke/matrices-universal-fixtures.mjs',
  './smoke/projection-readiness.mjs',
  './smoke/universal-conversion-plan.mjs',
  './smoke/universal-conversion-compact-counts.mjs'
];

const semanticAutoMergeSmokeModules = [
  './smoke/semantic-edit-insertions.mjs',
  './smoke/semantic-edit-rename-move.mjs',
  './smoke/semantic-edit-bundle-auto-merge.mjs',
  './smoke/semantic-edit-bundle-admission.mjs'
];

for (const modulePath of semanticAutoMergeSmokeModules) {
  if (!smokeModules.includes(modulePath)) {
    throw new Error(`Default smoke gate is missing required semantic auto-merge proof: ${modulePath}`);
  }
}

const explicitModules = process.argv.slice(2).filter((arg) => arg.endsWith('.mjs'));
const modules = explicitModules.length > 0
  ? explicitModules.map((arg) => pathToFileURL(resolve(arg)).href)
  : smokeModules;

for (const modulePath of modules) {
  await import(modulePath);
}
