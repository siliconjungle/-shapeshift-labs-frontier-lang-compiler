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
  './smoke/semantic-sidecars.mjs',
  './smoke/semantic-impact-merge-signals.mjs',
  './smoke/semantic-sidecar-expected.mjs',
  './smoke/semantic-merge-candidates.mjs',
  './smoke/semantic-merge-conflicts.mjs',
  './smoke/semantic-history-records.mjs',
  './smoke/semantic-history-lineage-resolution.mjs',
  './smoke/semantic-lineage-inference.mjs',
  './smoke/semantic-edit-script.mjs',
  './smoke/semantic-edit-sibling-merge.mjs',
  './smoke/semantic-edit-bundle-admission.mjs',
  './smoke/semantic-patch-bundles.mjs',
  './smoke/semantic-patch-bundle-overlaps.mjs',
  './smoke/bidirectional-target-change.mjs',
  './smoke/native-projection.mjs',
  './smoke-workbench.mjs',
  './smoke/roundtrip.mjs',
  './smoke/scanned-languages.mjs',
  './smoke/matrices-final.mjs',
  './smoke/matrices-universal-fixtures.mjs',
  './smoke/projection-readiness.mjs',
  './smoke/universal-conversion-plan.mjs'
];

const explicitModules = process.argv.slice(2).filter((arg) => arg.endsWith('.mjs'));
const modules = explicitModules.length > 0
  ? explicitModules.map((arg) => pathToFileURL(resolve(arg)).href)
  : smokeModules;

for (const modulePath of modules) {
  await import(modulePath);
}
